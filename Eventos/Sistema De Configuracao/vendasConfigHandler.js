'use strict';

const {
    ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, ChannelType,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, StringSelectMenuBuilder
} = require('discord.js');
const { configuracao, Emojis } = require('../../Database');
const { vendasConfig, vendasLogsConfig, vendasCanalCarrinhoConfig, vendasPostarPainel } = require('../../Functions/VendasConfig');
const {
    gerenciarDropdownVendas,
    handlePickConfigSecao,
    buildSecaoConfigPanel,
    buildSubprodutosPanel,
    buildEmojiPickerPanel,
    buildSubEmojiPickerPanel,
    buildSubEmojiSourcePanel,
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

// Posta o painel no canal selecionado
async function postarPainelNoCanal(channel) {
    const secoes = configuracao.get('vendas.secoes') || [];
    if (secoes.length === 0) return;

    const { buildFinalPainelContainer } = require('../../Functions/VendasPainelBuilder');
    const painelData = configuracao.get('vendas.painelData') || null;
    const container = buildFinalPainelContainer(painelData, secoes);

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
                if (customId === 'vnd_gerenciar_dropdown')   { await gerenciarDropdownVendas(interaction); return; }
                if (customId === 'vnd_config_logs')          { await vendasLogsConfig(interaction); return; }
                if (customId === 'vnd_postar_painel')        { await vendasPostarPainel(interaction); return; }
                if (customId === 'vnd_config_canal_carrinho'){ await vendasCanalCarrinhoConfig(interaction); return; }

                // ── Construtor realtime — painel principal ───────────────────
                if (customId === 'vnd_builder_painel') {
                    const { buildPainelMainMenu, getPainelData, setPainelData } = require('../../Functions/VendasPainelBuilder');
                    const userId = interaction.user.id;
                    // Carrega dados salvos como ponto de partida; se não houver nenhum,
                    // pré-popula com o texto padrão para que fique visível e editável.
                    if (Object.keys(getPainelData(userId)).length === 0) {
                        const saved = configuracao.get('vendas.painelData');
                        const base = saved ? { ...saved } : {
                            title: `${Emojis.get('store_emoji')} Loja`,
                            description: 'Selecione uma categoria abaixo para ver os produtos disponíveis.',
                            footer: 'Pagamento via PIX automático — confirmação instantânea.',
                        };
                        setPainelData(userId, base);
                    }
                    await interaction.update(buildPainelMainMenu(userId));
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
                if (customId === 'vnd_add_secao')            { await interaction.showModal(buildModalAddSecao()); return; }
                if (customId === 'vnd_editar_secao_pick')    { await handlePickEditSecao(interaction); return; }
                if (customId === 'vnd_remover_secao_pick')   { await handlePickRemoverSecao(interaction); return; }
                if (customId === 'vnd_config_secao_pick')    { await handlePickConfigSecao(interaction); return; }

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

                // Configurar emoji da seção
                if (customId.startsWith('vnd_secao_emoji_')) {
                    const secaoId = customId.slice('vnd_secao_emoji_'.length);
                    await buildEmojiPickerPanel(interaction, client, { tipo: 'secao', secaoId });
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
                    secoes = secoes.filter(s => s.id !== secaoId);
                    configuracao.set('vendas.secoes', secoes);
                    logAction(client, { action: 'Seção removida', details: `Seção \`${secao.nome}\` removida.`, userId: interaction.user.id, guildId: interaction.guildId });
                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    await gerenciarDropdownVendas(interaction);
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

                if (customId === 'vnd_canal_postar') {
                    const channelId = interaction.values[0];
                    const channel = interaction.guild.channels.cache.get(channelId);
                    if (!channel) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal não encontrado.`, ephemeral: true });
                    await interaction.deferUpdate();
                    try {
                        await postarPainelNoCanal(channel);
                        const container = new ContainerBuilder();
                        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `## ${Emojis.get('confirmed_emoji')} Painel postado!\nO painel de vendas foi enviado em <#${channelId}>.`
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

                // Adicionar nova seção
                if (customId === 'vnd_modal_add_secao') {
                    const nome     = interaction.fields.getTextInputValue('nome').trim();
                    const descricao = interaction.fields.getTextInputValue('descricao').trim();
                    const secoes   = configuracao.get('vendas.secoes') || [];
                    if (secoes.length >= 25) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 25 seções atingido.`, ephemeral: true });
                    const nova = { id: gerarId(), nome, descricao: descricao || '', emoji: '', mensagem: '', subprodutos: [] };
                    secoes.push(nova);
                    configuracao.set('vendas.secoes', secoes);
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
