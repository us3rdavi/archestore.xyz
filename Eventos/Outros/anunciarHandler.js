const {
    ModalBuilder, TextInputBuilder, TextInputStyle,
    ActionRowBuilder, ChannelSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    MessageFlags, ButtonStyle,
} = require('discord.js');
const {
    getEmbedData, setEmbedData, clearEmbedData,
    buildMainMenu, buildSectionScreen, buildAnnouncementContainer,
    buildBoesScreen, buildBotaoEditScreen, buildBotaoCorScreen, buildBotaoEmojiScreen,
    styleFromString,
} = require('../../Functions/AnunciarBuilder');
const { Emojis } = require('../../Database');

module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;
            if (!customId.startsWith('anunciar_')) return;

            const parts = customId.split('_');
            const userId = parts[parts.length - 1];

            if (userId !== interaction.user.id) {
                if (!interaction.replied && !interaction.deferred) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Esta interação não é sua.`, ephemeral: true });
                }
                return;
            }

            // ── Select Menus ───────────────────────────────────────────────────────

            if (interaction.isStringSelectMenu()) {

                if (customId === `anunciar_nav_${userId}`) {
                    const selected = interaction.values[0];
                    if (selected === 'main') {
                        await interaction.update(buildMainMenu(userId));
                    } else {
                        await interaction.update(buildSectionScreen(userId, selected));
                    }
                    return;
                }

                // Select button to edit
                if (customId === `anunciar_botoes_select_${userId}`) {
                    const idx = parseInt(interaction.values[0], 10);
                    await interaction.update(buildBotaoEditScreen(userId, idx));
                    return;
                }

                // Color selection for a button
                if (customId.startsWith(`anunciar_botao_corsel_`)) {
                    const inner = customId.slice('anunciar_botao_corsel_'.length);
                    const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                    const newStyle = parseInt(interaction.values[0], 10);
                    const data = getEmbedData(userId);
                    if (data.buttons && data.buttons[idx]) {
                        data.buttons[idx].style = newStyle;
                        // If switching away from Link, remove URL
                        if (newStyle !== ButtonStyle.Link) delete data.buttons[idx].url;
                        setEmbedData(userId, data);
                    }
                    await interaction.update(buildBotaoEditScreen(userId, idx));
                    return;
                }

                // Emoji selection for a button
                if (customId.startsWith(`anunciar_botao_emojisel_`)) {
                    const inner = customId.slice('anunciar_botao_emojisel_'.length);
                    const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                    const emojiVal = interaction.values[0];
                    const data = getEmbedData(userId);
                    if (data.buttons && data.buttons[idx]) {
                        data.buttons[idx].emoji = emojiVal;
                        setEmbedData(userId, data);
                    }
                    await interaction.update(buildBotaoEditScreen(userId, idx));
                    return;
                }

            }

            // ── Channel Select (post) ──────────────────────────────────────────────

            if (interaction.isChannelSelectMenu() && customId === `anunciar_channel_${userId}`) {
                const channel = interaction.guild.channels.cache.get(interaction.values[0]);
                const data = getEmbedData(userId);
                const hasContent = data && Object.keys(data).some(k => k !== 'content');

                if (!hasContent) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Configure o anúncio antes de enviar.`, ephemeral: true });
                }

                try {
                    const sendComponents = [];
                    if (data.content) {
                        const contentC = new ContainerBuilder();
                        contentC.addTextDisplayComponents(new TextDisplayBuilder().setContent(data.content));
                        sendComponents.push(contentC);
                    }
                    sendComponents.push(buildAnnouncementContainer(data));
                    await channel.send({ components: sendComponents, flags: MessageFlags.IsComponentsV2 });
                    await interaction.reply({ content: `${Emojis.get('confirmed_emoji')} Anúncio enviado com sucesso em <#${channel.id}>!`, ephemeral: true });
                } catch (e) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Erro ao enviar: ${e.message}`, ephemeral: true });
                }
                return;
            }

            // ── Modal Submissions ──────────────────────────────────────────────────

            if (interaction.isModalSubmit()) {
                if (!customId.startsWith(`anunciar_modal_`)) return;

                // Add button modal
                if (customId === `anunciar_modal_addbotao_${userId}`) {
                    const label = interaction.fields.getTextInputValue('btn_label');
                    const styleRaw = interaction.fields.getTextInputValue('btn_style') || 'primary';
                    const url = interaction.fields.getTextInputValue('btn_url') || '';
                    const style = styleFromString(styleRaw);
                    const data = getEmbedData(userId);
                    if (!data.buttons) data.buttons = [];
                    if (data.buttons.length >= 5) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 5 botões atingido.`, ephemeral: true });
                    }
                    const newBtn = { label, style };
                    if (style === ButtonStyle.Link && url.trim()) newBtn.url = url.trim();
                    data.buttons.push(newBtn);
                    setEmbedData(userId, data);
                    await interaction.update(buildBoesScreen(userId));
                    return;
                }

                // Edit button label
                if (customId.startsWith(`anunciar_modal_botao_label_`)) {
                    const inner = customId.slice('anunciar_modal_botao_label_'.length);
                    const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                    const label = interaction.fields.getTextInputValue('btn_label');
                    const data = getEmbedData(userId);
                    if (data.buttons && data.buttons[idx]) {
                        data.buttons[idx].label = label;
                        setEmbedData(userId, data);
                    }
                    await interaction.update(buildBotaoEditScreen(userId, idx));
                    return;
                }

                // Edit button URL
                if (customId.startsWith(`anunciar_modal_botao_url_`)) {
                    const inner = customId.slice('anunciar_modal_botao_url_'.length);
                    const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                    const url = interaction.fields.getTextInputValue('btn_url') || '';
                    const data = getEmbedData(userId);
                    if (data.buttons && data.buttons[idx]) {
                        if (url.trim()) {
                            data.buttons[idx].url = url.trim();
                            data.buttons[idx].style = ButtonStyle.Link;
                        } else {
                            delete data.buttons[idx].url;
                        }
                        setEmbedData(userId, data);
                    }
                    await interaction.update(buildBotaoEditScreen(userId, idx));
                    return;
                }

                // Generic section modal
                const withoutPrefix = customId.slice('anunciar_modal_'.length);
                const section = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));

                if (section === 'addfield') {
                    const name = interaction.fields.getTextInputValue('field_name');
                    const value = interaction.fields.getTextInputValue('field_value');
                    const inlineRaw = interaction.fields.getTextInputValue('field_inline') || 'não';
                    const inline = inlineRaw.trim().toLowerCase() === 'sim';
                    const data = getEmbedData(userId);
                    if (!data.fields) data.fields = [];
                    if (data.fields.length >= 25) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 25 campos atingido.`, ephemeral: true });
                    }
                    data.fields.push({ name, value, inline });
                    setEmbedData(userId, data);
                    await interaction.update(buildSectionScreen(userId, 'fields'));
                } else if (section === 'content') {
                    const text = interaction.fields.getTextInputValue('content_text');
                    const data = getEmbedData(userId);
                    data.content = text || null;
                    if (!data.content) delete data.content;
                    setEmbedData(userId, data);
                    await interaction.update(buildMainMenu(userId));
                } else {
                    const value = interaction.fields.getTextInputValue('section_value');
                    const data = getEmbedData(userId);
                    if (value && value.trim()) {
                        data[section] = value.trim();
                    } else {
                        delete data[section];
                    }
                    setEmbedData(userId, data);
                    await interaction.update(buildSectionScreen(userId, section));
                }
                return;
            }

            // ── Buttons ────────────────────────────────────────────────────────────

            if (!interaction.isButton()) return;

            if (customId === `anunciar_post_${userId}`) {
                const canalMenu = new ChannelSelectMenuBuilder()
                    .setCustomId(`anunciar_channel_${userId}`)
                    .setPlaceholder('Selecione o canal')
                    .setChannelTypes([0]);
                const row = new ActionRowBuilder().addComponents(canalMenu);
                await interaction.reply({ content: `${Emojis.get('_send_emoji')} Selecione o canal para enviar a embed:`, components: [row], ephemeral: true });
                return;
            }

            if (customId === `anunciar_reset_${userId}`) {
                clearEmbedData(userId);
                await interaction.update(buildMainMenu(userId));
                return;
            }

            if (customId === `anunciar_content_${userId}`) {
                const data = getEmbedData(userId);
                const modal = new ModalBuilder()
                    .setCustomId(`anunciar_modal_content_${userId}`)
                    .setTitle('Definir Conteúdo da Mensagem');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('content_text')
                            .setLabel('Conteúdo (texto da mensagem, opcional)')
                            .setStyle(TextInputStyle.Paragraph)
                            .setValue(data.content || '')
                            .setRequired(false)
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            if (customId === `anunciar_setnow_${userId}`) {
                const data = getEmbedData(userId);
                data.timestamp = new Date().toISOString();
                setEmbedData(userId, data);
                await interaction.update(buildSectionScreen(userId, 'timestamp'));
                return;
            }

            if (customId === `anunciar_setcustom_timestamp_${userId}`) {
                const modal = new ModalBuilder()
                    .setCustomId(`anunciar_modal_timestamp_${userId}`)
                    .setTitle('Definir Timestamp');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('section_value')
                            .setLabel('Data/hora (ISO 8601 ou deixe em branco para agora)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setPlaceholder('Ex: 2025-01-15T10:30:00')
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            if (customId === `anunciar_remove_timestamp_${userId}`) {
                const data = getEmbedData(userId);
                delete data.timestamp;
                setEmbedData(userId, data);
                await interaction.update(buildSectionScreen(userId, 'timestamp'));
                return;
            }

            if (customId === `anunciar_addfield_${userId}`) {
                const modal = new ModalBuilder()
                    .setCustomId(`anunciar_modal_addfield_${userId}`)
                    .setTitle('Adicionar Campo');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('field_name')
                            .setLabel('Nome do Campo')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(256)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('field_value')
                            .setLabel('Valor do Campo')
                            .setStyle(TextInputStyle.Paragraph)
                            .setMaxLength(1024)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('field_inline')
                            .setLabel('Inline? (sim/não)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setValue('não')
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            if (customId === `anunciar_clearfields_${userId}`) {
                const data = getEmbedData(userId);
                delete data.fields;
                setEmbedData(userId, data);
                await interaction.update(buildSectionScreen(userId, 'fields'));
                return;
            }

            // ── Botões buttons ─────────────────────────────────────────────────────

            if (customId === `anunciar_addbotao_${userId}`) {
                const modal = new ModalBuilder()
                    .setCustomId(`anunciar_modal_addbotao_${userId}`)
                    .setTitle('Adicionar Botão');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('btn_label')
                            .setLabel('Nome do botão')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(80)
                            .setPlaceholder('Ex: Comprar Agora')
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('btn_style')
                            .setLabel('Cor (azul, cinza, verde, vermelho, link)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setValue('azul')
                            .setPlaceholder('azul | cinza | verde | vermelho | link')
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('btn_url')
                            .setLabel('URL (somente para botões do tipo "link")')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setPlaceholder('https://...')
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            if (customId === `anunciar_clearbotoes_${userId}`) {
                const data = getEmbedData(userId);
                delete data.buttons;
                setEmbedData(userId, data);
                await interaction.update(buildBoesScreen(userId));
                return;
            }

            // Edit button label
            if (customId.startsWith(`anunciar_botao_label_`)) {
                const inner = customId.slice('anunciar_botao_label_'.length);
                const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                const data = getEmbedData(userId);
                const currentLabel = data.buttons?.[idx]?.label || '';
                const modal = new ModalBuilder()
                    .setCustomId(`anunciar_modal_botao_label_${idx}_${userId}`)
                    .setTitle(`Editar Nome — Botão ${idx + 1}`);
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('btn_label')
                            .setLabel('Nome do botão')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(80)
                            .setValue(currentLabel)
                            .setRequired(true)
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            // Edit button URL
            if (customId.startsWith(`anunciar_botao_url_`)) {
                const inner = customId.slice('anunciar_botao_url_'.length);
                const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                const data = getEmbedData(userId);
                const currentUrl = data.buttons?.[idx]?.url || '';
                const modal = new ModalBuilder()
                    .setCustomId(`anunciar_modal_botao_url_${idx}_${userId}`)
                    .setTitle(`Definir URL — Botão ${idx + 1}`);
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('btn_url')
                            .setLabel('URL do botão (deixe vazio para remover)')
                            .setStyle(TextInputStyle.Short)
                            .setValue(currentUrl)
                            .setRequired(false)
                            .setPlaceholder('https://...')
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            // Open color selection screen
            if (customId.startsWith(`anunciar_botao_cor_`)) {
                const inner = customId.slice('anunciar_botao_cor_'.length);
                const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                await interaction.update(buildBotaoCorScreen(userId, idx));
                return;
            }

            // Open emoji selection screen
            if (customId.startsWith(`anunciar_botao_emoji_`) && !customId.startsWith(`anunciar_botao_emojisel_`) && !customId.startsWith(`anunciar_botao_removeemoji_`)) {
                const inner = customId.slice('anunciar_botao_emoji_'.length);
                const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                await interaction.update(buildBotaoEmojiScreen(userId, idx));
                return;
            }

            // Remove emoji from button
            if (customId.startsWith(`anunciar_botao_removeemoji_`)) {
                const inner = customId.slice('anunciar_botao_removeemoji_'.length);
                const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                const data = getEmbedData(userId);
                if (data.buttons && data.buttons[idx]) {
                    delete data.buttons[idx].emoji;
                    setEmbedData(userId, data);
                }
                await interaction.update(buildBotaoEditScreen(userId, idx));
                return;
            }

            // Remove a button
            if (customId.startsWith(`anunciar_botao_remove_`)) {
                const inner = customId.slice('anunciar_botao_remove_'.length);
                const idx = parseInt(inner.slice(0, inner.lastIndexOf('_')), 10);
                const data = getEmbedData(userId);
                if (data.buttons) {
                    data.buttons.splice(idx, 1);
                    if (data.buttons.length === 0) delete data.buttons;
                    setEmbedData(userId, data);
                }
                await interaction.update(buildBoesScreen(userId));
                return;
            }

            // Generic set/remove handlers
            if (customId.startsWith(`anunciar_set_`)) {
                const withoutPrefix = customId.slice(`anunciar_set_`.length);
                const section = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));
                const sectionLabels = {
                    title: 'Título', description: 'Descrição', author: 'Autor',
                    url: 'URL da mensagem',
                    thumbnail: 'URL da Thumbnail', image: 'URL da Imagem', footer: 'Texto do Footer',
                };
                const data = getEmbedData(userId);
                const modal = new ModalBuilder()
                    .setCustomId(`anunciar_modal_${section}_${userId}`)
                    .setTitle(`Definir ${sectionLabels[section] || section}`);
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('section_value')
                            .setLabel(sectionLabels[section] || section)
                            .setStyle(section === 'description' ? TextInputStyle.Paragraph : TextInputStyle.Short)
                            .setValue(data[section] || '')
                            .setRequired(false)
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            if (customId.startsWith(`anunciar_remove_`)) {
                const withoutPrefix = customId.slice(`anunciar_remove_`.length);
                const section = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));
                const data = getEmbedData(userId);
                delete data[section];
                setEmbedData(userId, data);
                await interaction.update(buildSectionScreen(userId, section));
                return;
            }

        } catch (err) {
            if (err.code === 10062) return;
            console.error('[AnunciarHandler] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro. Tente novamente.`, ephemeral: true });
                }
            } catch (e) { if (e.code !== 10062) console.error('[AnunciarHandler] Erro ao responder:', e.message); }
        }
    }
};
