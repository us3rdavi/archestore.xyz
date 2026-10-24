'use strict';

const { Emojis } = require('../Database');

function getConfiguredEmojiIds() {
    const ids = new Set();
    for (const value of Object.values(Emojis.all())) {
        if (typeof value !== 'string') continue;
        const match = value.match(/^<(?:a)?:[^:]+:(\d+)>$/);
        const id = match?.[1] || (/^\d+$/.test(value.trim()) ? value.trim() : null);
        if (id) ids.add(id);
    }
    return ids;
}

async function getUsableEmojiIds(_client, guild) {
    const configuredIds = getConfiguredEmojiIds();
    const guildIds = new Set(
        [...(guild?.emojis?.cache?.values() || [])].map(emoji => emoji.id)
    );
    return new Set([...configuredIds, ...guildIds]);
}

async function buildDatabaseEmojiOptions(client, {
    guild,
    includeNoEmoji = false,
    noEmojiLabel = 'Sem emoji',
    noEmojiValue = 'sem_emoji',
    valueMode = 'id',
} = {}) {
    const usableIds = await getUsableEmojiIds(client, guild);
    const options = [];
    const seenIds = new Set();

    if (includeNoEmoji) {
        options.push({ label: noEmojiLabel, value: noEmojiValue });
    }

    for (const [key, value] of Object.entries(Emojis.all())) {
        if (typeof value !== 'string') continue;
        const match = value.match(/^<(a?):([^:]+):(\d+)>$/);
        if (!match) continue;

        const [, animated, emojiName, id] = match;
        if (!usableIds.has(id) || seenIds.has(id)) continue;
        seenIds.add(id);

        options.push({
            label: (key.replace(/_emoji$/, '').replace(/_/g, ' ') || emojiName).slice(0, 100),
            value: valueMode === 'mention' ? value : id,
            emoji: { id, animated: animated === 'a' },
        });
    }

    return options;
}

function buildGuildEmojiOptions(guild, { includeAnimated = true, limit = Infinity } = {}) {
    return [...(guild?.emojis?.cache?.values() || [])]
        .filter(emoji => includeAnimated || !emoji.animated)
        .slice(0, limit)
        .map(emoji => ({
            label: ((emoji.name || 'emoji').replace(/_/g, ' ')).slice(0, 100),
            value: emoji.id,
            emoji: { id: emoji.id, animated: !!emoji.animated },
        }));
}

module.exports = {
    getUsableEmojiIds,
    buildDatabaseEmojiOptions,
    buildGuildEmojiOptions,
};
