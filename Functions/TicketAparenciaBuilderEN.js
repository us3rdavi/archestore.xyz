const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ButtonStyle, MessageFlags,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MediaGalleryBuilder
} = require('discord.js');
const { tickets, Emojis } = require('../Database');

const NAV_OPTIONS = [
    { label: 'Main Menu',    description: 'Back to main menu',              value: 'main',     emoji: { id: '1501804019184828507' } },
    { label: 'Title',        description: 'Edit panel title',               value: 'titulo',   emoji: { id: '1501804003850322052' } },
    { label: 'Description',  description: 'Edit panel description',         value: 'descricao',emoji: { id: '1501804039451709441' } },
    { label: 'Color',        description: 'Edit embed color (hex)',          value: 'cor',      emoji: { id: '1501804122943389716' } },
    { label: 'Banner',       description: 'Edit panel image/banner',        value: 'banner',   emoji: { id: '1501803928973476023' } },
    { label: 'Title Emoji',  description: 'Emoji shown before the title',   value: 'emoji',    emoji: { id: '1501804043121725490' } },
];

const SECTION_LABELS = {
    titulo: 'Title', descricao: 'Description', cor: 'Color', banner: 'Banner', emoji: 'Title Emoji',
};

const BOT_EMOJI_OPTIONS = [
    { label: 'No emoji',      value: 'sem_emoji',          description: 'Remove the title emoji' },
    { label: 'Ticket',        value: '1501804043121725490', description: 'Ticket icon',       emoji: { id: '1501804043121725490' } },
    { label: 'Support',       value: '1501803899085131867', description: 'Support icon',      emoji: { id: '1501803899085131867' } },
    { label: 'Staff',         value: '1501803902046048297', description: 'Staff icon',        emoji: { id: '1501803902046048297' } },
    { label: 'Information',   value: '1501803944375222392', description: 'Information icon',  emoji: { id: '1501803944375222392' } },
    { label: 'Confirmed',     value: '1501803932484108359', description: 'Confirmation icon', emoji: { id: '1501803932484108359' } },
    { label: 'Warning',       value: '1501803941112053861', description: 'Warning icon',      emoji: { id: '1501803941112053861' } },
    { label: 'Star',          value: '1501804049563910285', description: 'Highlight/star',    emoji: { id: '1501804049563910285' } },
    { label: 'Diamond',       value: '1501804052827209768', description: 'Premium/diamond',   emoji: { id: '1501804052827209768' } },
    { label: 'Settings',      value: '1501804030605922346', description: 'Settings icon',     emoji: { id: '1501804030605922346' } },
    { label: 'Tool',          value: '1501804000994132080', description: 'Tool icon',         emoji: { id: '1501804000994132080' } },
    { label: 'Folder',        value: '1501804010049634426', description: 'Folder icon',       emoji: { id: '1501804010049634426' } },
    { label: 'Messages',      value: '1501804039451709441', description: 'Messages icon',     emoji: { id: '1501804039451709441' } },
    { label: 'Brush',         value: '1501804122943389716', description: 'Design/appearance', emoji: { id: '1501804122943389716' } },
    { label: 'Add',           value: '1501803905363869769', description: 'Add icon',          emoji: { id: '1501803905363869769' } },
    { label: 'Send',          value: '1501803923126747178', description: 'Send icon',         emoji: { id: '1501803923126747178' } },
    { label: 'Notify',        value: '1501804036540862464', description: 'Notification icon', emoji: { id: '1501804036540862464' } },
    { label: 'Ghost',         value: '1501804033608777859', description: 'Ghost icon',        emoji: { id: '1501804033608777859' } },
    { label: 'People',        value: '1501803896073621706', description: 'Group/community',   emoji: { id: '1501803896073621706' } },
    { label: 'Store',         value: '1501803947898306724', description: 'Store icon',        emoji: { id: '1501803947898306724' } },
    { label: 'Brand',         value: '1501804076189351949', description: 'Brand icon',        emoji: { id: '1501804076189351949' } },
    { label: 'Pencil',        value: '1501804003850322052', description: 'Edit icon',         emoji: { id: '1501804003850322052' } },
    { label: 'Clock',         value: '1501804058699366470', description: 'Time/schedule',     emoji: { id: '1501804058699366470' } },
    { label: 'Question',      value: '1502520447340777482', description: 'Question icon',     emoji: { id: '1502520447340777482' } },
    { label: 'System',        value: '1501804019184828507', description: 'System icon',       emoji: { id: '1501804019184828507' } },
];

const CV2 = { flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };

function buildPreviewContainerEN(data) {
    const c = new ContainerBuilder();
    const titleParts = [data.emoji, data.title].filter(Boolean);
    const titleStr = titleParts.join(' ');
    const hasData = titleStr || data.description || data.color || data.banner;

    if (!hasData) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `-# Configure the properties below to see the preview here.`
        ));
        return c;
    }

    const lines = [];
    if (titleStr) lines.push(`## ${titleStr}`);
    if (data.description) lines.push(data.description);
    if (data.color) lines.push(`-# Accent color: \`${data.color}\``);

    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        lines.join('\n') || `-# Configure the properties below.`
    ));

    if (data.banner) {
        try {
            c.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems({ media: { url: data.banner } })
            );
        } catch (e) {}
    }

    return c;
}

function buildNavSelectRowEN(userId, currentSection) {
    const options = NAV_OPTIONS.map(opt => ({ ...opt, default: opt.value === currentSection }));
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`taparelen_nav_${userId}`)
            .setPlaceholder('Select property to edit...')
            .addOptions(options)
    );
}

function buildAparenciaMainEN(userId) {
    const data = tickets.get('en.aparencia') || {};
    const previewContainer = buildPreviewContainerEN(data);

    const controlContainer = new ContainerBuilder();
    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_pincel_emoji')} Ticket Panel Appearance (EN)\n` +
        `-# Live preview above — update properties using the menu below`
    ));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRowEN(userId, 'main'));
    controlContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('en_painelconfigticket')
            .setLabel('Back to Panel')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(ButtonStyle.Secondary),
    ));

    return { components: [previewContainer, controlContainer], ...CV2 };
}

function buildAparenciaSectionEN(userId, section) {
    const data = tickets.get('en.aparencia') || {};
    const sectionLabel = SECTION_LABELS[section] || section;
    const previewContainer = buildPreviewContainerEN(data);

    const controlContainer = new ContainerBuilder();
    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Editing — ${sectionLabel}\n` +
        `-# Live preview above — update properties using the controls below`
    ));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRowEN(userId, section));

    if (section === 'emoji') {
        controlContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`taparelen_emoji_pick_${userId}`)
                .setPlaceholder('Choose an emoji for the panel title...')
                .addOptions(BOT_EMOJI_OPTIONS)
        ));
    } else {
        controlContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`taparelen_set_${section}_${userId}`)
                .setLabel(`Set ${sectionLabel}`)
                .setEmoji({ id: '1501804003850322052' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`taparelen_remove_${section}_${userId}`)
                .setLabel('Remove')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(ButtonStyle.Secondary),
        ));
    }

    return { components: [previewContainer, controlContainer], ...CV2 };
}

function buildFuncaoNavScreenEN(userId) {
    const funcoes = tickets.get('en.funcoes') || {};
    const nomes = Object.keys(funcoes);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_ticket_emoji')} Category Emojis (EN)\n` +
        `-# Select a category to edit the emoji shown in the panel select menu`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    if (nomes.length === 0) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `-# No categories registered. Add categories first in the panel.`
        ));
    } else {
        const options = nomes.slice(0, 25).map(nome => {
            const f = funcoes[nome];
            const emojiId = f.emoji ? f.emoji.match(/\d{17,20}/)?.[0] : null;
            return {
                label: nome.slice(0, 100),
                value: nome,
                description: (f.predescricao || 'No pre-description').slice(0, 100),
                ...(emojiId ? { emoji: { id: emojiId } } : {}),
            };
        });
        container.addActionRowComponents(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`taparelen_funcnav_${userId}`)
                .setPlaceholder('Select the category to edit the emoji...')
                .addOptions(options)
        ));
    }

    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('en_painelconfigticket')
            .setLabel('Back to Panel')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(ButtonStyle.Secondary),
    ));

    return { components: [container], ...CV2 };
}

function buildFuncaoEmojiScreenEN(userId, nomeFuncao) {
    const funcao = tickets.get(`en.funcoes.${nomeFuncao}`) || {};
    const emojiLine = funcao.emoji
        ? `**Current emoji:** ${funcao.emoji}`
        : `-# No emoji set for this category.`;

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_ticket_emoji')} Category Emoji — \`${nomeFuncao}\`\n` +
        `${emojiLine}`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`taparelen_feoji_${userId}_${nomeFuncao}`)
            .setPlaceholder('Choose an emoji for this category...')
            .addOptions(BOT_EMOJI_OPTIONS)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`taparelen_funcback_${userId}`)
            .setLabel('Back')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(ButtonStyle.Secondary),
    ));

    return { components: [container], ...CV2 };
}

module.exports = {
    buildAparenciaMainEN,
    buildAparenciaSectionEN,
    buildFuncaoNavScreenEN,
    buildFuncaoEmojiScreenEN,
    BOT_EMOJI_OPTIONS,
    SECTION_LABELS,
};
