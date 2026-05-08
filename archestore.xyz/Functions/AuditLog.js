const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { configuracao, Emojis } = require('../DataBaseJson');

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function logAction(client, { action, details, userId, guildId }) {
    const channelId = configuracao.get('auditlog.channel');
    if (!channelId) return;

    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return;

        const unixTs = Math.floor(Date.now() / 1000);

        const container = new ContainerBuilder();
        container;

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `${Emojis.get('system_emoji')} **Log de Auditoria** — <t:${unixTs}:F>`
            )
        );

        container.addSeparatorComponents(new SeparatorBuilder());

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `${Emojis.get('_silueta_emoji')} **Usuário:** <@${userId}>\n` +
                `${Emojis.get('_settings_emoji')} **Ação:** ${action}\n` +
                `${Emojis.get('information_emoji')} **Detalhe:** ${details}\n` +
                `-# <t:${unixTs}:R>`
            )
        );

        await channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    } catch (e) {
        console.error('[AuditLog] Erro ao enviar log:', e.message);
    }
}

module.exports = { logAction };
