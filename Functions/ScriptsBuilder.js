'use strict';

const { randomUUID } = require('crypto');
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ChannelType,
    ContainerBuilder,
    MediaGalleryBuilder,
    MessageFlags,
    SeparatorBuilder,
    StringSelectMenuBuilder,
    TextDisplayBuilder,
} = require('discord.js');
const { configuracao, Emojis } = require('../Database');

const EDITOR_SESSIONS = new Map();
const KEYWORD_PAGE_SIZE = 25;
const CHANNEL_PAGE_SIZE = 25;

const EDITOR_SECTIONS = [
    { label: 'Menu do editor', value: 'main', description: 'Voltar aos controles da mensagem' },
    { label: 'Título', value: 'title', description: 'Título em destaque no Components V2' },
    { label: 'Descrição', value: 'description', description: 'Texto de descrição' },
    { label: 'Conteúdo', value: 'content', description: 'Bloco principal de texto' },
    { label: 'Imagem', value: 'image', description: 'Imagem ou banner' },
    { label: 'Rodapé', value: 'footer', description: 'Texto compacto no final' },
    { label: 'Botões de link', value: 'links', description: 'Links clicáveis na mensagem' },
];

const EDITOR_FIELDS = {
    title: { label: 'Título', maxLength: 100, style: 'short' },
    description: { label: 'Descrição', maxLength: 1800, style: 'paragraph' },
    content: { label: 'Conteúdo', maxLength: 1800, style: 'paragraph' },
    image: { label: 'URL da imagem', maxLength: 500, style: 'short' },
    footer: { label: 'Rodapé', maxLength: 500, style: 'short' },
};

const V2 = { flags: MessageFlags.IsComponentsV2, content: '', embeds: [] };

function copy(value) {
    return JSON.parse(JSON.stringify(value ?? {}));
}

function normalizeKeyword(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .trim()
        .toLocaleLowerCase('pt-BR');
}

function getScriptsConfig(guildId) {
    const saved = configuracao.get(`Scripts.${guildId}`) || {};
    return {
        enabled: saved.enabled === true,
        channels: Array.isArray(saved.channels) ? [...new Set(saved.channels.map(String))] : [],
        entries: Array.isArray(saved.entries) ? saved.entries.filter(entry => entry && entry.id && entry.keyword) : [],
    };
}

function saveScriptsConfig(guildId, config) {
    const safeConfig = {
        enabled: config.enabled === true,
        channels: [...new Set((config.channels || []).map(String))],
        entries: Array.isArray(config.entries) ? config.entries : [],
    };
    configuracao.set(`Scripts.${guildId}`, safeConfig);
    return safeConfig;
}

function getScriptEntry(guildId, entryId) {
    return getScriptsConfig(guildId).entries.find(entry => entry.id === entryId) || null;
}

function hasScriptMessage(data) {
    return Boolean(
        data && (
            data.title?.trim() ||
            data.description?.trim() ||
            data.content?.trim() ||
            data.image?.trim() ||
            data.footer?.trim() ||
            (Array.isArray(data.links) && data.links.length > 0)
        )
    );
}

function buildScriptMessageContainer(data = {}, showPlaceholder = false) {
    const container = new ContainerBuilder();
    let componentCount = 0;

    if (data.title || data.description) {
        const header = [];
        if (data.title) header.push(`## ${data.title}`);
        if (data.description) header.push(data.description);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(header.join('\n\n')));
        componentCount++;
    }

    if (data.content) {
        if (componentCount > 0) container.addSeparatorComponents(new SeparatorBuilder());
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(data.content));
        componentCount++;
    }

    if (data.image) {
        try {
            if (componentCount > 0) container.addSeparatorComponents(new SeparatorBuilder());
            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems({ media: { url: data.image } })
            );
            componentCount++;
        } catch (error) {
            // An URL inválida é bloqueada ao salvar; mantém o restante da prévia útil.
        }
    }

    if (data.footer) {
        if (componentCount > 0) container.addSeparatorComponents(new SeparatorBuilder());
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${data.footer}`));
        componentCount++;
    }

    const links = Array.isArray(data.links) ? data.links.slice(0, 5) : [];
    if (links.length > 0) {
        if (componentCount > 0) container.addSeparatorComponents(new SeparatorBuilder());
        const row = new ActionRowBuilder();
        for (const link of links) {
            if (!link?.label || !link?.url) continue;
            try {
                row.addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
                        .setLabel(link.label.slice(0, 80))
                        .setURL(link.url)
                );
            } catch (error) {
                // Links inválidos não são enviados; a validação normal os impede de serem salvos.
            }
        }
        if (row.components.length > 0) {
            container.addActionRowComponents(row);
            componentCount++;
        }
    }

    if (componentCount === 0 && showPlaceholder) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `-# Configure o conteúdo abaixo para visualizar a resposta em tempo real.`
        ));
    }

    return container;
}

function payload(components) {
    return { ...V2, components };
}

function buildScriptsPanel(guildId, userId, guild, requestedPage = 0) {
    const config = getScriptsConfig(guildId);
    const pageCount = Math.max(1, Math.ceil(config.entries.length / KEYWORD_PAGE_SIZE));
    const page = Math.min(Math.max(0, Number(requestedPage) || 0), pageCount - 1);
    const container = new ContainerBuilder();
    const channelList = config.channels.slice(0, 8)
        .map(id => `<#${id}>`)
        .join(' · ') || '`Nenhum canal configurado`';
    const extraChannels = config.channels.length > 8
        ? `\n-# e mais ${config.channels.length - 8} canal(is)`
        : '';

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_messages_emoji')} Scripts por palavra-chave\n` +
        `**Status:** ${config.enabled ? '🟢 Ativo' : '⚪ Desativado'}\n` +
        `**Canais monitorados:** ${config.channels.length}\n${channelList}${extraChannels}\n` +
        `**Palavras-chave:** ${config.entries.length}\n\n` +
        `-# As correspondências ignoram maiúsculas/minúsculas. Se uma mensagem combinar com mais de uma palavra, será usada a correspondência mais longa.`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    if (config.entries.length > 0) {
        const options = config.entries
            .slice(page * KEYWORD_PAGE_SIZE, (page + 1) * KEYWORD_PAGE_SIZE)
            .map(entry => ({
                label: entry.keyword.slice(0, 100),
                value: entry.id,
                description: hasScriptMessage(entry.message) ? 'Mensagem Components V2 configurada' : 'Mensagem ainda não configurada',
            }));
        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`scripts_${userId}_keywords_select_${page}`)
                    .setPlaceholder(`Selecione uma palavra-chave (${page + 1}/${pageCount})`)
                    .addOptions(options)
            )
        );
    } else {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `-# Nenhuma palavra-chave cadastrada. Crie uma para configurar a primeira resposta.`
        ));
    }

    if (pageCount > 1) {
        const pageRow = new ActionRowBuilder();
        if (page > 0) {
            pageRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`scripts_${userId}_keywords_prev_${page}`)
                    .setLabel('Anterior')
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        if (page < pageCount - 1) {
            pageRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`scripts_${userId}_keywords_next_${page}`)
                    .setLabel('Próxima')
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        if (pageRow.components.length) container.addActionRowComponents(pageRow);
    }

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`scripts_${userId}_channels_add`)
                .setLabel('Adicionar canais')
                .setEmoji('➕')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`scripts_${userId}_channels_remove`)
                .setLabel('Remover canais')
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(config.channels.length === 0)
        )
    );

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`scripts_${userId}_keyword_add`)
                .setLabel('Adicionar palavra')
                .setEmoji('🔑')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`scripts_${userId}_toggle`)
                .setLabel(config.enabled ? 'Desativar sistema' : 'Ativar sistema')
                .setEmoji(config.enabled ? '⏸️' : '▶️')
                .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
        )
    );

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`scripts_${userId}_back_config`)
                .setLabel('Voltar para /config')
                .setEmoji('↩️')
                .setStyle(ButtonStyle.Secondary)
        )
    );

    return payload([container]);
}

function buildAddChannelsPanel(userId) {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_messages_emoji')} Adicionar canais monitorados\n` +
        `Selecione até 25 canais de texto por vez. Você pode repetir a operação quantas vezes precisar; a lista não tem limite.\n` +
        `Canais já cadastrados não serão duplicados.`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId(`scripts_${userId}_channels_apply`)
                .setPlaceholder('Selecione os canais de texto...')
                .setMinValues(1)
                .setMaxValues(25)
                .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        )
    );
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`scripts_${userId}_main`)
                .setLabel('Voltar')
                .setEmoji('↩️')
                .setStyle(ButtonStyle.Secondary)
        )
    );
    return payload([container]);
}

function buildRemoveChannelsPanel(guildId, userId, guild, requestedPage = 0) {
    const config = getScriptsConfig(guildId);
    const pageCount = Math.max(1, Math.ceil(config.channels.length / CHANNEL_PAGE_SIZE));
    const page = Math.min(Math.max(0, Number(requestedPage) || 0), pageCount - 1);
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_messages_emoji')} Remover canais\n` +
        `Selecione os canais cadastrados que deseja retirar do monitoramento.\n` +
        `-# ${config.channels.length} canal(is) configurado(s) · Página ${page + 1}/${pageCount}`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    if (config.channels.length === 0) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Não há canais para remover.`));
    } else {
        const channelIds = config.channels.slice(page * CHANNEL_PAGE_SIZE, (page + 1) * CHANNEL_PAGE_SIZE);
        const options = channelIds.map(id => {
            const channel = guild?.channels?.cache?.get(id);
            return {
                label: (channel?.name || `Canal ${id}`).slice(0, 100),
                value: id,
                description: `ID: ${id}`,
            };
        });
        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`scripts_${userId}_channels_remove_select_${page}`)
                    .setPlaceholder('Selecione um ou mais canais para remover...')
                    .setMinValues(1)
                    .setMaxValues(options.length)
                    .addOptions(options)
            )
        );

        if (pageCount > 1) {
            const pageRow = new ActionRowBuilder();
            if (page > 0) {
                pageRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`scripts_${userId}_channels_prev_${page}`)
                        .setLabel('Anterior')
                        .setStyle(ButtonStyle.Secondary)
                );
            }
            if (page < pageCount - 1) {
                pageRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`scripts_${userId}_channels_next_${page}`)
                        .setLabel('Próxima')
                        .setStyle(ButtonStyle.Secondary)
                );
            }
            if (pageRow.components.length) container.addActionRowComponents(pageRow);
        }
    }

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`scripts_${userId}_main`)
                .setLabel('Voltar')
                .setEmoji('↩️')
                .setStyle(ButtonStyle.Secondary)
        )
    );
    return payload([container]);
}

function buildKeywordPanel(guildId, userId, entryId, returnPage = 0) {
    const entry = getScriptEntry(guildId, entryId);
    const container = new ContainerBuilder();
    if (!entry) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${Emojis.get('negative_emoji')} Essa palavra-chave não existe mais.`
        ));
        container.addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`scripts_${userId}_main_${returnPage}`)
                .setLabel('Voltar aos Scripts')
                .setStyle(ButtonStyle.Secondary)
        ));
        return payload([container]);
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_messages_emoji')} Palavra-chave: \`${entry.keyword}\`\n` +
        `**Resposta:** ${hasScriptMessage(entry.message) ? 'Components V2 configurados' : 'Ainda não configurada'}\n\n` +
        `-# A mensagem será enviada nos canais monitorados quando esta palavra aparecer.`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`scripts_${userId}_keyword_edit_${entry.id}_${returnPage}`)
                .setLabel('Editar mensagem V2')
                .setEmoji('✏️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`scripts_${userId}_keyword_rename_${entry.id}_${returnPage}`)
                .setLabel('Renomear')
                .setStyle(ButtonStyle.Secondary)
        )
    );
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`scripts_${userId}_keyword_delete_${entry.id}_${returnPage}`)
                .setLabel('Excluir palavra-chave')
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`scripts_${userId}_main_${returnPage}`)
                .setLabel('Voltar')
                .setEmoji('↩️')
                .setStyle(ButtonStyle.Secondary)
        )
    );
    return payload([container]);
}

function startEditor(userId, guildId, entryId) {
    const entry = getScriptEntry(guildId, entryId);
    if (!entry) return null;
    const session = {
        guildId,
        entryId,
        keyword: entry.keyword,
        draft: copy(entry.message),
        section: 'main',
    };
    EDITOR_SESSIONS.set(userId, session);
    return session;
}

function getEditorSession(userId) {
    return EDITOR_SESSIONS.get(userId) || null;
}

function closeEditor(userId) {
    EDITOR_SESSIONS.delete(userId);
}

function saveEditor(userId) {
    const session = getEditorSession(userId);
    if (!session) return null;
    const config = getScriptsConfig(session.guildId);
    const entry = config.entries.find(item => item.id === session.entryId);
    if (!entry) {
        closeEditor(userId);
        return null;
    }
    entry.message = copy(session.draft);
    saveScriptsConfig(session.guildId, config);
    closeEditor(userId);
    return entry;
}

function buildScriptEditorPayload(userId) {
    const session = getEditorSession(userId);
    if (!session) return null;

    const section = session.section || 'main';
    const sectionLabel = EDITOR_SECTIONS.find(item => item.value === section)?.label || 'Menu do editor';
    const preview = buildScriptMessageContainer(session.draft, true);
    const controls = new ContainerBuilder();
    controls.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Editor da resposta — \`${session.keyword}\`\n` +
        `-# Pré-visualização ao vivo acima: cada alteração aparece antes de salvar.\n` +
        `**Editando:** ${sectionLabel}`
    ));
    controls.addSeparatorComponents(new SeparatorBuilder());
    controls.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`scripts_${userId}_editor_nav`)
                .setPlaceholder('Selecionar propriedade para editar...')
                .addOptions(EDITOR_SECTIONS.map(item => ({
                    label: item.label,
                    value: item.value,
                    description: item.description,
                    default: item.value === section,
                })))
        )
    );

    if (section === 'main') {
        controls.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `Configure o título, os textos, a imagem, o rodapé e até cinco botões de link. ` +
            `A prévia usa o mesmo Container Components V2 que será enviado no canal.`
        ));
    } else if (section === 'links') {
        const links = Array.isArray(session.draft.links) ? session.draft.links : [];
        controls.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `**Botões de link:** ${links.length}/5\n` +
            (links.length
                ? links.map((link, index) => `\`${index + 1}.\` **${link.label}** · ${link.url}`).join('\n')
                : `-# Nenhum botão configurado.`)
        ));
        const linkButtons = new ActionRowBuilder();
        if (links.length < 5) {
            linkButtons.addComponents(
                new ButtonBuilder()
                    .setCustomId(`scripts_${userId}_editor_add_link`)
                    .setLabel('Adicionar link')
                    .setEmoji('➕')
                    .setStyle(ButtonStyle.Success)
            );
        }
        if (linkButtons.components.length) controls.addActionRowComponents(linkButtons);
        if (links.length > 0) {
            controls.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`scripts_${userId}_editor_remove_link`)
                        .setPlaceholder('Selecione o(s) link(s) para remover...')
                        .setMinValues(1)
                        .setMaxValues(links.length)
                        .addOptions(links.map((link, index) => ({
                            label: `${index + 1}. ${link.label}`.slice(0, 100),
                            value: String(index),
                            description: link.url.slice(0, 100),
                        })))
                )
            );
        }
    } else {
        const field = EDITOR_FIELDS[section];
        const current = session.draft[section] || '';
        controls.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            current
                ? `**Valor atual:**\n${current.slice(0, 900)}`
                : `-# Ainda não há valor definido para ${field.label.toLowerCase()}.`
        ));
        controls.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`scripts_${userId}_editor_set_${section}`)
                    .setLabel(`Editar ${field.label}`)
                    .setEmoji('✏️')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`scripts_${userId}_editor_remove_${section}`)
                    .setLabel('Remover')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!current)
            )
        );
    }

    controls.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`scripts_${userId}_editor_save`)
                .setLabel('Salvar mensagem')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success)
                .setDisabled(!hasScriptMessage(session.draft)),
            new ButtonBuilder()
                .setCustomId(`scripts_${userId}_editor_cancel`)
                .setLabel('Cancelar')
                .setEmoji('↩️')
                .setStyle(ButtonStyle.Secondary)
        )
    );

    return payload([preview, controls]);
}

function createKeywordEntry(keyword) {
    return {
        id: randomUUID().replace(/-/g, '').slice(0, 16),
        keyword: String(keyword).trim(),
        message: {},
    };
}

module.exports = {
    EDITOR_FIELDS,
    EDITOR_SECTIONS,
    buildAddChannelsPanel,
    buildKeywordPanel,
    buildRemoveChannelsPanel,
    buildScriptEditorPayload,
    buildScriptMessageContainer,
    buildScriptsPanel,
    closeEditor,
    createKeywordEntry,
    getEditorSession,
    getScriptEntry,
    getScriptsConfig,
    hasScriptMessage,
    normalizeKeyword,
    saveEditor,
    saveScriptsConfig,
    startEditor,
};
