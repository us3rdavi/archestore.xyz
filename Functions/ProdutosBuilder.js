const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ButtonStyle, EmbedBuilder
} = require('discord.js');
const { dbembed, Emojis } = require('../Database');

const NAV_OPTIONS = [
    { label: 'Menu Principal',      description: 'Voltar ao menu principal',      value: 'main',        emoji: { id: '1501804019184828507' } },
    { label: 'Título',              description: 'Editar título da embed',         value: 'title',       emoji: { id: '1501804003850322052' } },
    { label: 'Descrição',           description: 'Editar descrição da embed',      value: 'description', emoji: { id: '1501804039451709441' } },
    { label: 'Cor',                 description: 'Editar cor da embed',            value: 'color',       emoji: { id: '1501804122943389716' } },
    { label: 'Thumbnail',           description: 'Editar thumbnail da embed',      value: 'thumbnail',   emoji: { id: '1501804049563910285' } },
    { label: 'Imagem',              description: 'Editar imagem da embed',         value: 'image',       emoji: { id: '1501803928973476023' } },
    { label: 'Footer',              description: 'Editar footer da embed',         value: 'footer',      emoji: { id: '1501804120615555132' } },
    { label: 'Configurar Produtos', description: 'Personalizar itens do select',   value: 'produtos',    emoji: { id: '1501803947898306724' } },
];

const SECTION_LABELS = {
    title: 'Título', description: 'Descrição', color: 'Cor',
    thumbnail: 'Thumbnail', image: 'Imagem', footer: 'Footer',
    produtos: 'Configurar Produtos',
};

const BOT_EMOJI_OPTIONS = [
    { label: 'Sem emoji',     value: 'sem_emoji',          description: 'Remove o emoji do item' },
    { label: 'Loja',          value: '1501803947898306724', description: 'Ícone de loja',         emoji: { id: '1501803947898306724' } },
    { label: 'Estrela',       value: '1501804049563910285', description: 'Destaque/estrela',      emoji: { id: '1501804049563910285' } },
    { label: 'Diamante',      value: '1501804052827209768', description: 'Premium/diamante',      emoji: { id: '1501804052827209768' } },
    { label: 'Ticket',        value: '1501804043121725490', description: 'Ícone de ticket',       emoji: { id: '1501804043121725490' } },
    { label: 'Confirmado',    value: '1501803932484108359', description: 'Ícone de confirmação',  emoji: { id: '1501803932484108359' } },
    { label: 'Aviso',         value: '1501803941112053861', description: 'Ícone de aviso',        emoji: { id: '1501803941112053861' } },
    { label: 'Informação',    value: '1501803944375222392', description: 'Ícone de informação',   emoji: { id: '1501803944375222392' } },
    { label: 'Configurações', value: '1501804030605922346', description: 'Ícone de config',       emoji: { id: '1501804030605922346' } },
    { label: 'Ferramenta',    value: '1501804000994132080', description: 'Ícone de ferramenta',   emoji: { id: '1501804000994132080' } },
    { label: 'Pasta',         value: '1501804010049634426', description: 'Ícone de pasta',        emoji: { id: '1501804010049634426' } },
    { label: 'Mensagens',     value: '1501804039451709441', description: 'Ícone de mensagens',    emoji: { id: '1501804039451709441' } },
    { label: 'Pincel',        value: '1501804122943389716', description: 'Design/aparência',      emoji: { id: '1501804122943389716' } },
    { label: 'Adicionar',     value: '1501803905363869769', description: 'Ícone de adicionar',    emoji: { id: '1501803905363869769' } },
    { label: 'Enviar',        value: '1501803923126747178', description: 'Ícone de envio',        emoji: { id: '1501803923126747178' } },
    { label: 'Notificar',     value: '1501804036540862464', description: 'Ícone de notificação',  emoji: { id: '1501804036540862464' } },
    { label: 'Marca',         value: '1501804076189351949', description: 'Ícone de marca',        emoji: { id: '1501804076189351949' } },
    { label: 'Pessoas',       value: '1501803896073621706', description: 'Grupo/comunidade',      emoji: { id: '1501803896073621706' } },
    { label: 'Suporte',       value: '1501803899085131867', description: 'Ícone de suporte',      emoji: { id: '1501803899085131867' } },
    { label: 'Staff',         value: '1501803902046048297', description: 'Ícone de staff',        emoji: { id: '1501803902046048297' } },
    { label: 'Fantasma',      value: '1501804033608777859', description: 'Ícone fantasma',        emoji: { id: '1501804033608777859' } },
    { label: 'Lápis',         value: '1501804003850322052', description: 'Ícone de edição',       emoji: { id: '1501804003850322052' } },
    { label: 'Relógio',       value: '1501804058699366470', description: 'Horário/tempo',         emoji: { id: '1501804058699366470' } },
    { label: 'Pergunta',      value: '1502520447340777482', description: 'Ícone de dúvida',       emoji: { id: '1502520447340777482' } },
    { label: 'Sistema',       value: '1501804019184828507', description: 'Ícone de sistema',      emoji: { id: '1501804019184828507' } },
];

// ── DB helpers ────────────────────────────────────────────────────────────────

function getEmbedData(userId) {
    return dbembed.get(`pr_embed.${userId}`) || {};
}
function setEmbedData(userId, data) {
    dbembed.set(`pr_embed.${userId}`, data);
}
function getItemsData(userId) {
    return dbembed.get(`pr_items.${userId}`) || {};
}
function setItemsData(userId, items) {
    dbembed.set(`pr_items.${userId}`, items);
}
function clearAll(userId) {
    dbembed.delete(`pr_embed.${userId}`);
    dbembed.delete(`pr_items.${userId}`);
}

// ── Embed live preview ────────────────────────────────────────────────────────

function buildLiveEmbed(data) {
    const hasData = data && Object.keys(data).some(k => k !== 'content');
    if (!hasData) {
        return new EmbedBuilder()
            .setDescription(
                '> Configure as propriedades usando o seletor abaixo.\n' +
                '> A embed será atualizada **em tempo real** aqui — exatamente como ficará ao enviar.'
            )
            .setColor('#2B2D31');
    }
    const embed = new EmbedBuilder();
    if (data.title) embed.setTitle(data.title);
    if (data.description) embed.setDescription(data.description);
    if (data.color === '__none__') {
        // sem barra de cor
    } else if (data.color) {
        try { embed.setColor(data.color); } catch (e) { embed.setColor('#5865F2'); }
    } else {
        embed.setColor('#5865F2');
    }
    if (data.thumbnail) { try { embed.setThumbnail(data.thumbnail); } catch (e) {} }
    if (data.image) { try { embed.setImage(data.image); } catch (e) {} }
    if (data.footer) embed.setFooter({ text: data.footer });
    return embed;
}

function buildFinalEmbed(data) {
    return buildLiveEmbed(data);
}

// ── Nav select ────────────────────────────────────────────────────────────────

function buildNavSelectRow(userId, currentSection) {
    const options = NAV_OPTIONS.map(opt => ({ ...opt, default: opt.value === currentSection }));
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`pr_nav_${userId}`)
            .setPlaceholder('Selecionar seção para editar...')
            .addOptions(options)
    );
}

// ── Menu principal ────────────────────────────────────────────────────────────

function buildMainMenu(userId) {
    const data = getEmbedData(userId);
    return {
        content: `-# ${Emojis.get('store_emoji')} Construtor de Anúncio de Produtos — preview ao vivo abaixo`,
        embeds: [buildLiveEmbed(data)],
        components: [
            buildNavSelectRow(userId, 'main'),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`pr_send_${userId}`)
                    .setLabel('Enviar Anúncio')
                    .setEmoji({ id: '1501803923126747178' })
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`pr_reset_${userId}`)
                    .setLabel('Resetar')
                    .setEmoji({ id: '1501803926180335727' })
                    .setStyle(ButtonStyle.Danger),
            ),
        ],
    };
}

// ── Tela de seção de embed ────────────────────────────────────────────────────

function buildSectionScreen(userId, section) {
    const data = getEmbedData(userId);
    const sectionLabel = SECTION_LABELS[section] || section;
    const components = [buildNavSelectRow(userId, section)];

    if (section === 'color') {
        components.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`pr_set_color_${userId}`)
                .setLabel('Definir Cor')
                .setEmoji({ id: '1501804122943389716' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`pr_nocolor_${userId}`)
                .setLabel('Sem Barra de Cor')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`pr_remove_color_${userId}`)
                .setLabel('Restaurar Padrão')
                .setEmoji({ id: '1501803920576745522' })
                .setStyle(ButtonStyle.Secondary),
        ));
    } else {
        components.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`pr_set_${section}_${userId}`)
                .setLabel(`Definir ${sectionLabel}`)
                .setEmoji({ id: '1501804003850322052' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`pr_remove_${section}_${userId}`)
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
        embeds: [buildLiveEmbed(data)],
        components,
    };
}

// ── Tela de Configurar Produtos ───────────────────────────────────────────────

function buildProdutosScreen(userId, packages, categories) {
    const data = getEmbedData(userId);
    const items = getItemsData(userId);

    // Mapa categoria id → nome
    const catMap = {};
    for (const cat of (categories || [])) catMap[cat.id] = cat.name;

    // Filtra produtos não-pai (variações compráveis) ou todos se não houver filhos
    const allPkgs = Array.isArray(packages) ? packages : (packages?.data || []);
    const nonParents = allPkgs.filter(p => p.enabled && !p.is_variation_parent);
    const displayPkgs = nonParents.length > 0 ? nonParents : allPkgs.filter(p => p.enabled);

    const components = [buildNavSelectRow(userId, 'produtos')];

    if (displayPkgs.length === 0) {
        return {
            content: `-# ${Emojis.get('store_emoji')} Configurar Produtos — preview ao vivo abaixo\n-# Nenhum produto encontrado na loja CentralCart.`,
            embeds: [buildLiveEmbed(data)],
            components,
        };
    }

    // Monta opções para selecionar qual produto editar
    const options = displayPkgs.slice(0, 25).map(p => {
        const override = items[String(p.id)] || {};
        const catName = catMap[p.category_id] ? `[${catMap[p.category_id]}] ` : '';
        const label = (override.name || `${catName}${p.name}`).slice(0, 100);
        const desc = (override.description || p.price_display || 'Sem preço').slice(0, 100);
        const emojiId = override.emoji ? override.emoji.match(/\d{17,20}/)?.[0] : null;
        return {
            label,
            value: String(p.id),
            description: desc,
            ...(emojiId ? { emoji: { id: emojiId } } : {}),
        };
    });

    components.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`pr_ipick_${userId}`)
            .setPlaceholder('Selecione um produto para personalizar...')
            .addOptions(options)
    ));
    components.push(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`pr_refresh_produtos_${userId}`)
            .setLabel('Atualizar Lista')
            .setEmoji({ id: '1501803920576745522' })
            .setStyle(ButtonStyle.Secondary),
    ));

    return {
        content: `-# ${Emojis.get('store_emoji')} Configurar Produtos — preview ao vivo abaixo`,
        embeds: [buildLiveEmbed(data)],
        components,
    };
}

// ── Tela de edição de item ────────────────────────────────────────────────────

function buildItemEditScreen(userId, pkg, categories, guildEmojis = []) {
    const data = getEmbedData(userId);
    const items = getItemsData(userId);
    const override = items[String(pkg.id)] || {};
    const catMap = {};
    for (const cat of (categories || [])) catMap[cat.id] = cat.name;

    const catName = catMap[pkg.category_id] ? `[${catMap[pkg.category_id]}]` : '';
    const displayName = override.name || `${catName} ${pkg.name}`.trim();
    const displayDesc = override.description || pkg.price_display || 'Sem preço';
    const displayEmoji = override.emoji || '—';

    const infoLines = [
        `-# ${Emojis.get('store_emoji')} Editando produto: **${pkg.name}** (ID: \`${pkg.id}\`)`,
        ``,
        `**Nome no select:** \`${displayName}\``,
        `**Descrição no select:** \`${displayDesc}\``,
        `**Emoji:** ${displayEmoji}`,
    ].join('\n');

    const components = [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`pr_iname_${userId}`)
                .setLabel('Definir Nome')
                .setEmoji({ id: '1501804003850322052' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`pr_idesc_${userId}`)
                .setLabel('Definir Descrição')
                .setEmoji({ id: '1501804039451709441' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`pr_iemrm_${userId}`)
                .setLabel('Remover Emoji')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`pr_ireset_${userId}`)
                .setLabel('Resetar Item')
                .setEmoji({ id: '1501803926180335727' })
                .setStyle(ButtonStyle.Danger),
        ),
    ];

    // Emoji bot (select menu)
    components.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`pr_iembot_${userId}`)
            .setPlaceholder('Emoji do bot para este produto...')
            .addOptions(BOT_EMOJI_OPTIONS)
    ));

    // Emoji do servidor (se houver emojis, mostra select; senão, mostra botão de modal)
    if (guildEmojis.length > 0) {
        const srvOptions = guildEmojis.slice(0, 25).map(e => ({
            label: e.name.slice(0, 100),
            value: e.id,
            description: `Emoji do servidor: ${e.name}`,
            emoji: { id: e.id },
        }));
        components.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`pr_iemsrv_${userId}`)
                .setPlaceholder('Emoji do servidor para este produto...')
                .addOptions(srvOptions)
        ));
    } else {
        components.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`pr_iemsrv_${userId}`)
                .setLabel('Emoji do Servidor')
                .setEmoji({ id: '1501804043121725490' })
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`pr_iback_${userId}`)
                .setLabel('Voltar')
                .setEmoji({ id: '1501803908589162537' })
                .setStyle(ButtonStyle.Secondary),
        ));
    }

    if (guildEmojis.length > 0) {
        components.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`pr_iback_${userId}`)
                .setLabel('Voltar aos Produtos')
                .setEmoji({ id: '1501803908589162537' })
                .setStyle(ButtonStyle.Secondary),
        ));
    }

    return {
        content: infoLines,
        embeds: [buildLiveEmbed(data)],
        components,
    };
}

// ── Monta o select menu do anúncio ─────────────────────────────────────────────

function buildAnnouncementSelect(packages, categories, itemsData, guildId) {
    const catMap = {};
    for (const cat of (categories || [])) catMap[cat.id] = cat.name;

    const allPkgs = Array.isArray(packages) ? packages : (packages?.data || []);
    const nonParents = allPkgs.filter(p => p.enabled && !p.is_variation_parent);
    const displayPkgs = (nonParents.length > 0 ? nonParents : allPkgs.filter(p => p.enabled)).slice(0, 25);

    if (displayPkgs.length === 0) return null;

    // Agrupa por categoria para ordenação
    displayPkgs.sort((a, b) => (a.category_id || 0) - (b.category_id || 0));

    const options = displayPkgs.map(p => {
        const override = itemsData[String(p.id)] || {};
        const catName = catMap[p.category_id] ? catMap[p.category_id] : '';
        const label = (override.name || p.name).slice(0, 100);
        const descBase = override.description || p.price_display || '';
        const desc = (catName ? `${catName} · ${descBase}` : descBase).slice(0, 100);
        const emojiId = override.emoji ? override.emoji.match(/\d{17,20}/)?.[0] : null;
        return {
            label,
            value: String(p.id),
            description: desc || undefined,
            ...(emojiId ? { emoji: { id: emojiId } } : {}),
        };
    });

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`pr_ann_select_${guildId}`)
            .setPlaceholder('Selecione um produto...')
            .addOptions(options)
    );
}

module.exports = {
    getEmbedData,
    setEmbedData,
    getItemsData,
    setItemsData,
    clearAll,
    buildLiveEmbed,
    buildFinalEmbed,
    buildMainMenu,
    buildSectionScreen,
    buildProdutosScreen,
    buildItemEditScreen,
    buildAnnouncementSelect,
    BOT_EMOJI_OPTIONS,
    SECTION_LABELS,
    NAV_OPTIONS,
};
