const {
    ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} = require('discord.js');
const {
    buildAparenciaMain, buildAparenciaSection,
    buildFuncaoNavScreen, buildFuncaoEmojiScreen,
    SECTION_LABELS
} = require('../../Functions/TicketAparenciaBuilder');
const { tickets, Emojis } = require('../../Database');

module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;
            if (!customId.startsWith('taparel_')) return;

            // Extrai userId — para feoji o userId é o 3º segmento (taparel_feoji_USERID_NOME)
            const parts = customId.split('_');
            const userId = parts[1] === 'feoji' ? parts[2] : parts[parts.length - 1];

            if (userId !== interaction.user.id) {
                if (!interaction.replied && !interaction.deferred) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Esta interação não é sua.`, ephemeral: true });
                }
                return;
            }

            // ── Nav select (troca de seção) ──────────────────────────────────
            if (interaction.isStringSelectMenu() && customId === `taparel_nav_${userId}`) {
                const section = interaction.values[0];
                if (section === 'main') {
                    await interaction.update(buildAparenciaMain(userId));
                } else {
                    await interaction.update(buildAparenciaSection(userId, section));
                }
                return;
            }

            // ── Emoji picker do título do painel ─────────────────────────────
            if (interaction.isStringSelectMenu() && customId === `taparel_emoji_pick_${userId}`) {
                const valor = interaction.values[0];
                if (valor === 'sem_emoji') {
                    tickets.delete('tickets.aparencia.emoji');
                } else {
                    tickets.set('tickets.aparencia.emoji', `<:e:${valor}>`);
                }
                await interaction.update(buildAparenciaSection(userId, 'emoji'));
                return;
            }

            // ── Select de função para editar emoji ───────────────────────────
            if (interaction.isStringSelectMenu() && customId === `taparel_funcnav_${userId}`) {
                const nomeFuncao = interaction.values[0];
                await interaction.update(buildFuncaoEmojiScreen(userId, nomeFuncao));
                return;
            }

            // ── Emoji picker de uma função específica ────────────────────────
            if (interaction.isStringSelectMenu() && customId.startsWith(`taparel_feoji_${userId}_`)) {
                const nomeFuncao = customId.slice(`taparel_feoji_${userId}_`.length);
                const valor = interaction.values[0];
                if (valor === 'sem_emoji') {
                    tickets.delete(`tickets.funcoes.${nomeFuncao}.emoji`);
                } else {
                    tickets.set(`tickets.funcoes.${nomeFuncao}.emoji`, `<:e:${valor}>`);
                }
                await interaction.update(buildFuncaoEmojiScreen(userId, nomeFuncao));
                return;
            }

            // ── Botão Voltar da tela de emoji de função ──────────────────────
            if (interaction.isButton() && customId === `taparel_funcback_${userId}`) {
                await interaction.update(buildFuncaoNavScreen(userId));
                return;
            }

            if (!interaction.isButton() && !interaction.isModalSubmit()) return;

            // ── Botão "Definir X" → abre modal ───────────────────────────────
            if (interaction.isButton() && customId.startsWith(`taparel_set_`)) {
                const withoutPrefix = customId.slice('taparel_set_'.length);
                const section = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));
                const sectionLabel = SECTION_LABELS[section] || section;
                const data = tickets.get('tickets.aparencia') || {};
                const keyMap = { titulo: 'title', descricao: 'description', cor: 'color', banner: 'banner' };
                const currentVal = data[keyMap[section]] || '';

                const modal = new ModalBuilder()
                    .setCustomId(`taparel_modal_${section}_${userId}`)
                    .setTitle(`Definir ${sectionLabel}`);
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('section_value')
                            .setLabel(sectionLabel)
                            .setStyle(section === 'descricao' ? TextInputStyle.Paragraph : TextInputStyle.Short)
                            .setValue(currentVal)
                            .setRequired(false)
                            .setMaxLength(section === 'descricao' ? 1024 : 512)
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            // ── Botão "Remover" ───────────────────────────────────────────────
            if (interaction.isButton() && customId.startsWith(`taparel_remove_`)) {
                const withoutPrefix = customId.slice('taparel_remove_'.length);
                const section = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));
                const keyMap = { titulo: 'title', descricao: 'description', cor: 'color', banner: 'banner', emoji: 'emoji' };
                const dbKey = keyMap[section];
                if (dbKey) tickets.delete(`tickets.aparencia.${dbKey}`);
                await interaction.update(buildAparenciaSection(userId, section));
                return;
            }

            // ── Modal submit ─────────────────────────────────────────────────
            if (interaction.isModalSubmit() && customId.startsWith(`taparel_modal_`)) {
                const withoutPrefix = customId.slice('taparel_modal_'.length);
                const section = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));
                const value = interaction.fields.getTextInputValue('section_value').trim();
                const keyMap = { titulo: 'title', descricao: 'description', cor: 'color', banner: 'banner' };
                const dbKey = keyMap[section];

                if (value) {
                    if (section === 'cor') {
                        const hexRegex = /^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
                        if (!hexRegex.test(value)) {
                            return interaction.reply({
                                content: `${Emojis.get('negative_emoji')} Cor inválida. Use formato hex, ex: \`#5865F2\``,
                                ephemeral: true
                            });
                        }
                        tickets.set(`tickets.aparencia.${dbKey}`, value.startsWith('#') ? value : `#${value}`);
                    } else if (section === 'banner') {
                        const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
                        if (!urlRegex.test(value)) {
                            return interaction.reply({
                                content: `${Emojis.get('negative_emoji')} URL inválida. Use uma URL válida começando com http/https.`,
                                ephemeral: true
                            });
                        }
                        tickets.set(`tickets.aparencia.${dbKey}`, value);
                    } else {
                        tickets.set(`tickets.aparencia.${dbKey}`, value);
                    }
                } else {
                    if (dbKey) tickets.delete(`tickets.aparencia.${dbKey}`);
                }

                await interaction.update(buildAparenciaSection(userId, section));
                return;
            }

        } catch (err) {
            console.error('[TicketAparenciaHandler] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro. Tente novamente.`, ephemeral: true });
                }
            } catch (e) {}
        }
    }
};
