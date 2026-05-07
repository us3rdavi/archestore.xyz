const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { configuracao, BackupStorage, Emojis } = require('../DataBaseJson');

async function SincronizarDados(client) {
    let channel_logs = await client.channels.fetch(configuracao.get('ConfigChannels.systemlogs')).catch(() => null);
    if (!channel_logs) return;

    let guild = await client.guilds.fetch(channel_logs.guild.id);
    let guilds = BackupStorage.get(`Backup_${guild.id}`) || [];
    let guildIndex = guilds.findIndex(g => g.id == guild.id);

    // Initialize or reset guild backup structure
    if (guildIndex === -1) {
        guilds.push({
            id: guild.id,
            name: guild.name,
            channels: [],
            roles: [],
            emojis: [],
            stickers: [],
            msgs: [],
            config: {}
        });
        guildIndex = guilds.length - 1;
    } else {
        guilds[guildIndex] = {
            id: guild.id,
            name: guild.name,
            channels: [],
            roles: [],
            emojis: [],
            stickers: [],
            msgs: [],
            config: {}
        };
    }

    // Process channels
    guild.channels.cache.forEach(channel => {
        const hasPermissionOverwrites = channel.permissionOverwrites && channel.permissionOverwrites.cache;

        guilds[guildIndex].channels.push({
            id: channel.id,
            name: channel.name,
            type: channel.type,
            categoria: channel.parent ? channel.parent.name : null,
            topic: (channel.type === 12 || channel.type === 11) ?
                { topic: channel.topic, parentChannelName: channel.parent?.name || channel.name } :
                null,
            permissionOverwrites: hasPermissionOverwrites ? channel.permissionOverwrites.cache.map(perm => ({
                id: perm.id,
                type: perm.type,
                allow: perm.allow.bitfield,
                deny: perm.deny.bitfield
            })) : []
        });
    });

    // Process emojis
    guild.emojis.cache.forEach(emoji => {
        guilds[guildIndex].emojis.push({
            id: emoji.id,
            name: emoji.name,
            url: emoji.url // emoji.url
        });
    });

    // Process stickers
    guild.stickers.cache.forEach(sticker => {
        guilds[guildIndex].stickers.push({
            id: sticker.id,
            name: sticker.name,
            url: sticker.url
        });
    });

    // Process roles
    guild.roles.cache.forEach(role => {
        if (role.id === guild.id || role.managed) return;
        guilds[guildIndex].roles.push({
            id: role.id,
            name: role.name,
            color: role.color,
            permissions: role.permissions.bitfield,
            mentionable: role.mentionable,
            position: role.position
        });
    });

    // Fetch messages from text-based channels
    await Promise.all(
        guild.channels.cache.map(async channel => {
            if (channel.isTextBased() && channel.messages) {
                try {
                    const messages = await channel.messages.fetch({ limit: 100 });
                    messages.forEach(message => {
                        guilds[guildIndex].msgs.push({
                            channel: channel.name,
                            id: message.id,
                            message: message.toJSON()
                        });
                    });
                } catch (err) {
                    console.error(`Erro ao buscar mensagens no canal ${channel.name}:`, err);
                }
            }
        })
    );

    // Save server configurations
    guilds[guildIndex].config = {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        banner: guild.bannerURL(),
        splash: guild.splashURL(),
        owner: guild.ownerId,
        region: guild.region,
        verificationLevel: guild.verificationLevel,
        explicitContentFilter: guild.explicitContentFilter,
        defaultMessageNotifications: guild.defaultMessageNotifications,
        mfaLevel: guild.mfaLevel,
        systemChannel: guild.systemChannelId,
        afkChannel: guild.afkChannelId,
        afkTimeout: guild.afkTimeout,
        widget: guild.widgetEnabled,
        widgetChannel: guild.widgetChannelId,
        rulesChannel: guild.rulesChannelId,
        publicUpdatesChannel: guild.publicUpdatesChannelId,
        preferredLocale: guild.preferredLocale,
        maxPresences: guild.maximumPresences,
        maxMembers: guild.maximumMembers,
        vanityURL: guild.vanityURLCode,
        description: guild.description,
        features: guild.features,
        premiumTier: guild.premiumTier,
        premiumSubscriptionCount: guild.premiumSubscriptionCount,
        systemChannelFlags: guild.systemChannelFlags.bitfield,
        maxVideoChannelUsers: guild.maximumVideoChannelUsers,
        approximateMemberCount: guild.approximateMemberCount,
        approximatePresenceCount: guild.approximatePresenceCount,
        welcomeScreen: guild.welcomeScreen,
        nsfwLevel: guild.nsfwLevel
    };

    // Save to storage
    await BackupStorage.set(
        `Backup_${guild.id}`,
        JSON.parse(
            JSON.stringify(guilds, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            )
        )
    );

    // Send logs
    SendLogs(client, channel_logs);
}

async function SendLogs(client, channel_logs) {
    const embed = new EmbedBuilder()
        .setTitle(`${Emojis.get(`confirmed_backup_emoji`)} — Dados Sincronizados`)
        .setDescription('As configurações do servidor, incluindo canais, cargos, permissões, mensagens, emojis e stickers, foram salvas na nuvem. Se por acaso seu servidor enfrentar problemas no futuro, será possível restaurá-lo completamente com apenas um comando.')
        .setColor('White')
        .setFields({
            name: `Informações salvas na nuvem`,
            value: `- Canais: \`${BackupStorage.get(`Backup_${channel_logs.guild.id}`)[0]?.channels?.length}\` | Cargos: \`${BackupStorage.get(`Backup_${channel_logs.guild.id}`)[0]?.roles?.length}\` | Emojis: \`${BackupStorage.get(`Backup_${channel_logs.guild.id}`)[0]?.emojis?.length}\` | Figurinhas: \`${BackupStorage.get(`Backup_${channel_logs.guild.id}`)[0]?.stickers?.length}\`\n- Permissões, configurações e mensagens também foram salvas.\n-# Esse sistema está em desenvolvimento.`
        })
        .setFooter({ text: `eCloud Driver - Ease Solutions.`, iconURL: `https://cdn.discordapp.com/emojis/1178328984170287114.webp` })
        .setTimestamp();

    try {
        channel_logs.send({ embeds: [embed] });
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    SincronizarDados
};
