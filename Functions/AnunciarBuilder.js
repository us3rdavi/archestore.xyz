const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ButtonStyle, EmbedBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { dbembed, Emojis } = require('../Database');

const NAV_OPTIONS = [
    { label: 'Menu Principal', description: 'Voltar ao menu principal',  value: 'main',        emoji: { id: '1501804019184828507' } },
    { label: 'Título',         description: 'Editar título da embed',     value: 'title',       emoji: { id: '1501804003850322052' } },
    { label: 'Descrição',      description: 'Editar descrição da embed',  value: 'description', emoji: { id: '1501804039451709441' } },
    { label: 'Campos',         description: 'Editar campos da embed',     value: 'fields',      emoji: { id: '1501804013262475275' } },
    { label: 'Autor',          description: 'Editar autor da embed',      value: 'author',      emoji: { id: '1501804126487580773' } },
    { label: 'Cor',            description: 'Editar cor da embed',        value: 'color',       emoji: { id: '1501804122943389716' } },
    { label: 'URL',            description: 'Editar URL da embed',        value: 'url',         emoji: { id: '1501803997583904810' } },
    { label: 'Thumbnail',      description: 'Editar thumbnail da embed',  value: 'thumbnail',   emoji: { id: '1501804049563910285' } },
    { label: 'Imagem',         description: 'Editar imagem da embed',     value: 'image',       emoji: { id: '1501803928973476023' } },
    { label: 'Footer',         description: 'Editar footer da embed',     value: 'footer',      emoji: { id: '1501804120615555132' } },
    { label: 'Timestamp',      description: 'Editar timestamp da embed',  value: 'timestamp',   emoji: { id: '1501804058699366470' } },
];

const SECTION_LABELS = {
    title: 'Título', description: 'Descrição', fields: 'Campos',
    author: 'Autor', color: 'Cor', url: 'URL',
    thumbnail: 'Thumbnail', image: 'Imagem', footer: 'Footer', timestamp: 'Timestamp',
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

function buildDiscordEmbed(data) {
    if (!data || Object.keys(data).filter(k => k !== 'content').length === 0) return null;
    const embed = new EmbedBuilder();
    if (data.title) embed.setTitle(data.title);
    if (data.description) embed.setDescription(data.description);
    try { embed.setColor(data.color || '#5865F2'); } catch (e) { embed.setColor('#5865F2'); }
    if (data.url) { try { embed.setURL(data.url); } catch (e) {} }
    if (data.thumbnail) { try { embed.setThumbnail(data.thumbnail); } catch (e) {} }
    if (data.image) { try { embed.setImage(data.image); } catch (e) {} }
    if (data.author) embed.setAuthor({ name: data.author });
    if (data.footer) embed.setFooter({ text: data.footer });
    if (data.timestamp) embed.setTimestamp(new Date(data.timestamp));
    if (data.fields && data.fields.length > 0) {
        embed.addFields(data.fields.map(f => ({
            name: f.name || '\u200b',
            value: f.value || '\u200b',
            inline: f.inline || false,
        })));
    }
    return embed;
}

function buildPreviewText(data) {
    const hasData = Object.keys(data).some(k => k !== 'content');
    if (!hasData && !data.content) {
        return `-# Configure as propriedades abaixo para construir a embed.`;
    }
    const ok = Emojis.get('confirmed_emoji') || '✅';
    const no = Emojis.get('negative_emoji')  || '❌';
    const lines = [];
    if (data.title)       lines.push(`**Título:** \`${data.title.slice(0, 60)}\``);
    if (data.description) lines.push(`**Descrição:** \`${data.description.slice(0, 80)}${data.description.length > 80 ? '...' : ''}\``);
    if (data.color)       lines.push(`**Cor:** \`${data.color}\``);
    if (data.author)      lines.push(`**Autor:** \`${data.author.slice(0, 60)}\``);
    if (data.url)         lines.push(`**URL:** \`${data.url.slice(0, 60)}\``);
    if (data.thumbnail)   lines.push(`**Thumbnail:** ${ok} Definida`);
    if (data.image)       lines.push(`**Imagem:** ${ok} Definida`);
    if (data.footer)      lines.push(`**Footer:** \`${data.footer.slice(0, 60)}\``);
    if (data.timestamp)   lines.push(`**Timestamp:** \`${new Date(data.timestamp).toLocaleString('pt-BR')}\``);
    if (data.fields && data.fields.length > 0) lines.push(`**Campos:** \`${data.fields.length}\` campo(s) definido(s)`);
    if (data.content)     lines.push(`**Conteúdo:** \`${data.content.slice(0, 80)}${data.content.length > 80 ? '...' : ''}\``);
    return lines.length ? lines.join('\n') : `-# Configure as propriedades abaixo para construir a embed.`;
}

const CV2 = { flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };

function buildNavSelect(userId, currentSection) {
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
    const previewText = buildPreviewText(data);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_send_emoji') || '📢'} Construtor de Anúncios\n` +
        `-# Pré-visualização das propriedades configuradas`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(previewText));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(buildNavSelect(userId, 'main'));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`anunciar_post_${userId}`)
            .setLabel('Enviar Embed')
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

    return { components: [container], ...CV2 };
}

function buildSectionScreen(userId, section) {
    const data = getEmbedData(userId);
    const previewText = buildPreviewText(data);
    const sectionLabel = SECTION_LABELS[section] || section;

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji') || '✏️'} Editando — ${sectionLabel}\n` +
        `-# Pré-visualização atual das propriedades`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(previewText));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(buildNavSelect(userId, section));

    let actionRow;
    if (section === 'fields') {
        actionRow = new ActionRowBuilder().addComponents(
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
        );
    } else if (section === 'timestamp') {
        actionRow = new ActionRowBuilder().addComponents(
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
        );
    } else {
        actionRow = new ActionRowBuilder().addComponents(
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
        );
    }

    container.addActionRowComponents(actionRow);
    return { components: [container], ...CV2 };
}

module.exports = {
    getEmbedData,
    setEmbedData,
    clearEmbedData,
    buildMainMenu,
    buildSectionScreen,
    buildDiscordEmbed,
    SECTION_LABELS,
    NAV_OPTIONS,
};
