const { Emojis } = require('../Database');
const AllEmojis = require('./emojis.json');
const axios = require('axios');

async function fetchEmojis(client) {
    const response = await axios.get(`https://discord.com/api/v10/applications/${client.user.id}/emojis`, {
        headers: {
            Authorization: `Bot ${client.token}`
        }
    });
    return Array.isArray(response.data?.items) ? response.data.items : [];
}

async function createEmoji(client, name, image) {
    const url = `https://discord.com/api/v10/applications/${client.user.id}/emojis`;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
        try {
            const response = await axios.post(url, {
                name,
                image,
            }, {
                headers: {
                    Authorization: `Bot ${client.token}`,
                },
            });

            const emoji = response.data;
            await saveEmojiToDatabase(name, emoji.id, emoji.animated);
            return emoji.animated
                ? `<a:${emoji.name}:${emoji.id}>`
                : `<:${emoji.name}:${emoji.id}>`;
        } catch (error) {
            const status = error.response?.status;
            if (status === 429 && attempt < 5) {
                const retryAfter = Number(
                    error.response?.data?.retry_after ??
                    error.response?.headers?.['retry-after'] ??
                    1
                );
                await new Promise(resolve => setTimeout(resolve, Math.ceil(retryAfter * 1000)));
                continue;
            }
            if (status >= 500 && attempt < 5) {
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                continue;
            }

            console.error(`[Emojis] Erro ao adicionar o emoji ${name}:`, error.message);
            return null;
        }
    }
    return null;
}


async function GetEmoji(client, emojiName) {
    const emojis = await fetchEmojis(client);

    const existingEmoji = emojis.find(e => e.name === emojiName);
    if (existingEmoji) {
        if (existingEmoji.animated) {
            return `<a:${emojiName}:${existingEmoji.id}>`;
        } else {
            return `<:${emojiName}:${existingEmoji.id}>`;
        }
    }

    const emojiData = AllEmojis.find(e => e.name === emojiName);
    if (emojiData) {
        return await createEmoji(client, emojiData.name, emojiData.image);
    }
    return null;
}

async function saveEmojiToDatabase(emojiName, emojiId, animated) {
    try {
        Emojis.set(emojiName, animated ? `<a:${emojiName}:${emojiId}>` : `<:${emojiName}:${emojiId}>`);
    } catch (error) {
        console.log(`\x1b[31m[Emojis]\x1b[0m Erro ao salvar o emoji ${emojiName} no banco de dados: ${error.message}`);
    }
}

async function UploadEmojis(client) {
    const emojis = await fetchEmojis(client);
    const savedEmojis = Emojis.fetchAll();
    let synced = 0;

    for (const emoji of emojis) {
        const mention = emoji.animated
            ? `<a:${emoji.name}:${emoji.id}>`
            : `<:${emoji.name}:${emoji.id}>`;
        if (savedEmojis[emoji.name] === mention) continue;

        await saveEmojiToDatabase(emoji.name, emoji.id, emoji.animated);
        savedEmojis[emoji.name] = mention;
        synced += 1;
    }

    // Do not create unrelated emojis during bot startup. New assets are imported
    // explicitly through the safe icon-pack importer.
    return { synced, uploaded: 0 };
}

module.exports = {
    GetEmoji,
    UploadEmojis
};
