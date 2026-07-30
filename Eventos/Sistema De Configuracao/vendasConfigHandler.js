'use strict';

const {
    ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, ChannelType,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags,
    StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');
const { configuracao, Emojis } = require('../../Database');
const {
    vendasConfig, vendasGerenciarPaineis, vendasPostarPainelEspecifico,
    vendasLogsConfig, vendasCanalCarrinhoConfig, vendasPostarPainel,
    getPaneis, gerarPainelId, abrirGerenciadorSecoes, migrarSecoesSemPainel,
} = require('../../Functions/VendasConfig');
const {
    gerenciarDropdownVendas,
    handlePickConfigSecao,
    buildSecaoConfigPanel,
    buildSubprodutosPanel,
    buildEmojiPickerPanel,
    buildSubEmojiPickerPanel,
    buildSubEmojiSourcePanel,
    buildSecaoEmojiSourcePanel,
    buildSubReorderPickPanel,
    buildSubReorderMovePanel,
    buildModalAddSecao,
    buildModalMsgSecao,
    buildModalAddSub,
    handlePickEditSub,
    handlePickDelSub,
    handlePickEditSecao,
    handlePickRemoverSecao,
    gerarId,
} = require('../../Functions/VendasDropdownManager');
const { logAction } = require('../../Functions/AuditLog');

// Posta um painel específico no canal selecionado
async function postarPainelNoCanal(channel, painelData, painelId) {
    const todasSecoes = configuracao.get('vendas.secoes') || [];
    const secoes = painelId ? todasSecoes.filter(s => s.painelId === painelId) : todasSecoes;
    if (secoes.length === 0) return;
    const { buildFinalPainelContainer } = require('../../Functions/VendasPainelBuilder');
    const container = buildFinalPainelContainer(painelData || null, secoes);
    await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            // ══════════════════════════════════════════════════════════════════════
            // BUTTONS
            // ══════════════════════════════════════════════════════════════════════
            if (interaction.isButton()) {

                if (customId === 'vnd_voltar_config')        { await vendasConfig(interaction); return; }
                if (customId === 'vnd_gerenciar_dropdown') {
                    await abrirGerenciadorSecoes(interaction);
                    return;
                }
                if (customId === 'vnd_config_logs')          { await vendasLogsConfig(interaction); return; }
                if (customId === 'vnd_postar_painel')        { await vendasPostarPainel(interaction); return; }
                if (customId === 'vnd_config_canal_carrinho'){ await vendasCanalCarrinhoConfig(interaction); return; }

                // ── Construtor realtime — painel principal ───────────────────
                // vnd_builder_painel_<painelId>  (ou legado: vnd_builder_painel)
                if (customId === 'vnd_builder_painel' || customId.startsWith('vnd_builder_painel_')) {
                    const painelId = customId.startsWith('vnd_builder_painel_')
                        ? customId.slice('vnd_builder_painel_'.length)
                        : null;
                    const { buildPainelMainMenu, getPainelData, setPainelData } = require('../../Functions/VendasPainelBuilder');
                    const userId = interaction.user.id;
                    if (Object.keys(getPainelData(userId)).length === 0) {
                        const paineis = getPaneis();
                        const painel = painelId ? paineis.find(p => p.id === painelId) : null;
                        const base = painel?.data ? { ...painel.data } : {
                            title: `${Emojis.get('store_emoji')} Loja`,
                            description: 'Selecione uma categoria abaixo para ver os produtos disponíveis.',
                            footer: 'Pagamento via PIX automático — confirmação instantânea.',
                        };
                        if (painelId) { base._painelId = painelId; base._painelNome = painel?.nome || 'Painel'; }
                        setPainelData(userId, base);
                    }
                    await interaction.update(buildPainelMainMenu(userId));
                    return;
                }

                // ── Gerenciar painéis ──────────────────────────────────────────
                if (customId === 'vnd_gerenciar_paineis') {
                    await vendasGerenciarPaineis(interaction);
                    return;
                }

                // ── Seções de painel específico ──────────────────────────────
                if (customId.startsWith('vnd_gerenciar_dropdown_')) {
                    const painelId = customId.slice('vnd_gerenciar_dropdown_'.length);
                    await gerenciarDropdownVendas(interaction, painelId);
                    return;
                }

                // ── Adicionar seção a um painel específico ───────────────────
                if (customId.startsWith('vnd_add_secao_')) {
                    const painelId = customId.slice('vnd_add_secao_'.length);
                    await interaction.showModal(buildModalAddSecao(null, painelId));
                    return;
                }

                // ── Pickers de seção com painelId ────────────────────────────
                if (customId.startsWith('vnd_config_secao_pick_')) {
                    const painelId = customId.slice('vnd_config_secao_pick_'.length);
                    await handlePickConfigSecao(interaction, painelId);
                    return;
                }
                if (customId.startsWith('vnd_editar_secao_pick_')) {
                    const painelId = customId.slice('vnd_editar_secao_pick_'.length);
                    await handlePickEditSecao(interaction, painelId);
                    return;
                }
                if (customId.startsWith('vnd_remover_secao_pick_')) {
                    const painelId = customId.slice('vnd_remover_secao_pick_'.length);
                    await handlePickRemoverSecao(interaction, painelId);
                    return;
                }

                if (customId === 'vnd_add_painel') {
                    const paineis = getPaneis();
                    if (paineis.length >= 10) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 10 painéis atingido.`, ephemeral: true });
                    const modal = new ModalBuilder()
                        .setCustomId('vnd_modal_add_painel')
                        .setTitle('Criar Novo Painel');
                    modal.addComponents(new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('painel_nome')
                            .setLabel('Nome do painel (só aparece para você)')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(50)
                            .setRequired(true)
                            .setPlaceholder('Ex: Loja Principal, Promoções...')
                    ));
                    await interaction.showModal(modal);
                    return;
                }

                if (customId === 'vnd_edit_painel_pick') {
                    const paineis = getPaneis();
                    if (paineis.length === 0) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Nenhum painel criado.`, ephemeral: true });
                    const options = paineis.map((p, i) => ({ label: p.nome, value: p.id, description: `Painel ${i + 1}` }));
                    const container = new ContainerBuilder();
                    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('_lapis_emoji')} Editar Visual do Painel\nSelecione qual painel deseja editar.`
                    ));
                    container.addSeparatorComponents(new SeparatorBuilder());
                    container.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder().setCustomId('vnd_select_edit_painel').setPlaceholder('Selecione o painel...').addOptions(options)
                    ));
                    container.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('vnd_gerenciar_paineis').setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
                    ));
                    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
                    return;
                }

                if (customId === 'vnd_post_painel_pick') {
                    const paineis = getPaneis();
                    if (paineis.length === 0) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Nenhum painel criado.`, ephemeral: true });
                    if (paineis.length === 1) { await vendasPostarPainelEspecifico(interaction, paineis[0].id); return; }
                    const options = paineis.map((p, i) => ({ label: p.nome, value: p.id, description: `Painel ${i + 1}` }));
                    const container = new ContainerBuilder();
                    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('store_emoji')} Postar Painel\nSelecione qual painel deseja postar.`
                    ));
                    container.addSeparatorComponents(new SeparatorBuilder());
                    container.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder().setCustomId('vnd_select_post_painel').setPlaceholder('Selecione o painel...').addOptions(options)
                    ));
                    container.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('vnd_gerenciar_paineis').setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
                    ));
                    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
                    return;
                }

                if (customId === 'vnd_del_painel_pick') {
                    const paineis = getPaneis();
                    if (paineis.length === 0) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Nenhum painel para excluir.`, ephemeral: true });
                    const options = paineis.map((p, i) => ({ label: p.nome, value: p.id, description: `Painel ${i + 1}` }));
                    const container = new ContainerBuilder();
                    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('_trash_emoji')} Excluir Painel\nSelecione qual painel deseja excluir.`
                    ));
                    container.addSeparatorComponents(new SeparatorBuilder());
                    container.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder().setCustomId('vnd_select_del_painel').setPlaceholder('Selecione o painel...').addOptions(options)
                    ));
                    container.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('vnd_gerenciar_paineis').setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
                    ));
                    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
                    return;
                }

                // ── Construtor realtime — seção ──────────────────────────────
                if (customId.startsWith('vnd_secao_builder_')) {
                    const secaoId = customId.slice('vnd_secao_builder_'.length);
                    const secao = (configuracao.get('vendas.secoes') || []).find(s => s.id === secaoId);
                    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    const { buildSecaoMainMenu, getSecaoData, setSecaoData } = require('../../Functions/VendasPainelBuilder');
                    const userId = interaction.user.id;
                    // Carrega builderData existente como ponto de partida
                    const existing = getSecaoData(userId);
                    if (!existing._secaoId || existing._secaoId !== secaoId) {
                        const base = secao.builderData ? { ...secao.builderData } : {};
                        base._secaoId = secaoId;
                        setSecaoData(userId, base);
                    }
                    await interaction.update(buildSecaoMainMenu(userId, secao));
                    return;
                }
                if (customId === 'vnd_add_secao')            { await interaction.showModal(buildModalAddSecao(null, null)); return; }
                if (customId === 'vnd_editar_secao_pick')    { await handlePickEditSecao(interaction, null); return; }
                if (customId === 'vnd_remover_secao_pick')   { await handlePickRemoverSecao(interaction, null); return; }
                if (customId === 'vnd_config_secao_pick')    { await handlePickConfigSecao(interaction, null); return; }

                // Voltar à seção config
                if (customId.startsWith('vnd_secao_cfg_')) {
                    const secaoId = customId.slice('vnd_secao_cfg_'.length);
                    const secao = (configuracao.get('vendas.secoes') || []).find(s => s.id === secaoId);
                    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    await buildSecaoConfigPanel(interaction, secao);
                    return;
                }

                // Editar info da seção (nome + descrição)
                if (customId.startsWith('vnd_secao_info_')) {
                    const secaoId = customId.slice('vnd_secao_info_'.length);
                    const secao = (configuracao.get('vendas.secoes') || []).find(s => s.id === secaoId);
                    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    await interaction.showModal(buildModalAddSecao(secao));
                    return;
                }

                // Definir mensagem do painel
                if (customId.startsWith('vnd_secao_msg_')) {
                    const secaoId = customId.slice('vnd_secao_msg_'.length);
                    const secao = (configuracao.get('vendas.secoes') || []).find(s => s.id === secaoId);
                    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    await interaction.showModal(buildModalMsgSecao(secao));
                    return;
                }

                // Paginação do emoji picker da seção — vnd_secao_emoji_bot_<page>_<secaoId> / vnd_secao_emoji_server_<page>_<secaoId>
                if (customId.startsWith('vnd_secao_emoji_bot_') || customId.startsWith('vnd_secao_emoji_server_')) {
                    const isBot = customId.startsWith('vnd_secao_emoji_bot_');
                    const prefix = isBot ? 'vnd_secao_emoji_bot_' : 'vnd_secao_emoji_server_';
                    const rest = customId.slice(prefix.length);
                    const us = rest.indexOf('_');
                    const page = us !== -1 ? (parseInt(rest.slice(0, us), 10) || 0) : 0;
                    const secaoId = us !== -1 ? rest.slice(us + 1) : rest;
                    await buildSecaoEmojiSourcePanel(interaction, secaoId, isBot ? 'bot' : 'server', page);
                    return;
                }

                // Remover emoji da seção — vnd_secao_emoji_rm_<secaoId>
                if (customId.startsWith('vnd_secao_emoji_rm_')) {
                    const secaoId = customId.slice('vnd_secao_emoji_rm_'.length);
                    let secoes = configuracao.get('vendas.secoes') || [];
                    const idx = secoes.findIndex(s => s.id === secaoId);
                    if (idx !== -1) {
                        secoes[idx].emoji = '';
                        configuracao.set('vendas.secoes', secoes);
                    }
                    await buildSecaoEmojiSourcePanel(interaction, secaoId, 'bot', 0);
                    return;
                }

                // Configurar emoji da seção — entry point: vnd_secao_emoji_<secaoId>
                if (customId.startsWith('vnd_secao_emoji_')) {
                    const secaoId = customId.slice('vnd_secao_emoji_'.length);
                    await buildSecaoEmojiSourcePanel(interaction, secaoId, 'bot', 0);
                    return;
                }

                // Painel de subprodutos
                if (customId.startsWith('vnd_sub_panel_')) {
                    const secaoId = customId.slice('vnd_sub_panel_'.length);
                    const secao = (configuracao.get('vendas.secoes') || []).find(s => s.id === secaoId);
                    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    await buildSubprodutosPanel(interaction, secao);
                    return;
                }

                // Adicionar subproduto
                if (customId.startsWith('vnd_add_sub_')) {
                    const secaoId = customId.slice('vnd_add_sub_'.length);
                    await interaction.showModal(buildModalAddSub(secaoId));
                    return;
                }

                // Picker: editar subproduto
                if (customId.startsWith('vnd_sub_edit_pick_')) {
                    const secaoId = customId.slice('vnd_sub_edit_pick_'.length);
                    await handlePickEditSub(interaction, secaoId);
                    return;
                }

                // Picker: remover subproduto
                if (customId.startsWith('vnd_sub_del_pick_')) {
                    const secaoId = customId.slice('vnd_sub_del_pick_'.length);
                    await handlePickDelSub(interaction, secaoId);
                    return;
                }

                // Reorganizar subprodutos — abrir picker
                if (customId.startsWith('vnd_sub_reorder_')) {
                    const secaoId = customId.slice('vnd_sub_reorder_'.length);
                    await buildSubReorderPickPanel(interaction, secaoId);
                    return;
                }

                // Mover subproduto — vnd_sub_mv_<dir>_<secaoId>_<subId>
                if (customId.startsWith('vnd_sub_mv_')) {
                    const rest = customId.slice('vnd_sub_mv_'.length); // dir_secaoId_subId
                    const firstUs = rest.indexOf('_');
                    const dir = rest.slice(0, firstUs);              // top | up | down | bot
                    const ids = rest.slice(firstUs + 1);             // secaoId_subId
                    const secondUs = ids.indexOf('_');
                    const secaoId = ids.slice(0, secondUs);
                    const subId   = ids.slice(secondUs + 1);

                    let secoes = configuracao.get('vendas.secoes') || [];
                    const si = secoes.findIndex(s => s.id === secaoId);
                    if (si === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    const subs = secoes[si].subprodutos || [];
                    const pi = subs.findIndex(sp => sp.id === subId);
                    if (pi === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Subproduto não encontrado.`, ephemeral: true });

                    if (dir === 'top') {
                        const [item] = subs.splice(pi, 1);
                        subs.unshift(item);
                    } else if (dir === 'up' && pi > 0) {
                        [subs[pi - 1], subs[pi]] = [subs[pi], subs[pi - 1]];
                    } else if (dir === 'down' && pi < subs.length - 1) {
                        [subs[pi], subs[pi + 1]] = [subs[pi + 1], subs[pi]];
                    } else if (dir === 'bot') {
                        const [item] = subs.splice(pi, 1);
                        subs.push(item);
                    }

                    secoes[si].subprodutos = subs;
                    configuracao.set('vendas.secoes', secoes);
                    await buildSubReorderMovePanel(interaction, secaoId, subId);
                    return;
                }

                // Picker: escolher subproduto para emoji
                if (customId.startsWith('vnd_sub_emoji_pick_')) {
                    const secaoId = customId.slice('vnd_sub_emoji_pick_'.length);
                    await buildSubEmojiPickerPanel(interaction, secaoId);
                    return;
                }

                // Mostrar emojis do bot ou servidor para subproduto
                // customId: vnd_sub_emoji_<source>_<page>_<secaoId>_<subId>
                if (customId.startsWith('vnd_sub_emoji_bot_') || customId.startsWith('vnd_sub_emoji_server_')) {
                    const isBot = customId.startsWith('vnd_sub_emoji_bot_');
                    const prefix = isBot ? 'vnd_sub_emoji_bot_' : 'vnd_sub_emoji_server_';
                    const rest = customId.slice(prefix.length); // page_secaoId_subId
                    const parts = rest.split('_');
                    const page = parseInt(parts[0], 10) || 0;
                    const secaoId = parts[1];
                    const subId = parts[2];
                    await buildSubEmojiSourcePanel(interaction, secaoId, subId, isBot ? 'bot' : 'server', page);
                    return;
                }

                // Remover emoji do subproduto — vnd_sub_emoji_rm_<secaoId>_<subId>
                if (customId.startsWith('vnd_sub_emoji_rm_')) {
                    const rest = customId.slice('vnd_sub_emoji_rm_'.length);
                    const parts = rest.split('_');
                    const secaoId = parts[0];
                    const subId = parts[1];
                    let secoes = configuracao.get('vendas.secoes') || [];
                    const si = secoes.findIndex(s => s.id === secaoId);
                    if (si !== -1) {
                        const pi = (secoes[si].subprodutos || []).findIndex(sp => sp.id === subId);
                        if (pi !== -1) {
                            secoes[si].subprodutos[pi].emoji = '';
                            configuracao.set('vendas.secoes', secoes);
                        }
                    }
                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    const secao = (configuracao.get('vendas.secoes') || []).find(s => s.id === secaoId);
                    if (secao) await buildSubprodutosPanel(interaction, secao);
                    return;
                }
            }

            // ══════════════════════════════════════════════════════════════════════
            // STRING SELECT MENUS
            // ══════════════════════════════════════════════════════════════════════
            if (interaction.isStringSelectMenu()) {

                // Selecionar seção para configurar
                if (customId === 'vnd_select_config_secao') {
                    const secaoId = interaction.values[0];
                    const secao = (configuracao.get('vendas.secoes') || []).find(s => s.id === secaoId);
                    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    await buildSecaoConfigPanel(interaction, secao);
                    return;
                }

                // Selecionar seção para editar (info básica)
                if (customId === 'vnd_select_edit_secao') {
                    const secaoId = interaction.values[0];
                    const secao = (configuracao.get('vendas.secoes') || []).find(s => s.id === secaoId);
                    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    await interaction.showModal(buildModalAddSecao(secao));
                    return;
                }

                // Selecionar seção para remover
                if (customId === 'vnd_select_rm_secao') {
                    const secaoId = interaction.values[0];
                    let secoes = configuracao.get('vendas.secoes') || [];
                    const secao = secoes.find(s => s.id === secaoId);
                    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    const painelIdSecao = secao.painelId || null;
                    secoes = secoes.filter(s => s.id !== secaoId);
                    configuracao.set('vendas.secoes', secoes);
                    logAction(client, { action: 'Seção removida', details: `Seção \`${secao.nome}\` removida.`, userId: interaction.user.id, guildId: interaction.guildId });
                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    await gerenciarDropdownVendas(interaction, painelIdSecao);
                    return;
                }

                // Selecionar subproduto para reorganizar — passo 2
                if (customId.startsWith('vnd_sub_reorder_sel_')) {
                    const secaoId = customId.slice('vnd_sub_reorder_sel_'.length);
                    const subId = interaction.values[0];
                    await buildSubReorderMovePanel(interaction, secaoId, subId);
                    return;
                }

                // Selecionar subproduto para editar
                if (customId.startsWith('vnd_select_sub_edit_')) {
                    const secaoId = customId.slice('vnd_select_sub_edit_'.length);
                    const subId = interaction.values[0];
                    const secao = (configuracao.get('vendas.secoes') || []).find(s => s.id === secaoId);
                    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    const sub = (secao.subprodutos || []).find(sp => sp.id === subId);
                    if (!sub) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Subproduto não encontrado.`, ephemeral: true });
                    await interaction.showModal(buildModalAddSub(secaoId, sub));
                    return;
                }

                // Selecionar subproduto para remover
                if (customId.startsWith('vnd_select_sub_del_')) {
                    const secaoId = customId.slice('vnd_select_sub_del_'.length);
                    const subId = interaction.values[0];
                    let secoes = configuracao.get('vendas.secoes') || [];
                    const idx = secoes.findIndex(s => s.id === secaoId);
                    if (idx === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    const subNome = (secoes[idx].subprodutos || []).find(sp => sp.id === subId)?.nome || subId;
                    secoes[idx].subprodutos = (secoes[idx].subprodutos || []).filter(sp => sp.id !== subId);
                    configuracao.set('vendas.secoes', secoes);
                    logAction(client, { action: 'Subproduto removido', details: `\`${subNome}\` da seção \`${secoes[idx].nome}\``, userId: interaction.user.id, guildId: interaction.guildId });
                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    await buildSubprodutosPanel(interaction, secoes[idx]);
                    return;
                }

                // Selecionar emoji para a seção
                if (customId.startsWith('vnd_set_emoji_s_')) {
                    const secaoId = customId.slice('vnd_set_emoji_s_'.length);
                    const emojiId = interaction.values[0];
                    let secoes = configuracao.get('vendas.secoes') || [];
                    const idx = secoes.findIndex(s => s.id === secaoId);
                    if (idx === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    secoes[idx].emoji = emojiId;
                    configuracao.set('vendas.secoes', secoes);
                    logAction(client, { action: 'Emoji da seção configurado', details: `Seção \`${secoes[idx].nome}\``, userId: interaction.user.id, guildId: interaction.guildId });
                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    await buildSecaoConfigPanel(interaction, secoes[idx]);
                    return;
                }

                // Selecionar painel para editar
                if (customId === 'vnd_select_edit_painel') {
                    const painelId = interaction.values[0];
                    const paineis = getPaneis();
                    const painel = paineis.find(p => p.id === painelId);
                    if (!painel) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Painel não encontrado.`, ephemeral: true });
                    const { buildPainelMainMenu, getPainelData, setPainelData } = require('../../Functions/VendasPainelBuilder');
                    const userId = interaction.user.id;
                    if (Object.keys(getPainelData(userId)).length === 0) {
                        const base = painel.data ? { ...painel.data } : {
                            title: `${Emojis.get('store_emoji')} Loja`,
                            description: 'Selecione uma categoria abaixo para ver os produtos disponíveis.',
                            footer: 'Pagamento via PIX automático — confirmação instantânea.',
                        };
                        base._painelId = painelId;
                        base._painelNome = painel.nome;
                        setPainelData(userId, base);
                    }
                    await interaction.update(buildPainelMainMenu(userId));
                    return;
                }

                // Selecionar painel para postar
                if (customId === 'vnd_select_post_painel') {
                    const painelId = interaction.values[0];
                    await vendasPostarPainelEspecifico(interaction, painelId);
                    return;
                }

                // Selecionar painel para gerenciar seções
                if (customId === 'vnd_select_pick_secao_painel') {
                    const painelId = interaction.values[0];
                    await gerenciarDropdownVendas(interaction, painelId);
                    return;
                }

                // Selecionar painel para excluir
                if (customId === 'vnd_select_del_painel') {
                    const painelId = interaction.values[0];
                    let paineis = getPaneis();
                    const nomeExcluido = paineis.find(p => p.id === painelId)?.nome || 'Painel';
                    paineis = paineis.filter(p => p.id !== painelId);
                    configuracao.set('vendas.paineis', paineis);
                    logAction(client, { action: 'Painel excluído', details: `\`${nomeExcluido}\``, userId: interaction.user.id, guildId: interaction.guildId });
                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    await vendasGerenciarPaineis(interaction);
                    return;
                }

                // Selecionar subproduto para configurar emoji
                if (customId.startsWith('vnd_select_sub_emoji_')) {
                    const secaoId = customId.slice('vnd_select_sub_emoji_'.length);
                    const subId = interaction.values[0];
                    await buildSubEmojiSourcePanel(interaction, secaoId, subId, 'bot', 0);
                    return;
                }

                // Selecionar emoji do bot para subproduto — vnd_sub_emojisel_bot_<secaoId>_<subId>
                if (customId.startsWith('vnd_sub_emojisel_bot_')) {
                    const rest = customId.slice('vnd_sub_emojisel_bot_'.length);
                    const parts = rest.split('_');
                    const secaoId = parts[0];
                    const subId = parts[1];
                    const emojiId = interaction.values[0];
                    let secoes = configuracao.get('vendas.secoes') || [];
                    const si = secoes.findIndex(s => s.id === secaoId);
                    if (si === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    const pi = (secoes[si].subprodutos || []).findIndex(sp => sp.id === subId);
                    if (pi === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Subproduto não encontrado.`, ephemeral: true });
                    secoes[si].subprodutos[pi].emoji = emojiId;
                    configuracao.set('vendas.secoes', secoes);
                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    await buildSubprodutosPanel(interaction, secoes[si]);
                    return;
                }

                // Selecionar emoji do servidor para subproduto — vnd_sub_emojisel_svr_<secaoId>_<subId>
                if (customId.startsWith('vnd_sub_emojisel_svr_')) {
                    const rest = customId.slice('vnd_sub_emojisel_svr_'.length);
                    const parts = rest.split('_');
                    const secaoId = parts[0];
                    const subId = parts[1];
                    const emojiId = interaction.values[0];
                    let secoes = configuracao.get('vendas.secoes') || [];
                    const si = secoes.findIndex(s => s.id === secaoId);
                    if (si === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    const pi = (secoes[si].subprodutos || []).findIndex(sp => sp.id === subId);
                    if (pi === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Subproduto não encontrado.`, ephemeral: true });
                    secoes[si].subprodutos[pi].emoji = emojiId;
                    configuracao.set('vendas.secoes', secoes);
                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    await buildSubprodutosPanel(interaction, secoes[si]);
                    return;
                }

                // Selecionar emoji para subproduto — vnd_set_emoji_p_[secaoId]_[subId]
                if (customId.startsWith('vnd_set_emoji_p_')) {
                    const rest = customId.slice('vnd_set_emoji_p_'.length);
                    const us = rest.indexOf('_');
                    if (us === -1) return;
                    const secaoId = rest.slice(0, us);
                    const subId   = rest.slice(us + 1);
                    const emojiId = interaction.values[0];
                    let secoes = configuracao.get('vendas.secoes') || [];
                    const si = secoes.findIndex(s => s.id === secaoId);
                    if (si === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    const pi = (secoes[si].subprodutos || []).findIndex(sp => sp.id === subId);
                    if (pi === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Subproduto não encontrado.`, ephemeral: true });
                    secoes[si].subprodutos[pi].emoji = emojiId;
                    configuracao.set('vendas.secoes', secoes);
                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    await buildSubprodutosPanel(interaction, secoes[si]);
                    return;
                }
            }

            // ══════════════════════════════════════════════════════════════════════
            // CHANNEL SELECT MENUS
            // ══════════════════════════════════════════════════════════════════════
            if (interaction.isChannelSelectMenu()) {

                if (customId === 'vnd_set_log_compras') {
                    const channelId = interaction.values[0];
                    configuracao.set('vendas.canais.logCompras', channelId);
                    logAction(client, { action: 'Canal Log de Compras configurado', details: `<#${channelId}>`, userId: interaction.user.id, guildId: interaction.guildId });
                    await interaction.deferUpdate();
                    await vendasLogsConfig(interaction);
                    return;
                }

                if (customId === 'vnd_set_log_pendentes') {
                    const channelId = interaction.values[0];
                    configuracao.set('vendas.canais.logPendentes', channelId);
                    logAction(client, { action: 'Canal Log de Pendentes configurado', details: `<#${channelId}>`, userId: interaction.user.id, guildId: interaction.guildId });
                    await interaction.deferUpdate();
                    await vendasLogsConfig(interaction);
                    return;
                }

                if (customId === 'vnd_set_canal_carrinho') {
                    const channelId = interaction.values[0];
                    configuracao.set('vendas.canais.carrinho', channelId);
                    logAction(client, { action: 'Canal de Carrinho configurado', details: `<#${channelId}>`, userId: interaction.user.id, guildId: interaction.guildId });
                    await interaction.deferUpdate();
                    await vendasCanalCarrinhoConfig(interaction);
                    return;
                }

                // Postar painel específico — vnd_canal_postar_<painelId>
                if (customId.startsWith('vnd_canal_postar_')) {
                    const painelId = customId.slice('vnd_canal_postar_'.length);
                    const channelId = interaction.values[0];
                    const channel = interaction.guild.channels.cache.get(channelId);
                    if (!channel) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal não encontrado.`, ephemeral: true });
                    const paineis = getPaneis();
                    const painel = paineis.find(p => p.id === painelId);
                    if (!painel) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Painel não encontrado.`, ephemeral: true });
                    await interaction.deferUpdate();
                    try {
                        await postarPainelNoCanal(channel, painel.data, painelId);
                        const container = new ContainerBuilder();
                        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `## ${Emojis.get('confirmed_emoji')} Painel postado!\n**${painel.nome}** foi enviado em <#${channelId}>.`
                        ));
                        container.addSeparatorComponents(new SeparatorBuilder());
                        container.addActionRowComponents(new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('vnd_gerenciar_paineis').setLabel('Voltar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
                        ));
                        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
                        logAction(client, { action: `Painel "${painel.nome}" postado`, details: `Canal: <#${channelId}>`, userId: interaction.user.id, guildId: interaction.guildId });
                    } catch (err) {
                        await interaction.editReply({ content: `${Emojis.get('negative_emoji')} Erro ao postar: ${err.message}`, components: [], embeds: [] });
                    }
                    return;
                }

                // Legado — vnd_canal_postar (sem painelId)
                if (customId === 'vnd_canal_postar') {
                    const channelId = interaction.values[0];
                    const channel = interaction.guild.channels.cache.get(channelId);
                    if (!channel) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal não encontrado.`, ephemeral: true });
                    const paineis = getPaneis();
                    const painelData = paineis[0]?.data || configuracao.get('vendas.painelData') || null;
                    await interaction.deferUpdate();
                    try {
                        await postarPainelNoCanal(channel, painelData);
                        const container = new ContainerBuilder();
                        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `## ${Emojis.get('confirmed_emoji')} Painel postado!\nEnviado em <#${channelId}>.`
                        ));
                        container.addSeparatorComponents(new SeparatorBuilder());
                        container.addActionRowComponents(new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('vnd_voltar_config').setLabel('Voltar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
                        ));
                        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
                        logAction(client, { action: 'Painel de Vendas postado', details: `Canal: <#${channelId}>`, userId: interaction.user.id, guildId: interaction.guildId });
                    } catch (err) {
                        await interaction.editReply({ content: `${Emojis.get('negative_emoji')} Erro ao postar: ${err.message}`, components: [], embeds: [] });
                    }
                    return;
                }
            }

            // ══════════════════════════════════════════════════════════════════════
            // MODAL SUBMITS
            // ══════════════════════════════════════════════════════════════════════
            if (interaction.isModalSubmit()) {

                // Criar novo painel
                if (customId === 'vnd_modal_add_painel') {
                    const nome = interaction.fields.getTextInputValue('painel_nome').trim() || 'Novo Painel';
                    const paineis = getPaneis();
                    if (paineis.length >= 10) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 10 painéis atingido.`, ephemeral: true });
                    const { buildPainelMainMenu, getPainelData, setPainelData } = require('../../Functions/VendasPainelBuilder');
                    const userId = interaction.user.id;
                    const newId = gerarPainelId();
                    // Limpa rascunho anterior se havia
                    if (Object.keys(getPainelData(userId)).length === 0) {
                        setPainelData(userId, {
                            _painelId: newId,
                            _painelNome: nome,
                            title: `${Emojis.get('store_emoji')} Loja`,
                            description: 'Selecione uma categoria abaixo para ver os produtos disponíveis.',
                            footer: 'Pagamento via PIX automático — confirmação instantânea.',
                        });
                    } else {
                        // Atualiza o painelId/nome no rascunho existente
                        const d = getPainelData(userId);
                        d._painelId = newId;
                        d._painelNome = nome;
                        setPainelData(userId, d);
                    }
                    await interaction.update(buildPainelMainMenu(userId));
                    return;
                }

                // Adicionar nova seção (customId: vnd_modal_add_secao_<painelId>)
                // O customId sem painelId (legado) só chega aqui se vnd_add_secao foi acionado
                // sem painelId — nesse caso atribuímos ao primeiro painel para garantir vínculo.
                if (customId === 'vnd_modal_add_secao' || customId.startsWith('vnd_modal_add_secao_')) {
                    let painelId = customId.startsWith('vnd_modal_add_secao_')
                        ? customId.slice('vnd_modal_add_secao_'.length)
                        : null;
                    // Garante que painelId nunca seja nulo — fallback para o primeiro painel
                    if (!painelId) {
                        const paineis = getPaneis();
                        painelId = paineis[0]?.id || null;
                    }
                    if (!painelId) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Crie um painel antes de adicionar seções.`, ephemeral: true });
                    const nome     = interaction.fields.getTextInputValue('nome').trim();
                    const descricao = interaction.fields.getTextInputValue('descricao').trim();
                    const todasSecoes = configuracao.get('vendas.secoes') || [];
                    const secoesDoPanel = todasSecoes.filter(s => s.painelId === painelId);
                    if (secoesDoPanel.length >= 25) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 25 seções por painel atingido.`, ephemeral: true });
                    const nova = { id: gerarId(), painelId, nome, descricao: descricao || '', emoji: '', mensagem: '', subprodutos: [] };
                    todasSecoes.push(nova);
                    configuracao.set('vendas.secoes', todasSecoes);
                    logAction(client, { action: 'Seção adicionada', details: `\`${nome}\``, userId: interaction.user.id, guildId: interaction.guildId });
                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    await buildSecaoConfigPanel(interaction, nova);
                    return;
                }

                // Editar info de seção existente
                if (customId.startsWith('vnd_modal_edit_secao_')) {
                    const secaoId  = customId.slice('vnd_modal_edit_secao_'.length);
                    const nome     = interaction.fields.getTextInputValue('nome').trim();
                    const descricao = interaction.fields.getTextInputValue('descricao').trim();
                    let secoes = configuracao.get('vendas.secoes') || [];
                    const idx  = secoes.findIndex(s => s.id === secaoId);
                    if (idx === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    secoes[idx] = { ...secoes[idx], nome, descricao: descricao || '' };
                    configuracao.set('vendas.secoes', secoes);
                    logAction(client, { action: 'Seção editada', details: `\`${nome}\``, userId: interaction.user.id, guildId: interaction.guildId });
                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    await buildSecaoConfigPanel(interaction, secoes[idx]);
                    return;
                }

                // Definir mensagem do painel
                if (customId.startsWith('vnd_modal_msg_secao_')) {
                    const secaoId = customId.slice('vnd_modal_msg_secao_'.length);
                    const mensagem = interaction.fields.getTextInputValue('mensagem').trim();
                    let secoes = configuracao.get('vendas.secoes') || [];
                    const idx  = secoes.findIndex(s => s.id === secaoId);
                    if (idx === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    secoes[idx].mensagem = mensagem;
                    configuracao.set('vendas.secoes', secoes);
                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    await buildSecaoConfigPanel(interaction, secoes[idx]);
                    return;
                }

                // Adicionar subproduto
                if (customId.startsWith('vnd_modal_add_sub_')) {
                    const secaoId  = customId.slice('vnd_modal_add_sub_'.length);
                    const nome     = interaction.fields.getTextInputValue('nome').trim();
                    const descricao = interaction.fields.getTextInputValue('descricao').trim();
                    const valorRaw = interaction.fields.getTextInputValue('valor').trim().replace(',', '.');
                    if (isNaN(Number(valorRaw)) || Number(valorRaw) <= 0) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Valor inválido. Use o formato \`29.90\`.`, ephemeral: true });
                    }
                    let secoes = configuracao.get('vendas.secoes') || [];
                    const idx  = secoes.findIndex(s => s.id === secaoId);
                    if (idx === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    if ((secoes[idx].subprodutos || []).length >= 25) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 25 subprodutos por seção atingido.`, ephemeral: true });
                    }
                    const novo = { id: gerarId(), nome, descricao: descricao || '', emoji: '', valor: Number(valorRaw).toFixed(2) };
                    secoes[idx].subprodutos = [...(secoes[idx].subprodutos || []), novo];
                    configuracao.set('vendas.secoes', secoes);
                    logAction(client, { action: 'Subproduto adicionado', details: `\`${nome}\` → R$ ${novo.valor} na seção \`${secoes[idx].nome}\``, userId: interaction.user.id, guildId: interaction.guildId });
                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    await buildSubprodutosPanel(interaction, secoes[idx]);
                    return;
                }

                // Editar subproduto — vnd_modal_edit_sub_[secaoId]_[subId]
                if (customId.startsWith('vnd_modal_edit_sub_')) {
                    const rest    = customId.slice('vnd_modal_edit_sub_'.length);
                    const us      = rest.indexOf('_');
                    if (us === -1) return;
                    const secaoId = rest.slice(0, us);
                    const subId   = rest.slice(us + 1);
                    const nome     = interaction.fields.getTextInputValue('nome').trim();
                    const descricao = interaction.fields.getTextInputValue('descricao').trim();
                    const valorRaw = interaction.fields.getTextInputValue('valor').trim().replace(',', '.');
                    if (isNaN(Number(valorRaw)) || Number(valorRaw) <= 0) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Valor inválido. Use o formato \`29.90\`.`, ephemeral: true });
                    }
                    let secoes = configuracao.get('vendas.secoes') || [];
                    const si   = secoes.findIndex(s => s.id === secaoId);
                    if (si === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    const pi = (secoes[si].subprodutos || []).findIndex(sp => sp.id === subId);
                    if (pi === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Subproduto não encontrado.`, ephemeral: true });
                    secoes[si].subprodutos[pi] = { ...secoes[si].subprodutos[pi], nome, descricao: descricao || '', valor: Number(valorRaw).toFixed(2) };
                    configuracao.set('vendas.secoes', secoes);
                    logAction(client, { action: 'Subproduto editado', details: `\`${nome}\` → R$ ${Number(valorRaw).toFixed(2)}`, userId: interaction.user.id, guildId: interaction.guildId });
                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    await buildSubprodutosPanel(interaction, secoes[si]);
                    return;
                }
            }

        } catch (err) {
            if (err.code === 10062) return;
            console.error('[VendasConfigHandler] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro. Tente novamente.`, ephemeral: true });
                }
            } catch (e) { if (e.code !== 10062) console.error('[VendasConfigHandler] Erro ao responder:', e.message); }
        }
    },
};
