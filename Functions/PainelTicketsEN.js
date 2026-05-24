const {
    ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { tickets, Emojis } = require("../Database");

async function painelTicketEN(interaction, useEditReply = false, useReply = false) {
    const canalTickets  = tickets.get('en.canalTickets');
    const canalLogs     = tickets.get('en.canalLogs');
    const staffRoles    = tickets.get('en.staffRoles') || [];
    const contador      = tickets.get('en.contador') || 0;
    const botoesAdic    = tickets.get('en.botoesAdicionais') || [];
    const funcoes       = tickets.get('en.funcoes') || {};
    const nFuncoes      = Object.keys(funcoes).length;
    const horarioOn     = tickets.get('en_statushorario') || false;
    const abertura      = tickets.get('en_horarioAbertura');
    const fechamento    = tickets.get('en_horarioFechamento');

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_ticket_emoji')} Support Center (EN)\n` +
            `-# Manage all settings for the English ticket system.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    let status = '';
    status += `${Emojis.get('_ticket_emoji')} **Ticket Channel:** ${canalTickets ? `<#${canalTickets}>` : `\`Not configured\``}\n`;
    status += `${Emojis.get('_messages_emoji')} **Logs Channel:** ${canalLogs ? `<#${canalLogs}>` : `\`Not configured\``}\n`;
    status += `${Emojis.get('_staff_emoji')} **Staff Roles:** ${staffRoles.length > 0 ? staffRoles.map(r => `<@&${r}>`).join(', ') : `\`None configured\``}\n`;
    status += `${Emojis.get('_folder_emoji')} **Categories:** \`${nFuncoes}\`${nFuncoes > 0 ? ` — ${Object.keys(funcoes).slice(0, 3).join(', ')}${nFuncoes > 3 ? ` +${nFuncoes - 3}` : ''}` : ''}\n`;
    status += `${Emojis.get('information_emoji')} **Total Tickets:** \`${contador}\` · **Extra buttons:** \`${botoesAdic.length}\`\n`;
    status += `${Emojis.get('clock_emoji')} **Service Hours:** ${horarioOn && abertura && fechamento ? `\`${abertura} – ${fechamento}\`` : `\`Disabled\``}`;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(status));

    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('en_definiraparencia')
            .setLabel('Appearance')
            .setEmoji({ id: '1501804122943389716' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('en_configuracaoticket')
            .setLabel('Settings')
            .setEmoji({ id: '1501804064596558017' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('en_definirhorarioatendimento24')
            .setLabel('Service Hours')
            .setEmoji({ id: '1501804058699366470' })
            .setStyle(2)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('en_addfuncaoticket')
            .setLabel('Add Category')
            .setEmoji({ id: '1501803905363869769' })
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('en_remfuncaoticket')
            .setLabel('Remove Category')
            .setEmoji({ id: '1501803926180335727' })
            .setStyle(4),
        new ButtonBuilder()
            .setCustomId('en_editaremojiticket')
            .setLabel('Category Emojis')
            .setEmoji({ id: '1501804043121725490' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('en_postarticket')
            .setLabel('Post Panel')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('en_voltar1')
            .setLabel('Back')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2)
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(row2);

    const payload = { content: '', embeds: [], components: [container], flags: MessageFlags.IsComponentsV2 };
    if (useReply)          await interaction.reply(payload);
    else if (useEditReply) await interaction.editReply(payload);
    else                   await interaction.update(payload);
}

async function painelConfiguracaoTicketEN(interaction) {
    const canalTickets  = tickets.get('en.canalTickets');
    const canalLogs     = tickets.get('en.canalLogs');
    const staffRoles    = tickets.get('en.staffRoles') || [];
    const botoesAdic    = tickets.get('en.botoesAdicionais') || [];
    const msgInicial    = tickets.get('en.mensagemInicial') || {};
    const msgFinal      = tickets.get('en.mensagemFinalizacao') || {};

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_settings_emoji')} Ticket Settings (EN)\n` +
            `-# Manage channels, roles and messages for the English ticket system.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const tick = Emojis.get('confirmed_emoji');
    const warn = Emojis.get('_flag_emoji');

    let info = '';
    info += `${Emojis.get('_ticket_emoji')} **Ticket Channel:** ${canalTickets ? `<#${canalTickets}>` : `${warn} \`Not configured\``}\n`;
    info += `${Emojis.get('_messages_emoji')} **Logs Channel:** ${canalLogs ? `<#${canalLogs}>` : `${warn} \`Not configured\``}\n`;
    info += `${Emojis.get('_staff_emoji')} **Staff Roles:** ${staffRoles.length > 0 ? `${tick} ${staffRoles.map(r => `<@&${r}>`).join(', ')}` : `${warn} \`None configured\``}\n`;
    info += `${Emojis.get('_pincel_emoji')} **Initial Message:** ${msgInicial.msgTitulo ? `${tick} \`${msgInicial.msgTitulo}\`` : `${warn} \`Default\``}\n`;
    info += `${Emojis.get('_confirm_emoji')} **Closing Message:** ${msgFinal.titulo ? `${tick} \`${msgFinal.titulo}\`` : `${warn} \`Default\``}\n`;
    info += `${Emojis.get('_add_emoji')} **Link Buttons:** \`${botoesAdic.length}/5\``;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(info));

    container.addSeparatorComponents(new SeparatorBuilder());

    const select = new StringSelectMenuBuilder()
        .setCustomId('en_config_ticket_settings')
        .setPlaceholder('Select what you want to configure...')
        .addOptions([
            {
                label: 'Ticket Channel',
                value: 'en_canalticketconfigsystem',
                description: 'Channel where ticket threads are created',
                emoji: { id: '1501804058699366470' }
            },
            {
                label: 'Logs Channel',
                value: 'en_canallogsticket2',
                description: 'Channel for ticket logs and transcripts',
                emoji: { id: '1501804039451709441' }
            },
            {
                label: 'Staff Roles',
                value: 'en_cargosstaff',
                description: 'Roles that can manage tickets',
                emoji: { id: '1501803902046048297' }
            },
            {
                label: 'Initial Message',
                value: 'en_configmensageminicial',
                description: 'Title, description, color and banner of the ticket',
                emoji: { id: '1501804122943389716' }
            },
            {
                label: 'Closing Message',
                value: 'en_configmensagemfinal',
                description: 'Message shown when closing a ticket',
                emoji: { id: '1501804067616325723' }
            },
            {
                label: 'Add Link Button',
                value: 'en_adicionarbotaoticket',
                description: 'Add a link button to the ticket (max 5)',
                emoji: { id: '1501803905363869769' }
            },
            {
                label: 'Remove Link Button',
                value: 'en_removerbotoesticket',
                description: 'Remove configured link buttons',
                emoji: { id: '1501803926180335727' }
            },
        ]);

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(select)
    );

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('en_painelconfigticket')
                .setLabel('Back')
                .setEmoji({ id: '1501803908589162537' })
                .setStyle(2)
        )
    );

    await interaction.update({
        content: '', embeds: [],
        components: [container],
        flags: MessageFlags.IsComponentsV2
    });
}

module.exports = { painelTicketEN, painelConfiguracaoTicketEN };
