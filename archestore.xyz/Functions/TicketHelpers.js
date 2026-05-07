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
const { configuracao, tickets } = require("../DataBaseJson");
const emojis = require("../DataBaseJson/Emojis.json");
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
    const staffRoles = tickets.get('tickets.staffRoles') || [];
    const cargoadm = configuracao.get('ConfigRoles.cargoadm');
    const cargosup = configuracao.get('ConfigRoles.cargosup');

    if (cargoadm && member.roles.cache.has(cargoadm)) return true;
    if (cargosup && member.roles.cache.has(cargosup)) return true;
    for (const roleId of staffRoles) {
        if (member.roles.cache.has(roleId)) return true;
    }
    return false;
}

function buildTicketContainer(ticketData, aparencia, botoesAdicionais) {
    const container = new ContainerBuilder();

    if (aparencia.msgCor) {
        try {
            container.setAccentColor(parseInt(aparencia.msgCor.replace('#', ''), 16));
        } catch (e) {
            container.setAccentColor(0x5865F2);
        }
    } else {
        container.setAccentColor(0x5865F2);
    }

    const emoji = aparencia.msgEmoji ? `${aparencia.msgEmoji} ` : `${Emojis.get('_ticket_emoji')} `;
    const titulo = (aparencia.msgTitulo || 'Ticket #{numero}').replace('{numero}', ticketData.numero);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${emoji}${titulo}`)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const assumidoPorText = ticketData.assumidoPor
        ? `<@${ticketData.staffMemberId}>`
        : 'Aguardando atendimento';

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `${Emojis.get('_ticket_emoji')} **Opção Selecionada:** ${ticketData.funcao}\n` +
            `${Emojis.get('_silueta_emoji')} **Assumido por:** ${assumidoPorText}\n` +
            `${Emojis.get('information_emoji')} **Nº do Ticket:** #${ticketData.numero}\n` +
            `${Emojis.get('_silueta_emoji')} **Aberto por:** ${ticketData.username || 'Desconhecido'}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    if (aparencia.msgDescricao) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(aparencia.msgDescricao)
        );
        container.addSeparatorComponents(new SeparatorBuilder());
    }

    if (aparencia.msgBanner) {
        try {
            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems({ media: { url: aparencia.msgBanner } })
            );
        } catch (e) {}
    }

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

    if (config && config.cor) {
        try {
            container.setAccentColor(parseInt(config.cor.replace('#', ''), 16));
        } catch (e) {
            container.setAccentColor(0x57F287);
        }
    } else {
        container.setAccentColor(0x57F287);
    }

    const emoji = (config && config.emoji) || Emojis.get('_confirm_emoji');
    const titulo = (config && config.titulo) || 'Ticket Marcado como Concluído';

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${emoji} ${titulo}`)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const descricao = (config && config.descricao) ||
        '> Se o seu problema foi **totalmente resolvido**, clique em **Resolvido** abaixo.\n' +
        '> Se você **ainda precisa de ajuda**, clique em **Precisa de Mais Ajuda** e reabriremos seu ticket.\n\n' +
        `-# ${Emojis.get('clock_emoji')} Você tem 12 horas para responder antes do ticket ser fechado automaticamente.`;

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
                .setLabel('Precisa de Mais Ajuda')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(ButtonStyle.Danger)
        )
    );

    return container;
}

function buildStaffPanelContainer(ticketData) {
    const container = new ContainerBuilder();
    container.setAccentColor(0x5865F2);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${Emojis.get('_tool_emoji')} Painel Staff`)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const assumidoPorText = ticketData.assumidoPor
        ? `<@${ticketData.staffMemberId}>`
        : 'Aguardando atendimento';

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `${Emojis.get('_ticket_emoji')} **Ticket:** #${ticketData.numero}\n` +
            `${Emojis.get('_messages_emoji')} **Opção:** ${ticketData.funcao}\n` +
            `${Emojis.get('_silueta_emoji')} **Aberto por:** <@${ticketData.userId}>\n` +
            `${Emojis.get('_people_emoji')} **Assumido por:** ${assumidoPorText}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('**Ações disponíveis:**')
    );

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
