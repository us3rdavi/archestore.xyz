const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const { configuracao, Emojis } = require("../DataBaseJson");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

function buildContainer(text, rowComponent) {
    const container = new ContainerBuilder();
    container;
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
    if (rowComponent) container.addActionRowComponents(rowComponent);
    return container;
}

function getEmoji(type) {
    if (type === 'error') return Emojis.get('negative_emoji') || '';
    if (type === 'success') return Emojis.get('confirmed_emoji') || '';
    if (type === 'loading') return Emojis.get('loading_emoji') || '';
    return '';
}

async function replyMessage({ interaction, type, message, components }) {
    const container = buildContainer(`${getEmoji(type)} ${message}`, components || null);
    return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], ephemeral: true });
}

async function editReplyMessage({ interaction, type, message, components }) {
    const container = buildContainer(`${getEmoji(type)} ${message}`, components || null);
    return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], ephemeral: true });
}

async function updateMessage({ interaction, type, message, components }) {
    const container = buildContainer(`${getEmoji(type)} ${message}`, components || null);
    return interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], ephemeral: true });
}

async function followUpMessage({ interaction, type, message, components }) {
    const container = buildContainer(`${getEmoji(type)} ${message}`, components || null);
    return interaction.followUp({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], ephemeral: true });
}

module.exports = {
    replyMessage,
    editReplyMessage,
    updateMessage,
    followUpMessage
};
