'use strict';

const { Emojis } = require('../Database');

const applicationEmojiCache = new WeakMap();
const CACHE_TTL_MS = 60_000;
const RETRY_AFTER_ERROR_MS = 5_000;

async function getUsableEmojiIds(client, guild) {
    const now = Date.now();
    const guildIds = new Set(
        [...(guild?.emojis?.cache?.values() || [])].map(emoji => emoji.id)
    );

    if (!client || (typeof client !== 'object' && typeof client !== 'function')) {
        return guildIds;
    }

    let cached = applicationEmojiCache.get(client);
    if (cached?.expiresAt > now) {
        return new Set([...cached.ids, ...guildIds]);
    }

    if (!cached?.refreshPromise) {
        const manager = client.application?.emojis;
        if (!manager?.fetch) {
            console.warn('[Emojis] O gerenciador de emojis da aplicação ainda não está disponível.');
            cached = { ids: new Set(), expiresAt: now + RETRY_AFTER_ERROR_MS };
            applicationEmojiCache.set(client, cached);
            return guildIds;
        }

        const refreshPromise = Promise.resolve()
            .then(() => manager.fetch({ force: true }))
            .then(emojis => {
                const ids = new Set([...emojis.values()].map(emoji => emoji.id));
                applicationEmojiCache.set(client, {
                    ids,
                    expiresAt: Date.now() + CACHE_TTL_MS,
                });
                return ids;
            })
            .catch(error => {
                console.warn(`[Emojis] Não foi possível atualizar os emojis da aplicação: ${error.message}`);
                applicationEmojiCache.set(client, {
                    ids: new Set(),
                    expiresAt: Date.now() + RETRY_AFTER_ERROR_MS,
                });
                return new Set();
            });

        cached = { ids: new Set(), expiresAt: 0, refreshPromise };
        applicationEmojiCache.set(client, cached);
    }

    const applicationIds = cached.refreshPromise
        ? await cached.refreshPromise
        : cached.ids;
    return new Set([...applicationIds, ...guildIds]);
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
