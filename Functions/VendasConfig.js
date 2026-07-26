'use strict';

const {
    ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, ChannelType,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { configuracao, Emojis } = require('../Database');

async function vendasConfig(interaction) {
    const secoes = configuracao.get('vendas.secoes') || [];
    const logCompras   = configuracao.get('vendas.canais.logCompras');
    const logPendentes = configuracao.get('vendas.canais.logPendentes');
    const efiAtivo  = configuracao.get('pagamentos.EfiOnOff') === true;
    const efiConfig = !!configuracao.get('pagamentos.EfiAPI.client_id');

    const ok = Emojis.get('confirmed_emoji');
    const no = Emojis.get('negative_emoji');

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Sistema de Vendas\n` +
        `Configure o dropdown de produtos, canais de log e pagamento PIX automático via EfiBank.\n\n` +
        `${Emojis.get('_efi_emoji')} **EfiBank PIX:** ` +
            `${efiAtivo ? `${ok} \`Habilitado\`` : `${no} \`Desabilitado\``} | ` +
            `${efiConfig ? `${ok} \`Credenciais configuradas\`` : `${no} \`Credenciais não configuradas\``}\n` +
        `${Emojis.get('store_emoji')} **Seções no dropdown:** \`${secoes.length}\`\n` +
        `${Emojis.get('neworder_emoji')} **Log de Compras:** ${logCompras ? `${ok} <#${logCompras}>` : `${no} \`Não configurado\``}\n` +
        `${Emojis.get('clock_emoji')} **Log de Pagamentos Pendentes:** ${logPendentes ? `${ok} <#${logPendentes}>` : `${no} \`Não configurado\``}`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vnd_gerenciar_dropdown')
            .setLabel('Gerenciar Dropdown')
            .setEmoji({ id: '1501803947898306724' })
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('vnd_config_logs')
            .setLabel('Canais de Log')
            .setEmoji({ id: '1501804019184828507' })
            .setStyle(2),
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vnd_postar_painel')
            .setLabel('Postar Painel de Vendas')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(3)
            .setDisabled(secoes.length === 0),
        new ButtonBuilder()
            .setCustomId('voltar1')
            .setLabel('Menu Principal')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(row2);

    const payload = {
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        embeds: [],
        content: ''
    };

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
    } else {
        await interaction.update(payload);
    }
}

async function vendasLogsConfig(interaction) {
    const logCompras   = configuracao.get('vendas.canais.logCompras');
    const logPendentes = configuracao.get('vendas.canais.logPendentes');
    const ok = Emojis.get('confirmed_emoji');
    const no = Emojis.get('negative_emoji');

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_settings_emoji')} Canais de Log — Vendas\n` +
        `Configure os canais onde serão enviados os logs de vendas.\n\n` +
        `${Emojis.get('neworder_emoji')} **Log de Compras:** ${logCompras ? `${ok} <#${logCompras}>` : `${no} \`Não configurado\``}\n` +
        `-# Enviado quando um pagamento é **confirmado**.\n\n` +
        `${Emojis.get('clock_emoji')} **Log de Pagamentos Pendentes:** ${logPendentes ? `${ok} <#${logPendentes}>` : `${no} \`Não configurado\``}\n` +
        `-# Enviado quando uma cobrança PIX é **gerada** (antes do pagamento).`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('vnd_set_log_compras')
            .setPlaceholder('Selecione o canal de log de compras...')
            .setChannelTypes(ChannelType.GuildText)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('vnd_set_log_pendentes')
            .setPlaceholder('Selecione o canal de log de pagamentos pendentes...')
            .setChannelTypes(ChannelType.GuildText)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vnd_voltar_config')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
    ));

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        embeds: [],
        content: ''
    });
}

async function vendasPostarPainel(interaction) {
    const secoes = configuracao.get('vendas.secoes') || [];
    if (secoes.length === 0) {
        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Adicione ao menos uma seção ao dropdown antes de postar o painel.`, ephemeral: true });
    }

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Postar Painel de Vendas\n` +
        `Selecione o canal onde deseja postar o painel de vendas com o dropdown de produtos.\n\n` +
        `-# **${secoes.length}** seção(ões) configurada(s) serão exibidas.`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('vnd_canal_postar')
            .setPlaceholder('Selecione o canal...')
            .setChannelTypes(ChannelType.GuildText)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vnd_voltar_config')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
    ));

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        embeds: [],
        content: ''
    });
}

module.exports = { vendasConfig, vendasLogsConfig, vendasPostarPainel };
