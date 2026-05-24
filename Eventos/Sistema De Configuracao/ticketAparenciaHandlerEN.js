const {
    ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} = require('discord.js');
const {
    buildAparenciaMainEN, buildAparenciaSectionEN,
    buildFuncaoNavScreenEN, buildFuncaoEmojiScreenEN,
    SECTION_LABELS
} = require('../../Functions/TicketAparenciaBuilderEN');
const { tickets, Emojis } = require('../../Database');

module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;
            if (!customId.startsWith('taparelen_')) return;

            const parts  = customId.split('_');
            const userId = parts[1] === 'feoji' ? parts[2] : parts[parts.length - 1];

            if (userId !== interaction.user.id) {
                if (!interaction.replied && !interaction.deferred) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} This interaction is not yours.`, ephemeral: true });
                }
                return;
            }

            // ── Nav select (section switch) ──────────────────────────────────
            if (interaction.isStringSelectMenu() && customId === `taparelen_nav_${userId}`) {
                const section = interaction.values[0];
                if (section === 'main') {
                    await interaction.update(buildAparenciaMainEN(userId));
                } else {
                    await interaction.update(buildAparenciaSectionEN(userId, section));
                }
                return;
            }

            // ── Panel title emoji picker ─────────────────────────────────────
            if (interaction.isStringSelectMenu() && customId === `taparelen_emoji_pick_${userId}`) {
                const valor = interaction.values[0];
                if (valor === 'sem_emoji') {
                    tickets.delete('en.aparencia.emoji');
                } else {
                    tickets.set('en.aparencia.emoji', `<:e:${valor}>`);
                }
                await interaction.update(buildAparenciaSectionEN(userId, 'emoji'));
                return;
            }

            // ── Category nav select ──────────────────────────────────────────
            if (interaction.isStringSelectMenu() && customId === `taparelen_funcnav_${userId}`) {
                const nomeFuncao = interaction.values[0];
                await interaction.update(buildFuncaoEmojiScreenEN(userId, nomeFuncao));
                return;
            }

            // ── Category emoji picker ────────────────────────────────────────
            if (interaction.isStringSelectMenu() && customId.startsWith(`taparelen_feoji_${userId}_`)) {
                const nomeFuncao = customId.slice(`taparelen_feoji_${userId}_`.length);
                const valor = interaction.values[0];
                if (valor === 'sem_emoji') {
                    tickets.delete(`en.funcoes.${nomeFuncao}.emoji`);
                } else {
                    tickets.set(`en.funcoes.${nomeFuncao}.emoji`, `<:e:${valor}>`);
                }
                await interaction.update(buildFuncaoEmojiScreenEN(userId, nomeFuncao));
                return;
            }

            // ── Category emoji back button ───────────────────────────────────
            if (interaction.isButton() && customId === `taparelen_funcback_${userId}`) {
                await interaction.update(buildFuncaoNavScreenEN(userId));
                return;
            }

            if (!interaction.isButton() && !interaction.isModalSubmit()) return;

            // ── "Set X" button → opens modal ─────────────────────────────────
            if (interaction.isButton() && customId.startsWith(`taparelen_set_`)) {
                const withoutPrefix = customId.slice('taparelen_set_'.length);
                const section       = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));
                const sectionLabel  = SECTION_LABELS[section] || section;
                const data          = tickets.get('en.aparencia') || {};
                const keyMap        = { titulo: 'title', descricao: 'description', cor: 'color', banner: 'banner' };
                const currentVal    = data[keyMap[section]] || '';

                const modal = new ModalBuilder()
                    .setCustomId(`taparelen_modal_${section}_${userId}`)
                    .setTitle(`Set ${sectionLabel}`);
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

            // ── "Remove" button ───────────────────────────────────────────────
            if (interaction.isButton() && customId.startsWith(`taparelen_remove_`)) {
                const withoutPrefix = customId.slice('taparelen_remove_'.length);
                const section       = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));
                const keyMap        = { titulo: 'title', descricao: 'description', cor: 'color', banner: 'banner', emoji: 'emoji' };
                const dbKey         = keyMap[section];
                if (dbKey) tickets.delete(`en.aparencia.${dbKey}`);
                await interaction.update(buildAparenciaSectionEN(userId, section));
                return;
            }

            // ── Modal submit ──────────────────────────────────────────────────
            if (interaction.isModalSubmit() && customId.startsWith(`taparelen_modal_`)) {
                const withoutPrefix = customId.slice('taparelen_modal_'.length);
                const section       = withoutPrefix.slice(0, withoutPrefix.lastIndexOf('_'));
                const value         = interaction.fields.getTextInputValue('section_value').trim();
                const keyMap        = { titulo: 'title', descricao: 'description', cor: 'color', banner: 'banner' };
                const dbKey         = keyMap[section];

                if (value) {
                    if (section === 'cor') {
                        const hexRegex = /^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
                        if (!hexRegex.test(value)) {
                            return interaction.reply({
                                content: `${Emojis.get('negative_emoji')} Invalid color. Use hex format, e.g.: \`#5865F2\``,
                                ephemeral: true
                            });
                        }
                        tickets.set(`en.aparencia.${dbKey}`, value.startsWith('#') ? value : `#${value}`);
                    } else if (section === 'banner') {
                        const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
                        if (!urlRegex.test(value)) {
                            return interaction.reply({
                                content: `${Emojis.get('negative_emoji')} Invalid URL. Use a valid URL starting with http/https.`,
                                ephemeral: true
                            });
                        }
                        tickets.set(`en.aparencia.${dbKey}`, value);
                    } else {
                        tickets.set(`en.aparencia.${dbKey}`, value);
                    }
                } else {
                    if (dbKey) tickets.delete(`en.aparencia.${dbKey}`);
                }

                await interaction.update(buildAparenciaSectionEN(userId, section));
                return;
            }

        } catch (err) {
            if (err.code === 10062) return;
            console.error('[TicketAparenciaHandlerEN] Error:', err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} An error occurred. Please try again.`, ephemeral: true });
                }
            } catch (e) { if (e.code !== 10062) console.error('[TicketAparenciaHandlerEN] Error responding:', e.message); }
        }
    }
};
