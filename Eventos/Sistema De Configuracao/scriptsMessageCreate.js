'use strict';

const { MessageFlags } = require('discord.js');
const {
    buildScriptMessageContainer,
    getScriptsConfig,
    hasScriptMessage,
    normalizeKeyword,
} = require('../../Functions/ScriptsBuilder');

function findMatchingScript(messageContent, config) {
    const content = normalizeKeyword(messageContent);
    if (!content) return null;

    return config.entries
        .filter(entry => {
            const keyword = normalizeKeyword(entry.keyword);
            return keyword && content.includes(keyword) && hasScriptMessage(entry.message);
        })
        .sort((a, b) => normalizeKeyword(b.keyword).length - normalizeKeyword(a.keyword).length)[0] || null;
}

async function processScriptsMessage(message) {
    if (!message?.guildId || !message.channelId || !message.content || message.author?.bot || message.webhookId) return false;

    const config = getScriptsConfig(message.guildId);
    if (!config.enabled || !config.channels.includes(String(message.channelId))) return false;

    const match = findMatchingScript(message.content, config);
    if (!match) return false;

    await message.channel.send({
        components: [buildScriptMessageContainer(match.message)],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] },
    });
    return true;
}

module.exports = {
    name: 'messageCreate',
    run: async message => {
        try {
            await processScriptsMessage(message);
        } catch (error) {
            console.error('[ScriptsMessageCreate] Falha ao enviar resposta:', error);
        }
    },
    findMatchingScript,
    processScriptsMessage,
};
