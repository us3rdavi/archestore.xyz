const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
    InteractionType
} = require("discord.js");
const { tickets } = require("../../Database");
const { painelConfiguracaoTicketEN } = require("../../Functions/PainelTicketsEN");
const emojis = require("../../Database/emojis.json");

const Emojis = { get: (name) => emojis[name] || "" };

const CONFIG_BUTTON_IDS = [
    'en_configuracaoticket',
    'en_canalticketconfigsystem',
    'en_canallogsticket2',
    'en_cargosstaff',
    'en_configmensageminicial',
    'en_configmensagemfinal',
    'en_adicionarbotaoticket',
    'en_removerbotoesticket',
    'en_cancelarconfigticket'
];

const CONFIG_CHANNEL_SELECT_IDS = ['en_selectcanaltickets', 'en_selectcanallogsticket'];
const CONFIG_ROLE_SELECT_IDS    = ['en_selectcargosstaff'];
const CONFIG_STRING_SELECT_IDS  = ['en_removerbotaoticketselect', 'en_config_ticket_settings'];
const CONFIG_MODAL_IDS          = ['en_modalmensageminicial', 'en_modalmensagemfinal', 'en_modaladicionarbotao'];

async function executeConfigActionEN(actionId, interaction) {
    if (actionId === 'en_canalticketconfigsystem') {
        const canalAtual = tickets.get('en.canalTickets');
        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('en_selectcanaltickets')
            .setPlaceholder('Select the channel where ticket threads will be created')
            .setChannelTypes(ChannelType.GuildText, ChannelType.GuildForum)
            .setMinValues(1).setMaxValues(1);
        await interaction.reply({
            content: `${Emojis.get('_notify_emoji')} **Ticket Channel**\nSelect the channel where ticket threads will be created.\n${canalAtual ? `> Current: <#${canalAtual}>` : '> No channel configured.'}`,
            components: [
                new ActionRowBuilder().addComponents(channelSelect),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('en_cancelarconfigticket').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
                )
            ],
            ephemeral: true
        });
        return;
    }

    if (actionId === 'en_canallogsticket2') {
        const canalAtual = tickets.get('en.canalLogs');
        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('en_selectcanallogsticket')
            .setPlaceholder('Select the ticket logs channel')
            .setChannelTypes(ChannelType.GuildText)
            .setMinValues(1).setMaxValues(1);
        await interaction.reply({
            content: `${Emojis.get('_messages_emoji')} **Logs Channel**\nSelect the channel where ticket logs and transcripts will be sent.\n${canalAtual ? `> Current: <#${canalAtual}>` : '> No channel configured.'}`,
            components: [
                new ActionRowBuilder().addComponents(channelSelect),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('en_cancelarconfigticket').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
                )
            ],
            ephemeral: true
        });
        return;
    }

    if (actionId === 'en_cargosstaff') {
        const cargosAtuais = tickets.get('en.staffRoles') || [];
        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('en_selectcargosstaff')
            .setPlaceholder('Select the roles that can manage tickets')
            .setMinValues(0).setMaxValues(10);
        await interaction.reply({
            content: `${Emojis.get('_staff_emoji')} **Staff Roles**\nSelect the roles that will be able to claim, close and manage tickets.\n${cargosAtuais.length > 0 ? `> Current: ${cargosAtuais.map(r => `<@&${r}>`).join(', ')}` : '> No roles configured.'}`,
            components: [
                new ActionRowBuilder().addComponents(roleSelect),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('en_cancelarconfigticket').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
                )
            ],
            ephemeral: true
        });
        return;
    }

    if (actionId === 'en_configmensageminicial') {
        const atual = tickets.get('en.mensagemInicial') || {};
        const modal = new ModalBuilder()
            .setCustomId('en_modalmensageminicial')
            .setTitle('Ticket Initial Message');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('titulo').setLabel('Title (use {numero} for ticket number)')
                    .setPlaceholder('E.g.: Ticket #{numero}').setValue(atual.msgTitulo || 'Ticket #{numero}')
                    .setMaxLength(100).setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('descricao').setLabel('Description (shown below the ticket info)')
                    .setPlaceholder('E.g.: Our team will assist you shortly!').setValue(atual.msgDescricao || '')
                    .setMaxLength(500).setStyle(TextInputStyle.Paragraph).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('banner').setLabel('Banner URL (image in the ticket)')
                    .setPlaceholder('https://example.com/image.png').setValue(atual.msgBanner || '')
                    .setStyle(TextInputStyle.Short).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('cor').setLabel('Accent Color (hex)')
                    .setPlaceholder('E.g.: #5865F2').setValue(atual.msgCor || '#5865F2')
                    .setMaxLength(7).setStyle(TextInputStyle.Short).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('emoji').setLabel('Title Emoji (optional)')
                    .setPlaceholder('E.g.: <:name:123456789> or <a:name:123456789>').setValue(atual.msgEmoji || '')
                    .setMaxLength(100).setStyle(TextInputStyle.Short).setRequired(false)
            )
        );
        await interaction.showModal(modal);
        return;
    }

    if (actionId === 'en_configmensagemfinal') {
        const atual = tickets.get('en.mensagemFinalizacao') || {};
        const modal = new ModalBuilder()
            .setCustomId('en_modalmensagemfinal')
            .setTitle('Ticket Closing Message');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('titulo').setLabel('Closing message title')
                    .setPlaceholder('E.g.: Ticket Marked as Resolved').setValue(atual.titulo || 'Ticket Marked as Resolved')
                    .setMaxLength(100).setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('descricao').setLabel('Description (instruction for the user)')
                    .setPlaceholder('E.g.: If resolved, click Resolved.').setValue(atual.descricao || '')
                    .setMaxLength(800).setStyle(TextInputStyle.Paragraph).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('banner').setLabel('Banner URL (optional)')
                    .setPlaceholder('https://example.com/image.png').setValue(atual.banner || '')
                    .setStyle(TextInputStyle.Short).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('cor').setLabel('Accent Color (hex)')
                    .setPlaceholder('E.g.: #57F287').setValue(atual.cor || '#57F287')
                    .setMaxLength(7).setStyle(TextInputStyle.Short).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('emoji').setLabel('Title Emoji (optional)')
                    .setPlaceholder('E.g.: <:name:123456789> or <a:name:123456789>').setValue(atual.emoji || '')
                    .setMaxLength(100).setStyle(TextInputStyle.Short).setRequired(false)
            )
        );
        await interaction.showModal(modal);
        return;
    }

    if (actionId === 'en_adicionarbotaoticket') {
        const modal = new ModalBuilder()
            .setCustomId('en_modaladicionarbotao')
            .setTitle('Add Button to Initial Message');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('label').setLabel('Button Text')
                    .setPlaceholder('E.g.: Our Website').setMaxLength(80).setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('url').setLabel('Button URL')
                    .setPlaceholder('https://yourwebsite.com').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('emoji').setLabel('Button Emoji (optional)')
                    .setPlaceholder('E.g.: <:name:123456789> or <a:name:123456789>').setStyle(TextInputStyle.Short).setRequired(false)
            )
        );
        await interaction.showModal(modal);
        return;
    }

    if (actionId === 'en_removerbotoesticket') {
        const botoesAdicionais = tickets.get('en.botoesAdicionais') || [];
        if (botoesAdicionais.length === 0) {
            return interaction.reply({
                content: `${Emojis.get('negative_emoji')} No additional buttons configured.`,
                ephemeral: true
            });
        }
        const select = new StringSelectMenuBuilder()
            .setCustomId('en_removerbotaoticketselect')
            .setPlaceholder('Select the button to remove')
            .setMinValues(1).setMaxValues(botoesAdicionais.length)
            .addOptions(
                botoesAdicionais.map((btn, i) => ({
                    label: btn.label.slice(0, 100),
                    value: String(i),
                    description: btn.url.slice(0, 100)
                }))
            );
        await interaction.reply({
            content: `${Emojis.get('_trash_emoji')} Select the button(s) you want to remove:`,
            components: [
                new ActionRowBuilder().addComponents(select),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('en_cancelarconfigticket').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
                )
            ],
            ephemeral: true
        });
        return;
    }
}

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            if (interaction.isButton()) {
                if (!CONFIG_BUTTON_IDS.includes(interaction.customId)) return;

                if (interaction.customId === 'en_configuracaoticket') {
                    await painelConfiguracaoTicketEN(interaction);
                    return;
                }

                if (interaction.customId === 'en_cancelarconfigticket') {
                    await interaction.update({
                        content: `${Emojis.get('confirmed_emoji')} Cancelled.`,
                        components: [],
                        embeds: []
                    });
                    return;
                }

                await executeConfigActionEN(interaction.customId, interaction);
                return;
            }

            if (interaction.isStringSelectMenu()) {
                if (!CONFIG_STRING_SELECT_IDS.includes(interaction.customId)) return;

                if (interaction.customId === 'en_config_ticket_settings') {
                    const action = interaction.values[0];
                    await executeConfigActionEN(action, interaction);
                    return;
                }

                if (interaction.customId === 'en_removerbotaoticketselect') {
                    const indices = interaction.values.map(Number).sort((a, b) => b - a);
                    const botoesAdicionais = tickets.get('en.botoesAdicionais') || [];
                    for (const idx of indices) {
                        botoesAdicionais.splice(idx, 1);
                    }
                    tickets.set('en.botoesAdicionais', botoesAdicionais);
                    await interaction.update({
                        content: `${Emojis.get('confirmed_emoji')} \`${indices.length}\` button(s) removed successfully!`,
                        components: [],
                        embeds: []
                    });
                    return;
                }
            }

            if (interaction.isChannelSelectMenu()) {
                if (!CONFIG_CHANNEL_SELECT_IDS.includes(interaction.customId)) return;

                if (interaction.customId === 'en_selectcanaltickets') {
                    const channelId = interaction.values[0];
                    tickets.set('en.canalTickets', channelId);
                    await interaction.update({
                        content: `${Emojis.get('confirmed_emoji')} Ticket channel set to <#${channelId}>!\nTicket threads will be created in that channel.`,
                        components: [],
                        embeds: []
                    });
                    return;
                }

                if (interaction.customId === 'en_selectcanallogsticket') {
                    const channelId = interaction.values[0];
                    tickets.set('en.canalLogs', channelId);
                    await interaction.update({
                        content: `${Emojis.get('confirmed_emoji')} Logs channel set to <#${channelId}>!\nTicket transcripts and logs will be sent to that channel.`,
                        components: [],
                        embeds: []
                    });
                    return;
                }
            }

            if (interaction.isRoleSelectMenu()) {
                if (!CONFIG_ROLE_SELECT_IDS.includes(interaction.customId)) return;

                if (interaction.customId === 'en_selectcargosstaff') {
                    const roleIds = interaction.values;
                    tickets.set('en.staffRoles', roleIds);
                    const rolesMentions = roleIds.length > 0 ? roleIds.map(id => `<@&${id}>`).join(', ') : 'None';
                    await interaction.update({
                        content: `${Emojis.get('confirmed_emoji')} Staff roles updated!\n> ${rolesMentions}\nThese roles will be able to claim, close and manage tickets.`,
                        components: [],
                        embeds: []
                    });
                    return;
                }
            }

            if (InteractionType.ModalSubmit === interaction.type) {
                if (!CONFIG_MODAL_IDS.includes(interaction.customId)) return;

                if (interaction.customId === 'en_modalmensageminicial') {
                    const titulo    = interaction.fields.getTextInputValue('titulo');
                    const descricao = interaction.fields.getTextInputValue('descricao');
                    const banner    = interaction.fields.getTextInputValue('banner');
                    const cor       = interaction.fields.getTextInputValue('cor');
                    const emoji     = interaction.fields.getTextInputValue('emoji');

                    const config = {};
                    if (titulo)                                                              config.msgTitulo   = titulo;
                    if (descricao)                                                           config.msgDescricao = descricao;
                    if (banner && (banner.startsWith('http://') || banner.startsWith('https://'))) config.msgBanner = banner;
                    if (cor && cor.startsWith('#'))                                          config.msgCor      = cor;
                    if (emoji)                                                               config.msgEmoji    = emoji;

                    const atual = tickets.get('en.mensagemInicial') || {};
                    tickets.set('en.mensagemInicial', { ...atual, ...config });

                    await interaction.reply({
                        content: `${Emojis.get('confirmed_emoji')} Ticket initial message updated successfully!`,
                        ephemeral: true
                    });
                    return;
                }

                if (interaction.customId === 'en_modalmensagemfinal') {
                    const titulo    = interaction.fields.getTextInputValue('titulo');
                    const descricao = interaction.fields.getTextInputValue('descricao');
                    const banner    = interaction.fields.getTextInputValue('banner');
                    const cor       = interaction.fields.getTextInputValue('cor');
                    const emoji     = interaction.fields.getTextInputValue('emoji');

                    const config = {};
                    if (titulo)                                                              config.titulo   = titulo;
                    if (descricao)                                                           config.descricao = descricao;
                    if (banner && (banner.startsWith('http://') || banner.startsWith('https://'))) config.banner = banner;
                    if (cor && cor.startsWith('#'))                                          config.cor      = cor;
                    if (emoji)                                                               config.emoji    = emoji;

                    const atual = tickets.get('en.mensagemFinalizacao') || {};
                    tickets.set('en.mensagemFinalizacao', { ...atual, ...config });

                    await interaction.reply({
                        content: `${Emojis.get('confirmed_emoji')} Ticket closing message updated successfully!`,
                        ephemeral: true
                    });
                    return;
                }

                if (interaction.customId === 'en_modaladicionarbotao') {
                    const label = interaction.fields.getTextInputValue('label');
                    const url   = interaction.fields.getTextInputValue('url');
                    const emoji = interaction.fields.getTextInputValue('emoji');

                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        return interaction.reply({
                            content: `${Emojis.get('negative_emoji')} The URL must start with \`http://\` or \`https://\`.`,
                            ephemeral: true
                        });
                    }

                    const botoesAdicionais = tickets.get('en.botoesAdicionais') || [];
                    if (botoesAdicionais.length >= 5) {
                        return interaction.reply({
                            content: `${Emojis.get('negative_emoji')} Maximum of 5 additional buttons reached. Remove a button before adding another.`,
                            ephemeral: true
                        });
                    }

                    const novoBotao = { label, url };
                    if (emoji) novoBotao.emoji = emoji;
                    botoesAdicionais.push(novoBotao);
                    tickets.set('en.botoesAdicionais', botoesAdicionais);

                    await interaction.reply({
                        content: `${Emojis.get('confirmed_emoji')} Button **${label}** added successfully! It will appear in the initial message of new tickets.`,
                        ephemeral: true
                    });
                    return;
                }
            }
        } catch (error) {
            if (error.code === 10062) return;
            console.error('[configTicketsEN] Error:', error);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `An error occurred while processing this action.`, ephemeral: true });
                }
            } catch (e) { if (e.code !== 10062) console.error('[configTicketsEN] Error responding:', e.message); }
        }
    }
};
