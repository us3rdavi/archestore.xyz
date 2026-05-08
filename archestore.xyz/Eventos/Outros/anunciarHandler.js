const {
    ModalBuilder, TextInputBuilder, TextInputStyle,
    ActionRowBuilder, ChannelSelectMenuBuilder
} = require('discord.js');
const {
    getEmbedData, setEmbedData, clearEmbedData,
    buildMainMenu, buildSectionScreen, buildDiscordEmbed
} = require('../../Functions/AnunciarBuilder');
const { Emojis } = require('../../DataBaseJson');

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

            if (interaction.isStringSelectMenu() && customId === `anunciar_nav_${userId}`) {
                const selected = interaction.values[0];
                if (selected === 'main') {
                    await interaction.update(buildMainMenu(userId));
                } else {
                    await interaction.update(buildSectionScreen(userId, selected));
                }
                return;
            }

            if (interaction.isChannelSelectMenu() && customId === `anunciar_channel_${userId}`) {
                const channel = interaction.guild.channels.cache.get(interaction.values[0]);
                const data = getEmbedData(userId);
                const embed = buildDiscordEmbed(data);

                if (!embed) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Configure a embed antes de enviar.`, ephemeral: true });
                }

                try {
                    await channel.send({ embeds: [embed], content: data.content || null });
                    await interaction.reply({ content: `${Emojis.get('confirmed_emoji')} Embed enviada com sucesso em <#${channel.id}>!`, ephemeral: true });
                } catch (e) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Erro ao enviar: ${e.message}`, ephemeral: true });
                }
                return;
            }

            if (interaction.isModalSubmit()) {
                if (!customId.startsWith(`anunciar_modal_`)) return;

                const withoutPrefix = customId.slice('anunciar_modal_'.length);
                const section = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));
                const data = getEmbedData(userId);

                if (section === 'addfield') {
                    const name = interaction.fields.getTextInputValue('field_name');
                    const value = interaction.fields.getTextInputValue('field_value');
                    const inlineRaw = interaction.fields.getTextInputValue('field_inline') || 'não';
                    const inline = inlineRaw.trim().toLowerCase() === 'sim';
                    if (!data.fields) data.fields = [];
                    if (data.fields.length >= 25) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 25 campos atingido.`, ephemeral: true });
                    }
                    data.fields.push({ name, value, inline });
                    setEmbedData(userId, data);
                    await interaction.update(buildSectionScreen(userId, 'fields'));
                } else if (section === 'content') {
                    const text = interaction.fields.getTextInputValue('content_text');
                    data.content = text || null;
                    if (!data.content) delete data.content;
                    setEmbedData(userId, data);
                    await interaction.update(buildMainMenu(userId));
                } else {
                    const value = interaction.fields.getTextInputValue('section_value');
                    if (value && value.trim()) {
                        if (section === 'color') {
                            const hexRegex = /^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
                            if (!hexRegex.test(value.trim())) {
                                return interaction.reply({ content: `${Emojis.get('negative_emoji')} Cor inválida. Use formato hex, ex: \`#5865F2\``, ephemeral: true });
                            }
                            data[section] = value.trim().startsWith('#') ? value.trim() : `#${value.trim()}`;
                        } else {
                            data[section] = value.trim();
                        }
                    } else {
                        delete data[section];
                    }
                    setEmbedData(userId, data);
                    await interaction.update(buildSectionScreen(userId, section));
                }
                return;
            }

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

            if (customId.startsWith(`anunciar_set_`)) {
                const withoutPrefix = customId.slice(`anunciar_set_`.length);
                const section = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));
                const sectionLabels = {
                    title: 'Título', description: 'Descrição', author: 'Autor',
                    color: 'Cor (ex: #5865F2)', url: 'URL da mensagem',
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
            console.error('[AnunciarHandler] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro. Tente novamente.`, ephemeral: true });
                }
            } catch (e) {}
        }
    }
};
