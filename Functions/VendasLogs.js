'use strict';

const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, AttachmentBuilder
} = require('discord.js');
const { configuracao, Emojis } = require('../Database');

function formatBRL(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function unixNow() { return Math.floor(Date.now() / 1000); }

/**
 * Log de pagamento pendente — enviado quando a cobrança PIX é gerada.
 */
async function logPagamentoPendente(client, {
    guildId, userId, userTag, userAvatar,
    sectionNome, quantidade, valorUnitario, valorTotal,
    txid, expiracao,
}) {
    const channelId = configuracao.get('vendas.canais.logPendentes');
    if (!channelId) return;

    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return;

        const ts = unixNow();
        const expiresAt = ts + expiracao;

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `## ${Emojis.get('clock_emoji')} Pagamento Pendente\n` +
            `-# <t:${ts}:F>`
        ));
        container.addSeparatorComponents(new SeparatorBuilder());
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${Emojis.get('_silueta_emoji')} **Usuário:** <@${userId}> — \`${userTag}\`\n` +
            `${Emojis.get('information_emoji')} **ID:** \`${userId}\`\n` +
            (userAvatar ? `${Emojis.get('_pincel_emoji')} **Avatar:** [Ver foto](${userAvatar})\n` : '') +
            `\n` +
            `${Emojis.get('store_emoji')} **Produto:** \`${sectionNome}\`\n` +
            `${Emojis.get('_folder_emoji')} **Quantidade:** \`${quantidade}x\`\n` +
            `${Emojis.get('dream')} **Valor unitário:** \`${formatBRL(valorUnitario)}\`\n` +
            `${Emojis.get('pix_stamp_emoji')} **Total a pagar:** \`${formatBRL(valorTotal)}\`\n` +
            `\n` +
            `${Emojis.get('_settings_emoji')} **TxID:** \`${txid}\`\n` +
            `${Emojis.get('negative_emoji')} **Status:** \`AGUARDANDO PAGAMENTO\`\n` +
            `⏳ **Expira:** <t:${expiresAt}:R> — <t:${expiresAt}:T>`
        ));

        await channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    } catch (e) {
        console.error('[VendasLogs] Erro ao enviar log pendente:', e.message);
    }
}

/**
 * Log de compra confirmada — enviado quando o pagamento é confirmado.
 */
async function logCompraConfirmada(client, {
    guildId, userId, userTag, userAvatar,
    sectionNome, quantidade, valorUnitario, valorTotal,
    txid, e2eid, pagador,
}) {
    const channelId = configuracao.get('vendas.canais.logCompras');
    if (!channelId) return;

    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return;

        const ts = unixNow();

        const pagadorInfo = pagador
            ? `\n${Emojis.get('_silueta_emoji')} **Pagador (CPF/CNPJ):** \`${pagador.cpf || pagador.cnpj || 'N/A'}\` — \`${pagador.nome || 'N/A'}\``
            : '';

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `## ${Emojis.get('confirmed_emoji')} Compra Confirmada\n` +
            `-# <t:${ts}:F>`
        ));
        container.addSeparatorComponents(new SeparatorBuilder());
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${Emojis.get('_silueta_emoji')} **Usuário:** <@${userId}> — \`${userTag}\`\n` +
            `${Emojis.get('information_emoji')} **ID Discord:** \`${userId}\`\n` +
            (userAvatar ? `${Emojis.get('_pincel_emoji')} **Avatar:** [Ver foto](${userAvatar})\n` : '') +
            pagadorInfo +
            `\n` +
            `${Emojis.get('store_emoji')} **Produto:** \`${sectionNome}\`\n` +
            `${Emojis.get('_folder_emoji')} **Quantidade:** \`${quantidade}x\`\n` +
            `${Emojis.get('dream')} **Valor unitário:** \`${formatBRL(valorUnitario)}\`\n` +
            `${Emojis.get('pix_stamp_emoji')} **Total pago:** \`${formatBRL(valorTotal)}\`\n` +
            `\n` +
            `${Emojis.get('_settings_emoji')} **TxID:** \`${txid}\`\n` +
            `${Emojis.get('confirmed_emoji')} **E2E ID:** \`${e2eid || 'N/A'}\`\n` +
            `${Emojis.get('confirmed_emoji')} **Status:** \`PAGO ✓\`\n` +
            `-# Confirmado em <t:${ts}:R>`
        ));

        await channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    } catch (e) {
        console.error('[VendasLogs] Erro ao enviar log de compra:', e.message);
    }
}

module.exports = { logPagamentoPendente, logCompraConfirmada };
