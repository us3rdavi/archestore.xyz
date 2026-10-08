'use strict';

const {
    ActionRowBuilder,
    ButtonStyle,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');
const { Emojis } = require('../../Database');
const { buildSubPanel } = require('../../Functions/ConfigPainelBuilder');
const {
    EDITOR_FIELDS,
    buildAddChannelsPanel,
    buildKeywordPanel,
    buildRemoveChannelsPanel,
    buildScriptEditorPayload,
    buildScriptsPanel,
    closeEditor,
    createKeywordEntry,
    getEditorSession,
    getScriptsConfig,
    hasScriptMessage,
    normalizeKeyword,
    saveEditor,
    saveScriptsConfig,
    startEditor,
} = require('../../Functions/ScriptsBuilder');

function modalTextInput(customId, label, style, maxLength, currentValue = '', required = false, placeholder) {
    const input = new TextInputBuilder()
        .setCustomId(customId)
        .setLabel(label)
        .setStyle(style)
        .setMaxLength(maxLength)
        .setRequired(required);
    if (currentValue) input.setValue(currentValue.slice(0, maxLength));
    if (placeholder) input.setPlaceholder(placeholder);
    return new ActionRowBuilder().addComponents(input);
}

function parseEntryAndPage(action, prefix) {
    const suffix = action.slice(prefix.length);
    const separator = suffix.lastIndexOf('_');
    if (separator < 1) return null;
    const page = Number(suffix.slice(separator + 1));
    if (!Number.isInteger(page) || page < 0) return null;
    return { entryId: suffix.slice(0, separator), page };
}

function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch (error) {
        return false;
    }
}

async function replyError(interaction, message) {
    if (interaction.replied || interaction.deferred) {
        return interaction.followUp({ content: message, ephemeral: true });
    }
    return interaction.reply({ content: message, ephemeral: true });
}

module.exports = {
    name: 'interactionCreate',

    run: async (interaction) => {
        const customId = interaction.customId;
        if (!customId || !customId.startsWith('scripts_')) return;

        const [, userId] = customId.split('_');
        if (!userId || userId !== interaction.user.id) {
            return replyError(interaction, `${Emojis.get('negative_emoji')} Esta interação não é sua.`);
        }
        if (!interaction.guildId) {
            return replyError(interaction, `${Emojis.get('negative_emoji')} Este sistema só pode ser usado em um servidor.`);
        }

        const action = customId.slice(`scripts_${userId}_`.length);
        const guildId = interaction.guildId;
        const guild = interaction.guild;

        try {
            if (interaction.isChannelSelectMenu()) {
                if (action !== 'channels_apply') return;

                const config = getScriptsConfig(guildId);
                const validIds = interaction.values.filter(channelId => {
                    const channel = guild.channels.cache.get(channelId);
                    return channel && (
                        channel.type === 0 ||
                        channel.type === 5
                    );
                });
                const beforeCount = config.channels.length;
                config.channels = [...new Set([...config.channels, ...validIds])];
                saveScriptsConfig(guildId, config);
                const added = config.channels.length - beforeCount;
                await interaction.update(buildScriptsPanel(guildId, userId, guild));
                if (added === 0) {
                    await interaction.followUp({
                        content: `${Emojis.get('information_emoji')} Os canais selecionados já estavam cadastrados.`,
                        ephemeral: true,
                    });
                }
                return;
            }

            if (interaction.isStringSelectMenu()) {
                if (action === 'editor_nav') {
                    const session = getEditorSession(userId);
                    if (!session || session.guildId !== guildId) {
                        return replyError(interaction, `${Emojis.get('negative_emoji')} A sessão do editor expirou. Abra a mensagem novamente.`);
                    }
                    session.section = interaction.values[0];
                    await interaction.update(buildScriptEditorPayload(userId));
                    return;
                }

                const keywordPageMatch = action.match(/^keywords_select_(\d+)$/);
                if (keywordPageMatch) {
                    await interaction.update(
                        buildKeywordPanel(guildId, userId, interaction.values[0], Number(keywordPageMatch[1]))
                    );
                    return;
                }

                const removeChannelsMatch = action.match(/^channels_remove_select_(\d+)$/);
                if (removeChannelsMatch) {
                    const config = getScriptsConfig(guildId);
                    const selected = new Set(interaction.values);
                    config.channels = config.channels.filter(channelId => !selected.has(channelId));
                    saveScriptsConfig(guildId, config);
                    if (config.channels.length === 0) {
                        await interaction.update(buildScriptsPanel(guildId, userId, guild));
                    } else {
                        await interaction.update(
                            buildRemoveChannelsPanel(guildId, userId, guild, Number(removeChannelsMatch[1]))
                        );
                    }
                    return;
                }

                if (action === 'editor_remove_link') {
                    const session = getEditorSession(userId);
                    if (!session || session.guildId !== guildId) {
                        return replyError(interaction, `${Emojis.get('negative_emoji')} A sessão do editor expirou.`);
                    }
                    const indexes = interaction.values.map(Number).filter(Number.isInteger).sort((a, b) => b - a);
                    for (const index of indexes) session.draft.links?.splice(index, 1);
                    if (!session.draft.links?.length) delete session.draft.links;
                    await interaction.update(buildScriptEditorPayload(userId));
                    return;
                }
            }

            if (interaction.isModalSubmit()) {
                if (action === 'modal_add_keyword') {
                    const keyword = interaction.fields.getTextInputValue('keyword').trim();
                    const normalized = normalizeKeyword(keyword);
                    if (!normalized) {
                        return replyError(interaction, `${Emojis.get('negative_emoji')} Informe uma palavra-chave válida.`);
                    }

                    const config = getScriptsConfig(guildId);
                    if (config.entries.some(entry => normalizeKeyword(entry.keyword) === normalized)) {
                        return replyError(interaction, `${Emojis.get('negative_emoji')} Essa palavra-chave já está cadastrada.`);
                    }
                    const entry = createKeywordEntry(keyword);
                    config.entries.push(entry);
                    saveScriptsConfig(guildId, config);
                    await interaction.update(buildKeywordPanel(guildId, userId, entry.id));
                    return;
                }

                if (action.startsWith('modal_keyword_rename_')) {
                    const parsed = parseEntryAndPage(action, 'modal_keyword_rename_');
                    if (!parsed) return replyError(interaction, `${Emojis.get('negative_emoji')} Não foi possível identificar a palavra-chave.`);
                    const config = getScriptsConfig(guildId);
                    const entry = config.entries.find(item => item.id === parsed.entryId);
                    if (!entry) return replyError(interaction, `${Emojis.get('negative_emoji')} Essa palavra-chave não existe mais.`);

                    const keyword = interaction.fields.getTextInputValue('keyword').trim();
                    const normalized = normalizeKeyword(keyword);
                    if (!normalized) {
                        return replyError(interaction, `${Emojis.get('negative_emoji')} Informe uma palavra-chave válida.`);
                    }
                    if (config.entries.some(item => item.id !== entry.id && normalizeKeyword(item.keyword) === normalized)) {
                        return replyError(interaction, `${Emojis.get('negative_emoji')} Essa palavra-chave já está cadastrada.`);
                    }

                    entry.keyword = keyword;
                    saveScriptsConfig(guildId, config);
                    await interaction.update(buildKeywordPanel(guildId, userId, entry.id, parsed.page));
                    return;
                }

                const editorFieldMatch = action.match(/^modal_editor_(title|description|content|image|footer)$/);
                if (editorFieldMatch) {
                    const session = getEditorSession(userId);
                    if (!session || session.guildId !== guildId) {
                        return replyError(interaction, `${Emojis.get('negative_emoji')} A sessão do editor expirou.`);
                    }
                    const section = editorFieldMatch[1];
                    const value = interaction.fields.getTextInputValue('value').trim();
                    if (section === 'image' && value && !isHttpUrl(value)) {
                        return replyError(interaction, `${Emojis.get('negative_emoji')} Use uma URL de imagem válida iniciada por http:// ou https://.`);
                    }
                    if (value) session.draft[section] = value;
                    else delete session.draft[section];
                    session.section = section;
                    await interaction.update(buildScriptEditorPayload(userId));
                    return;
                }

                if (action === 'modal_editor_link') {
                    const session = getEditorSession(userId);
                    if (!session || session.guildId !== guildId) {
                        return replyError(interaction, `${Emojis.get('negative_emoji')} A sessão do editor expirou.`);
                    }
                    const label = interaction.fields.getTextInputValue('label').trim();
                    const url = interaction.fields.getTextInputValue('url').trim();
                    if (!label || !url || !isHttpUrl(url)) {
                        return replyError(interaction, `${Emojis.get('negative_emoji')} Informe um nome e uma URL http(s) válida.`);
                    }
                    if (!Array.isArray(session.draft.links)) session.draft.links = [];
                    if (session.draft.links.length >= 5) {
                        return replyError(interaction, `${Emojis.get('negative_emoji')} O limite é de cinco botões de link.`);
                    }
                    session.draft.links.push({ label, url });
                    session.section = 'links';
                    await interaction.update(buildScriptEditorPayload(userId));
                    return;
                }
            }

            if (!interaction.isButton()) return;

            if (action === 'back_config') {
                await interaction.update({
                    components: [buildSubPanel(userId, 'scripts')],
                    flags: MessageFlags.IsComponentsV2,
                    content: '',
                    embeds: [],
                });
                return;
            }

            if (action === 'main' || action.match(/^main_\d+$/)) {
                const page = action === 'main' ? 0 : Number(action.slice('main_'.length));
                await interaction.update(buildScriptsPanel(guildId, userId, guild, page));
                return;
            }

            if (action === 'channels_add') {
                await interaction.update(buildAddChannelsPanel(userId));
                return;
            }

            if (action === 'channels_remove') {
                await interaction.update(buildRemoveChannelsPanel(guildId, userId, guild));
                return;
            }

            const channelsPageMatch = action.match(/^channels_(prev|next)_(\d+)$/);
            if (channelsPageMatch) {
                const oldPage = Number(channelsPageMatch[2]);
                const page = Math.max(0, oldPage + (channelsPageMatch[1] === 'next' ? 1 : -1));
                await interaction.update(buildRemoveChannelsPanel(guildId, userId, guild, page));
                return;
            }

            if (action === 'keyword_add') {
                const modal = new ModalBuilder()
                    .setCustomId(`scripts_${userId}_modal_add_keyword`)
                    .setTitle('Adicionar palavra-chave');
                modal.addComponents(
                    modalTextInput(
                        'keyword',
                        'Palavra ou frase (máx. 80 caracteres)',
                        TextInputStyle.Short,
                        80,
                        '',
                        true,
                        'Ex.: Rivals'
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            if (action === 'toggle') {
                const config = getScriptsConfig(guildId);
                config.enabled = !config.enabled;
                saveScriptsConfig(guildId, config);
                await interaction.update(buildScriptsPanel(guildId, userId, guild));
                return;
            }

            const keywordsPageMatch = action.match(/^keywords_(prev|next)_(\d+)$/);
            if (keywordsPageMatch) {
                const oldPage = Number(keywordsPageMatch[2]);
                const page = Math.max(0, oldPage + (keywordsPageMatch[1] === 'next' ? 1 : -1));
                await interaction.update(buildScriptsPanel(guildId, userId, guild, page));
                return;
            }

            if (action.startsWith('keyword_edit_')) {
                const parsed = parseEntryAndPage(action, 'keyword_edit_');
                if (!parsed || !startEditor(userId, guildId, parsed.entryId)) {
                    return replyError(interaction, `${Emojis.get('negative_emoji')} Essa palavra-chave não existe mais.`);
                }
                await interaction.update(buildScriptEditorPayload(userId));
                return;
            }

            if (action.startsWith('keyword_rename_')) {
                const parsed = parseEntryAndPage(action, 'keyword_rename_');
                const entry = parsed && getScriptsConfig(guildId).entries.find(item => item.id === parsed.entryId);
                if (!parsed || !entry) {
                    return replyError(interaction, `${Emojis.get('negative_emoji')} Essa palavra-chave não existe mais.`);
                }
                const modal = new ModalBuilder()
                    .setCustomId(`scripts_${userId}_modal_keyword_rename_${parsed.entryId}_${parsed.page}`)
                    .setTitle('Renomear palavra-chave');
                modal.addComponents(
                    modalTextInput(
                        'keyword',
                        'Nova palavra ou frase',
                        TextInputStyle.Short,
                        80,
                        entry.keyword,
                        true
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            if (action.startsWith('keyword_delete_')) {
                const parsed = parseEntryAndPage(action, 'keyword_delete_');
                if (!parsed) return replyError(interaction, `${Emojis.get('negative_emoji')} Não foi possível identificar a palavra-chave.`);
                const config = getScriptsConfig(guildId);
                const exists = config.entries.some(entry => entry.id === parsed.entryId);
                if (!exists) return replyError(interaction, `${Emojis.get('negative_emoji')} Essa palavra-chave não existe mais.`);
                config.entries = config.entries.filter(entry => entry.id !== parsed.entryId);
                saveScriptsConfig(guildId, config);
                if (getEditorSession(userId)?.entryId === parsed.entryId) closeEditor(userId);
                await interaction.update(buildScriptsPanel(guildId, userId, guild, parsed.page));
                return;
            }

            if (action.startsWith('editor_set_')) {
                const session = getEditorSession(userId);
                const section = action.slice('editor_set_'.length);
                const field = EDITOR_FIELDS[section];
                if (!session || session.guildId !== guildId || !field) {
                    return replyError(interaction, `${Emojis.get('negative_emoji')} Não foi possível abrir esse campo do editor.`);
                }
                const modal = new ModalBuilder()
                    .setCustomId(`scripts_${userId}_modal_editor_${section}`)
                    .setTitle(`Editar ${field.label}`);
                modal.addComponents(
                    modalTextInput(
                        'value',
                        field.label,
                        field.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short,
                        field.maxLength,
                        session.draft[section] || '',
                        false
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            if (action.startsWith('editor_remove_')) {
                const session = getEditorSession(userId);
                const section = action.slice('editor_remove_'.length);
                if (!session || session.guildId !== guildId || !EDITOR_FIELDS[section]) {
                    return replyError(interaction, `${Emojis.get('negative_emoji')} Não foi possível remover esse campo.`);
                }
                delete session.draft[section];
                session.section = section;
                await interaction.update(buildScriptEditorPayload(userId));
                return;
            }

            if (action === 'editor_add_link') {
                const session = getEditorSession(userId);
                if (!session || session.guildId !== guildId) {
                    return replyError(interaction, `${Emojis.get('negative_emoji')} A sessão do editor expirou.`);
                }
                const modal = new ModalBuilder()
                    .setCustomId(`scripts_${userId}_modal_editor_link`)
                    .setTitle('Adicionar botão de link');
                modal.addComponents(
                    modalTextInput('label', 'Texto do botão', TextInputStyle.Short, 80, '', true, 'Ex.: Abrir site'),
                    modalTextInput('url', 'URL do botão (http/https)', TextInputStyle.Short, 500, '', true, 'https://')
                );
                await interaction.showModal(modal);
                return;
            }

            if (action === 'editor_save') {
                const session = getEditorSession(userId);
                if (!session || session.guildId !== guildId) {
                    return replyError(interaction, `${Emojis.get('negative_emoji')} A sessão do editor expirou.`);
                }
                if (!hasScriptMessage(session.draft)) {
                    return replyError(interaction, `${Emojis.get('negative_emoji')} Configure pelo menos um componente antes de salvar.`);
                }
                const entry = saveEditor(userId);
                if (!entry) return replyError(interaction, `${Emojis.get('negative_emoji')} A palavra-chave não existe mais.`);
                await interaction.update(buildKeywordPanel(guildId, userId, entry.id));
                return;
            }

            if (action === 'editor_cancel') {
                const session = getEditorSession(userId);
                if (!session || session.guildId !== guildId) {
                    return replyError(interaction, `${Emojis.get('negative_emoji')} A sessão do editor expirou.`);
                }
                const entryId = session.entryId;
                closeEditor(userId);
                await interaction.update(buildKeywordPanel(guildId, userId, entryId));
            }
        } catch (error) {
            if (error.code === 10062) return;
            console.error('[ScriptsHandler] Erro:', error);
            try {
                await replyError(interaction, `${Emojis.get('negative_emoji')} Ocorreu um erro ao configurar Scripts.`);
            } catch (replyError) {
                if (replyError.code !== 10062) console.error('[ScriptsHandler] Falha ao responder:', replyError.message);
            }
        }
    },
};
