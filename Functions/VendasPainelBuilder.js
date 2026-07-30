'use strict';

/**
 * VendasPainelBuilder — construtor realtime CV2 para:
 *   - Painel inicial de vendas  (prefix customId: vndp_)
 *   - Conteúdo de cada seção    (prefix customId: vndps_)
 *
 * Idêntico ao AnunciarBuilder em funcionalidade; apenas as chaves de
 * armazenamento, prefixos de customId e elementos extras (dropdowns de
 * preview) diferem.
 */

const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ButtonStyle, MessageFlags,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MediaGalleryBuilder,
} = require('discord.js');
const { dbembed, Emojis, configuracao } = require('../Database');

// ── Constantes ────────────────────────────────────────────────────────────────

const NAV_OPTIONS = [
    { label: 'Menu Principal', description: 'Voltar ao menu principal',   value: 'main',        emoji: { id: '1501804019184828507' } },
    { label: 'Título',         description: 'Editar título',              value: 'title',       emoji: { id: '1501804003850322052' } },
    { label: 'Descrição',      description: 'Editar texto principal',     value: 'description', emoji: { id: '1501804039451709441' } },
    { label: 'Campos',         description: 'Editar campos/seções',       value: 'fields',      emoji: { id: '1501804013262475275' } },
    { label: 'Autor',          description: 'Texto de origem/autor',      value: 'author',      emoji: { id: '1501804126487580773' } },
    { label: 'URL',            description: 'Link no título',             value: 'url',         emoji: { id: '1501803997583904810' } },
    { label: 'Imagem',         description: 'Imagem principal',           value: 'image',       emoji: { id: '1501803928973476023' } },
    { label: 'Footer',         description: 'Texto do rodapé',            value: 'footer',      emoji: { id: '1501804120615555132' } },
    { label: 'Timestamp',      description: 'Data e hora no rodapé',      value: 'timestamp',   emoji: { id: '1501804058699366470' } },
    { label: 'Botões',         description: 'Adicionar botões',           value: 'botoes',      emoji: { id: '1501803905363869769' } },
];

const SECTION_LABELS = {
    title: 'Título', description: 'Descrição', fields: 'Campos',
    author: 'Autor', url: 'URL',
    image: 'Imagem', footer: 'Footer', timestamp: 'Timestamp', botoes: 'Botões',
};

const BUTTON_STYLE_MAP = {
    'primary': ButtonStyle.Primary, 'azul': ButtonStyle.Primary,
    'secondary': ButtonStyle.Secondary, 'cinza': ButtonStyle.Secondary, 'cinza/secondary': ButtonStyle.Secondary,
    'success': ButtonStyle.Success, 'verde': ButtonStyle.Success,
    'danger': ButtonStyle.Danger, 'vermelho': ButtonStyle.Danger,
    'link': ButtonStyle.Link,
};

const BUTTON_STYLE_LABELS = {
    [ButtonStyle.Primary]: 'Azul (Primary)',
    [ButtonStyle.Secondary]: 'Cinza (Secondary)',
    [ButtonStyle.Success]: 'Verde (Success)',
    [ButtonStyle.Danger]: 'Vermelho (Danger)',
    [ButtonStyle.Link]: 'Link',
};

const PAGE_SIZE = 25;
const CV2 = { flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };

// ── Helpers compartilhados ────────────────────────────────────────────────────

function styleFromString(str) {
    return BUTTON_STYLE_MAP[(str || '').toLowerCase().trim()] ?? ButtonStyle.Primary;
}

function parseEmojiForButton(emojiStr) {
    if (!emojiStr) return null;
    const match = emojiStr.match(/^<(a?):([^:]+):(\d+)>$/);
    if (match) return { animated: match[1] === 'a', name: match[2], id: match[3] };
    if (emojiStr.length <= 8) return { name: emojiStr };
    return null;
}

function buildButtonRows(buttons) {
    if (!buttons || buttons.length === 0) return [];
    const rows = [];
    const chunks = [];
    for (let i = 0; i < buttons.length; i += 5) chunks.push(buttons.slice(i, i + 5));
    for (const chunk of chunks) {
        const row = new ActionRowBuilder();
        for (let i = 0; i < chunk.length; i++) {
            const btn = chunk[i];
            const globalIdx = buttons.indexOf(chunk[i]);
            const b = new ButtonBuilder().setStyle(btn.style ?? ButtonStyle.Primary).setLabel(btn.label || 'Botão');
            if (btn.style === ButtonStyle.Link) {
                b.setURL(btn.url || 'https://discord.com');
            } else {
                b.setCustomId(`vnd_btn_preview_${globalIdx}`);
            }
            const emojiObj = parseEmojiForButton(btn.emoji);
            if (emojiObj) { try { b.setEmoji(emojiObj); } catch (e) {} }
            row.addComponents(b);
        }
        rows.push(row);
    }
    return rows;
}

function buildBotEmojiOptions() {
    const allEmojis = Emojis.all();
    const options = [];
    for (const val of Object.values(allEmojis)) {
        const match = val.match(/^<(a?):([^:]+):(\d+)>$/);
        if (!match) continue;
        options.push({
            label: (match[2].replace(/_emoji$/, '').replace(/_/g, ' ') || 'emoji').slice(0, 100),
            value: val,
            emoji: { id: match[3], animated: match[1] === 'a' },
        });
    }
    return options;
}

function buildServerEmojiOptions(guild) {
    return [...guild.emojis.cache.values()].map(e => ({
        label: ((e.name || 'emoji').replace(/_/g, ' ')).slice(0, 100),
        value: `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`,
        emoji: { id: e.id, animated: !!e.animated },
    }));
}

// ── Preview container (idêntico ao AnunciarBuilder) ───────────────────────────

function buildPreviewContainer(data) {
    const hasData = data && Object.keys(data).some(k => k !== 'content' && k !== '_secaoId');
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

// ── Preview do painel (preview + dropdown de seções) ─────────────────────────

function buildPainelPreviewContainer(data) {
    const content = buildPreviewContainer(data);
    const todasSecoes = configuracao.get('vendas.secoes') || [];
    const painelIdPreview = data && data._painelId;
    const secoes = painelIdPreview ? todasSecoes.filter(s => s.painelId === painelIdPreview) : todasSecoes;

    // Adiciona o dropdown de seções no preview (mostra exatamente como vai ficar)
    if (secoes.length > 0) {
        content.addSeparatorComponents(new SeparatorBuilder());
        const options = secoes.slice(0, 25).map(s => ({
            label: s.nome.slice(0, 100),
            value: `vnd_${s.id}`,
            description: (s.descricao || '').slice(0, 100) || undefined,
            ...(s.emoji ? { emoji: { id: s.emoji } } : {}),
        }));
        content.addActionRowComponents(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('vndp_preview_sections_ignore')
                .setPlaceholder('Selecione uma categoria...')
                .addOptions(options)
        ));
    }
    return content;
}

// ── Preview de seção (preview + dropdown de subprodutos) ─────────────────────

function buildSecaoPreviewContainer(data, secao) {
    const content = buildPreviewContainer(data);
    const subprodutos = (secao && secao.subprodutos) || [];

    if (subprodutos.length > 0) {
        content.addSeparatorComponents(new SeparatorBuilder());
        const options = subprodutos.slice(0, 25).map(sp => ({
            label: sp.nome.slice(0, 100),
            value: `vndps_preview_${sp.id}`,
            description: ((sp.descricao ? `${sp.descricao} — ` : '') + `R$ ${Number(sp.valor).toFixed(2)}`).slice(0, 100),
            ...(sp.emoji ? { emoji: { id: sp.emoji } } : {}),
        }));
        content.addActionRowComponents(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('vndps_preview_subs_ignore')
                .setPlaceholder('Selecione um produto...')
                .addOptions(options)
        ));
    }
    return content;
}

// ── Nav select ────────────────────────────────────────────────────────────────

function buildNavSelectRow(pref, userId, currentSection) {
    const options = NAV_OPTIONS.map(opt => ({ ...opt, default: opt.value === currentSection }));
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`${pref}_nav_${userId}`)
            .setPlaceholder('Selecionar propriedade para editar...')
            .addOptions(options)
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// PAINEL PRINCIPAL  (prefix: vndp_)
// ════════════════════════════════════════════════════════════════════════════════

const PREF_P = 'vndp';

function getPainelData(userId) {
    return dbembed.get(`vndpainel.${userId}`) || {};
}
function setPainelData(userId, data) {
    dbembed.set(`vndpainel.${userId}`, data);
}
function clearPainelData(userId) {
    dbembed.delete(`vndpainel.${userId}`);
}

function buildPainelMainMenu(userId) {
    const data = getPainelData(userId);
    const previewContainer = buildPainelPreviewContainer(data);

    const controlContainer = new ContainerBuilder();
    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Construtor — Painel de Vendas\n` +
        `-# Preview ao vivo acima — edite as propriedades usando o menu abaixo`
    ));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRow(PREF_P, userId, 'main'));
    controlContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`vndp_save_${userId}`)
            .setLabel('Salvar Painel')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`vndp_content_${userId}`)
            .setLabel('Conteúdo')
            .setEmoji({ id: '1501804039451709441' })
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`vndp_reset_${userId}`)
            .setLabel('Resetar')
            .setEmoji({ id: '1501803926180335727' })
            .setStyle(ButtonStyle.Danger),
    ));

    return { components: [previewContainer, controlContainer], ...CV2 };
}

function buildPainelSectionScreen(userId, section) {
    if (section === 'botoes') return buildPainelBoesScreen(userId);

    const data = getPainelData(userId);
    const sectionLabel = SECTION_LABELS[section] || section;
    const previewContainer = buildPainelPreviewContainer(data);

    const controlContainer = new ContainerBuilder();
    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Editando — ${sectionLabel}\n` +
        `-# Preview ao vivo acima — use os botões abaixo para editar`
    ));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRow(PREF_P, userId, section));

    _addSectionControls(controlContainer, PREF_P, userId, section, sectionLabel);

    return { components: [previewContainer, controlContainer], ...CV2 };
}

function buildPainelBoesScreen(userId) {
    const data = getPainelData(userId);
    return _buildBoesScreen(PREF_P, userId, data, buildPainelPreviewContainer(data));
}

function buildPainelBotaoEditScreen(userId, idx) {
    const data = getPainelData(userId);
    return _buildBotaoEditScreen(PREF_P, userId, idx, data, buildPainelPreviewContainer(data));
}

function buildPainelBotaoCorScreen(userId, idx) {
    const data = getPainelData(userId);
    return _buildBotaoCorScreen(PREF_P, userId, idx, data, buildPainelPreviewContainer(data));
}

function buildPainelBotaoEmojiScreen(userId, idx, page, allOptions, source) {
    const data = getPainelData(userId);
    return _buildBotaoEmojiScreen(PREF_P, userId, idx, page, allOptions, source, data, buildPainelPreviewContainer(data));
}

/** Container final que vai ser postado no canal */
function buildFinalPainelContainer(data, secoes) {
    const c = new ContainerBuilder();

    if (data && data.content) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(data.content));
        c.addSeparatorComponents(new SeparatorBuilder());
    }

    const headerLines = [];
    if (data && data.author) headerLines.push(`-# ${data.author}`);
    if (data && data.title) headerLines.push(data.url ? `## [${data.title}](${data.url})` : `## ${data.title}`);
    if (data && data.description) headerLines.push(data.description);

    if (headerLines.length > 0) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerLines.join('\n')));
    } else {
        // fallback padrão
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `## ${Emojis.get('store_emoji')} Loja\n` +
            `Selecione uma categoria abaixo para ver os produtos disponíveis.\n` +
            `-# Pagamento via PIX automático — confirmação instantânea.`
        ));
    }

    if (data && data.image) {
        try { c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems({ media: { url: data.image } })); } catch (e) {}
    }

    if (data && data.fields && data.fields.length > 0) {
        c.addSeparatorComponents(new SeparatorBuilder());
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            data.fields.map(f => `**${f.name || '\u200b'}**\n${f.value || '\u200b'}`).join('\n\n')
        ));
    }

    const footerParts = [];
    if (data && data.footer) footerParts.push(data.footer);
    if (data && data.timestamp) {
        const ts = Math.floor(new Date(data.timestamp).getTime() / 1000);
        if (!isNaN(ts)) footerParts.push(`<t:${ts}:f>`);
    }
    if (footerParts.length > 0) {
        c.addSeparatorComponents(new SeparatorBuilder());
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            footerParts.map(p => `-# ${p}`).join(' · ')
        ));
    }

    if (data && data.buttons && data.buttons.length > 0) {
        c.addSeparatorComponents(new SeparatorBuilder());
        const rows = buildButtonRows(data.buttons);
        for (const row of rows) c.addActionRowComponents(row);
    }

    // Sempre adiciona o dropdown de seções
    c.addSeparatorComponents(new SeparatorBuilder());
    const options = secoes.slice(0, 25).map(s => ({
        label: s.nome.slice(0, 100),
        value: `vnd_${s.id}`,
        description: (s.descricao || '').slice(0, 100) || undefined,
        ...(s.emoji ? { emoji: { id: s.emoji } } : {}),
    }));
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('vnd_comprar_select')
            .setPlaceholder('Selecione uma categoria...')
            .addOptions(options)
    ));

    return c;
}

// ════════════════════════════════════════════════════════════════════════════════
// SEÇÃO  (prefix: vndps_)
// ════════════════════════════════════════════════════════════════════════════════

const PREF_S = 'vndps';

function getSecaoData(userId) {
    return dbembed.get(`vndpainel_s.${userId}`) || {};
}
function setSecaoData(userId, data) {
    dbembed.set(`vndpainel_s.${userId}`, data);
}
function clearSecaoData(userId) {
    dbembed.delete(`vndpainel_s.${userId}`);
}

function buildSecaoMainMenu(userId, secao) {
    const data = getSecaoData(userId);
    const previewContainer = buildSecaoPreviewContainer(data, secao);

    const controlContainer = new ContainerBuilder();
    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Construtor — Seção: **${secao.nome}**\n` +
        `-# Preview ao vivo acima — edite as propriedades usando o menu abaixo`
    ));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRow(PREF_S, userId, 'main'));
    controlContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`vndps_save_${userId}`)
            .setLabel('Salvar Seção')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`vndps_content_${userId}`)
            .setLabel('Conteúdo')
            .setEmoji({ id: '1501804039451709441' })
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`vndps_reset_${userId}`)
            .setLabel('Resetar')
            .setEmoji({ id: '1501803926180335727' })
            .setStyle(ButtonStyle.Danger),
    ));

    return { components: [previewContainer, controlContainer], ...CV2 };
}

function buildSecaoSectionScreen(userId, section, secao) {
    if (section === 'botoes') return buildSecaoBoesScreen(userId, secao);

    const data = getSecaoData(userId);
    const sectionLabel = SECTION_LABELS[section] || section;
    const previewContainer = buildSecaoPreviewContainer(data, secao);

    const controlContainer = new ContainerBuilder();
    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Editando — ${sectionLabel} (${secao.nome})\n` +
        `-# Preview ao vivo acima — use os botões abaixo para editar`
    ));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRow(PREF_S, userId, section));

    _addSectionControls(controlContainer, PREF_S, userId, section, sectionLabel);

    return { components: [previewContainer, controlContainer], ...CV2 };
}

function buildSecaoBoesScreen(userId, secao) {
    const data = getSecaoData(userId);
    return _buildBoesScreen(PREF_S, userId, data, buildSecaoPreviewContainer(data, secao));
}

function buildSecaoBotaoEditScreen(userId, idx, secao) {
    const data = getSecaoData(userId);
    return _buildBotaoEditScreen(PREF_S, userId, idx, data, buildSecaoPreviewContainer(data, secao));
}

function buildSecaoBotaoCorScreen(userId, idx, secao) {
    const data = getSecaoData(userId);
    return _buildBotaoCorScreen(PREF_S, userId, idx, data, buildSecaoPreviewContainer(data, secao));
}

function buildSecaoBotaoEmojiScreen(userId, idx, page, allOptions, source, secao) {
    const data = getSecaoData(userId);
    return _buildBotaoEmojiScreen(PREF_S, userId, idx, page, allOptions, source, data, buildSecaoPreviewContainer(data, secao));
}

/** Container final mostrado ao cliente quando seleciona a seção */
function buildFinalSecaoContainer(data, secao, subprodutos) {
    const c = new ContainerBuilder();

    const headerLines = [];
    if (data && data.author) headerLines.push(`-# ${data.author}`);
    if (data && data.title) headerLines.push(data.url ? `## [${data.title}](${data.url})` : `## ${data.title}`);
    if (data && data.description) headerLines.push(data.description);

    if (headerLines.length > 0) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerLines.join('\n')));
    } else {
        const mensagem = secao.mensagem || `Selecione um produto abaixo para continuar com sua compra.`;
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `## ${secao.emoji ? `<:e:${secao.emoji}> ` : Emojis.get('store_emoji') + ' '}${secao.nome}\n\n${mensagem}`
        ));
    }

    if (data && data.image) {
        try { c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems({ media: { url: data.image } })); } catch (e) {}
    }

    if (data && data.fields && data.fields.length > 0) {
        c.addSeparatorComponents(new SeparatorBuilder());
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            data.fields.map(f => `**${f.name || '\u200b'}**\n${f.value || '\u200b'}`).join('\n\n')
        ));
    }

    const footerParts = [];
    if (data && data.footer) footerParts.push(data.footer);
    if (data && data.timestamp) {
        const ts = Math.floor(new Date(data.timestamp).getTime() / 1000);
        if (!isNaN(ts)) footerParts.push(`<t:${ts}:f>`);
    }
    if (footerParts.length > 0) {
        c.addSeparatorComponents(new SeparatorBuilder());
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            footerParts.map(p => `-# ${p}`).join(' · ')
        ));
    }

    if (data && data.buttons && data.buttons.length > 0) {
        c.addSeparatorComponents(new SeparatorBuilder());
        const rows = buildButtonRows(data.buttons);
        for (const row of rows) c.addActionRowComponents(row);
    }

    // Dropdown de subprodutos (sempre presente)
    c.addSeparatorComponents(new SeparatorBuilder());
    const options = subprodutos.slice(0, 25).map(sp => ({
        label: sp.nome.slice(0, 100),
        value: `vndsub_${secao.id}_${sp.id}`,
        description: ((sp.descricao ? `${sp.descricao} — ` : '') + `R$ ${Number(sp.valor).toFixed(2)}`).slice(0, 100),
        ...(sp.emoji ? { emoji: { id: sp.emoji } } : {}),
    }));
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('vnd_sub_select')
            .setPlaceholder('Selecione um produto...')
            .addOptions(options)
    ));

    return c;
}

// ════════════════════════════════════════════════════════════════════════════════
// Funções internas compartilhadas (botões, campos, emoji, etc.)
// ════════════════════════════════════════════════════════════════════════════════

function _addSectionControls(container, pref, userId, section, sectionLabel) {
    if (section === 'fields') {
        container.addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`${pref}_addfield_${userId}`)
                .setLabel('Adicionar Campo')
                .setEmoji({ id: '1501803923126747178' })
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`${pref}_clearfields_${userId}`)
                .setLabel('Limpar Campos')
                .setEmoji({ id: '1501803926180335727' })
                .setStyle(ButtonStyle.Danger),
        ));
    } else if (section === 'timestamp') {
        container.addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`${pref}_setnow_${userId}`)
                .setLabel('Agora')
                .setEmoji({ id: '1501804058699366470' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`${pref}_setcustom_timestamp_${userId}`)
                .setLabel('Definir Timestamp')
                .setEmoji({ id: '1501804003850322052' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`${pref}_remove_timestamp_${userId}`)
                .setLabel('Remover')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(ButtonStyle.Secondary),
        ));
    } else {
        container.addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`${pref}_set_${section}_${userId}`)
                .setLabel(`Definir ${sectionLabel}`)
                .setEmoji({ id: '1501804003850322052' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`${pref}_remove_${section}_${userId}`)
                .setLabel('Remover')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(ButtonStyle.Secondary),
        ));
    }
}

function _buildBoesScreen(pref, userId, data, previewContainer) {
    const buttons = data.buttons || [];
    const controlContainer = new ContainerBuilder();
    const btnCount = buttons.length;

    let headerText = `## ${Emojis.get('_add_emoji')} Botões\n`;
    if (btnCount === 0) {
        headerText += `-# Nenhum botão adicionado ainda. Adicione até 5 botões.`;
    } else {
        const lines = buttons.map((b, i) => {
            const styleLabel = BUTTON_STYLE_LABELS[b.style ?? ButtonStyle.Primary] || '?';
            const emojiPart = b.emoji ? ` ${b.emoji}` : '';
            const urlPart = b.url ? ` — ${b.url}` : '';
            return `\`${i + 1}.\`${emojiPart} **${b.label || 'Sem nome'}** · ${styleLabel}${urlPart}`;
        });
        headerText += `-# ${btnCount}/5 botões configurados\n\n${lines.join('\n')}`;
    }

    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRow(pref, userId, 'botoes'));

    const actionRow = new ActionRowBuilder();
    if (btnCount < 5) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${pref}_addbotao_${userId}`)
                .setLabel('Adicionar Botão')
                .setEmoji({ id: '1501803905363869769' })
                .setStyle(ButtonStyle.Success)
        );
    }
    if (btnCount > 0) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${pref}_clearbotoes_${userId}`)
                .setLabel('Limpar Botões')
                .setEmoji({ id: '1501803926180335727' })
                .setStyle(ButtonStyle.Danger)
        );
    }
    if (actionRow.components.length > 0) controlContainer.addActionRowComponents(actionRow);

    if (btnCount > 0) {
        const selectOptions = buttons.map((b, i) => ({
            label: `${i + 1}. ${b.label || 'Sem nome'}`,
            description: BUTTON_STYLE_LABELS[b.style ?? ButtonStyle.Primary] || 'Primary',
            value: String(i),
        }));
        controlContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`${pref}_botoes_select_${userId}`)
                .setPlaceholder('Selecione um botão para editar...')
                .addOptions(selectOptions)
        ));
    }

    return { components: [previewContainer, controlContainer], ...CV2 };
}

function _buildBotaoEditScreen(pref, userId, idx, data, previewContainer) {
    const buttons = data.buttons || [];
    const btn = buttons[idx];
    if (!btn) return _buildBoesScreen(pref, userId, data, previewContainer);

    const controlContainer = new ContainerBuilder();
    const styleLabel = BUTTON_STYLE_LABELS[btn.style ?? ButtonStyle.Primary] || '?';
    const emojiPart = btn.emoji ? ` | Emoji: ${btn.emoji}` : '';
    const urlPart = btn.url ? `\n-# URL: ${btn.url}` : '';

    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Editando Botão ${idx + 1}\n` +
        `-# Nome: **${btn.label || 'Sem nome'}** | Cor: ${styleLabel}${emojiPart}${urlPart}`
    ));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRow(pref, userId, 'botoes'));
    controlContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`${pref}_botao_label_${idx}_${userId}`).setLabel('Editar Nome').setEmoji({ id: '1501804003850322052' }).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`${pref}_botao_url_${idx}_${userId}`).setLabel('Definir URL').setEmoji({ id: '1501803997583904810' }).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`${pref}_botao_remove_${idx}_${userId}`).setLabel('Remover Botão').setEmoji({ id: '1501803935453679616' }).setStyle(ButtonStyle.Danger),
    ));
    controlContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`${pref}_botao_cor_${idx}_${userId}`).setLabel('Mudar Cor').setEmoji({ id: '1501804058699366470' }).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`${pref}_botao_emoji_${idx}_${userId}`).setLabel('Emojis do Bot').setEmoji({ id: '1501804039451709441' }).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`${pref}_botao_svremoji_${idx}_${userId}`).setLabel('Emojis do Servidor').setEmoji({ id: '1501803947898306724' }).setStyle(ButtonStyle.Secondary),
    ));
    if (btn.emoji) {
        controlContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${pref}_botao_removeemoji_${idx}_${userId}`).setLabel('Remover Emoji').setEmoji({ id: '1501803926180335727' }).setStyle(ButtonStyle.Secondary),
        ));
    }

    return { components: [previewContainer, controlContainer], ...CV2 };
}

function _buildBotaoCorScreen(pref, userId, idx, data, previewContainer) {
    const btn = (data.buttons || [])[idx];
    if (!btn) return _buildBoesScreen(pref, userId, data, previewContainer);

    const controlContainer = new ContainerBuilder();
    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Mudar Cor — Botão ${idx + 1}\n` +
        `-# Selecione a nova cor para **${btn.label || 'Sem nome'}**`
    ));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRow(pref, userId, 'botoes'));
    controlContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`${pref}_botao_corsel_${idx}_${userId}`)
            .setPlaceholder('Selecione a cor...')
            .addOptions([
                { label: 'Azul (Primary)',     value: `${ButtonStyle.Primary}`,   description: 'Botão azul padrão' },
                { label: 'Cinza (Secondary)',  value: `${ButtonStyle.Secondary}`, description: 'Botão cinza neutro' },
                { label: 'Verde (Success)',    value: `${ButtonStyle.Success}`,   description: 'Botão verde de confirmação' },
                { label: 'Vermelho (Danger)',  value: `${ButtonStyle.Danger}`,    description: 'Botão vermelho de atenção' },
                { label: 'Link',              value: `${ButtonStyle.Link}`,      description: 'Botão de link externo (requer URL)' },
            ])
    ));

    return { components: [previewContainer, controlContainer], ...CV2 };
}

function _buildBotaoEmojiScreen(pref, userId, idx, page, allOptions, source, data, previewContainer) {
    const btn = (data.buttons || [])[idx];
    if (!btn) return _buildBoesScreen(pref, userId, data, previewContainer);

    const totalPages = Math.max(1, Math.ceil(allOptions.length / PAGE_SIZE));
    const safePage   = Math.max(0, Math.min(page, totalPages - 1));
    const pageOptions = allOptions.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

    const isServer   = source === 'server';
    const sourceLabel = isServer ? 'Servidor' : 'Bot';
    const selId      = `${pref}_botao_${isServer ? 'svr' : ''}emojisel_${idx}_${userId}`;
    const pagePrefix = `${pref}_botao_${isServer ? 'svr' : ''}emojipage`;
    const backId     = `${pref}_botao_${isServer ? 'svr' : ''}emojiback_${idx}_${userId}`;

    const controlContainer = new ContainerBuilder();
    controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Emojis do ${sourceLabel} — Botão ${idx + 1}\n` +
        `-# Página ${safePage + 1}/${totalPages} · ${allOptions.length} emojis · **${btn.label || 'Sem nome'}**`
    ));
    controlContainer.addSeparatorComponents(new SeparatorBuilder());
    controlContainer.addActionRowComponents(buildNavSelectRow(pref, userId, 'botoes'));

    if (allOptions.length === 0) {
        controlContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Nenhum emoji do ${sourceLabel.toLowerCase()} disponível.`));
    } else {
        controlContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(selId)
                .setPlaceholder(`Emojis ${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, allOptions.length)} de ${allOptions.length}...`)
                .addOptions(pageOptions)
        ));

        if (totalPages > 1) {
            const navRow = new ActionRowBuilder();
            if (safePage > 0) {
                navRow.addComponents(new ButtonBuilder().setCustomId(`${pagePrefix}_${safePage - 1}_${idx}_${userId}`).setLabel('Anterior').setEmoji({ id: '1501803911655198742' }).setStyle(ButtonStyle.Secondary));
            }
            navRow.addComponents(new ButtonBuilder().setCustomId(backId).setLabel('Voltar ao Botão').setEmoji({ id: '1501803908589162537' }).setStyle(ButtonStyle.Primary));
            if (safePage < totalPages - 1) {
                navRow.addComponents(new ButtonBuilder().setCustomId(`${pagePrefix}_${safePage + 1}_${idx}_${userId}`).setLabel('Próxima').setEmoji({ id: '1501803914654257326' }).setStyle(ButtonStyle.Secondary));
            }
            controlContainer.addActionRowComponents(navRow);
        }
    }

    return { components: [previewContainer, controlContainer], ...CV2 };
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
    // Painel principal
    getPainelData, setPainelData, clearPainelData,
    buildPainelMainMenu, buildPainelSectionScreen,
    buildPainelBoesScreen, buildPainelBotaoEditScreen,
    buildPainelBotaoCorScreen, buildPainelBotaoEmojiScreen,
    buildFinalPainelContainer,
    // Seção
    getSecaoData, setSecaoData, clearSecaoData,
    buildSecaoMainMenu, buildSecaoSectionScreen,
    buildSecaoBoesScreen, buildSecaoBotaoEditScreen,
    buildSecaoBotaoCorScreen, buildSecaoBotaoEmojiScreen,
    buildFinalSecaoContainer,
    // Helpers
    buildBotEmojiOptions, buildServerEmojiOptions,
    styleFromString, SECTION_LABELS, NAV_OPTIONS, ButtonStyle,
};
