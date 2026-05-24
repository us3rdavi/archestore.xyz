const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    UserSelectMenuBuilder,
    ChannelType,
    MessageFlags
} = require("discord.js");
const { configuracao, tickets } = require("../../Database");
const emojis = require("../../Database/emojis.json");
const {
    findTicketByThreadIdEN,
    isStaffEN,
    buildTicketContainerEN,
    buildFinalizacaoContainerEN,
    buildStaffPanelContainerEN
} = require("../../Functions/TicketHelpersEN");

const Emojis = { get: (name) => emojis[name] || "" };

const TICKET_BUTTON_IDS = [
    'en_ticket_assumir',
    'en_ticket_staffpanel',
    'en_ticket_finalizar',
    'en_ticket_resolvido',
    'en_ticket_reabrir',
    'en_ticket_notificar'
];

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        const isBtn     = interaction.isButton();
        const isSelect  = interaction.isStringSelectMenu();
        const isUserSel = interaction.isUserSelectMenu();

        if (!isBtn && !isSelect && !isUserSel) return;

        if (isBtn    && !TICKET_BUTTON_IDS.includes(interaction.customId)) return;
        if (isSelect && interaction.customId !== 'en_ticket_staff_action') return;
        if (isUserSel && !interaction.customId.startsWith('en_ticket_staff_user_')) return;

        // ── UserSelectMenu handlers ──────────────────────────────────────────
        if (isUserSel && interaction.customId.startsWith('en_ticket_staff_user_')) {
            const parts    = interaction.customId.split('_');
            const action   = parts[5];
            const threadId = parts[6];

            const ticketData = findTicketByThreadIdEN(threadId || interaction.channel.id);

            if (action === 'transferir') {
                const novoStaffId = interaction.values[0];
                if (!ticketData) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Invalid ticket.`, ephemeral: true });
                tickets.set(`en.abertos.${ticketData.userId}.staffMemberId`, novoStaffId);
                tickets.set(`en.abertos.${ticketData.userId}.assumidoPor`, `<@${novoStaffId}>`);
                await interaction.reply({ content: `${Emojis.get('confirmed_emoji')} Ticket transferred to <@${novoStaffId}>!`, ephemeral: true });
                const thread = interaction.guild.channels.cache.get(threadId);
                if (thread) await thread.send({ content: `${Emojis.get('_transfer_emoji')} The ticket was transferred to <@${novoStaffId}>.` }).catch(() => {});
                return;
            }

            if (action === 'addmembro') {
                const memberId = interaction.values[0];
                const thread   = interaction.guild.channels.cache.get(threadId);
                if (!thread) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Ticket channel not found.`, ephemeral: true });
                try {
                    await thread.members.add(memberId);
                    await interaction.reply({ content: `${Emojis.get('confirmed_emoji')} <@${memberId}> was added to the ticket!`, ephemeral: true });
                } catch (e) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Could not add the member.`, ephemeral: true });
                }
                return;
            }

            if (action === 'remmembro') {
                const memberId = interaction.values[0];
                const thread   = interaction.guild.channels.cache.get(threadId);
                if (!thread) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Ticket channel not found.`, ephemeral: true });
                try {
                    await thread.members.remove(memberId);
                    await interaction.reply({ content: `${Emojis.get('confirmed_emoji')} <@${memberId}> was removed from the ticket.`, ephemeral: true });
                } catch (e) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Could not remove the member.`, ephemeral: true });
                }
                return;
            }
            return;
        }

        // ── StringSelectMenu: en_ticket_staff_action ─────────────────────────
        if (isSelect && interaction.customId === 'en_ticket_staff_action') {
            if (!isStaffEN(interaction.member)) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} You do not have permission to use the staff panel.`,
                    ephemeral: true
                });
            }

            const ticketData = findTicketByThreadIdEN(interaction.channel.id);
            if (!ticketData) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} This channel is not a valid ticket.`,
                    ephemeral: true
                });
            }

            const action   = interaction.values[0];
            const threadId = interaction.channel.id;

            if (action === 'notificar') {
                try {
                    const usuario = await client.users.fetch(ticketData.userId);
                    await usuario.send({
                        content: `${Emojis.get('_notify_emoji')} Hello, **${ticketData.username}**! A member of our team has notified you about your ticket **#${ticketData.numero}** in **${interaction.guild.name}**. Please access the ticket to continue.`
                    });
                    await interaction.reply({ content: `${Emojis.get('confirmed_emoji')} User <@${ticketData.userId}> was notified via DM!`, ephemeral: true });
                } catch (e) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Could not send a DM to the user (DMs closed).`, ephemeral: true });
                }
                return;
            }

            if (action === 'transferir') {
                const row = new ActionRowBuilder().addComponents(
                    new UserSelectMenuBuilder()
                        .setCustomId(`en_ticket_staff_user_transferir_${threadId}`)
                        .setPlaceholder('Select the team member to transfer to...')
                        .setMinValues(1).setMaxValues(1)
                );
                await interaction.reply({ content: `${Emojis.get('_transfer_emoji')} Select the member to receive the ticket:`, components: [row], ephemeral: true });
                return;
            }

            if (action === 'addmembro') {
                const row = new ActionRowBuilder().addComponents(
                    new UserSelectMenuBuilder()
                        .setCustomId(`en_ticket_staff_user_addmembro_${threadId}`)
                        .setPlaceholder('Select the member to add...')
                        .setMinValues(1).setMaxValues(1)
                );
                await interaction.reply({ content: `${Emojis.get('_add_emoji') || '➕'} Select the member to add to the ticket:`, components: [row], ephemeral: true });
                return;
            }

            if (action === 'remmembro') {
                const row = new ActionRowBuilder().addComponents(
                    new UserSelectMenuBuilder()
                        .setCustomId(`en_ticket_staff_user_remmembro_${threadId}`)
                        .setPlaceholder('Select the member to remove...')
                        .setMinValues(1).setMaxValues(1)
                );
                await interaction.reply({ content: `${Emojis.get('negative_emoji')} Select the member to remove from the ticket:`, components: [row], ephemeral: true });
                return;
            }

            if (action === 'criarcall') {
                try {
                    const category = interaction.channel.parent?.parentId
                        ? interaction.guild.channels.cache.get(interaction.channel.parent.parentId)
                        : interaction.channel.parent || null;

                    const voiceChannel = await interaction.guild.channels.create({
                        name: `ticket-${ticketData.numero}`,
                        type: ChannelType.GuildVoice,
                        parent: category?.id || null,
                        reason: `Voice call for Ticket #${ticketData.numero}`,
                    });

                    await interaction.reply({
                        content: `${Emojis.get('confirmed_emoji')} Voice call created: ${voiceChannel}`,
                        ephemeral: true
                    });
                    await interaction.channel.send({
                        content: `${Emojis.get('information_emoji')} A voice call was created for this ticket: ${voiceChannel}`
                    });
                } catch (e) {
                    console.error('[TicketEN] Error creating voice call:', e.message);
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Could not create the voice channel.`, ephemeral: true });
                }
                return;
            }
            return;
        }

        // ── Button handlers ──────────────────────────────────────────────────
        const ticketData = findTicketByThreadIdEN(interaction.channel.id);

        if (interaction.customId === 'en_ticket_assumir') {
            if (!ticketData) {
                return interaction.reply({ content: `${Emojis.get('negative_emoji')} This channel is not a valid ticket.`, ephemeral: true });
            }
            if (!isStaffEN(interaction.member)) {
                return interaction.reply({ content: `${Emojis.get('negative_emoji')} You do not have permission to claim tickets.`, ephemeral: true });
            }
            if (ticketData.assumidoPor && ticketData.staffMemberId === interaction.user.id) {
                return interaction.reply({ content: `${Emojis.get('negative_emoji')} You have already claimed this ticket.`, ephemeral: true });
            }

            await interaction.deferUpdate();

            tickets.set(`en.abertos.${ticketData.userId}.assumidoPor`, interaction.user.tag);
            tickets.set(`en.abertos.${ticketData.userId}.staffMemberId`, interaction.user.id);

            const updatedTicketData    = tickets.get(`en.abertos.${ticketData.userId}`);
            const aparencia            = tickets.get('en.mensagemInicial') || {};
            const botoesAdicionais     = tickets.get('en.botoesAdicionais') || [];

            const newContainer = buildTicketContainerEN(
                { ...updatedTicketData, userId: ticketData.userId },
                aparencia,
                botoesAdicionais
            );

            try {
                await interaction.message.edit({ components: [newContainer], flags: MessageFlags.IsComponentsV2 });
            } catch (e) {
                console.error('[TicketEN] Error editing message after claim:', e.message);
            }

            await interaction.channel.send({
                content: `${Emojis.get('confirmed_emoji')} **${interaction.member.displayName}** claimed the ticket!`
            });
        }

        if (interaction.customId === 'en_ticket_staffpanel') {
            if (!isStaffEN(interaction.member)) {
                return interaction.reply({ content: `${Emojis.get('negative_emoji')} You do not have permission to access the staff panel.`, ephemeral: true });
            }
            if (!ticketData) {
                return interaction.reply({ content: `${Emojis.get('negative_emoji')} This channel is not a valid ticket.`, ephemeral: true });
            }

            const staffContainer = buildStaffPanelContainerEN({ ...ticketData, userId: ticketData.userId });
            await interaction.reply({
                components: [staffContainer],
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
            });
        }

        if (interaction.customId === 'en_ticket_finalizar') {
            if (!isStaffEN(interaction.member)) {
                return interaction.reply({ content: `${Emojis.get('negative_emoji')} Only team members can close tickets.`, ephemeral: true });
            }
            if (!ticketData) {
                return interaction.reply({ content: `${Emojis.get('negative_emoji')} This channel is not a valid ticket.`, ephemeral: true });
            }

            const configFinal        = tickets.get('en.mensagemFinalizacao') || {};
            const finalizacaoContainer = buildFinalizacaoContainerEN(configFinal);

            await interaction.reply({ components: [finalizacaoContainer], flags: MessageFlags.IsComponentsV2 });
        }

        if (interaction.customId === 'en_ticket_resolvido') {
            if (!ticketData) {
                return interaction.reply({ content: `${Emojis.get('negative_emoji')} Invalid ticket.`, ephemeral: true });
            }

            await interaction.deferUpdate();

            const confirmContainer = new ContainerBuilder();
            confirmContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${Emojis.get('confirmed_emoji')} Ticket Closed\nThis ticket was marked as **resolved**. Thank you for reaching out!`)
            );

            try {
                await interaction.message.edit({ components: [confirmContainer], flags: MessageFlags.IsComponentsV2 });
            } catch (e) {}

            await interaction.channel.send({
                content: `${Emojis.get('confirmed_emoji')} Ticket closed successfully! Thank you, <@${ticketData.userId}>.`
            });

            const canalLogsId = tickets.get('en.canalLogs') || configuracao.get('ConfigChannels.systemlogs');
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
                        { name: 'Opened by',    value: `<@${ticketData.userId}>\n\`${ticketData.username || 'Unknown'}\``, inline: true },
                        { name: 'Claimed by',   value: ticketData.staffMemberId ? `<@${ticketData.staffMemberId}>` : '`Nobody`', inline: true },
                        { name: 'Category',     value: `\`${ticketData.funcao || 'Unknown'}\``, inline: true },
                        { name: 'Ticket #',     value: `\`#${ticketData.numero}\``, inline: true },
                        { name: 'Closed by',    value: `${interaction.user}\n\`Resolved\``, inline: true },
                        { name: 'Closed at',    value: `<t:${closedTs}:F>`, inline: true }
                    )
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setTimestamp();

                try {
                    const { generateTranscript } = require('../../Functions/TranscriptHTML');
                    const { AttachmentBuilder }  = require('discord.js');
                    const htmlContent = await generateTranscript(interaction.channel, {
                        ...ticketData, userId: ticketData.userId
                    });
                    const buffer     = Buffer.from(htmlContent, 'utf-8');
                    const attachment = new AttachmentBuilder(buffer, {
                        name: `transcript-ticket-${ticketData.numero}.html`,
                        description: `Transcript for Ticket #${ticketData.numero}`
                    });
                    await logChannel.send({ embeds: [logEmbed], files: [attachment] });
                } catch (err) {
                    console.error('[TicketEN] Error generating transcript:', err.message);
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }

            tickets.delete(`en.abertos.${ticketData.userId}`);
            tickets.delete(`en.threads.${interaction.channel.id}`);

            await new Promise(resolve => setTimeout(resolve, 4000));

            try {
                await interaction.channel.delete(`Ticket #${ticketData.numero} closed as resolved by ${interaction.user.tag}`);
            } catch (e) {
                console.error('[TicketEN] Error deleting thread:', e.message);
            }
        }

        if (interaction.customId === 'en_ticket_reabrir') {
            if (!ticketData) {
                return interaction.reply({ content: `${Emojis.get('negative_emoji')} Invalid ticket.`, ephemeral: true });
            }

            await interaction.deferUpdate();

            const reabertoContainer = new ContainerBuilder();
            reabertoContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${Emojis.get('warn_emoji')} Ticket Reopened\nThe user still needs help. A team member will get back to you shortly.`)
            );

            try {
                await interaction.message.edit({ components: [reabertoContainer], flags: MessageFlags.IsComponentsV2 });
            } catch (e) {}

            const staffRoles   = tickets.get('en.staffRoles') || [];
            const roleMentions = staffRoles.map(id => `<@&${id}>`).join(' ');

            await interaction.channel.send({
                content: `${Emojis.get('warn_emoji')} <@${ticketData.userId}> still needs help!${roleMentions ? ` ${roleMentions}` : ''}`.trim(),
                allowedMentions: { users: [ticketData.userId], roles: staffRoles }
            });
        }

        if (interaction.customId === 'en_ticket_notificar') {
            if (!isStaffEN(interaction.member)) {
                return interaction.reply({ content: `${Emojis.get('negative_emoji')} You do not have permission to notify users.`, ephemeral: true });
            }
            if (!ticketData) {
                return interaction.reply({ content: `${Emojis.get('negative_emoji')} Invalid ticket.`, ephemeral: true });
            }

            try {
                const usuario = await client.users.fetch(ticketData.userId);
                await usuario.send({
                    content: `${Emojis.get('_notify_emoji')} Hello, **${ticketData.username}**! A member of our team has notified you about your ticket **#${ticketData.numero}** in **${interaction.guild.name}**. Please access the ticket to continue.`
                });
                await interaction.reply({ content: `${Emojis.get('confirmed_emoji')} User <@${ticketData.userId}> was notified via DM!`, ephemeral: true });
            } catch (e) {
                await interaction.reply({ content: `${Emojis.get('negative_emoji')} Could not send a DM to the user (DMs closed).`, ephemeral: true });
            }
        }
    }
};
