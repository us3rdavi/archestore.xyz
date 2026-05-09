const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require("discord.js");
const { tickets } = require("../Database");
const emojis = require("../Database/emojis.json");
const Emojis = { get: (name) => emojis[name] || "" };

function findTicketByThreadId(threadId) {
    const abertos = tickets.get('tickets.abertos') || {};
    for (const [userId, data] of Object.entries(abertos)) {
        if (data && data.threadId === threadId) {
            return { userId, ...data };
        }
    }
    return null;
}

function isStaff(member) {
    if (member.permissions.has('Administrator')) return true;
    const staffRoles = tickets.get('tickets.staffRoles') || [];
    return staffRoles.some(roleId => member.roles.cache.has(roleId));
}

function buildTicketContainer(ticketData, aparencia, botoesAdicionais) {
    const container = new ContainerBuilder();

    const emoji  = aparencia.msgEmoji ? `${aparencia.msgEmoji} ` : `${Emojis.get('_ticket_emoji')} `;
    const titulo = (aparencia.msgTitulo || 'Ticket #{numero}').replace('{numero}', ticketData.numero);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${emoji}${titulo}`)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const assumidoText = ticketData.assumidoPor
        ? `<@${ticketData.staffMemberId}>`
        : `${Emojis.get('loading_emoji')} Aguardando atendimento`;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `${Emojis.get('_folder_emoji')} **Categoria:** ${ticketData.funcao}\n` +
            `${Emojis.get('information_emoji')} **Ticket Nº:** \`#${ticketData.numero}\`\n` +
            `${Emojis.get('_silueta_emoji')} **Aberto por:** <@${ticketData.userId || ticketData.abertoPor}>\n` +
            `${Emojis.get('_staff_emoji')} **Atendente:** ${assumidoText}`
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
            .setCustomId('ticket_assumir')
            .setLabel('Assumir')
            .setEmoji({ id: '1501803902046048297' })
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('ticket_staffpanel')
            .setLabel('Painel Staff')
            .setEmoji({ id: '1501804000994132080' })
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('ticket_finalizar')
            .setLabel('Finalizar')
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

function buildFinalizacaoContainer(config) {
    const container = new ContainerBuilder();

    const emoji  = (config && config.emoji) || Emojis.get('_confirm_emoji');
    const titulo = (config && config.titulo) || 'Ticket Marcado como Concluído';

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${emoji} ${titulo}`)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const descricao = (config && config.descricao) ||
        `${Emojis.get('confirmed_emoji')} Se o seu problema foi **totalmente resolvido**, clique em **Resolvido** abaixo.\n` +
        `${Emojis.get('_flag_emoji')} Se você **ainda precisa de ajuda**, clique em **Reabrir** e entraremos em contato.\n\n` +
        `-# ${Emojis.get('clock_emoji')} Você tem 12 horas para responder antes do ticket ser encerrado automaticamente.`;

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
                .setCustomId('ticket_resolvido')
                .setLabel('Resolvido')
                .setEmoji({ id: '1501804123924729946' })
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('ticket_reabrir')
                .setLabel('Reabrir Ticket')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(ButtonStyle.Danger)
        )
    );

    return container;
}

function buildStaffPanelContainer(ticketData) {
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${Emojis.get('_tool_emoji')} Painel Staff`)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const assumidoText = ticketData.assumidoPor
        ? `<@${ticketData.staffMemberId}>`
        : `\`Aguardando atendimento\``;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `${Emojis.get('information_emoji')} **Ticket Nº:** \`#${ticketData.numero}\`\n` +
            `${Emojis.get('_folder_emoji')} **Categoria:** ${ticketData.funcao}\n` +
            `${Emojis.get('_silueta_emoji')} **Aberto por:** <@${ticketData.userId}>\n` +
            `${Emojis.get('_staff_emoji')} **Atendente:** ${assumidoText}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_notificar')
                .setLabel('Notificar Usuário')
                .setEmoji({ id: '1501804036540862464' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('ticket_finalizar')
                .setLabel('Finalizar Ticket')
                .setEmoji({ id: '1501804123924729946' })
                .setStyle(ButtonStyle.Success)
        )
    );

    return container;
}

module.exports = {
    findTicketByThreadId,
    isStaff,
    buildTicketContainer,
    buildFinalizacaoContainer,
    buildStaffPanelContainer
};
