'use strict';

const {
    ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, ChannelType,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags,
    StringSelectMenuBuilder
} = require('discord.js');
const { configuracao, Emojis } = require('../Database');

// ── Helpers de painel ─────────────────────────────────────────────────────────

function gerarPainelId() {
    return 'p_' + Math.random().toString(36).slice(2, 10);
}

function getPaneis() {
    let paineis = configuracao.get('vendas.paineis');
    if (!Array.isArray(paineis)) {
        // Migração do antigo modelo de painel único
        const oldData = configuracao.get('vendas.painelData');
        paineis = oldData ? [{ id: gerarPainelId(), nome: 'Painel Principal', data: oldData }] : [];
        configuracao.set('vendas.paineis', paineis);
    }
    return paineis;
}

// ── Painel principal de configuração de vendas ────────────────────────────────

async function vendasConfig(interaction) {
    const secoes        = configuracao.get('vendas.secoes') || [];
    const canalCarrinho = configuracao.get('vendas.canais.carrinho');
    const logCompras    = configuracao.get('vendas.canais.logCompras');
    const logPendentes  = configuracao.get('vendas.canais.logPendentes');
    const efiAtivo      = configuracao.get('pagamentos.EfiOnOff') === true;
    const efiConfig     = !!configuracao.get('pagamentos.EfiAPI.client_id');
    const nDescontos    = (configuracao.get('vendas.descontos') || []).filter(d => d.ativo !== false).length;
    const paineis       = getPaneis();
    const totalSubs     = secoes.reduce((acc, s) => acc + (s.subprodutos || []).length, 0);

    const ok = Emojis.get('confirmed_emoji');
    const no = Emojis.get('negative_emoji');

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Sistema de Vendas\n\n` +
        `${efiAtivo && efiConfig ? ok : no} PIX EfiBank  ·  ` +
        `${canalCarrinho ? ok : no} Canal de Carrinho\n` +
        `${Emojis.get('store_emoji')} **${secoes.length}** seções · **${totalSubs}** produtos  ·  ` +
        `${Emojis.get('_folder_emoji')} **${paineis.length}/5** painéis  ·  ` +
        `${Emojis.get('pix_stamp_emoji')} **${nDescontos}** cupons\n` +
        `${logCompras ? ok : no} Log de compras  ·  ${logPendentes ? ok : no} Log de pendentes`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vnd_gerenciar_dropdown')
            .setLabel('Seções e Produtos')
            .setEmoji({ id: '1501803947898306724' })
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('vnd_gerenciar_descontos')
            .setLabel('Cupons')
            .setEmoji({ id: '1501803982849445998' })
            .setStyle(2),
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vnd_config_canal_carrinho')
            .setLabel('Canal de Carrinho')
            .setEmoji({ id: '1501803917640732722' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('vnd_config_logs')
            .setLabel('Canais de Log')
            .setEmoji({ id: '1501804019184828507' })
            .setStyle(2),
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vnd_gerenciar_paineis')
            .setLabel(`Painéis de Vendas (${paineis.length}/5)`)
            .setEmoji({ id: '1501804003850322052' })
            .setStyle(1),
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('voltar1')
            .setLabel('Menu Principal')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
    ));

    const payload = { components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
    } else {
        await interaction.update(payload);
    }
}

// ── Gerenciar múltiplos painéis ───────────────────────────────────────────────

async function vendasGerenciarPaineis(interaction) {
    const paineis   = getPaneis();
    const secoes    = configuracao.get('vendas.secoes') || [];
    const totalSubs = secoes.reduce((acc, s) => acc + (s.subprodutos || []).length, 0);
    const podePostar = secoes.length > 0 && totalSubs > 0;

    const listaPaineis = paineis.length === 0
        ? `-# Nenhum painel criado ainda.`
        : paineis.map((p, i) => `**${i + 1}.** ${p.nome}`).join('\n');

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Painéis de Vendas\n` +
        `Gerencie até **5** painéis independentes. Cada painel pode ser postado em canais diferentes.\n\n` +
        listaPaineis + `\n\n-# ${paineis.length}/5 painéis`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vnd_add_painel')
            .setLabel('Criar Painel')
            .setEmoji({ id: '1501803905363869769' })
            .setStyle(3)
            .setDisabled(paineis.length >= 5),
    ));

    if (paineis.length > 0) {
        container.addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('vnd_edit_painel_pick')
                .setLabel('Editar Visual')
                .setEmoji({ id: '1501804003850322052' })
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('vnd_post_painel_pick')
                .setLabel('Postar')
                .setEmoji({ id: '1501803923126747178' })
                .setStyle(1)
                .setDisabled(!podePostar),
            new ButtonBuilder()
                .setCustomId('vnd_del_painel_pick')
                .setLabel('Excluir')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(4),
        ));
    }

    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vnd_voltar_config')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
    ));

    const payload = { components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };
    if (interaction.deferred || interaction.replied) await interaction.editReply(payload);
    else await interaction.update(payload);
}

// ── Postar painel específico (picker de canal) ────────────────────────────────

async function vendasPostarPainelEspecifico(interaction, painelId) {
    const secoes = configuracao.get('vendas.secoes') || [];
    const totalSubs = secoes.reduce((acc, s) => acc + (s.subprodutos || []).length, 0);
    if (secoes.length === 0 || totalSubs === 0) {
        return interaction.reply({
            content: `${Emojis.get('negative_emoji')} Adicione ao menos uma seção com subprodutos antes de postar.`,
            ephemeral: true,
        });
    }

    const paineis = getPaneis();
    const painel = paineis.find(p => p.id === painelId);
    if (!painel) {
        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Painel não encontrado.`, ephemeral: true });
    }

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Postar — ${painel.nome}\n` +
        `Selecione o canal onde deseja postar este painel.\n\n` +
        `-# **${secoes.length}** seção(ões) · **${totalSubs}** produto(s)`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId(`vnd_canal_postar_${painelId}`)
            .setPlaceholder('Selecione o canal...')
            .setChannelTypes(ChannelType.GuildText)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vnd_gerenciar_paineis')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
    ));

    const payload = { components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };
    if (interaction.deferred || interaction.replied) await interaction.editReply(payload);
    else await interaction.update(payload);
}

// ── Canais de log ─────────────────────────────────────────────────────────────

async function vendasLogsConfig(interaction) {
    const logCompras   = configuracao.get('vendas.canais.logCompras');
    const logPendentes = configuracao.get('vendas.canais.logPendentes');
    const ok = Emojis.get('confirmed_emoji');
    const no = Emojis.get('negative_emoji');

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_settings_emoji')} Canais de Log — Vendas\n\n` +
        `${Emojis.get('neworder_emoji')} **Log de Compras:** ${logCompras ? `${ok} <#${logCompras}>` : `${no} \`Não configurado\``}\n` +
        `-# Enviado ao confirmar pagamento.\n\n` +
        `${Emojis.get('clock_emoji')} **Log de Pendentes:** ${logPendentes ? `${ok} <#${logPendentes}>` : `${no} \`Não configurado\``}\n` +
        `-# Enviado ao gerar cobrança PIX.`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('vnd_set_log_compras')
            .setPlaceholder('Canal de compras confirmadas...')
            .setChannelTypes(ChannelType.GuildText)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('vnd_set_log_pendentes')
            .setPlaceholder('Canal de pagamentos pendentes...')
            .setChannelTypes(ChannelType.GuildText)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vnd_voltar_config')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
    ));

    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
}

// ── Canal de carrinho ─────────────────────────────────────────────────────────

async function vendasCanalCarrinhoConfig(interaction) {
    const canalCarrinho = configuracao.get('vendas.canais.carrinho');
    const ok = Emojis.get('confirmed_emoji');
    const no = Emojis.get('negative_emoji');

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Canal de Carrinho\n\n` +
        `**Canal atual:** ${canalCarrinho ? `${ok} <#${canalCarrinho}>` : `${no} \`Não configurado\``}\n\n` +
        `-# O bot precisa de permissão para criar threads privadas nesse canal.`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('vnd_set_canal_carrinho')
            .setPlaceholder('Selecione o canal de carrinhos...')
            .setChannelTypes(ChannelType.GuildText)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vnd_voltar_config')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
    ));

    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
}

// ── Postar painel (legado — mantido para compatibilidade) ─────────────────────

async function vendasPostarPainel(interaction) {
    const paineis = getPaneis();
    if (paineis.length === 0) {
        return interaction.reply({
            content: `${Emojis.get('negative_emoji')} Crie ao menos um painel em **Painéis de Vendas** antes de postar.`,
            ephemeral: true,
        });
    }
    await vendasGerenciarPaineis(interaction);
}

module.exports = {
    vendasConfig,
    vendasGerenciarPaineis,
    vendasPostarPainelEspecifico,
    vendasLogsConfig,
    vendasCanalCarrinhoConfig,
    vendasPostarPainel,
    getPaneis,
    gerarPainelId,
};
