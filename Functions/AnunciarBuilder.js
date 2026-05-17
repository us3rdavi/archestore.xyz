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
    { label: 'Botões',         description: 'Adicionar botões ao anúncio', value: 'botoes',     emoji: { id: '1501803905363869769' } },
];

const SECTION_LABELS = {
    title: 'Título', description: 'Descrição', fields: 'Campos',
    author: 'Autor', url: 'URL',
    image: 'Imagem', footer: 'Footer', timestamp: 'Timestamp', botoes: 'Botões',
};

const BUTTON_STYLE_MAP = {
    'primary':    ButtonStyle.Primary,
    'azul':       ButtonStyle.Primary,
    'secondary':  ButtonStyle.Secondary,
    'cinza':      ButtonStyle.Secondary,
    'cinza/secondary': ButtonStyle.Secondary,
    'success':    ButtonStyle.Success,
    'verde':      ButtonStyle.Success,
    'danger':     ButtonStyle.Danger,
    'vermelho':   ButtonStyle.Danger,
    'link':       ButtonStyle.Link,
};

const BUTTON_STYLE_LABELS = {
    [ButtonStyle.Primary]:   '🔵 Azul (Primary)',
    [ButtonStyle.Secondary]: '⚪ Cinza (Secondary)',
    [ButtonStyle.Success]:   '🟢 Verde (Success)',
    [ButtonStyle.Danger]:    '🔴 Vermelho (Danger)',
    [ButtonStyle.Link]:      '🔗 Link',
};

function styleFromString(str) {
    return BUTTON_STYLE_MAP[(str || '').toLowerCase().trim()] ?? ButtonStyle.Primary;
}

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

// Parse a stored emoji string like "<:name:id>" or "<a:name:id>" into a ButtonBuilder-compatible object
function parseEmojiForButton(emojiStr) {
    if (!emojiStr) return null;
    const match = emojiStr.match(/^<(a?):([^:]+):(\d+)>$/);
    if (match) return { animated: match[1] === 'a', name: match[2], id: match[3] };
    // unicode emoji
    if (emojiStr.length <= 8) return { name: emojiStr };
    return null;
}

// Build ActionRow(s) from buttons data — used in both preview and final send
function buildButtonRows(buttons) {
    if (!buttons || buttons.length === 0) return [];
    const rows = [];
    // Max 5 buttons per row, max 5 rows = 25 buttons total (we cap at 5 for simplicity)
    const chunks = [];
    for (let i = 0; i < buttons.length; i += 5) chunks.push(buttons.slice(i, i + 5));
    for (const chunk of chunks) {
        const row = new ActionRowBuilder();
        for (let i = 0; i < chunk.length; i++) {
            const btn = chunk[i];
            const globalIdx = buttons.indexOf(chunk[i]);
            const b = new ButtonBuilder()
                .setStyle(btn.style ?? ButtonStyle.Primary)
                .setLabel(btn.label || 'Botão');
            if (btn.style === ButtonStyle.Link) {
                b.setURL(btn.url || 'https://discord.com');
            } else {
                b.setCustomId(`anuncio_btn_${globalIdx}`);
            }
            const emojiObj = parseEmojiForButton(btn.emoji);
            if (emojiObj) {
                try { b.setEmoji(emojiObj); } catch (e) {}
            }
            row.addComponents(b);
        }
        rows.push(row);
    }
    return rows;
}

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

    if (data.buttons && data.buttons.length > 0) {
        c.addSeparatorComponents(new SeparatorBuilder());
        const rows = buildButtonRows(data.buttons);
        for (const row of rows) c.addActionRowComponents(row);
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

    if (data.buttons && data.buttons.length > 0) {
        c.addSeparatorComponents(new SeparatorBuilder());
        const rows = buildButtonRows(data.buttons);
        for (const row of rows) c.addActionRowComponents(row);
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
    if (section === 'botoes') return buildBoesScreen(userId);

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

// ── Botões Section ─────────────────────────────────────────────────────────────

function buildBoesScreen(userId) {
    const data = getEmbedData(userId);
    const buttons = data.buttons || [];
    const previewContainer = buildPreviewContainer(data);

    const controlContainer = new ContainerBuilder();
    const btnCount = buttons.length;

    let headerText = `## ${Emojis.get('_add_emoji')} Botões do Anúncio\n`;
    if (btnCount === 0) {
        headerText += `-# Nenhum botão adicionado ainda. Adicione até 5 botões.`;
    } else {
        const lines = buttons.map((b, i) => {
            const styleLabel = BUTTON_STYLE_LABELS[b.style ?? ButtonStyle.Primary] || '?';
            const emojiPart = b.emoji ? ` ${b.emoji}` : '';
            const urlPart = b.url ? ` — 🔗 ${b.url}` : '';
            return `\`${i + 1}.\`${emojiPart} **${b.label || 'Sem nome'}** · ${styleLabel}${urlPart}`;
        });
        headerText += `-# ${btnCount}/5 botões configurados\n\n${lines.join('\n')}`;
    }

    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRow(userId, 'botoes'));

    const actionRow = new ActionRowBuilder();
    if (btnCount < 5) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`anunciar_addbotao_${userId}`)
                .setLabel('Adicionar Botão')
                .setEmoji({ id: '1501803905363869769' })
                .setStyle(ButtonStyle.Success)
        );
    }
    if (btnCount > 0) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`anunciar_clearbotoes_${userId}`)
                .setLabel('Limpar Botões')
                .setEmoji({ id: '1501803926180335727' })
                .setStyle(ButtonStyle.Danger)
        );
    }
    if (actionRow.components.length > 0) {
        controlContainer.addActionRowComponents(actionRow);
    }

    if (btnCount > 0) {
        const selectOptions = buttons.map((b, i) => ({
            label: `${i + 1}. ${b.label || 'Sem nome'}`,
            description: BUTTON_STYLE_LABELS[b.style ?? ButtonStyle.Primary] || 'Primary',
            value: String(i),
        }));
        controlContainer.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`anunciar_botoes_select_${userId}`)
                    .setPlaceholder('Selecione um botão para editar...')
                    .addOptions(selectOptions)
            )
        );
    }

    return { components: [previewContainer, controlContainer], ...CV2 };
}

function buildBotaoEditScreen(userId, idx) {
    const data = getEmbedData(userId);
    const buttons = data.buttons || [];
    const btn = buttons[idx];

    if (!btn) return buildBoesScreen(userId);

    const previewContainer = buildPreviewContainer(data);
    const controlContainer = new ContainerBuilder();

    const styleLabel = BUTTON_STYLE_LABELS[btn.style ?? ButtonStyle.Primary] || '?';
    const emojiPart = btn.emoji ? ` | Emoji: ${btn.emoji}` : '';
    const urlPart = btn.url ? `\n-# 🔗 URL: ${btn.url}` : '';

    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Editando Botão ${idx + 1}\n` +
        `-# Nome: **${btn.label || 'Sem nome'}** | Cor: ${styleLabel}${emojiPart}${urlPart}`
    ));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRow(userId, 'botoes'));

    controlContainer.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`anunciar_botao_label_${idx}_${userId}`)
                .setLabel('Editar Nome')
                .setEmoji({ id: '1501804003850322052' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`anunciar_botao_url_${idx}_${userId}`)
                .setLabel('Definir URL')
                .setEmoji({ id: '1501803997583904810' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`anunciar_botao_remove_${idx}_${userId}`)
                .setLabel('Remover Botão')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(ButtonStyle.Danger),
        )
    );

    controlContainer.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`anunciar_botao_cor_${idx}_${userId}`)
                .setLabel('Mudar Cor')
                .setEmoji({ id: '1501804058699366470' })
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`anunciar_botao_emoji_${idx}_${userId}`)
                .setLabel('Escolher Emoji')
                .setEmoji({ id: '1501804039451709441' })
                .setStyle(ButtonStyle.Secondary),
            ...(btn.emoji ? [
                new ButtonBuilder()
                    .setCustomId(`anunciar_botao_removeemoji_${idx}_${userId}`)
                    .setLabel('Remover Emoji')
                    .setEmoji({ id: '1501803926180335727' })
                    .setStyle(ButtonStyle.Secondary),
            ] : []),
        )
    );

    return { components: [previewContainer, controlContainer], ...CV2 };
}

function buildBotaoCorScreen(userId, idx) {
    const data = getEmbedData(userId);
    const buttons = data.buttons || [];
    const btn = buttons[idx];
    if (!btn) return buildBoesScreen(userId);

    const previewContainer = buildPreviewContainer(data);
    const controlContainer = new ContainerBuilder();

    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Mudar Cor — Botão ${idx + 1}\n` +
        `-# Selecione a nova cor para **${btn.label || 'Sem nome'}**`
    ));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRow(userId, 'botoes'));

    const colorOptions = [
        { label: '🔵 Azul (Primary)',      value: `${ButtonStyle.Primary}`,   description: 'Botão azul padrão' },
        { label: '⚪ Cinza (Secondary)',    value: `${ButtonStyle.Secondary}`, description: 'Botão cinza neutro' },
        { label: '🟢 Verde (Success)',      value: `${ButtonStyle.Success}`,   description: 'Botão verde de confirmação' },
        { label: '🔴 Vermelho (Danger)',    value: `${ButtonStyle.Danger}`,    description: 'Botão vermelho de atenção' },
        { label: '🔗 Link',                value: `${ButtonStyle.Link}`,      description: 'Botão de link externo (requer URL)' },
    ];

    controlContainer.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`anunciar_botao_corsel_${idx}_${userId}`)
                .setPlaceholder('Selecione a cor do botão...')
                .addOptions(colorOptions)
        )
    );

    return { components: [previewContainer, controlContainer], ...CV2 };
}

function buildBotaoEmojiScreen(userId, idx) {
    const data = getEmbedData(userId);
    const buttons = data.buttons || [];
    const btn = buttons[idx];
    if (!btn) return buildBoesScreen(userId);

    const previewContainer = buildPreviewContainer(data);
    const controlContainer = new ContainerBuilder();

    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Escolher Emoji — Botão ${idx + 1}\n` +
        `-# Selecione um emoji do bot para o botão **${btn.label || 'Sem nome'}**`
    ));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRow(userId, 'botoes'));

    // Build emoji options from the bot's emoji store
    const allEmojis = Emojis.all();
    const emojiOptions = [];
    for (const [key, val] of Object.entries(allEmojis)) {
        if (emojiOptions.length >= 25) break;
        const match = val.match(/^<(a?):([^:]+):(\d+)>$/);
        if (!match) continue;
        const name = match[2];
        const id = match[3];
        const animated = match[1] === 'a';
        emojiOptions.push({
            label: name.replace(/_emoji$/, '').replace(/_/g, ' '),
            value: val,
            emoji: { id, animated },
        });
    }

    if (emojiOptions.length === 0) {
        controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `-# Nenhum emoji do bot disponível.`
        ));
    } else {
        controlContainer.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`anunciar_botao_emojisel_${idx}_${userId}`)
                    .setPlaceholder('Selecione um emoji...')
                    .addOptions(emojiOptions)
            )
        );
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
    buildBoesScreen,
    buildBotaoEditScreen,
    buildBotaoCorScreen,
    buildBotaoEmojiScreen,
    styleFromString,
    SECTION_LABELS,
    NAV_OPTIONS,
    ButtonStyle,
};
