const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ButtonStyle, EmbedBuilder, MessageFlags
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

// Constrói o EmbedBuilder real a partir dos dados — usado para envio E para live preview
function buildDiscordEmbed(data) {
    if (!data || Object.keys(data).filter(k => k !== 'content').length === 0) return null;
    const embed = new EmbedBuilder();
    if (data.title) embed.setTitle(data.title);
    if (data.description) embed.setDescription(data.description);

    // Cor: '__none__' = sem barra de cor (usa cor do fundo do Discord); undefined/null = blurple padrão; valor = cor definida
    if (data.color === '__none__') {
        embed.setColor(0x2b2d31);
    } else if (data.color) {
        try { embed.setColor(data.color); } catch (e) { embed.setColor('#5865F2'); }
    } else {
        embed.setColor('#5865F2');
    }

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

// Embed de preview ao vivo — sempre retorna um EmbedBuilder real
function buildLivePreviewEmbed(data) {
    const hasData = data && Object.keys(data).some(k => k !== 'content');
    if (!hasData) {
        return new EmbedBuilder()
            .setDescription(
                '> Configure as propriedades usando o seletor abaixo.\n' +
                '> A embed será atualizada **em tempo real** aqui — exatamente como ficará ao enviar.'
            )
            .setColor('#2B2D31');
    }
    return buildDiscordEmbed(data) || new EmbedBuilder().setDescription('Embed configurada.').setColor('#5865F2');
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
    return {
        content: `-# ${Emojis.get('_send_emoji')} Construtor de Anúncios — preview ao vivo abaixo`,
        embeds: [buildLivePreviewEmbed(data)],
        components: [
            buildNavSelectRow(userId, 'main'),
            new ActionRowBuilder().addComponents(
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
            ),
        ],
    };
}

function buildSectionScreen(userId, section) {
    const data = getEmbedData(userId);
    const sectionLabel = SECTION_LABELS[section] || section;

    const components = [buildNavSelectRow(userId, section)];

    if (section === 'fields') {
        components.push(new ActionRowBuilder().addComponents(
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
        components.push(new ActionRowBuilder().addComponents(
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
    } else if (section === 'color') {
        // Cor tem 3 opções: definir, sem barra de cor, remover
        components.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`anunciar_set_color_${userId}`)
                .setLabel('Definir Cor')
                .setEmoji({ id: '1501804122943389716' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`anunciar_nocolor_${userId}`)
                .setLabel('Sem Barra de Cor')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`anunciar_remove_color_${userId}`)
                .setLabel('Restaurar Padrão')
                .setEmoji({ id: '1501803920576745522' })
                .setStyle(ButtonStyle.Secondary),
        ));
    } else {
        components.push(new ActionRowBuilder().addComponents(
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

    const colorInfo = section === 'color' && data.color === '__none__'
        ? `-# Modo atual: **Sem barra de cor**`
        : null;

    return {
        content: [
            `-# ${Emojis.get('_lapis_emoji')} Editando **${sectionLabel}** — preview ao vivo abaixo`,
            colorInfo,
        ].filter(Boolean).join('\n'),
        embeds: [buildLivePreviewEmbed(data)],
        components,
    };
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
