const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ButtonStyle, MessageFlags,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MediaGalleryBuilder,
} = require('discord.js');
const { dbembed, Emojis } = require('../Database');

const NAV_OPTIONS = [
    { label: 'Menu Principal', description: 'Voltar ao menu principal',   value: 'main',        emoji: { id: '1501804019184828507' } },
    { label: 'Título',         description: 'Editar título do anúncio',   value: 'title',       emoji: { id: '1501804003850322052' } },
    { label: 'Descrição',      description: 'Editar texto do anúncio',    value: 'description', emoji: { id: '1501804039451709441' } },
    { label: 'Campos',         description: 'Editar campos/seções',       value: 'fields',      emoji: { id: '1501804013262475275' } },
    { label: 'Autor',          description: 'Texto de origem/autor',      value: 'author',      emoji: { id: '1501804126487580773' } },
    { label: 'URL',            description: 'Link no título',             value: 'url',         emoji: { id: '1501803997583904810' } },
    { label: 'Imagem',         description: 'Imagem principal',           value: 'image',       emoji: { id: '1501803928973476023' } },
    { label: 'Footer',         description: 'Texto do rodapé',            value: 'footer',      emoji: { id: '1501804120615555132' } },
    { label: 'Timestamp',      description: 'Data e hora no rodapé',      value: 'timestamp',   emoji: { id: '1501804058699366470' } },
];

const SECTION_LABELS = {
    title: 'Título', description: 'Descrição', fields: 'Campos',
    author: 'Autor', url: 'URL',
    image: 'Imagem', footer: 'Footer', timestamp: 'Timestamp',
};

function getEmbedData(userId) {
    return dbembed.get(`builder.${userId}`) || {};
}

function setEmbedData(userId, data) {
    dbembed.set(`builder.${userId}`, data);
}

function clearEmbedData(userId) {
    dbembed.delete(`builder.${userId}`);
}

const CV2 = { flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };

// Monta o container CV2 do anúncio — usado no envio final
function buildAnnouncementContainer(data) {
    const c = new ContainerBuilder();

    const headerLines = [];
    if (data.author) headerLines.push(`-# ${data.author}`);
    if (data.title) headerLines.push(data.url ? `## [${data.title}](${data.url})` : `## ${data.title}`);
    if (data.description) headerLines.push(data.description);
    if (headerLines.length > 0) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerLines.join('\n')));
    }

    if (data.image) {
        try { c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems({ media: { url: data.image } })); } catch (e) {}
    }

    if (data.fields && data.fields.length > 0) {
        c.addSeparatorComponents(new SeparatorBuilder());
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            data.fields.map(f => `**${f.name || '\u200b'}**\n${f.value || '\u200b'}`).join('\n\n')
        ));
    }

    const footerParts = [];
    if (data.footer) footerParts.push(data.footer);
    if (data.timestamp) {
        const ts = Math.floor(new Date(data.timestamp).getTime() / 1000);
        if (!isNaN(ts)) footerParts.push(`<t:${ts}:f>`);
    }
    if (footerParts.length > 0) {
        c.addSeparatorComponents(new SeparatorBuilder());
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            footerParts.map(p => `-# ${p}`).join(' · ')
        ));
    }

    return c;
}

// Container de preview ao vivo — exibido dentro do painel de edição
function buildPreviewContainer(data) {
    const hasData = data && Object.keys(data).some(k => k !== 'content');
    const c = new ContainerBuilder();

    if (!hasData) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `-# Configure as propriedades abaixo para ver o preview aqui.`
        ));
        return c;
    }

    if (data.content) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(data.content));
        c.addSeparatorComponents(new SeparatorBuilder());
    }

    const headerLines = [];
    if (data.author) headerLines.push(`-# ${data.author}`);
    if (data.title) headerLines.push(data.url ? `## [${data.title}](${data.url})` : `## ${data.title}`);
    if (data.description) headerLines.push(data.description);
    if (headerLines.length > 0) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerLines.join('\n')));
    }

    if (data.image) {
        try { c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems({ media: { url: data.image } })); } catch (e) {}
    }

    if (data.fields && data.fields.length > 0) {
        c.addSeparatorComponents(new SeparatorBuilder());
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            data.fields.map(f => `**${f.name || '\u200b'}**\n${f.value || '\u200b'}`).join('\n\n')
        ));
    }

    const footerParts = [];
    if (data.footer) footerParts.push(data.footer);
    if (data.timestamp) {
        const ts = Math.floor(new Date(data.timestamp).getTime() / 1000);
        if (!isNaN(ts)) footerParts.push(`<t:${ts}:f>`);
    }
    if (footerParts.length > 0) {
        c.addSeparatorComponents(new SeparatorBuilder());
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            footerParts.map(p => `-# ${p}`).join(' · ')
        ));
    }

    return c;
}

function buildNavSelectRow(userId, currentSection) {
    const options = NAV_OPTIONS.map(opt => ({ ...opt, default: opt.value === currentSection }));
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`anunciar_nav_${userId}`)
            .setPlaceholder('Selecionar propriedade para editar...')
            .addOptions(options)
    );
}

function buildMainMenu(userId) {
    const data = getEmbedData(userId);
    const previewContainer = buildPreviewContainer(data);

    const controlContainer = new ContainerBuilder();
    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_send_emoji')} Construtor de Anúncios\n` +
        `-# Preview ao vivo acima — edite as propriedades usando o menu abaixo`
    ));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRow(userId, 'main'));
    controlContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`anunciar_post_${userId}`)
            .setLabel('Enviar Anúncio')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`anunciar_content_${userId}`)
            .setLabel('Conteúdo')
            .setEmoji({ id: '1501804039451709441' })
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`anunciar_reset_${userId}`)
            .setLabel('Resetar')
            .setEmoji({ id: '1501803926180335727' })
            .setStyle(ButtonStyle.Danger),
    ));

    return { components: [previewContainer, controlContainer], ...CV2 };
}

function buildSectionScreen(userId, section) {
    const data = getEmbedData(userId);
    const sectionLabel = SECTION_LABELS[section] || section;
    const previewContainer = buildPreviewContainer(data);

    const controlContainer = new ContainerBuilder();
    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Editando — ${sectionLabel}\n` +
        `-# Preview ao vivo acima — use os botões abaixo para editar`
    ));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRow(userId, section));

    if (section === 'fields') {
        controlContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`anunciar_addfield_${userId}`)
                .setLabel('Adicionar Campo')
                .setEmoji({ id: '1501803923126747178' })
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`anunciar_clearfields_${userId}`)
                .setLabel('Limpar Campos')
                .setEmoji({ id: '1501803926180335727' })
                .setStyle(ButtonStyle.Danger),
        ));
    } else if (section === 'timestamp') {
        controlContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`anunciar_setnow_${userId}`)
                .setLabel('Agora')
                .setEmoji({ id: '1501804058699366470' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`anunciar_setcustom_timestamp_${userId}`)
                .setLabel('Definir Timestamp')
                .setEmoji({ id: '1501804003850322052' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`anunciar_remove_timestamp_${userId}`)
                .setLabel('Remover')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(ButtonStyle.Secondary),
        ));
    } else {
        controlContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`anunciar_set_${section}_${userId}`)
                .setLabel(`Definir ${sectionLabel}`)
                .setEmoji({ id: '1501804003850322052' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`anunciar_remove_${section}_${userId}`)
                .setLabel('Remover')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(ButtonStyle.Secondary),
        ));
    }

    return { components: [previewContainer, controlContainer], ...CV2 };
}

module.exports = {
    getEmbedData,
    setEmbedData,
    clearEmbedData,
    buildMainMenu,
    buildSectionScreen,
    buildAnnouncementContainer,
    SECTION_LABELS,
    NAV_OPTIONS,
};
