const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    MessageFlags
} = require("discord.js");
const { tickets } = require("../Database");
const emojis = require("../Database/emojis.json");
const Emojis = { get: (name) => emojis[name] || "" };

function findTicketByThreadIdEN(threadId) {
    if (!threadId) return null;

    const userId = tickets.get(`en.threads.${threadId}`);
    if (userId) {
        const data = tickets.get(`en.abertos.${userId}`);
        if (data) return { userId, ...data };
    }

    const abertos = tickets.get('en.abertos') || {};
    for (const [uid, data] of Object.entries(abertos)) {
        if (data && data.threadId === threadId) {
            tickets.set(`en.threads.${threadId}`, uid);
            return { userId: uid, ...data };
        }
    }
    return null;
}

function isStaffEN(member) {
    if (member.permissions.has('Administrator')) return true;
    const staffRoles = tickets.get('en.staffRoles') || [];
    return staffRoles.some(roleId => member.roles.cache.has(roleId));
}

function buildTicketContainerEN(ticketData, aparencia, botoesAdicionais) {
    const container = new ContainerBuilder();

    const emoji  = aparencia.msgEmoji ? `${aparencia.msgEmoji} ` : `${Emojis.get('_ticket_emoji')} `;
    const titulo = (aparencia.msgTitulo || 'Ticket #{numero}').replace('{numero}', ticketData.numero);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${emoji}${titulo}`)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const assumidoText = ticketData.assumidoPor
        ? `<@${ticketData.staffMemberId}>`
        : `${Emojis.get('loading_emoji')} Waiting for staff`;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `${Emojis.get('_folder_emoji')} **Category:** ${ticketData.funcao}\n` +
            `${Emojis.get('information_emoji')} **Ticket #:** \`#${ticketData.numero}\`\n` +
            `${Emojis.get('_silueta_emoji')} **Opened by:** <@${ticketData.userId || ticketData.abertoPor}>\n` +
            `${Emojis.get('_staff_emoji')} **Staff:** ${assumidoText}`
        )
    );

    if (aparencia.msgDescricao) {
        container.addSeparatorComponents(new SeparatorBuilder());
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(aparencia.msgDescricao)
        );
    }

    if (aparencia.msgBanner) {
        try {
            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems({ media: { url: aparencia.msgBanner } })
            );
        } catch (e) {}
    }

    container.addSeparatorComponents(new SeparatorBuilder());

    const mainRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('en_ticket_assumir')
            .setLabel('Claim')
            .setEmoji({ id: '1501803902046048297' })
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('en_ticket_staffpanel')
            .setLabel('Staff Panel')
            .setEmoji({ id: '1501804000994132080' })
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('en_ticket_finalizar')
            .setLabel('Close')
            .setEmoji({ id: '1501804123924729946' })
            .setStyle(ButtonStyle.Success)
    );
    container.addActionRowComponents(mainRow);

    if (botoesAdicionais && botoesAdicionais.length > 0) {
        const customRow = new ActionRowBuilder();
        for (const btn of botoesAdicionais.slice(0, 5)) {
            try {
                const b = new ButtonBuilder()
                    .setLabel(btn.label)
                    .setStyle(ButtonStyle.Link)
                    .setURL(btn.url);
                if (btn.emoji) b.setEmoji(btn.emoji);
                customRow.addComponents(b);
            } catch (e) {}
        }
        if (customRow.components.length > 0) {
            container.addActionRowComponents(customRow);
        }
    }

    return container;
}

function buildFinalizacaoContainerEN(config) {
    const container = new ContainerBuilder();

    const emoji  = (config && config.emoji) || Emojis.get('_confirm_emoji');
    const titulo = (config && config.titulo) || 'Ticket Marked as Resolved';

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${emoji} ${titulo}`)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const descricao = (config && config.descricao) ||
        `${Emojis.get('confirmed_emoji')} If your issue was **fully resolved**, click **Resolved** below.\n` +
        `${Emojis.get('_flag_emoji')} If you **still need help**, click **Reopen** and our team will get back to you.\n\n` +
        `-# ${Emojis.get('clock_emoji')} You have 12 hours to respond before the ticket is automatically closed.`;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(descricao)
    );

    if (config && config.banner) {
        try {
            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems({ media: { url: config.banner } })
            );
        } catch (e) {}
    }

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('en_ticket_resolvido')
                .setLabel('Resolved')
                .setEmoji({ id: '1501804123924729946' })
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('en_ticket_reabrir')
                .setLabel('Reopen Ticket')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(ButtonStyle.Danger)
        )
    );

    return container;
}

function buildStaffPanelContainerEN(ticketData) {
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_tool_emoji')} Staff Panel\n` +
            `-# Actions available to manage this ticket`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const assumidoText = ticketData.assumidoPor
        ? `<@${ticketData.staffMemberId}>`
        : `\`Waiting for staff\``;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `${Emojis.get('information_emoji')} **Ticket #:** \`#${ticketData.numero}\`\n` +
            `${Emojis.get('_folder_emoji')} **Category:** ${ticketData.funcao}\n` +
            `${Emojis.get('_silueta_emoji')} **Opened by:** <@${ticketData.userId}>\n` +
            `${Emojis.get('_staff_emoji')} **Staff:** ${assumidoText}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('en_ticket_staff_action')
                .setPlaceholder('Select an action...')
                .addOptions([
                    {
                        label: 'Notify User',
                        value: 'notificar',
                        description: 'Send a DM notification to the ticket user',
                        emoji: { id: '1501804036540862464' },
                    },
                    {
                        label: 'Transfer Ticket',
                        value: 'transferir',
                        description: 'Transfer the ticket to another team member',
                        emoji: { id: '1501803997583904810' },
                    },
                    {
                        label: 'Add Member',
                        value: 'addmembro',
                        description: 'Add a member to this ticket',
                        emoji: { id: '1501803923126747178' },
                    },
                    {
                        label: 'Remove Member',
                        value: 'remmembro',
                        description: 'Remove a member from this ticket',
                        emoji: { id: '1501803926180335727' },
                    },
                    {
                        label: 'Create Voice Call',
                        value: 'criarcall',
                        description: 'Create a temporary voice channel for this ticket',
                        emoji: { id: '1501804043121725490' },
                    },
                ])
        )
    );

    return container;
}

module.exports = {
    findTicketByThreadIdEN,
    isStaffEN,
    buildTicketContainerEN,
    buildFinalizacaoContainerEN,
    buildStaffPanelContainerEN
};
