'use strict';

/**
 * Handler do construtor realtime de vendas.
 * Gerencia interações com prefixo vndp_ (painel principal) e vndps_ (seção).
 * Idêntico ao fluxo do anunciarHandler, adaptado para o sistema de vendas.
 */

const {
    ModalBuilder, TextInputBuilder, TextInputStyle,
    ActionRowBuilder, ButtonBuilder, MessageFlags, ButtonStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
} = require('discord.js');
const {
    getPainelData, setPainelData, clearPainelData,
    buildPainelMainMenu, buildPainelSectionScreen,
    buildPainelBoesScreen, buildPainelBotaoEditScreen,
    buildPainelBotaoCorScreen, buildPainelBotaoEmojiScreen,
    buildFinalPainelContainer,
    getSecaoData, setSecaoData, clearSecaoData,
    buildSecaoMainMenu, buildSecaoSectionScreen,
    buildSecaoBoesScreen, buildSecaoBotaoEditScreen,
    buildSecaoBotaoCorScreen, buildSecaoBotaoEmojiScreen,
    buildFinalSecaoContainer,
    buildBotEmojiOptions, buildServerEmojiOptions,
    styleFromString,
} = require('../../Functions/VendasPainelBuilder');
const { configuracao, Emojis } = require('../../Database');

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSecao(userId) {
    const data = getSecaoData(userId);
    const secaoId = data._secaoId;
    if (!secaoId) return null;
    return (configuracao.get('vendas.secoes') || []).find(s => s.id === secaoId) || null;
}

// ── Handler ───────────────────────────────────────────────────────────────────

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            const isP  = customId.startsWith('vndp_');
            const isPS = customId.startsWith('vndps_');
            if (!isP && !isPS) return;

            // Ignorar interações dos dropdowns de preview
            if (customId === 'vndp_preview_sections_ignore' || customId === 'vndps_preview_subs_ignore') {
                if (!interaction.replied && !interaction.deferred) {
                    return interaction.reply({ content: `-# Este dropdown é apenas para preview.`, ephemeral: true });
                }
                return;
            }

            const pref = isPS ? 'vndps' : 'vndp';
            const parts = customId.split('_');
            const userId = parts[parts.length - 1];

            if (userId !== interaction.user.id) {
                if (!interaction.replied && !interaction.deferred) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Esta interação não é sua.`, ephemeral: true });
                }
                return;
            }

            const getData   = isPS ? () => getSecaoData(userId)         : () => getPainelData(userId);
            const setData   = isPS ? (d) => setSecaoData(userId, d)     : (d) => setPainelData(userId, d);
            const clearData = isPS ? () => clearSecaoData(userId)       : () => clearPainelData(userId);
            const getMenu   = isPS ? () => { const s = getSecao(userId); return s ? buildSecaoMainMenu(userId, s) : null; }
                                   : () => buildPainelMainMenu(userId);
            const getSectionScreen = isPS
                ? (section) => { const s = getSecao(userId); return s ? buildSecaoSectionScreen(userId, section, s) : null; }
                : (section) => buildPainelSectionScreen(userId, section);
            const getBoesScreen = isPS
                ? () => { const s = getSecao(userId); return s ? buildSecaoBoesScreen(userId, s) : null; }
                : () => buildPainelBoesScreen(userId);
            const getBotaoEditScreen = isPS
                ? (idx) => { const s = getSecao(userId); return s ? buildSecaoBotaoEditScreen(userId, idx, s) : null; }
                : (idx) => buildPainelBotaoEditScreen(userId, idx);
            const getBotaoCorScreen = isPS
                ? (idx) => { const s = getSecao(userId); return s ? buildSecaoBotaoCorScreen(userId, idx, s) : null; }
                : (idx) => buildPainelBotaoCorScreen(userId, idx);
            const getBotaoEmojiScreen = isPS
                ? (idx, page, opts, src) => { const s = getSecao(userId); return s ? buildSecaoBotaoEmojiScreen(userId, idx, page, opts, src, s) : null; }
                : (idx, page, opts, src) => buildPainelBotaoEmojiScreen(userId, idx, page, opts, src);

            // ── SELECT MENUS ───────────────────────────────────────────────────

            if (interaction.isStringSelectMenu()) {

                // Nav dropdown
                if (customId === `${pref}_nav_${userId}`) {
                    const selected = interaction.values[0];
                    const screen = selected === 'main' ? getMenu() : getSectionScreen(selected);
                    if (screen) await interaction.update(screen);
                    return;
                }

                // Select button to edit
                if (customId === `${pref}_botoes_select_${userId}`) {
                    const idx = parseInt(interaction.values[0], 10);
                    const screen = getBotaoEditScreen(idx);
                    if (screen) await interaction.update(screen);
                    return;
                }

                // Color selection
                if (customId.startsWith(`${pref}_botao_corsel_`)) {
                    const inner = customId.slice(`${pref}_botao_corsel_`.length);
                    const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                    const newStyle = parseInt(interaction.values[0], 10);
                    const data = getData();
                    if (data.buttons && data.buttons[idx]) {
                        data.buttons[idx].style = newStyle;
                        if (newStyle !== ButtonStyle.Link) delete data.buttons[idx].url;
                        setData(data);
                    }
                    const screen = getBotaoEditScreen(idx);
                    if (screen) await interaction.update(screen);
                    return;
                }

                // Emoji selection (bot or server)
                if (customId.startsWith(`${pref}_botao_emojisel_`) || customId.startsWith(`${pref}_botao_svremojisel_`)) {
                    const prefix = customId.startsWith(`${pref}_botao_svremojisel_`)
                        ? `${pref}_botao_svremojisel_`
                        : `${pref}_botao_emojisel_`;
                    const inner = customId.slice(prefix.length);
                    const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                    const emojiVal = interaction.values[0];
                    const data = getData();
                    if (data.buttons && data.buttons[idx]) {
                        data.buttons[idx].emoji = emojiVal;
                        setData(data);
                    }
                    const screen = getBotaoEditScreen(idx);
                    if (screen) await interaction.update(screen);
                    return;
                }

            }

            // ── MODAL SUBMITS ──────────────────────────────────────────────────

            if (interaction.isModalSubmit()) {
                if (!customId.startsWith(`${pref}_modal_`)) return;

                // Add button
                if (customId === `${pref}_modal_addbotao_${userId}`) {
                    const label    = interaction.fields.getTextInputValue('btn_label');
                    const styleRaw = interaction.fields.getTextInputValue('btn_style') || 'primary';
                    const url      = interaction.fields.getTextInputValue('btn_url') || '';
                    const style    = styleFromString(styleRaw);
                    const data     = getData();
                    if (!data.buttons) data.buttons = [];
                    if (data.buttons.length >= 5) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 5 botões atingido.`, ephemeral: true });
                    }
                    const newBtn = { label, style };
                    if (style === ButtonStyle.Link && url.trim()) newBtn.url = url.trim();
                    data.buttons.push(newBtn);
                    setData(data);
                    const screen = getBoesScreen();
                    if (screen) await interaction.update(screen);
                    return;
                }

                // Edit button label
                if (customId.startsWith(`${pref}_modal_botao_label_`)) {
                    const inner = customId.slice(`${pref}_modal_botao_label_`.length);
                    const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                    const label = interaction.fields.getTextInputValue('btn_label');
                    const data = getData();
                    if (data.buttons && data.buttons[idx]) { data.buttons[idx].label = label; setData(data); }
                    const screen = getBotaoEditScreen(idx);
                    if (screen) await interaction.update(screen);
                    return;
                }

                // Edit button URL
                if (customId.startsWith(`${pref}_modal_botao_url_`)) {
                    const inner = customId.slice(`${pref}_modal_botao_url_`.length);
                    const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                    const url = interaction.fields.getTextInputValue('btn_url') || '';
                    const data = getData();
                    if (data.buttons && data.buttons[idx]) {
                        if (url.trim()) { data.buttons[idx].url = url.trim(); data.buttons[idx].style = ButtonStyle.Link; }
                        else { delete data.buttons[idx].url; }
                        setData(data);
                    }
                    const screen = getBotaoEditScreen(idx);
                    if (screen) await interaction.update(screen);
                    return;
                }

                // Generic section modal
                const withoutPrefix = customId.slice(`${pref}_modal_`.length);
                const section = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));

                if (section === 'addfield') {
                    const name      = interaction.fields.getTextInputValue('field_name');
                    const value     = interaction.fields.getTextInputValue('field_value');
                    const inlineRaw = interaction.fields.getTextInputValue('field_inline') || 'não';
                    const inline    = inlineRaw.trim().toLowerCase() === 'sim';
                    const data = getData();
                    if (!data.fields) data.fields = [];
                    if (data.fields.length >= 25) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 25 campos atingido.`, ephemeral: true });
                    }
                    data.fields.push({ name, value, inline });
                    setData(data);
                    const screen = getSectionScreen('fields');
                    if (screen) await interaction.update(screen);
                } else if (section === 'content') {
                    const text = interaction.fields.getTextInputValue('content_text');
                    const data = getData();
                    data.content = text || null;
                    if (!data.content) delete data.content;
                    setData(data);
                    const screen = getMenu();
                    if (screen) await interaction.update(screen);
                } else {
                    const value = interaction.fields.getTextInputValue('section_value');
                    const data = getData();
                    if (value && value.trim()) { data[section] = value.trim(); }
                    else { delete data[section]; }
                    setData(data);
                    const screen = getSectionScreen(section);
                    if (screen) await interaction.update(screen);
                }
                return;
            }

            // ── BUTTONS ────────────────────────────────────────────────────────

            if (!interaction.isButton()) return;

            // ── SALVAR ────────────────────────────────────────────────────────
            if (customId === `vndp_save_${userId}`) {
                const data = getPainelData(userId);
                const { _secaoId, ...cleanData } = data;
                configuracao.set('vendas.painelData', cleanData);
                clearPainelData(userId);
                const container = new ContainerBuilder();
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('confirmed_emoji')} Painel salvo!\n` +
                    `O visual do painel de vendas foi atualizado. Poste novamente para aplicar as alterações.\n\n` +
                    `-# Use **Postar Painel de Vendas** nas configurações para atualizar o canal.`
                ));
                container.addSeparatorComponents(new SeparatorBuilder());
                container.addActionRowComponents(new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`vndp_reopen_${userId}`).setLabel('Continuar editando').setEmoji({ id: '1501804003850322052' }).setStyle(2),
                ));
                await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
                return;
            }

            if (customId === `vndps_save_${userId}`) {
                const data = getSecaoData(userId);
                const { _secaoId, ...cleanData } = data;
                if (!_secaoId) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não identificada.`, ephemeral: true });

                let secoes = configuracao.get('vendas.secoes') || [];
                const idx = secoes.findIndex(s => s.id === _secaoId);
                if (idx === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });

                secoes[idx].builderData = Object.keys(cleanData).length > 0 ? cleanData : null;
                configuracao.set('vendas.secoes', secoes);
                clearSecaoData(userId);

                const container = new ContainerBuilder();
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('confirmed_emoji')} Seção salva!\n` +
                    `O visual da seção **${secoes[idx].nome}** foi atualizado.\n\n` +
                    `-# O novo visual será exibido aos clientes na próxima vez que abrirem a seção.`
                ));
                container.addSeparatorComponents(new SeparatorBuilder());
                container.addActionRowComponents(new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`vndps_reopen_${_secaoId}_${userId}`).setLabel('Continuar editando').setEmoji({ id: '1501804003850322052' }).setStyle(2),
                    new ButtonBuilder().setCustomId(`vnd_secao_cfg_${_secaoId}`).setLabel('Voltar à seção').setEmoji({ id: '1501803908589162537' }).setStyle(2),
                ));
                await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
                return;
            }

            // ── REABRIR EDITOR ────────────────────────────────────────────────
            if (customId === `vndp_reopen_${userId}`) {
                await interaction.update(buildPainelMainMenu(userId));
                return;
            }

            if (customId.startsWith(`vndps_reopen_`)) {
                const rest = customId.slice('vndps_reopen_'.length);
                const secaoId = rest.slice(0, rest.lastIndexOf('_'));
                const secao = (configuracao.get('vendas.secoes') || []).find(s => s.id === secaoId);
                if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                const data = getSecaoData(userId);
                data._secaoId = secaoId;
                setSecaoData(userId, data);
                await interaction.update(buildSecaoMainMenu(userId, secao));
                return;
            }

            // ── RESET ─────────────────────────────────────────────────────────
            if (customId === `${pref}_reset_${userId}`) {
                if (isPS) {
                    const sid = (getSecaoData(userId))._secaoId;
                    clearSecaoData(userId);
                    if (sid) { const d = {}; d._secaoId = sid; setSecaoData(userId, d); }
                    const s = getSecao(userId);
                    if (s) await interaction.update(buildSecaoMainMenu(userId, s));
                } else {
                    clearPainelData(userId);
                    await interaction.update(buildPainelMainMenu(userId));
                }
                return;
            }

            // ── CONTEÚDO ──────────────────────────────────────────────────────
            if (customId === `${pref}_content_${userId}`) {
                const data = getData();
                const modal = new ModalBuilder()
                    .setCustomId(`${pref}_modal_content_${userId}`)
                    .setTitle('Definir Conteúdo da Mensagem');
                modal.addComponents(new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('content_text')
                        .setLabel('Conteúdo (texto da mensagem, opcional)')
                        .setStyle(TextInputStyle.Paragraph)
                        .setValue(data.content || '')
                        .setRequired(false)
                ));
                await interaction.showModal(modal);
                return;
            }

            // ── TIMESTAMP ─────────────────────────────────────────────────────
            if (customId === `${pref}_setnow_${userId}`) {
                const data = getData();
                data.timestamp = new Date().toISOString();
                setData(data);
                const screen = getSectionScreen('timestamp');
                if (screen) await interaction.update(screen);
                return;
            }

            if (customId === `${pref}_setcustom_timestamp_${userId}`) {
                const modal = new ModalBuilder().setCustomId(`${pref}_modal_timestamp_${userId}`).setTitle('Definir Timestamp');
                modal.addComponents(new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('section_value').setLabel('Data/hora (ISO 8601)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Ex: 2025-01-15T10:30:00')
                ));
                await interaction.showModal(modal);
                return;
            }

            if (customId === `${pref}_remove_timestamp_${userId}`) {
                const data = getData();
                delete data.timestamp;
                setData(data);
                const screen = getSectionScreen('timestamp');
                if (screen) await interaction.update(screen);
                return;
            }

            // ── CAMPOS ────────────────────────────────────────────────────────
            if (customId === `${pref}_addfield_${userId}`) {
                const modal = new ModalBuilder().setCustomId(`${pref}_modal_addfield_${userId}`).setTitle('Adicionar Campo');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('field_name').setLabel('Nome do Campo').setStyle(TextInputStyle.Short).setMaxLength(256).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('field_value').setLabel('Valor do Campo').setStyle(TextInputStyle.Paragraph).setMaxLength(1024).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('field_inline').setLabel('Inline? (sim/não)').setStyle(TextInputStyle.Short).setRequired(false).setValue('não')),
                );
                await interaction.showModal(modal);
                return;
            }

            if (customId === `${pref}_clearfields_${userId}`) {
                const data = getData();
                delete data.fields;
                setData(data);
                const screen = getSectionScreen('fields');
                if (screen) await interaction.update(screen);
                return;
            }

            // ── BOTÕES ────────────────────────────────────────────────────────
            if (customId === `${pref}_addbotao_${userId}`) {
                const modal = new ModalBuilder().setCustomId(`${pref}_modal_addbotao_${userId}`).setTitle('Adicionar Botão');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('btn_label').setLabel('Nome do botão').setStyle(TextInputStyle.Short).setMaxLength(80).setPlaceholder('Ex: Comprar Agora').setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('btn_style').setLabel('Cor (azul, cinza, verde, vermelho, link)').setStyle(TextInputStyle.Short).setRequired(false).setValue('azul').setPlaceholder('azul | cinza | verde | vermelho | link')),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('btn_url').setLabel('URL (somente para botões do tipo "link")').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('https://...')),
                );
                await interaction.showModal(modal);
                return;
            }

            if (customId === `${pref}_clearbotoes_${userId}`) {
                const data = getData();
                delete data.buttons;
                setData(data);
                const screen = getBoesScreen();
                if (screen) await interaction.update(screen);
                return;
            }

            // Edit button label
            if (customId.startsWith(`${pref}_botao_label_`)) {
                const inner = customId.slice(`${pref}_botao_label_`.length);
                const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                const data = getData();
                const currentLabel = data.buttons?.[idx]?.label || '';
                const modal = new ModalBuilder().setCustomId(`${pref}_modal_botao_label_${idx}_${userId}`).setTitle(`Editar Nome — Botão ${idx + 1}`);
                modal.addComponents(new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('btn_label').setLabel('Nome do botão').setStyle(TextInputStyle.Short).setMaxLength(80).setValue(currentLabel).setRequired(true)
                ));
                await interaction.showModal(modal);
                return;
            }

            // Edit button URL
            if (customId.startsWith(`${pref}_botao_url_`)) {
                const inner = customId.slice(`${pref}_botao_url_`.length);
                const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                const data = getData();
                const currentUrl = data.buttons?.[idx]?.url || '';
                const modal = new ModalBuilder().setCustomId(`${pref}_modal_botao_url_${idx}_${userId}`).setTitle(`Definir URL — Botão ${idx + 1}`);
                modal.addComponents(new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('btn_url').setLabel('URL (deixe vazio para remover)').setStyle(TextInputStyle.Short).setValue(currentUrl).setRequired(false).setPlaceholder('https://...')
                ));
                await interaction.showModal(modal);
                return;
            }

            // Color screen
            if (customId.startsWith(`${pref}_botao_cor_`)) {
                const inner = customId.slice(`${pref}_botao_cor_`.length);
                const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                const screen = getBotaoCorScreen(idx);
                if (screen) await interaction.update(screen);
                return;
            }

            // Bot emoji screen
            if (customId.startsWith(`${pref}_botao_emoji_`) && !customId.startsWith(`${pref}_botao_emojisel_`) && !customId.startsWith(`${pref}_botao_removeemoji_`) && !customId.startsWith(`${pref}_botao_emojipage_`) && !customId.startsWith(`${pref}_botao_emojiback_`) && !customId.startsWith(`${pref}_botao_svremoji_`)) {
                const inner = customId.slice(`${pref}_botao_emoji_`.length);
                const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                const screen = getBotaoEmojiScreen(idx, 0, buildBotEmojiOptions(), 'bot');
                if (screen) await interaction.update(screen);
                return;
            }

            // Server emoji screen
            if (customId.startsWith(`${pref}_botao_svremoji_`) && !customId.startsWith(`${pref}_botao_svremojisel_`) && !customId.startsWith(`${pref}_botao_svremojipage_`) && !customId.startsWith(`${pref}_botao_svremojiback_`)) {
                const inner = customId.slice(`${pref}_botao_svremoji_`.length);
                const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                const screen = getBotaoEmojiScreen(idx, 0, buildServerEmojiOptions(interaction.guild), 'server');
                if (screen) await interaction.update(screen);
                return;
            }

            // Bot emoji page nav
            if (customId.startsWith(`${pref}_botao_emojipage_`)) {
                const inner = customId.slice(`${pref}_botao_emojipage_`.length);
                const p2 = inner.split('_');
                const page = parseInt(p2[0], 10);
                const idx  = parseInt(p2[1], 10);
                const screen = getBotaoEmojiScreen(idx, page, buildBotEmojiOptions(), 'bot');
                if (screen) await interaction.update(screen);
                return;
            }

            // Server emoji page nav
            if (customId.startsWith(`${pref}_botao_svremojipage_`)) {
                const inner = customId.slice(`${pref}_botao_svremojipage_`.length);
                const p2 = inner.split('_');
                const page = parseInt(p2[0], 10);
                const idx  = parseInt(p2[1], 10);
                const screen = getBotaoEmojiScreen(idx, page, buildServerEmojiOptions(interaction.guild), 'server');
                if (screen) await interaction.update(screen);
                return;
            }

            // Emoji back to button edit
            if (customId.startsWith(`${pref}_botao_emojiback_`)) {
                const inner = customId.slice(`${pref}_botao_emojiback_`.length);
                const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                const screen = getBotaoEditScreen(idx);
                if (screen) await interaction.update(screen);
                return;
            }

            if (customId.startsWith(`${pref}_botao_svremojiback_`)) {
                const inner = customId.slice(`${pref}_botao_svremojiback_`.length);
                const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                const screen = getBotaoEditScreen(idx);
                if (screen) await interaction.update(screen);
                return;
            }

            // Remove emoji
            if (customId.startsWith(`${pref}_botao_removeemoji_`)) {
                const inner = customId.slice(`${pref}_botao_removeemoji_`.length);
                const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                const data = getData();
                if (data.buttons && data.buttons[idx]) { delete data.buttons[idx].emoji; setData(data); }
                const screen = getBotaoEditScreen(idx);
                if (screen) await interaction.update(screen);
                return;
            }

            // Remove button
            if (customId.startsWith(`${pref}_botao_remove_`)) {
                const inner = customId.slice(`${pref}_botao_remove_`.length);
                const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                const data = getData();
                if (data.buttons) {
                    data.buttons.splice(idx, 1);
                    if (data.buttons.length === 0) delete data.buttons;
                    setData(data);
                }
                const screen = getBoesScreen();
                if (screen) await interaction.update(screen);
                return;
            }

            // Generic set/remove
            if (customId.startsWith(`${pref}_set_`)) {
                const withoutPrefix = customId.slice(`${pref}_set_`.length);
                const section = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));
                const sectionLabels = {
                    title: 'Título', description: 'Descrição', author: 'Autor',
                    url: 'URL', thumbnail: 'URL da Thumbnail', image: 'URL da Imagem', footer: 'Texto do Footer',
                };
                const data = getData();
                const modal = new ModalBuilder()
                    .setCustomId(`${pref}_modal_${section}_${userId}`)
                    .setTitle(`Definir ${sectionLabels[section] || section}`);
                modal.addComponents(new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('section_value')
                        .setLabel(sectionLabels[section] || section)
                        .setStyle(section === 'description' ? TextInputStyle.Paragraph : TextInputStyle.Short)
                        .setValue(data[section] || '')
                        .setRequired(false)
                ));
                await interaction.showModal(modal);
                return;
            }

            if (customId.startsWith(`${pref}_remove_`)) {
                const withoutPrefix = customId.slice(`${pref}_remove_`.length);
                const section = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));
                const data = getData();
                delete data[section];
                setData(data);
                const screen = getSectionScreen(section);
                if (screen) await interaction.update(screen);
                return;
            }

        } catch (err) {
            if (err.code === 10062) return;
            console.error('[VendasPainelHandler] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro. Tente novamente.`, ephemeral: true });
                }
            } catch (e) { if (e.code !== 10062) console.error('[VendasPainelHandler] Erro ao responder:', e.message); }
        }
    },
};
