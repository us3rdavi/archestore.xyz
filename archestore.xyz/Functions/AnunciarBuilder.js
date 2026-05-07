const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    MessageFlags, ButtonStyle, EmbedBuilder
} = require('discord.js');
const { dbembed, Emojis } = require('../DataBaseJson');

const NAV_OPTIONS = [
    { label: 'Menu Principal', description: 'Voltar ao menu principal',  value: 'main',        emoji: { name: 'system_emoji',   id: '1501804019184828507' } },
    { label: 'Título',         description: 'Editar título da embed',     value: 'title',       emoji: { name: '_lapis_emoji',   id: '1501804003850322052' } },
    { label: 'Descrição',      description: 'Editar descrição da embed',  value: 'description', emoji: { name: '_messages_emoji', id: '1501804039451709441' } },
    { label: 'Campos',         description: 'Editar campos da embed',     value: 'fields',      emoji: { name: '_camp_emoji',    id: '1501804013262475275' } },
    { label: 'Autor',          description: 'Editar autor da embed',      value: 'author',      emoji: { name: '_silueta_emoji', id: '1501804126487580773' } },
    { label: 'Cor',            description: 'Editar cor da embed',        value: 'color',       emoji: { name: '_pincel_emoji',  id: '1501804122943389716' } },
    { label: 'URL',            description: 'Editar URL da embed',        value: 'url',         emoji: { name: '_transfer_emoji',id: '1501803997583904810' } },
    { label: 'Thumbnail',      description: 'Editar thumbnail da embed',  value: 'thumbnail',   emoji: { name: '_star_emoji',    id: '1501804049563910285' } },
    { label: 'Imagem',         description: 'Editar imagem da embed',     value: 'image',       emoji: { name: '_search_emoji',  id: '1501803928973476023' } },
    { label: 'Footer',         description: 'Editar footer da embed',     value: 'footer',      emoji: { name: '_fixe_emoji',    id: '1501804120615555132' } },
    { label: 'Timestamp',      description: 'Editar timestamp da embed',  value: 'timestamp',   emoji: { name: 'clock_emoji',    id: '1501804058699366470' } },
];

const SECTION_LABELS = {
    title: 'Título', description: 'Descrição', fields: 'Campos',
    author: 'Autor', color: 'Cor', url: 'URL',
    thumbnail: 'Thumbnail', image: 'Imagem', footer: 'Footer', timestamp: 'Timestamp'
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

function buildPreviewText(data) {
    if (!data || Object.keys(data).length === 0) {
        return '-# Nenhuma embed configurada ainda.';
    }
    const parts = [];
    if (data.title) parts.push(`### ${data.title}`);
    if (data.description) parts.push(data.description);
    if (data.author) parts.push(`-# ${Emojis.get('_silueta_emoji')} Autor: ${data.author}`);
    if (data.color) parts.push(`-# ${Emojis.get('_pincel_emoji')} Cor: \`${data.color}\``);
    if (data.url) parts.push(`-# ${Emojis.get('_transfer_emoji')} URL configurada`);
    if (data.footer) parts.push(`-# ${Emojis.get('_messages_emoji')} Footer: ${data.footer}`);
    if (data.timestamp) parts.push(`-# ${Emojis.get('clock_emoji')} Timestamp: ${new Date(data.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    if (data.thumbnail) parts.push(`-# ${Emojis.get('photo_emoji')} Thumbnail: configurada`);
    if (data.image) parts.push(`-# ${Emojis.get('photo_emoji')} Imagem: configurada`);
    if (data.fields && data.fields.length > 0) parts.push(`-# ${Emojis.get('_camp_emoji')} Campos: ${data.fields.length}`);
    return parts.length > 0 ? parts.join('\n') : '-# Nenhuma embed configurada ainda.';
}

function buildNavSelect(userId, currentSection) {
    const options = NAV_OPTIONS.map(opt => ({
        ...opt,
        default: opt.value === currentSection
    }));
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`anunciar_nav_${userId}`)
            .setPlaceholder('Selecionar propriedade')
            .addOptions(options)
    );
}

function buildMainMenu(userId) {
    const data = getEmbedData(userId);
    const container = new ContainerBuilder().setAccentColor(0x5865F2);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(buildPreviewText(data))
    );

    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(buildNavSelect(userId, 'main'));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`anunciar_preview_${userId}`)
            .setLabel('Preview')
            .setEmoji(Emojis.get('_search_emoji'))
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`anunciar_post_${userId}`)
            .setLabel('Enviar')
            .setEmoji(Emojis.get('_send_emoji'))
            .setStyle(ButtonStyle.Success),
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`anunciar_content_${userId}`)
            .setLabel('Definir Conteúdo')
            .setEmoji(Emojis.get('_messages_emoji'))
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`anunciar_reset_${userId}`)
            .setLabel('Resetar Tudo')
            .setEmoji(Emojis.get('_trash_emoji'))
            .setStyle(ButtonStyle.Danger),
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(row2);

    return {
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        embeds: [],
        content: ''
    };
}

function buildSectionScreen(userId, section) {
    const data = getEmbedData(userId);
    const container = new ContainerBuilder().setAccentColor(0x5865F2);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(buildPreviewText(data))
    );

    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(buildNavSelect(userId, section));
    container.addSeparatorComponents(new SeparatorBuilder());

    let actionRow;
    if (section === 'fields') {
        actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`anunciar_addfield_${userId}`)
                .setLabel('Adicionar Campo')
                .setEmoji(Emojis.get('_add_emoji'))
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`anunciar_clearfields_${userId}`)
                .setLabel('Limpar Campos')
                .setEmoji(Emojis.get('_trash_emoji'))
                .setStyle(ButtonStyle.Danger),
        );
    } else if (section === 'timestamp') {
        actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`anunciar_setnow_${userId}`)
                .setLabel('Agora')
                .setEmoji(Emojis.get('clock_emoji'))
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`anunciar_setcustom_timestamp_${userId}`)
                .setLabel('Definir Timestamp')
                .setEmoji(Emojis.get('date_emoji'))
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`anunciar_remove_timestamp_${userId}`)
                .setLabel('Remover')
                .setEmoji(Emojis.get('negative_emoji'))
                .setStyle(ButtonStyle.Secondary),
        );
    } else {
        actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`anunciar_set_${section}_${userId}`)
                .setLabel(`Definir ${sectionLabel}`)
                .setEmoji(Emojis.get('_lapis_emoji'))
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`anunciar_remove_${section}_${userId}`)
                .setLabel(`Remover ${sectionLabel}`)
                .setEmoji(Emojis.get('negative_emoji'))
                .setStyle(ButtonStyle.Secondary),
        );
    }

    container.addActionRowComponents(actionRow);

    return {
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        embeds: [],
        content: ''
    };
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
            inline: f.inline || false
        })));
    }
    return embed;
}

module.exports = {
    getEmbedData,
    setEmbedData,
    clearEmbedData,
    buildMainMenu,
    buildSectionScreen,
    buildDiscordEmbed,
    SECTION_LABELS,
    NAV_OPTIONS
};
