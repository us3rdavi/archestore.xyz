const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ChannelSelectMenuBuilder, ChannelType,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    InteractionType, MessageFlags
} = require("discord.js");
const { tickets, Emojis } = require("../../Database");
const { painelTicketEN } = require("../../Functions/PainelTicketsEN");
const { buildAparenciaMainEN } = require("../../Functions/TicketAparenciaBuilderEN");
const { buildFuncaoNavScreenEN } = require("../../Functions/TicketAparenciaBuilderEN");
const { CreateMessageTicketEN, CheckarmensagensticketEN } = require("../../Functions/CreateMensagemTicketEN");
const { buildMainPanel } = require("../../Functions/ConfigPainelBuilder");

const BUTTON_IDS = [
    'en_painelconfigticket',
    'en_voltar1',
    'en_addfuncaoticket',
    'en_definiraparencia',
    'en_editaremojiticket',
    'en_definirhorarioatendimento24',
    'en_postarticket',
    'en_remfuncaoticket',
    'en_sincronizarticket',
    'en_cancelarremoverfuncao',
];

const STRING_SELECT_IDS = [
    'en_deletarticketsfunction',
    'en_abrirticket',
];

const CHANNEL_SELECT_IDS = [
    'en_canalpostarticket',
];

const MODAL_IDS = [
    'en_sdaju11111231idsj1233js123dua123',
];

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            // ── Button handlers ──────────────────────────────────────────────
            if (interaction.isButton()) {
                if (!BUTTON_IDS.includes(customId)) return;

                if (customId === 'en_painelconfigticket') {
                    await painelTicketEN(interaction);
                    return;
                }

                if (customId === 'en_voltar1') {
                    await interaction.update({
                        components: [buildMainPanel(interaction.user.id, interaction)],
                        flags: MessageFlags.IsComponentsV2,
                        embeds: [],
                        content: ''
                    });
                    return;
                }

                if (customId === 'en_definiraparencia') {
                    await interaction.update(buildAparenciaMainEN(interaction.user.id));
                    return;
                }

                if (customId === 'en_editaremojiticket') {
                    await interaction.update(buildFuncaoNavScreenEN(interaction.user.id));
                    return;
                }

                if (customId === 'en_addfuncaoticket') {
                    const dd = tickets.get('en.funcoes');
                    if (dd && Object.keys(dd).length > 24) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} You cannot create more than 24 categories in your ticket system!`, ephemeral: true });
                    }

                    const modal = new ModalBuilder()
                        .setCustomId('en_sdaju11111231idsj1233js123dua123')
                        .setTitle('Add Category');

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('tokenMP')
                                .setLabel('CATEGORY NAME')
                                .setPlaceholder('E.g.: Support')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('tokenMP2')
                                .setLabel('PRE-DESCRIPTION')
                                .setPlaceholder('E.g.: "I need support."')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                                .setMaxLength(99)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('tokenMP3')
                                .setLabel('DESCRIPTION')
                                .setPlaceholder('Enter the category description.')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(false)
                                .setMaxLength(99)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('tokenMP5')
                                .setLabel('BANNER (OPTIONAL)')
                                .setPlaceholder('Enter an image or GIF URL')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(false)
                        )
                    );

                    await interaction.showModal(modal);
                    return;
                }

                if (customId === 'en_remfuncaoticket') {
                    const ggg = tickets.get('en.funcoes');
                    if (!ggg || Object.keys(ggg).length === 0) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} There are no categories created to remove.`, ephemeral: true });
                    }

                    const selectMenuBuilder = new StringSelectMenuBuilder()
                        .setCustomId('en_deletarticketsfunction')
                        .setPlaceholder('Select the category(ies) you want to remove')
                        .setMinValues(1)
                        .setMaxValues(Object.keys(ggg).length);

                    for (const chave in ggg) {
                        const item = ggg[chave];
                        selectMenuBuilder.addOptions({
                            label: `${item.nome}`,
                            description: `${item.predescricao}`.slice(0, 100),
                            value: item.nome
                        });
                    }

                    const style2row = new ActionRowBuilder().addComponents(selectMenuBuilder);
                    const cancelRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('en_cancelarremoverfuncao')
                            .setLabel('Cancel')
                            .setStyle(2)
                    );
                    await interaction.reply({
                        content: `Select the categories you want to remove:`,
                        components: [style2row, cancelRow],
                        ephemeral: true
                    });
                    return;
                }

                if (customId === 'en_postarticket') {
                    const ggg  = tickets.get('en.funcoes');
                    const ggg2 = tickets.get('en.aparencia');

                    if (!ggg || Object.keys(ggg).length === 0 || !ggg2 || Object.keys(ggg2).length === 0) {
                        return interaction.reply({
                            content: `${Emojis.get('negative_emoji')} Add at least one **Category** and configure the **Appearance** before posting the panel.`,
                            ephemeral: true
                        });
                    }

                    const container = new ContainerBuilder();
                    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('_ticket_emoji')} Post Ticket Panel (EN)\n` +
                        `Select the channel where you want to post the ticket opening panel.`
                    ));
                    container.addSeparatorComponents(new SeparatorBuilder());
                    container.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId('en_canalpostarticket')
                            .setPlaceholder('Select the channel...')
                            .setChannelTypes(ChannelType.GuildText)
                    ));
                    container.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('en_painelconfigticket')
                            .setLabel('Back')
                            .setEmoji({ id: '1501803908589162537' })
                            .setStyle(2)
                    ));
                    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, content: '', embeds: [] });
                    return;
                }

                if (customId === 'en_sincronizarticket') {
                    await interaction.reply({ content: `${Emojis.get('loading_emoji')} Please wait, updating your messages!`, ephemeral: true });
                    await CheckarmensagensticketEN(client);
                    await interaction.editReply({ content: `${Emojis.get('confirmed_emoji')} Messages updated successfully!`, ephemeral: true });
                    return;
                }

                if (customId === 'en_cancelarremoverfuncao') {
                    await interaction.update({ content: `${Emojis.get('confirmed_emoji')} Cancelled.`, components: [], embeds: [] });
                    return;
                }
            }

            // ── StringSelectMenu handlers ────────────────────────────────────
            if (interaction.isStringSelectMenu()) {
                if (!STRING_SELECT_IDS.includes(customId)) return;

                if (customId === 'en_deletarticketsfunction') {
                    const valordelete = interaction.values;
                    for (const iterator of valordelete) {
                        tickets.delete(`en.funcoes.${iterator}`);
                    }
                    await interaction.update({
                        content: `${Emojis.get('confirmed_emoji')} \`${valordelete.length}\` category(ies) removed successfully!`,
                        components: [],
                        embeds: []
                    });
                    return;
                }

                if (customId === 'en_abrirticket') {
                    const { CreateTicketEN } = require('../../Functions/CreateTicketEN');
                    const valor = interaction.values[0];
                    await CreateTicketEN(interaction, valor);
                    return;
                }
            }

            // ── ChannelSelectMenu handlers ────────────────────────────────────
            if (interaction.isChannelSelectMenu()) {
                if (!CHANNEL_SELECT_IDS.includes(customId)) return;

                if (customId === 'en_canalpostarticket') {
                    await interaction.reply({ content: `${Emojis.get('loading_emoji')} Please wait, creating your message!`, ephemeral: true });
                    await CreateMessageTicketEN(interaction, interaction.values[0], client);
                    await interaction.editReply({ content: `${Emojis.get('confirmed_emoji')} Panel posted successfully!`, ephemeral: true });
                    return;
                }
            }

            // ── Modal handlers ────────────────────────────────────────────────
            if (interaction.type === InteractionType.ModalSubmit) {
                if (!MODAL_IDS.includes(customId)) return;

                if (customId === 'en_sdaju11111231idsj1233js123dua123') {
                    let NOME    = interaction.fields.getTextInputValue('tokenMP');
                    let PREDESC = interaction.fields.getTextInputValue('tokenMP2');
                    let DESC    = interaction.fields.getTextInputValue('tokenMP3');
                    let BANNER  = interaction.fields.getTextInputValue('tokenMP5');

                    NOME    = NOME.replace('.', '');
                    PREDESC = PREDESC.replace('.', '');

                    if (tickets.get(`en.funcoes.${NOME}`) !== null) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} A category with that name already exists!`, ephemeral: true });
                    }

                    if (NOME.length > 32) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} The name cannot be longer than 32 characters!`, ephemeral: true });
                    }
                    tickets.set(`en.funcoes.${NOME}.nome`, NOME);

                    if (PREDESC.length > 64) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} The pre-description cannot be longer than 64 characters!`, ephemeral: true });
                    }
                    tickets.set(`en.funcoes.${NOME}.predescricao`, PREDESC);

                    if (DESC !== '') {
                        if (DESC.length > 1024) {
                            return interaction.reply({ content: `${Emojis.get('negative_emoji')} The description cannot be longer than 1024 characters!`, ephemeral: true });
                        }
                        tickets.set(`en.funcoes.${NOME}.descricao`, DESC);
                    }

                    if (BANNER !== '') {
                        const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
                        if (!urlRegex.test(BANNER)) {
                            tickets.set(`en.funcoes.${NOME}.banner`, BANNER);
                            return interaction.reply({ content: `${Emojis.get('negative_emoji')} The banner URL is invalid!`, ephemeral: true });
                        }
                        tickets.set(`en.funcoes.${NOME}.banner`, BANNER);
                    }

                    await interaction.reply({
                        content: `${Emojis.get('confirmed_emoji')} Category **${NOME}** added successfully! Use the **Category Emojis** button in the panel to set the emoji.`,
                        ephemeral: true
                    });
                    return;
                }
            }

        } catch (err) {
            if (err.code === 10062) return;
            console.error('[PainelEN] Error:', err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `An error occurred. Please try again.`, ephemeral: true });
                }
            } catch (e) { if (e.code !== 10062) console.error('[PainelEN] Error responding:', e.message); }
        }
    }
};
