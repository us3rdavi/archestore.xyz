const {
    ModalBuilder, TextInputBuilder, TextInputStyle,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ChannelSelectMenuBuilder, EmbedBuilder,
} = require('discord.js');
const {
    getEmbedData, setEmbedData,
    getItemsData, setItemsData, clearAll,
    buildMainMenu, buildSectionScreen,
    buildProdutosScreen, buildItemEditScreen,
    buildAnnouncementSelect, buildFinalEmbed,
    SECTION_LABELS,
} = require('../../Functions/ProdutosBuilder');
const { listPackages, listCategories, getAppDetails } = require('../../Functions/CentralCartAPI');
const { Emojis } = require('../../Database');

// Estado de sessão em memória: userId → { currentPkg, packages, categories }
const state = new Map();
function getState(userId) {
    if (!state.has(userId)) state.set(userId, { currentPkg: null, packages: null, categories: null });
    return state.get(userId);
}

// Carrega produtos e categorias da API (com cache por sessão)
async function loadProducts(userId) {
    const s = getState(userId);
    if (!s.packages || !s.categories) {
        const [pkgsRaw, cats] = await Promise.all([
            listPackages({ all: true }),
            listCategories(),
        ]);
        s.packages = Array.isArray(pkgsRaw) ? pkgsRaw : (pkgsRaw?.data || []);
        s.categories = Array.isArray(cats) ? cats : [];
    }
    return { packages: s.packages, categories: s.categories };
}

function invalidateCache(userId) {
    const s = getState(userId);
    s.packages = null;
    s.categories = null;
    s.currentPkg = null;
}

module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            // ── Handler de anúncio público (usuários selecionam produto) ─────
            if (interaction.isStringSelectMenu() && customId.startsWith('pr_ann_select_')) {
                const packageId = interaction.values[0];
                await interaction.deferReply({ ephemeral: true });
                try {
                    const { packages, categories } = await loadProducts('__shared__');
                    const pkg = packages.find(p => String(p.id) === packageId);
                    if (!pkg) {
                        return interaction.editReply({ content: `${Emojis.get('negative_emoji')} Produto não encontrado.` });
                    }
                    const catMap = {};
                    for (const cat of categories) catMap[cat.id] = cat.name;
                    const catName = catMap[pkg.category_id] || 'Sem categoria';

                    const embed = new EmbedBuilder()
                        .setTitle(pkg.name)
                        .setColor('#5865F2')
                        .addFields(
                            { name: 'Categoria', value: catName, inline: true },
                            { name: 'Preço', value: pkg.price_display || 'Sob consulta', inline: true },
                        );
                    if (pkg.image) { try { embed.setThumbnail(pkg.image); } catch (e) {} }

                    let storeUrl = null;
                    try {
                        const app = await getAppDetails();
                        storeUrl = app.url;
                    } catch (e) {}

                    const components = [];
                    if (storeUrl) {
                        const productUrl = `${storeUrl.replace(/\/$/, '')}/p/${pkg.slug}`;
                        components.push(new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setLabel('Comprar Agora')
                                .setURL(productUrl)
                                .setStyle(ButtonStyle.Link)
                                .setEmoji({ id: '1501803947898306724' })
                        ));
                    }

                    await interaction.editReply({ embeds: [embed], components });
                } catch (err) {
                    console.error('[ProdutosHandler] Erro ao carregar produto do anúncio:', err);
                    await interaction.editReply({ content: `${Emojis.get('negative_emoji')} Erro ao carregar informações do produto.` });
                }
                return;
            }

            // ── A partir daqui: interações do builder (apenas para o dono) ───
            if (!customId.startsWith('pr_')) return;

            // Extrai userId — é sempre o último segmento separado por _
            const parts = customId.split('_');
            const userId = parts[parts.length - 1];

            if (userId !== interaction.user.id) {
                if (!interaction.replied && !interaction.deferred) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Esta interação não é sua.`, ephemeral: true });
                }
                return;
            }

            // ── Nav select ───────────────────────────────────────────────────
            if (interaction.isStringSelectMenu() && customId === `pr_nav_${userId}`) {
                const section = interaction.values[0];
                if (section === 'main') {
                    await interaction.update(buildMainMenu(userId));
                } else if (section === 'produtos') {
                    await interaction.deferUpdate();
                    try {
                        invalidateCache(userId);
                        const { packages, categories } = await loadProducts(userId);
                        await interaction.editReply(buildProdutosScreen(userId, packages, categories));
                    } catch (err) {
                        console.error('[ProdutosHandler] Erro ao carregar produtos:', err);
                        await interaction.editReply({ content: `${Emojis.get('negative_emoji')} Erro ao carregar produtos da CentralCart: ${err.message}` });
                    }
                } else {
                    await interaction.update(buildSectionScreen(userId, section));
                }
                return;
            }

            // ── Bot emoji picker para item ────────────────────────────────────
            if (interaction.isStringSelectMenu() && customId === `pr_iembot_${userId}`) {
                const valor = interaction.values[0];
                const s = getState(userId);
                if (!s.currentPkg) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Selecione um produto primeiro.`, ephemeral: true });
                const items = getItemsData(userId);
                const pkgId = String(s.currentPkg.id);
                if (!items[pkgId]) items[pkgId] = {};
                if (valor === 'sem_emoji') {
                    delete items[pkgId].emoji;
                } else {
                    items[pkgId].emoji = `<:e:${valor}>`;
                }
                setItemsData(userId, items);
                const guildEmojis = [...interaction.guild.emojis.cache.values()].filter(e => !e.animated);
                await interaction.update(buildItemEditScreen(userId, s.currentPkg, s.categories || [], guildEmojis));
                return;
            }

            // ── Emoji do servidor para item (select) ─────────────────────────
            if (interaction.isStringSelectMenu() && customId === `pr_iemsrv_${userId}`) {
                const emojiId = interaction.values[0];
                const s = getState(userId);
                if (!s.currentPkg) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Selecione um produto primeiro.`, ephemeral: true });
                const items = getItemsData(userId);
                const pkgId = String(s.currentPkg.id);
                if (!items[pkgId]) items[pkgId] = {};
                items[pkgId].emoji = `<:e:${emojiId}>`;
                setItemsData(userId, items);
                const guildEmojis = [...interaction.guild.emojis.cache.values()].filter(e => !e.animated);
                await interaction.update(buildItemEditScreen(userId, s.currentPkg, s.categories || [], guildEmojis));
                return;
            }

            // ── Select de qual produto editar ────────────────────────────────
            if (interaction.isStringSelectMenu() && customId === `pr_ipick_${userId}`) {
                const pkgId = interaction.values[0];
                const s = getState(userId);
                const { packages, categories } = await loadProducts(userId);
                const pkg = packages.find(p => String(p.id) === pkgId);
                if (!pkg) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Produto não encontrado.`, ephemeral: true });
                s.currentPkg = pkg;
                s.categories = categories;
                const guildEmojis = [...interaction.guild.emojis.cache.values()].filter(e => !e.animated);
                await interaction.update(buildItemEditScreen(userId, pkg, categories, guildEmojis));
                return;
            }

            if (!interaction.isButton() && !interaction.isModalSubmit()) return;

            // ── Botão Reset ──────────────────────────────────────────────────
            if (interaction.isButton() && customId === `pr_reset_${userId}`) {
                clearAll(userId);
                invalidateCache(userId);
                await interaction.update(buildMainMenu(userId));
                return;
            }

            // ── Botão Sem Barra de Cor ────────────────────────────────────────
            if (interaction.isButton() && customId === `pr_nocolor_${userId}`) {
                const data = getEmbedData(userId);
                data.color = '__none__';
                setEmbedData(userId, data);
                await interaction.update(buildSectionScreen(userId, 'color'));
                return;
            }

            // ── Botão Atualizar Lista de Produtos ────────────────────────────
            if (interaction.isButton() && customId === `pr_refresh_produtos_${userId}`) {
                await interaction.deferUpdate();
                invalidateCache(userId);
                try {
                    const { packages, categories } = await loadProducts(userId);
                    await interaction.editReply(buildProdutosScreen(userId, packages, categories));
                } catch (err) {
                    await interaction.editReply({ content: `${Emojis.get('negative_emoji')} Erro ao atualizar: ${err.message}` });
                }
                return;
            }

            // ── Botão Voltar aos Produtos ─────────────────────────────────────
            if (interaction.isButton() && customId === `pr_iback_${userId}`) {
                await interaction.deferUpdate();
                const { packages, categories } = await loadProducts(userId);
                await interaction.editReply(buildProdutosScreen(userId, packages, categories));
                return;
            }

            // ── Botão Resetar Item ────────────────────────────────────────────
            if (interaction.isButton() && customId === `pr_ireset_${userId}`) {
                const s = getState(userId);
                if (!s.currentPkg) {
                    await interaction.deferUpdate();
                    const { packages, categories } = await loadProducts(userId);
                    return interaction.editReply(buildProdutosScreen(userId, packages, categories));
                }
                const items = getItemsData(userId);
                delete items[String(s.currentPkg.id)];
                setItemsData(userId, items);
                const guildEmojis = [...interaction.guild.emojis.cache.values()].filter(e => !e.animated);
                await interaction.update(buildItemEditScreen(userId, s.currentPkg, s.categories || [], guildEmojis));
                return;
            }

            // ── Botão Remover Emoji do Item ───────────────────────────────────
            if (interaction.isButton() && customId === `pr_iemrm_${userId}`) {
                const s = getState(userId);
                if (!s.currentPkg) return;
                const items = getItemsData(userId);
                if (items[String(s.currentPkg.id)]) {
                    delete items[String(s.currentPkg.id)].emoji;
                    setItemsData(userId, items);
                }
                const guildEmojis = [...interaction.guild.emojis.cache.values()].filter(e => !e.animated);
                await interaction.update(buildItemEditScreen(userId, s.currentPkg, s.categories || [], guildEmojis));
                return;
            }

            // ── Botão Emoji Servidor (abre modal se guild sem emojis) ─────────
            if (interaction.isButton() && customId === `pr_iemsrv_${userId}`) {
                const modal = new ModalBuilder()
                    .setCustomId(`pr_modal_emojiserv_${userId}`)
                    .setTitle('Emoji do Servidor');
                modal.addComponents(new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('emoji_value')
                        .setLabel('Emoji do servidor (ex: <:nome:ID>)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setMaxLength(64)
                ));
                await interaction.showModal(modal);
                return;
            }

            // ── Botão Definir Nome do Item ────────────────────────────────────
            if (interaction.isButton() && customId === `pr_iname_${userId}`) {
                const s = getState(userId);
                const items = getItemsData(userId);
                const currentName = (s.currentPkg && items[String(s.currentPkg.id)]?.name) || '';
                const modal = new ModalBuilder()
                    .setCustomId(`pr_modal_iname_${userId}`)
                    .setTitle('Nome do Produto no Select Menu');
                modal.addComponents(new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('item_name')
                        .setLabel('Nome exibido no select menu (máx. 100 chars)')
                        .setStyle(TextInputStyle.Short)
                        .setValue(currentName)
                        .setRequired(false)
                        .setMaxLength(100)
                ));
                await interaction.showModal(modal);
                return;
            }

            // ── Botão Definir Descrição do Item ──────────────────────────────
            if (interaction.isButton() && customId === `pr_idesc_${userId}`) {
                const s = getState(userId);
                const items = getItemsData(userId);
                const currentDesc = (s.currentPkg && items[String(s.currentPkg.id)]?.description) || '';
                const modal = new ModalBuilder()
                    .setCustomId(`pr_modal_idesc_${userId}`)
                    .setTitle('Descrição do Produto no Select Menu');
                modal.addComponents(new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('item_desc')
                        .setLabel('Descrição exibida no select menu (máx. 100 chars)')
                        .setStyle(TextInputStyle.Short)
                        .setValue(currentDesc)
                        .setRequired(false)
                        .setMaxLength(100)
                ));
                await interaction.showModal(modal);
                return;
            }

            // ── Botão Definir seção do embed ─────────────────────────────────
            if (interaction.isButton() && customId.startsWith(`pr_set_`)) {
                const withoutPrefix = customId.slice('pr_set_'.length);
                const section = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));
                const sectionLabel = SECTION_LABELS[section] || section;
                const data = getEmbedData(userId);
                const placeholders = {
                    color: '#5865F2', thumbnail: 'https://...', image: 'https://...', footer: 'Texto do footer',
                    title: 'Título do anúncio', description: 'Descrição dos produtos...',
                };
                const modal = new ModalBuilder()
                    .setCustomId(`pr_modal_${section}_${userId}`)
                    .setTitle(`Definir ${sectionLabel}`);
                modal.addComponents(new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('section_value')
                        .setLabel(sectionLabel)
                        .setStyle(section === 'description' ? TextInputStyle.Paragraph : TextInputStyle.Short)
                        .setValue(data[section] || '')
                        .setRequired(false)
                        .setPlaceholder(placeholders[section] || '')
                        .setMaxLength(section === 'description' ? 1024 : 512)
                ));
                await interaction.showModal(modal);
                return;
            }

            // ── Botão Remover seção do embed ─────────────────────────────────
            if (interaction.isButton() && customId.startsWith(`pr_remove_`)) {
                const withoutPrefix = customId.slice('pr_remove_'.length);
                const section = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));
                const data = getEmbedData(userId);
                delete data[section];
                setEmbedData(userId, data);
                await interaction.update(buildSectionScreen(userId, section));
                return;
            }

            // ── Botão Enviar Anúncio ──────────────────────────────────────────
            if (interaction.isButton() && customId === `pr_send_${userId}`) {
                const canalMenu = new ChannelSelectMenuBuilder()
                    .setCustomId(`pr_channel_${userId}`)
                    .setPlaceholder('Selecione o canal para enviar o anúncio')
                    .setChannelTypes([0]);
                await interaction.reply({
                    content: `${Emojis.get('_send_emoji')} Selecione o canal:`,
                    components: [new ActionRowBuilder().addComponents(canalMenu)],
                    ephemeral: true,
                });
                return;
            }

            // ── Channel select (envio) ────────────────────────────────────────
            if (interaction.isStringSelectMenu() && customId === `pr_channel_${userId}`) {
                const channel = interaction.guild.channels.cache.get(interaction.values[0]);
                if (!channel) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal não encontrado.`, ephemeral: true });
                await interaction.deferUpdate();
                try {
                    const data = getEmbedData(userId);
                    const embed = buildFinalEmbed(data);
                    const { packages, categories } = await loadProducts(userId);
                    const items = getItemsData(userId);
                    const selectRow = buildAnnouncementSelect(packages, categories, items, interaction.guildId);

                    const msgPayload = { embeds: [embed] };
                    if (data.content) msgPayload.content = data.content;
                    if (selectRow) msgPayload.components = [selectRow];

                    await channel.send(msgPayload);
                    await interaction.editReply({ content: `${Emojis.get('confirmed_emoji')} Anúncio enviado em <#${channel.id}>!`, components: [] });
                } catch (err) {
                    console.error('[ProdutosHandler] Erro ao enviar anúncio:', err);
                    await interaction.editReply({ content: `${Emojis.get('negative_emoji')} Erro ao enviar: ${err.message}`, components: [] });
                }
                return;
            }

            // ── Modal submits ─────────────────────────────────────────────────
            if (!interaction.isModalSubmit()) return;

            // Modal: nome do item
            if (customId === `pr_modal_iname_${userId}`) {
                const s = getState(userId);
                if (!s.currentPkg) return;
                const value = interaction.fields.getTextInputValue('item_name').trim();
                const items = getItemsData(userId);
                const pkgId = String(s.currentPkg.id);
                if (!items[pkgId]) items[pkgId] = {};
                if (value) items[pkgId].name = value;
                else delete items[pkgId].name;
                setItemsData(userId, items);
                const guildEmojis = [...interaction.guild.emojis.cache.values()].filter(e => !e.animated);
                await interaction.update(buildItemEditScreen(userId, s.currentPkg, s.categories || [], guildEmojis));
                return;
            }

            // Modal: descrição do item
            if (customId === `pr_modal_idesc_${userId}`) {
                const s = getState(userId);
                if (!s.currentPkg) return;
                const value = interaction.fields.getTextInputValue('item_desc').trim();
                const items = getItemsData(userId);
                const pkgId = String(s.currentPkg.id);
                if (!items[pkgId]) items[pkgId] = {};
                if (value) items[pkgId].description = value;
                else delete items[pkgId].description;
                setItemsData(userId, items);
                const guildEmojis = [...interaction.guild.emojis.cache.values()].filter(e => !e.animated);
                await interaction.update(buildItemEditScreen(userId, s.currentPkg, s.categories || [], guildEmojis));
                return;
            }

            // Modal: emoji do servidor (digitado manualmente)
            if (customId === `pr_modal_emojiserv_${userId}`) {
                const s = getState(userId);
                if (!s.currentPkg) return;
                const raw = interaction.fields.getTextInputValue('emoji_value').trim();
                const match = raw.match(/<a?:[\w]+:(\d+)>/);
                if (!match) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Emoji inválido. Use o formato \`<:nome:ID>\`.`, ephemeral: true });
                }
                const emojiId = match[1];
                const items = getItemsData(userId);
                const pkgId = String(s.currentPkg.id);
                if (!items[pkgId]) items[pkgId] = {};
                items[pkgId].emoji = `<:e:${emojiId}>`;
                setItemsData(userId, items);
                const guildEmojis = [...interaction.guild.emojis.cache.values()].filter(e => !e.animated);
                await interaction.update(buildItemEditScreen(userId, s.currentPkg, s.categories || [], guildEmojis));
                return;
            }

            // Modal: seção do embed
            if (customId.startsWith(`pr_modal_`) && !customId.startsWith('pr_modal_i') && !customId.startsWith('pr_modal_emojiserv')) {
                const withoutPrefix = customId.slice('pr_modal_'.length);
                const section = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));
                const value = interaction.fields.getTextInputValue('section_value').trim();
                const data = getEmbedData(userId);
                if (value) {
                    if (section === 'color') {
                        const hexRegex = /^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
                        if (!hexRegex.test(value)) {
                            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Cor inválida. Use formato hex, ex: \`#5865F2\``, ephemeral: true });
                        }
                        data.color = value.startsWith('#') ? value : `#${value}`;
                    } else if (section === 'thumbnail' || section === 'image') {
                        if (!value.startsWith('http')) {
                            return interaction.reply({ content: `${Emojis.get('negative_emoji')} URL inválida. Deve começar com http/https.`, ephemeral: true });
                        }
                        data[section] = value;
                    } else {
                        data[section] = value;
                    }
                } else {
                    delete data[section];
                }
                setEmbedData(userId, data);
                await interaction.update(buildSectionScreen(userId, section));
                return;
            }

        } catch (err) {
            if (err.code === 10062) return;
            console.error('[ProdutosHandler] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro. Tente novamente.`, ephemeral: true });
                }
            } catch (e) { if (e.code !== 10062) console.error('[ProdutosHandler] Erro ao responder:', e.message); }
        }
    },
};
