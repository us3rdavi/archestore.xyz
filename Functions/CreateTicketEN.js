const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    StringSelectMenuBuilder,
    ChannelType,
    MessageFlags
} = require("discord.js");
const { tickets, estatisticas } = require("../Database");
const emojis = require("../Database/emojis.json");
const { buildTicketContainerEN } = require("./TicketHelpersEN");
const moment = require('moment-timezone');

const Emojis = { get: (name) => emojis[name] || "" };

async function CreateTicketEN(interaction, valor) {
    const isSelectMenu = interaction.isStringSelectMenu();

    const replyEphemeral = async (opts) => {
        if (isSelectMenu) {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferUpdate().catch(() => {});
            }
            return interaction.followUp({ ...opts, ephemeral: true });
        }
        return interaction.reply({ ...opts, ephemeral: true });
    };

    const statusHorario    = tickets.get("en_statushorario");
    const horarioAbertura  = tickets.get("en_horarioAbertura") || `Not configured`;
    const horarioFechamento = tickets.get("en_horarioFechamento") || `Contact the owner to configure`;
    const tempoatual       = moment().tz("America/Sao_Paulo").format("HH:mm");

    if (statusHorario && (tempoatual < horarioAbertura || tempoatual > horarioFechamento)) {
        return replyEphemeral({
            content: `${Emojis.get('negative_emoji')} Tickets can only be opened between \`${horarioAbertura}\` and \`${horarioFechamento}\` (Brasília time).`
        });
    }

    const ticketFunction = tickets.get(`en.funcoes.${valor}`);
    if (!ticketFunction || Object.keys(ticketFunction).length === 0) {
        return replyEphemeral({ content: `${Emojis.get('negative_emoji')} This category does not exist!` });
    }

    const ticketsAbertos = tickets.get('en.abertos') || {};
    if (ticketsAbertos[interaction.user.id]) {
        const existingThreadId = ticketsAbertos[interaction.user.id].threadId;
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${existingThreadId}`)
                .setLabel('Go to Ticket')
                .setStyle(ButtonStyle.Link)
        );
        return replyEphemeral({
            content: `${Emojis.get('negative_emoji')} You already have an open ticket.`,
            components: [row]
        });
    }

    const nomeSelecionado = ticketFunction.nome || valor;
    if (isSelectMenu) {
        await interaction.deferUpdate().catch(() => {});
        await interaction.followUp({
            content: `${Emojis.get('loading_emoji')} You selected **${nomeSelecionado}** — please wait, we're creating your ticket!`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: `${Emojis.get('loading_emoji')} Please wait, we're creating your ticket!`,
            ephemeral: true
        });
    }

    const canalTicketsId = tickets.get('en.canalTickets');
    let ticketChannel = canalTicketsId ? interaction.guild.channels.cache.get(canalTicketsId) : null;

    if (!ticketChannel) {
        ticketChannel = interaction.channel;
    }

    const contador = (tickets.get('en.contador') || 0) + 1;
    tickets.set('en.contador', contador);

    const username   = (interaction.user.globalName || interaction.user.username).slice(0, 30);
    const threadName = `${valor} #${contador} • ${username}`.slice(0, 100);

    const editLoading = async (opts) => {
        try {
            if (isSelectMenu) {
                await interaction.editReply({ content: opts.content, components: opts.components || [], ephemeral: true }).catch(() => {});
            } else {
                await interaction.editReply(opts);
            }
        } catch (e) {}
    };

    try {
        const thread = await ticketChannel.threads.create({
            name: threadName,
            type: ChannelType.PrivateThread,
            invitable: false,
            reason: `Ticket #${contador} opened by ${interaction.user.tag}`
        });

        await thread.members.add(interaction.user.id).catch(() => {});

        const allStaffRoleIds = tickets.get('en.staffRoles') || [];

        try {
            await interaction.guild.members.fetch();
            for (const roleId of allStaffRoleIds) {
                const role = interaction.guild.roles.cache.get(roleId);
                if (role) {
                    for (const [memberId] of role.members) {
                        await thread.members.add(memberId).catch(() => {});
                    }
                }
            }
        } catch (e) {}

        const ticketData = {
            threadId: thread.id,
            numero: contador,
            funcao: valor,
            assumidoPor: null,
            staffMemberId: null,
            abertoPor: interaction.user.id,
            username: interaction.user.globalName || interaction.user.username,
            guildId: interaction.guild.id,
            messageId: null,
            isEN: true
        };
        tickets.set(`en.abertos.${interaction.user.id}`, ticketData);
        tickets.set(`en.threads.${thread.id}`, interaction.user.id);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${thread.id}`)
                .setLabel('Go to Ticket')
                .setStyle(ButtonStyle.Link)
        );

        await editLoading({
            content: `${Emojis.get('confirmed_emoji')} Ticket created successfully! Category: **${nomeSelecionado}**`,
            components: [row]
        });

        const staffRoles   = tickets.get('en.staffRoles') || [];
        const roleMentions = staffRoles.map(id => `<@&${id}>`).join(' ');
        const pingContent  = `${interaction.user}${roleMentions ? ` ${roleMentions}` : ''}`.trim();

        await thread.send({
            content: pingContent,
            allowedMentions: {
                users: [interaction.user.id],
                roles: staffRoles
            }
        });

        const aparencia        = tickets.get('en.mensagemInicial') || {};
        const botoesAdicionais = tickets.get('en.botoesAdicionais') || [];

        const container = buildTicketContainerEN(
            { ...ticketData, userId: interaction.user.id },
            aparencia,
            botoesAdicionais
        );

        const ticketMsg = await thread.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

        tickets.set(`en.abertos.${interaction.user.id}.messageId`, ticketMsg.id);

        try {
            const statsData      = Object.fromEntries(estatisticas.all().map(e => [e.id, e.value]));
            const userPurchases  = Object.values(statsData).filter(p => p.userid === interaction.user.id);

            if (userPurchases.length > 0) {
                const groupedPurchases = userPurchases.reduce((acc, purchase) => {
                    if (purchase.campo && purchase.id) {
                        if (!acc[purchase.campo]) {
                            acc[purchase.campo] = { quantity: 0, lastPurchaseDate: new Date(0) };
                        }
                        acc[purchase.campo].quantity += purchase.quantidade;
                        const pd = new Date(purchase.data);
                        if (pd > acc[purchase.campo].lastPurchaseDate) {
                            acc[purchase.campo].lastPurchaseDate = pd;
                        }
                    }
                    return acc;
                }, {});

                const options = Object.keys(groupedPurchases).map(product => {
                    const { quantity, lastPurchaseDate } = groupedPurchases[product];
                    const fd = `${lastPurchaseDate.getDate()}/${lastPurchaseDate.getMonth() + 1}/${lastPurchaseDate.getFullYear()}`;
                    return {
                        label: `${quantity}x ${product}`.slice(0, 100),
                        value: product,
                        description: `${Emojis.get('date_emoji')} Last purchase: ${fd}`.slice(0, 100),
                        emoji: { id: '1501804055826141246' }
                    };
                });

                if (options.length > 0) {
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('produto_select')
                        .setPlaceholder('Select a purchase here')
                        .addOptions(options.slice(0, 25));

                    const selectEmbed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setDescription(
                            `## Purchases Found ${Emojis.get('lupa')}\n` +
                            `- If this ticket is about a product you purchased, select it below.\n` +
                            `- If the ticket is not related to a product, you can ignore this menu.`
                        );

                    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
                    const buttonRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('ignorar_select')
                            .setLabel('Ignore')
                            .setStyle(ButtonStyle.Secondary)
                    );

                    const selectMessage = await thread.send({
                        embeds: [selectEmbed],
                        components: [selectRow, buttonRow]
                    });

                    const filter = (i) => (i.customId === 'produto_select' || i.customId === 'ignorar_select') && i.user.id === interaction.user.id;
                    const collector = thread.createMessageComponentCollector({ filter, time: 600000 });

                    collector.on('collect', async (collected) => {
                        if (collected.customId === 'produto_select') {
                            const selectedOption = collected.values[0];
                            const newName = `${selectedOption} #${contador} • ${username}`.slice(0, 100);
                            await thread.setName(newName).catch(() => {});
                            await collected.reply({
                                content: `${Emojis.get('confirmed_emoji')} Ticket subject updated! Our team will assist you shortly.`,
                                ephemeral: false
                            });
                            await selectMessage.delete().catch(() => {});
                            collector.stop();
                        } else if (collected.customId === 'ignorar_select') {
                            await collected.deferUpdate();
                            await selectMessage.delete().catch(() => {});
                            collector.stop();
                        }
                    });

                    collector.on('end', async (collected, reason) => {
                        if (reason === 'time') {
                            await selectMessage.delete().catch(() => {});
                        }
                    });
                }
            }
        } catch (e) {}

    } catch (error) {
        console.error('[TicketEN] Error creating ticket:', error);
        tickets.set('en.contador', contador - 1);
        await editLoading({
            content: `${Emojis.get('negative_emoji')} An error occurred while creating the ticket. Please check that the ticket channel is configured correctly.`
        });
    }
}

module.exports = { CreateTicketEN };
