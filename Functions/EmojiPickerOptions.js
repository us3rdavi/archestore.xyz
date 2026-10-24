'use strict';

const { Emojis } = require('../Database');

const applicationEmojiCache = new WeakMap();
const CACHE_TTL_MS = 60_000;

async function getUsableEmojiIds(client, guild) {
    if (!client?.application?.emojis?.fetch) {
        throw new Error('O cliente Discord ainda não disponibilizou os emojis da aplicação.');
    }

    const now = Date.now();
    let cached = applicationEmojiCache.get(client);
    if (!cached || cached.expiresAt <= now) {
        const emojis = await client.application.emojis.fetch({ force: true });
        cached = {
            expiresAt: now + CACHE_TTL_MS,
            ids: new Set([...emojis.values()].map(emoji => emoji.id)),
        };
        applicationEmojiCache.set(client, cached);
    }

    const usableIds = new Set(cached.ids);
    for (const emoji of guild?.emojis?.cache?.values() || []) {
        usableIds.add(emoji.id);
    }
    return usableIds;
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
