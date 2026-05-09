const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require("discord.js");
const { configuracao, tickets } = require("../../Database");
const emojis = require("../../Database/emojis.json");
const {
    findTicketByThreadId,
    isStaff,
    buildTicketContainer,
    buildFinalizacaoContainer,
    buildStaffPanelContainer
} = require("../../Functions/TicketHelpers");

const Emojis = { get: (name) => emojis[name] || "" };

const TICKET_BUTTON_IDS = [
    'ticket_assumir',
    'ticket_staffpanel',
    'ticket_finalizar',
    'ticket_resolvido',
    'ticket_reabrir',
    'ticket_notificar'
];

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        if (!interaction.isButton()) return;
        if (!TICKET_BUTTON_IDS.includes(interaction.customId)) return;

        const ticketData = findTicketByThreadId(interaction.channel.id);

        if (interaction.customId === 'ticket_assumir') {
            if (!ticketData) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Este canal não é um ticket válido.`,
                    ephemeral: true
                });
            }

            if (!isStaff(interaction.member)) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Você não tem permissão para assumir tickets.`,
                    ephemeral: true
                });
            }

            if (ticketData.assumidoPor && ticketData.staffMemberId === interaction.user.id) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Você já assumiu este ticket.`,
                    ephemeral: true
                });
            }

            await interaction.deferUpdate();

            tickets.set(`tickets.abertos.${ticketData.userId}.assumidoPor`, interaction.user.tag);
            tickets.set(`tickets.abertos.${ticketData.userId}.staffMemberId`, interaction.user.id);

            const updatedTicketData = tickets.get(`tickets.abertos.${ticketData.userId}`);
            const aparencia = tickets.get('tickets.mensagemInicial') || {};
            const botoesAdicionais = tickets.get('tickets.botoesAdicionais') || [];

            const newContainer = buildTicketContainer(
                { ...updatedTicketData, userId: ticketData.userId },
                aparencia,
                botoesAdicionais
            );

            try {
                await interaction.message.edit({
                    components: [newContainer],
                    flags: MessageFlags.IsComponentsV2
                });
            } catch (e) {
                console.error('[Ticket] Erro ao editar mensagem após assumir:', e.message);
            }

            await interaction.channel.send({
                content: `${Emojis.get('confirmed_emoji')} **${interaction.member.displayName}** assumiu o ticket!`
            });
        }

        if (interaction.customId === 'ticket_staffpanel') {
            if (!isStaff(interaction.member)) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Você não tem permissão para acessar o painel staff.`,
                    ephemeral: true
                });
            }

            if (!ticketData) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Este canal não é um ticket válido.`,
                    ephemeral: true
                });
            }

            const staffContainer = buildStaffPanelContainer({ ...ticketData, userId: ticketData.userId });

            await interaction.reply({
                components: [staffContainer],
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
            });
        }

        if (interaction.customId === 'ticket_finalizar') {
            if (!isStaff(interaction.member)) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Apenas membros da equipe podem finalizar tickets.`,
                    ephemeral: true
                });
            }

            if (!ticketData) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Este canal não é um ticket válido.`,
                    ephemeral: true
                });
            }

            const configFinal = tickets.get('tickets.mensagemFinalizacao') || {};
            const finalizacaoContainer = buildFinalizacaoContainer(configFinal);

            await interaction.reply({
                components: [finalizacaoContainer],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (interaction.customId === 'ticket_resolvido') {
            if (!ticketData) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Ticket inválido.`,
                    ephemeral: true
                });
            }

            await interaction.deferUpdate();

            const confirmContainer = new ContainerBuilder();
            confirmContainer;
            confirmContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${Emojis.get('confirmed_emoji')} Ticket Encerrado\nEste ticket foi marcado como **resolvido**. Obrigado pelo contato!`)
            );

            try {
                await interaction.message.edit({
                    components: [confirmContainer],
                    flags: MessageFlags.IsComponentsV2
                });
            } catch (e) {}

            await interaction.channel.send({
                content: `${Emojis.get('confirmed_emoji')} Ticket encerrado com sucesso! Obrigado, <@${ticketData.userId}>.`
            });

            const canalLogsId = tickets.get('tickets.canalLogs') || configuracao.get('ConfigChannels.systemlogs');
            let logChannel = null;
            if (canalLogsId) {
                logChannel = interaction.guild.channels.cache.get(canalLogsId);
            }

            if (logChannel) {
                const closedTs = Math.floor(Date.now() / 1000);
                const logEmbed = new EmbedBuilder()
                    .setTitle(`Transcript — Ticket #${ticketData.numero}`)
                    .setColor('#57F287')
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                    .addFields(
                        { name: 'Aberto por', value: `<@${ticketData.userId}>\n\`${ticketData.username || 'Desconhecido'}\``, inline: true },
                        { name: 'Assumido por', value: ticketData.staffMemberId ? `<@${ticketData.staffMemberId}>` : '`Ninguém`', inline: true },
                        { name: 'Categoria', value: `\`${ticketData.funcao || 'Desconhecida'}\``, inline: true },
                        { name: 'Nº do Ticket', value: `\`#${ticketData.numero}\``, inline: true },
                        { name: 'Encerrado por', value: `${interaction.user}\n\`Resolvido\``, inline: true },
                        { name: 'Encerrado em', value: `<t:${closedTs}:F>`, inline: true }
                    )
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setTimestamp();

                try {
                    const transcriptModule = require('discord-html-transcripts');
                    const attachment = await transcriptModule.createTranscript(interaction.channel, {
                        limit: -1,
                        returnType: 'attachment',
                        filename: `transcript-ticket-${ticketData.numero}.html`,
                        poweredBy: false,
                        saveImages: false,
                    });
                    await logChannel.send({ embeds: [logEmbed], files: [attachment] });
                } catch (err) {
                    console.error('[Ticket] Erro ao gerar transcript:', err.message);
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }

            tickets.delete(`tickets.abertos.${ticketData.userId}`);
            tickets.delete(`tickets.threads.${interaction.channel.id}`);

            await new Promise(resolve => setTimeout(resolve, 4000));

            try {
                await interaction.channel.delete(`Ticket #${ticketData.numero} fechado como resolvido por ${interaction.user.tag}`);
            } catch (e) {
                console.error('[Ticket] Erro ao deletar thread:', e.message);
            }
        }

        if (interaction.customId === 'ticket_reabrir') {
            if (!ticketData) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Ticket inválido.`,
                    ephemeral: true
                });
            }

            await interaction.deferUpdate();

            const reabertoContainer = new ContainerBuilder();
            reabertoContainer;
            reabertoContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${Emojis.get('warn_emoji')} Ticket Reaberto\nO usuário ainda precisa de ajuda. Um membro da equipe entrará em contato em breve.`)
            );

            try {
                await interaction.message.edit({
                    components: [reabertoContainer],
                    flags: MessageFlags.IsComponentsV2
                });
            } catch (e) {}

            const staffRoles = tickets.get('tickets.staffRoles') || [];
            const roleMentions = staffRoles.map(id => `<@&${id}>`).join(' ');

            await interaction.channel.send({
                content: `${Emojis.get('warn_emoji')} <@${ticketData.userId}> ainda precisa de ajuda!${roleMentions ? ` ${roleMentions}` : ''}`.trim(),
                allowedMentions: { users: [ticketData.userId], roles: staffRoles }
            });
        }

        if (interaction.customId === 'ticket_notificar') {
            if (!isStaff(interaction.member)) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Você não tem permissão para notificar usuários.`,
                    ephemeral: true
                });
            }

            if (!ticketData) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Ticket inválido.`,
                    ephemeral: true
                });
            }

            try {
                const usuario = await client.users.fetch(ticketData.userId);
                await usuario.send({
                    content: `${Emojis.get('_notify_emoji')} Olá, **${ticketData.username}**! Um membro da nossa equipe notificou você sobre o seu ticket **#${ticketData.numero}** no servidor **${interaction.guild.name}**. Por favor, acesse o ticket para continuar.`
                });
                await interaction.reply({
                    content: `${Emojis.get('confirmed_emoji')} Usuário <@${ticketData.userId}> foi notificado via DM!`,
                    ephemeral: true
                });
            } catch (e) {
                await interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Não foi possível enviar DM para o usuário (DMs fechadas).`,
                    ephemeral: true
                });
            }
        }
    }
};
