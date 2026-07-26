'use strict';

const {
    ModalBuilder, TextInputBuilder, TextInputStyle,
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { configuracao, Emojis } = require('../../Database');
const { vendasConfig, vendasLogsConfig, vendasPostarPainel } = require('../../Functions/VendasConfig');
const {
    gerenciarDropdownVendas,
    buildModalAddSecao,
    handlePickEditSecao,
    handlePickRemoverSecao,
    gerarId,
} = require('../../Functions/VendasDropdownManager');
const { logAction } = require('../../Functions/AuditLog');

// Monta e posta o dropdown de vendas num canal
async function postarPainelNoCanal(channel, client) {
    const { StringSelectMenuBuilder } = require('discord.js');
    const secoes = configuracao.get('vendas.secoes') || [];
    if (secoes.length === 0) return;

    const options = secoes.slice(0, 25).map(s => ({
        label: s.nome.slice(0, 100),
        value: `vnd_${s.id}`,
        description: (s.descricao || '').slice(0, 100) || undefined,
        ...(s.emoji ? { emoji: { id: s.emoji } } : {}),
    }));

    const container = new ContainerBuilder();
    const corHex = configuracao.get('Cores.Principal') || '5865F2';
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Loja\n` +
        `Selecione um produto abaixo para iniciar sua compra.\n` +
        `-# Pagamento via PIX automático — confirmação instantânea.`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('vnd_comprar_select')
                .setPlaceholder('Selecione um produto...')
                .addOptions(options)
        )
    );

    await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
    });
}

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            // ── Botões de config ────────────────────────────────────────────
            if (interaction.isButton()) {

                if (customId === 'vnd_voltar_config') {
                    await vendasConfig(interaction);
                    return;
                }

                if (customId === 'vnd_gerenciar_dropdown') {
                    await gerenciarDropdownVendas(interaction);
                    return;
                }

                if (customId === 'vnd_config_logs') {
                    await vendasLogsConfig(interaction);
                    return;
                }

                if (customId === 'vnd_postar_painel') {
                    await vendasPostarPainel(interaction);
                    return;
                }

                if (customId === 'vnd_add_secao') {
                    await interaction.showModal(buildModalAddSecao());
                    return;
                }

                if (customId === 'vnd_editar_secao_pick') {
                    await handlePickEditSecao(interaction);
                    return;
                }

                if (customId === 'vnd_remover_secao_pick') {
                    await handlePickRemoverSecao(interaction);
                    return;
                }
            }

            // ── Select Menus de config ──────────────────────────────────────
            if (interaction.isStringSelectMenu()) {

                // Selecionar seção para editar
                if (customId === 'vnd_select_edit_secao') {
                    const secaoId = interaction.values[0];
                    const secoes  = configuracao.get('vendas.secoes') || [];
                    const secao   = secoes.find(s => s.id === secaoId);
                    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                    await interaction.showModal(buildModalAddSecao(secao));
                    return;
                }

                // Selecionar seção para remover
                if (customId === 'vnd_select_rm_secao') {
                    const secaoId = interaction.values[0];
                    let secoes    = configuracao.get('vendas.secoes') || [];
                    const secao   = secoes.find(s => s.id === secaoId);
                    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });

                    secoes = secoes.filter(s => s.id !== secaoId);
                    configuracao.set('vendas.secoes', secoes);

                    logAction(client, {
                        action: 'Seção de Vendas removida',
                        details: `Seção: \`${secao.nome}\` removida do dropdown.`,
                        userId: interaction.user.id,
                        guildId: interaction.guildId,
                    });

                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    await gerenciarDropdownVendas(interaction);
                    return;
                }
            }

            // ── Channel Select Menus ────────────────────────────────────────
            if (interaction.isChannelSelectMenu()) {

                if (customId === 'vnd_set_log_compras') {
                    const channelId = interaction.values[0];
                    configuracao.set('vendas.canais.logCompras', channelId);
                    logAction(client, { action: 'Canal Log de Compras (Vendas) configurado', details: `<#${channelId}>`, userId: interaction.user.id, guildId: interaction.guildId });
                    await interaction.deferUpdate();
                    await vendasLogsConfig(interaction);
                    return;
                }

                if (customId === 'vnd_set_log_pendentes') {
                    const channelId = interaction.values[0];
                    configuracao.set('vendas.canais.logPendentes', channelId);
                    logAction(client, { action: 'Canal Log de Pagamentos Pendentes (Vendas) configurado', details: `<#${channelId}>`, userId: interaction.user.id, guildId: interaction.guildId });
                    await interaction.deferUpdate();
                    await vendasLogsConfig(interaction);
                    return;
                }

                if (customId === 'vnd_canal_postar') {
                    const channelId = interaction.values[0];
                    const channel   = interaction.guild.channels.cache.get(channelId);
                    if (!channel) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal não encontrado.`, ephemeral: true });

                    await interaction.deferUpdate();
                    try {
                        await postarPainelNoCanal(channel, client);
                        const container = new ContainerBuilder();
                        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `## ${Emojis.get('confirmed_emoji')} Painel postado!\nO painel de vendas foi enviado em <#${channelId}>.`
                        ));
                        container.addSeparatorComponents(new SeparatorBuilder());
                        container.addActionRowComponents(new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('vnd_voltar_config')
                                .setLabel('Voltar')
                                .setEmoji({ id: '1501803908589162537' })
                                .setStyle(2)
                        ));
                        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
                        logAction(client, { action: 'Painel de Vendas postado', details: `Canal: <#${channelId}>`, userId: interaction.user.id, guildId: interaction.guildId });
                    } catch (err) {
                        await interaction.editReply({ content: `${Emojis.get('negative_emoji')} Erro ao postar: ${err.message}`, components: [], embeds: [] });
                    }
                    return;
                }
            }

            // ── Modal Submits ───────────────────────────────────────────────
            if (interaction.isModalSubmit()) {

                // Adicionar nova seção
                if (customId === 'vnd_modal_add_secao') {
                    const nome     = interaction.fields.getTextInputValue('nome').trim();
                    const descricao = interaction.fields.getTextInputValue('descricao').trim();
                    const emoji    = interaction.fields.getTextInputValue('emoji').trim();
                    const valorRaw = interaction.fields.getTextInputValue('valor').trim().replace(',', '.');

                    if (isNaN(Number(valorRaw)) || Number(valorRaw) <= 0) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Valor inválido. Use o formato \`29.90\`.`, ephemeral: true });
                    }

                    const secoes = configuracao.get('vendas.secoes') || [];
                    if (secoes.length >= 25) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 25 seções atingido.`, ephemeral: true });
                    }

                    const nova = { id: gerarId(), nome, descricao, emoji: emoji || '', valor: Number(valorRaw).toFixed(2) };
                    secoes.push(nova);
                    configuracao.set('vendas.secoes', secoes);

                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    logAction(client, { action: 'Seção de Vendas adicionada', details: `\`${nome}\` — R$ ${nova.valor}`, userId: interaction.user.id, guildId: interaction.guildId });
                    await gerenciarDropdownVendas(interaction);
                    return;
                }

                // Editar seção existente
                if (customId.startsWith('vnd_modal_edit_secao_')) {
                    const secaoId  = customId.slice('vnd_modal_edit_secao_'.length);
                    const nome     = interaction.fields.getTextInputValue('nome').trim();
                    const descricao = interaction.fields.getTextInputValue('descricao').trim();
                    const emoji    = interaction.fields.getTextInputValue('emoji').trim();
                    const valorRaw = interaction.fields.getTextInputValue('valor').trim().replace(',', '.');

                    if (isNaN(Number(valorRaw)) || Number(valorRaw) <= 0) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Valor inválido. Use o formato \`29.90\`.`, ephemeral: true });
                    }

                    let secoes = configuracao.get('vendas.secoes') || [];
                    const idx  = secoes.findIndex(s => s.id === secaoId);
                    if (idx === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });

                    secoes[idx] = { ...secoes[idx], nome, descricao, emoji: emoji || '', valor: Number(valorRaw).toFixed(2) };
                    configuracao.set('vendas.secoes', secoes);

                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    logAction(client, { action: 'Seção de Vendas editada', details: `\`${nome}\` — R$ ${secoes[idx].valor}`, userId: interaction.user.id, guildId: interaction.guildId });
                    await gerenciarDropdownVendas(interaction);
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
