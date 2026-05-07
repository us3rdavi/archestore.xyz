const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    StringSelectMenuBuilder,
    ChannelType,
    MessageFlags
} = require("discord.js");
const { configuracao, tickets } = require("../DataBaseJson");
const emojis = require("../DataBaseJson/Emojis.json");
const { buildTicketContainer } = require("./TicketHelpers");
const fs = require('fs');
const moment = require('moment-timezone');

const Emojis = { get: (name) => emojis[name] || "" };

async function CreateTicket(interaction, valor) {
    const statusHorario = tickets.get("statushorario");
    const horarioAbertura = tickets.get("horarioAbertura") || `Não configurado`;
    const horarioFechamento = tickets.get("horarioFechamento") || `Contacte o owner para configurar`;
    const tempoatualtimebr24 = moment().tz("America/Sao_Paulo").format("HH:mm");

    if (statusHorario && (tempoatualtimebr24 < horarioAbertura || tempoatualtimebr24 > horarioFechamento)) {
        return interaction.reply({
            content: `${Emojis.get('negative_emoji')} Tickets só podem ser abertos entre \`${horarioAbertura}\` e \`${horarioFechamento}\` (horário de Brasília).`,
            ephemeral: true
        });
    }

    const ticketFunction = tickets.get(`tickets.funcoes.${valor}`);
    if (!ticketFunction || Object.keys(ticketFunction).length === 0) {
        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Essa função não existe!`, ephemeral: true });
    }

    const ticketsAbertos = tickets.get('tickets.abertos') || {};
    if (ticketsAbertos[interaction.user.id]) {
        const existingThreadId = ticketsAbertos[interaction.user.id].threadId;
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${existingThreadId}`)
                .setLabel('Ir para o Ticket')
                .setStyle(ButtonStyle.Link)
        );
        return interaction.reply({
            content: `${Emojis.get('negative_emoji')} Você já possui um ticket aberto.`,
            components: [row],
            ephemeral: true
        });
    }

    await interaction.reply({
        content: `${Emojis.get('loading_emoji')} Aguarde, estamos criando seu ticket!`,
        ephemeral: true
    });

    const canalTicketsId = tickets.get('tickets.canalTickets');
    let ticketChannel = canalTicketsId ? interaction.guild.channels.cache.get(canalTicketsId) : null;

    if (!ticketChannel) {
        ticketChannel = interaction.channel;
    }

    const contador = (tickets.get('tickets.contador') || 0) + 1;
    tickets.set('tickets.contador', contador);

    const username = (interaction.user.globalName || interaction.user.username).slice(0, 30);
    const threadName = `${valor} #${contador} • ${username}`.slice(0, 100);

    try {
        const thread = await ticketChannel.threads.create({
            name: threadName,
            type: ChannelType.PrivateThread,
            invitable: false,
            reason: `Ticket #${contador} aberto por ${interaction.user.tag}`
        });

        // Adicionar o usuário que abriu o ticket ao tópico privado
        await thread.members.add(interaction.user.id).catch(() => {});

        // Adicionar todos os membros com cargos staff ao tópico privado
        const staffRoleIds = tickets.get('tickets.staffRoles') || [];
        const cargoadm = configuracao.get('ConfigRoles.cargoadm');
        const cargosup = configuracao.get('ConfigRoles.cargosup');
        const allStaffRoleIds = [...new Set([...staffRoleIds, cargoadm, cargosup].filter(Boolean))];

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
            messageId: null
        };
        tickets.set(`tickets.abertos.${interaction.user.id}`, ticketData);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${thread.id}`)
                .setLabel('Ir para o Ticket')
                .setStyle(ButtonStyle.Link)
        );
        await interaction.editReply({
            content: `${Emojis.get('confirmed_emoji')} Ticket criado com sucesso!`,
            components: [row]
        });

        const staffRoles = tickets.get('tickets.staffRoles') || [];
        const roleMentions = staffRoles.map(id => `<@&${id}>`).join(' ');
        const cargoadmPing = configuracao.get('ConfigRoles.cargoadm');
        const cargosupPing = configuracao.get('ConfigRoles.cargosup');
        const extraMentions = [
            cargoadmPing && !staffRoles.includes(cargoadmPing) ? `<@&${cargoadmPing}>` : '',
            cargosupPing && !staffRoles.includes(cargosupPing) ? `<@&${cargosupPing}>` : ''
        ].filter(Boolean).join(' ');

        const pingContent = `${interaction.user} ${roleMentions} ${extraMentions}`.trim();
        const pingRoles = [...staffRoles];
        if (cargoadmPing && !pingRoles.includes(cargoadmPing)) pingRoles.push(cargoadmPing);
        if (cargosupPing && !pingRoles.includes(cargosupPing)) pingRoles.push(cargosupPing);

        await thread.send({
            content: pingContent,
            allowedMentions: {
                users: [interaction.user.id],
                roles: pingRoles
            }
        });

        const aparencia = tickets.get('tickets.mensagemInicial') || {};
        const botoesAdicionais = tickets.get('tickets.botoesAdicionais') || [];

        const container = buildTicketContainer(
            { ...ticketData, userId: interaction.user.id },
            aparencia,
            botoesAdicionais
        );

        const ticketMsg = await thread.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

        tickets.set(`tickets.abertos.${interaction.user.id}.messageId`, ticketMsg.id);

        try {
            const statsData = JSON.parse(fs.readFileSync('./DataBaseJson/estatisticas.json', 'utf8'));
            const userPurchases = Object.values(statsData).filter(p => p.userid === interaction.user.id);

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
                        description: `${Emojis.get('date_emoji')} Última compra: ${fd}`.slice(0, 100),
                        emoji: { id: '1501804055826141246' }
                    };
                });

                if (options.length > 0) {
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('produto_select')
                        .setPlaceholder('Escolha alguma Compra Aqui')
                        .addOptions(options.slice(0, 25));

                    const selectEmbed = new EmbedBuilder()
                        .setColor('#2F3136')
                        .setDescription(
                            `## Compras Encontradas ${Emojis.get('lupa')}\n` +
                            `- Caso o assunto for sobre algum produto que você comprou, escolha a opção abaixo.\n` +
                            `- Caso o ticket não esteja relacionado a um produto, pode ignorar esse menu.`
                        );

                    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
                    const buttonRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('ignorar_select')
                            .setLabel('Ignorar')
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
                                content: `${Emojis.get('confirmed_emoji')} Assunto do ticket atualizado! Nossa equipe irá te atender em breve.`,
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
        console.error('[Ticket] Erro ao criar ticket:', error);
        tickets.set('tickets.contador', contador - 1);
        await interaction.editReply({
            content: `${Emojis.get('negative_emoji')} Ocorreu um erro ao criar o ticket. Verifique se o canal de tickets está configurado corretamente.`
        });
    }
}

module.exports = { CreateTicket };
