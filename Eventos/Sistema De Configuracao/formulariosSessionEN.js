const {
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    MessageFlags,
} = require('discord.js');
const { formularios, Emojis, configuracao } = require('../../Database');

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

const activeSessions = new Map();
const startLock      = new Set();

function hasStaffPermission(member, form) {
    if (member.permissions.has('Administrator')) return true;
    if (!form.roles_responsible || form.roles_responsible.length === 0) return true;
    return form.roles_responsible.some(r => member.roles.cache.has(r));
}

function getEnSlots(guildId) {
    return formularios.get('en_' + guildId) || {};
}

async function sendFormLogEN(guild, form, slotId, guildId, user, answers, questions, sectionLabel) {
    const channel = guild.channels.cache.get(form.channel_output);
    if (!channel) return null;

    const qaText    = questions.map((q, i) =>
        `**${i + 1}. ${q.text}**\n> ${answers[i] || '*No answer*'}`
    ).join('\n\n');
    const timestamp = Math.floor(Date.now() / 1000);
    const secLine   = sectionLabel ? `${Emojis.get('_folder_emoji')} **Area:** ${sectionLabel}\n` : '';

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_messages_emoji')} New Application — ${form.name}\n` +
        `${Emojis.get('_silueta_emoji')} **Applicant:** ${user.username} (<@${user.id}>)\n` +
        `${Emojis.get('date_emoji')} **Submitted at:** <t:${timestamp}:F>\n` +
        secLine +
        `-# ID: ${user.id}\n\n` +
        `${Emojis.get('_lapis_emoji')} **Answers:**\n\n${qaText}`
    ));
    c.addSeparatorComponents(new SeparatorBuilder());
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`enfaccept_${guildId}_${slotId}_${user.id}`)
            .setLabel('Accept Application')
            .setEmoji({ id: '1501803932484108359' })
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`enfreject_${guildId}_${slotId}_${user.id}`)
            .setLabel('Reject Application')
            .setEmoji({ id: '1501803935453679616' })
            .setStyle(ButtonStyle.Danger),
    ));

    try {
        const msg = await channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 });
        return msg.id;
    } catch (e) {
        console.error('[FormSessionEN] Error sending log:', e);
        return null;
    }
}

async function runQuestionFlowEN(dmChannel, userId, questions, timeLimit) {
    const answers = [];

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        const qc = new ContainerBuilder();
        qc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `<:custom_question_emoji:1502520447340777482> **Question ${i + 1} of ${questions.length}**\n\n` +
            `${q.text}\n\n` +
            `-# ${Emojis.get('clock_emoji')} You have ${Math.round(timeLimit / 60)} minute(s) to answer.`
        ));
        await dmChannel.send({ components: [qc], flags: MessageFlags.IsComponentsV2 });

        try {
            const answer = await new Promise((resolve, reject) => {
                const collector = dmChannel.createMessageCollector({
                    filter: m => m.author.id === userId && !m.author.bot,
                    max: 1,
                    time: timeLimit * 1000,
                });
                collector.on('collect', m => resolve(m.content));
                collector.on('end', (_, reason) => {
                    if (reason === 'time') reject(new Error('timeout'));
                });
            });
            answers.push(answer);
        } catch (e) {
            throw new Error('timeout');
        }
    }

    return answers;
}

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            // ── Select Menu: start form ───────────────────────────────────
            if (interaction.isStringSelectMenu() && customId.startsWith('enfstart_')) {
                const parts   = customId.split('_');
                const guildId = parts[1];
                const slotId  = parts[2];
                const userId  = interaction.user.id;
                const selectedOptIdx = parseInt(interaction.values[0]) || 0;

                if (interaction.guild?.id !== guildId) return;

                const slots = getEnSlots(guildId);
                const form  = slots[slotId];

                if (!form || !form.active) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} This form is not currently available.`,
                        ephemeral: true,
                    });
                }

                const selectedOpt      = (form.selectOptions || [])[selectedOptIdx];
                const selectedOptLabel = selectedOpt?.label || null;
                const questions        = selectedOpt?.questions
                    || (selectedOptIdx === 0 ? form.questions : null)
                    || [];

                if (questions.length === 0) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} This area has no questions configured yet.`,
                        ephemeral: true,
                    });
                }

                if (startLock.has(userId) || activeSessions.has(userId)) {
                    return interaction.reply({
                        content: `${Emojis.get('warn_emoji')} You already have a form in progress. Check your DM!`,
                        ephemeral: true,
                    });
                }

                if (form.limit_per_user) {
                    const count = formularios.get(`en_sub_${guildId}_${slotId}_${userId}`) || 0;
                    if (count >= form.limit_per_user) {
                        return interaction.reply({
                            content: `${Emojis.get('negative_emoji')} You have reached the limit of ${form.limit_per_user} submission(s) for this form.`,
                            ephemeral: true,
                        });
                    }
                }

                startLock.add(userId);

                let dmChannel;
                try { dmChannel = await interaction.user.createDM(); } catch (e) {
                    startLock.delete(userId);
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} I couldn't open your DM. Please enable direct messages and try again.`,
                        ephemeral: true,
                    });
                }

                try {
                    const wc = new ContainerBuilder();
                    wc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('_messages_emoji')} ${form.name}${selectedOptLabel ? ` — ${selectedOptLabel}` : ''}\n` +
                        `Hello, **${interaction.user.username}**! You have started the application process.\n\n` +
                        `${Emojis.get('information_emoji')} **What to expect:**\n` +
                        `> <:custom_question_emoji:1502520447340777482> **${questions.length} question(s)** will be asked here in DMs\n` +
                        `> ${Emojis.get('clock_emoji')} You have **${Math.round((form.time_limit || 120) / 60)} minute(s)** per question\n` +
                        `> ${Emojis.get('_lapis_emoji')} Answer by typing normally in this conversation\n\n` +
                        `-# The first question will appear in a moment...`
                    ));
                    await dmChannel.send({ components: [wc], flags: MessageFlags.IsComponentsV2 });
                } catch (e) {
                    startLock.delete(userId);
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} I couldn't open your DM. Please enable direct messages and try again.`,
                        ephemeral: true,
                    });
                }

                await interaction.reply({
                    content: `${Emojis.get('confirmed_emoji')} Form started! Check your DM ${Emojis.get('_mail_emoji')}`,
                    ephemeral: true,
                });

                activeSessions.set(userId, { guildId, slotId });
                startLock.delete(userId);

                const timeLimit = form.time_limit || 120;
                let answers     = [];

                try {
                    answers = await runQuestionFlowEN(dmChannel, userId, questions, timeLimit);
                } catch (e) {
                    activeSessions.delete(userId);
                    const tc = new ContainerBuilder();
                    tc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('warn_emoji')} Time's Up\n` +
                        `You took too long to respond and the form was **cancelled**.\n\n` +
                        `-# Please try again by clicking the form button.`
                    ));
                    await dmChannel.send({ components: [tc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
                    return;
                }

                activeSessions.delete(userId);

                if (form.limit_per_user) {
                    const count = formularios.get(`en_sub_${guildId}_${slotId}_${userId}`) || 0;
                    formularios.set(`en_sub_${guildId}_${slotId}_${userId}`, count + 1);
                }

                const qaText = questions.map((q, i) =>
                    `**${i + 1}. ${q.text}**\n> ${answers[i] || '*No answer*'}`
                ).join('\n\n');
                formularios.set(`en_${guildId}.responses.${userId}.${slotId}`, {
                    answers,
                    qaText,
                    username: interaction.user.username,
                    submittedAt: Date.now(),
                });

                const dc = new ContainerBuilder();
                dc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('confirmed_emoji')} Form Completed!\n` +
                    `Your answers have been **successfully submitted**.\n\n` +
                    `You will receive a reply soon informing you whether your application was **accepted** or **rejected**.\n\n` +
                    `-# Thank you for applying!`
                ));
                await dmChannel.send({ components: [dc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

                const guild = client.guilds.cache.get(guildId);
                if (!guild) return;
                const currentForm = getEnSlots(guildId)[slotId];
                if (!currentForm) return;
                await sendFormLogEN(guild, currentForm, slotId, guildId, interaction.user, answers, questions, selectedOptLabel);
                return;
            }

            // ── Button: accept application ────────────────────────────────
            if (interaction.isButton() && customId.startsWith('enfaccept_')) {
                const parts        = customId.split('_');
                const guildId      = parts[1];
                const slotId       = parts[2];
                const targetUserId = parts[3];

                if (interaction.guild?.id !== guildId) return;

                const slots = getEnSlots(guildId);
                const form  = slots[slotId];
                if (!form) return;

                if (!hasStaffPermission(interaction.member, form)) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} You don't have permission to accept applications.`,
                        ephemeral: true,
                    });
                }

                await interaction.deferUpdate();

                if (form.role_approved) {
                    try {
                        const member = interaction.guild.members.cache.get(targetUserId)
                            || await interaction.guild.members.fetch(targetUserId).catch(() => null);
                        if (member) await member.roles.add(form.role_approved).catch(() => {});
                    } catch (e) {}
                }

                try {
                    const targetUser = await client.users.fetch(targetUserId);
                    const ac = new ContainerBuilder();
                    ac.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('confirmed_emoji')} Application Accepted!\n` +
                        `Congratulations, **${targetUser.username}**! Your application for **${form.name}** has been **accepted**.\n\n` +
                        `${Emojis.get('_staff_emoji')} **Reviewed by:** ${interaction.user.username}\n` +
                        `${Emojis.get('date_emoji')} **On:** <t:${Math.floor(Date.now() / 1000)}:F>`
                    ));
                    await targetUser.send({ components: [ac], flags: MessageFlags.IsComponentsV2 });
                } catch (e) {}

                const saved  = formularios.get(`en_${guildId}.responses.${targetUserId}.${slotId}`);
                const qaText = saved?.qaText || '*Answers not available*';

                const lc = new ContainerBuilder();
                lc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('confirmed_emoji')} Application Accepted — ${form.name}\n` +
                    `${Emojis.get('_silueta_emoji')} **Applicant:** ${saved?.username || 'User'} (<@${targetUserId}>)\n` +
                    `${Emojis.get('_staff_emoji')} **Accepted by:** ${interaction.user.username} (<@${interaction.user.id}>)\n` +
                    `${Emojis.get('date_emoji')} **On:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                    `${Emojis.get('_lapis_emoji')} **Answers:**\n\n${qaText}`
                ));
                lc.addSeparatorComponents(new SeparatorBuilder());
                lc.addActionRowComponents(new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('_enform_accepted_done')
                        .setLabel('Application Accepted')
                        .setEmoji({ id: '1501803932484108359' })
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                ));

                await interaction.editReply({ content: '', components: [lc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
                return;
            }

            // ── Button: reject application (opens modal) ──────────────────
            if (interaction.isButton() && customId.startsWith('enfreject_')) {
                const parts        = customId.split('_');
                const guildId      = parts[1];
                const slotId       = parts[2];
                const targetUserId = parts[3];

                if (interaction.guild?.id !== guildId) return;

                const slots = getEnSlots(guildId);
                const form  = slots[slotId];
                if (!form) return;

                if (!hasStaffPermission(interaction.member, form)) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} You don't have permission to reject applications.`,
                        ephemeral: true,
                    });
                }

                const modal = new ModalBuilder()
                    .setCustomId(`enfrejmod_${guildId}_${slotId}_${targetUserId}`)
                    .setTitle('Rejection Reason');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('motivo')
                            .setLabel('What is the reason for rejection?')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                            .setMaxLength(500)
                            .setPlaceholder('Describe the reason why this application is being rejected...')
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            // ── Modal: rejection reason submitted ─────────────────────────
            if (interaction.isModalSubmit() && customId.startsWith('enfrejmod_')) {
                const parts        = customId.split('_');
                const guildId      = parts[1];
                const slotId       = parts[2];
                const targetUserId = parts[3];

                if (interaction.guild?.id !== guildId) return;

                const slots = getEnSlots(guildId);
                const form  = slots[slotId];
                if (!form) return;

                const motivo = interaction.fields.getTextInputValue('motivo');
                await interaction.deferUpdate();

                try {
                    const targetUser = await client.users.fetch(targetUserId);
                    const rc = new ContainerBuilder();
                    rc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('negative_emoji')} Application Rejected\n` +
                        `Unfortunately, **${targetUser.username}**, your application for **${form.name}** has been **rejected**.\n\n` +
                        `${Emojis.get('information_emoji')} **Reason:** ${motivo}\n\n` +
                        `${Emojis.get('_staff_emoji')} **Reviewed by:** ${interaction.user.username}\n` +
                        `${Emojis.get('date_emoji')} **On:** <t:${Math.floor(Date.now() / 1000)}:F>`
                    ));
                    await targetUser.send({ components: [rc], flags: MessageFlags.IsComponentsV2 });
                } catch (e) {}

                const saved  = formularios.get(`en_${guildId}.responses.${targetUserId}.${slotId}`);
                const qaText = saved?.qaText || '*Answers not available*';

                const lc = new ContainerBuilder();
                lc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('negative_emoji')} Application Rejected — ${form.name}\n` +
                    `${Emojis.get('_silueta_emoji')} **Applicant:** ${saved?.username || 'User'} (<@${targetUserId}>)\n` +
                    `${Emojis.get('_staff_emoji')} **Rejected by:** ${interaction.user.username} (<@${interaction.user.id}>)\n` +
                    `${Emojis.get('warn_emoji')} **Reason:** ${motivo}\n` +
                    `${Emojis.get('date_emoji')} **On:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                    `${Emojis.get('_lapis_emoji')} **Answers:**\n\n${qaText}`
                ));
                lc.addSeparatorComponents(new SeparatorBuilder());
                lc.addActionRowComponents(new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('_enform_rejected_done')
                        .setLabel('Application Rejected')
                        .setEmoji({ id: '1501803935453679616' })
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true),
                ));

                await interaction.editReply({ content: '', components: [lc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
                return;
            }

        } catch (err) {
            if (err.code === 10062) return;
            console.error('[FormSessionEN] Error:', err);
            try {
                if (!interaction.replied && !interaction.deferred)
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} An error occurred while processing.`, ephemeral: true });
            } catch (e) {}
        }
    },
};
