const {
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    MessageFlags,
} = require('discord.js');
const { formularios, Emojis } = require('../../DataBaseJson');

// Sessões ativas em memória
const activeSessions = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// Verifica permissão de staff
// ─────────────────────────────────────────────────────────────────────────────
function hasStaffPermission(member, form) {
    if (member.permissions.has('Administrator')) return true;
    if (!form.roles_responsible || form.roles_responsible.length === 0) return true;
    return form.roles_responsible.some(r => member.roles.cache.has(r));
}

// ─────────────────────────────────────────────────────────────────────────────
// Envia log de respostas no canal configurado
// ─────────────────────────────────────────────────────────────────────────────
async function sendFormLog(guild, form, slotId, guildId, user, answers) {
    const channel = guild.channels.cache.get(form.channel_output);
    if (!channel) return null;

    const questions  = form.questions || [];
    const qaText     = questions.map((q, i) =>
        `**${i + 1}. ${q.text}**\n> ${answers[i] || '*Sem resposta*'}`
    ).join('\n\n');
    const timestamp  = Math.floor(Date.now() / 1000);

    const c = new ContainerBuilder().setAccentColor(0x5865F2);
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_messages_emoji')} Nova Aplicação — ${form.name}\n` +
        `${Emojis.get('_silueta_emoji')} **Candidato:** ${user.username} (<@${user.id}>)\n` +
        `${Emojis.get('date_emoji')} **Enviado em:** <t:${timestamp}:F>\n` +
        `-# ID: ${user.id}\n\n` +
        `${Emojis.get('_lapis_emoji')} **Respostas:**\n\n${qaText}`
    ));
    c.addSeparatorComponents(new SeparatorBuilder());
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`faccept_${guildId}_${slotId}_${user.id}`)
            .setLabel('Aceitar Aplicação')
            .setEmoji({ id: '1501803932484108359' })
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`freject_${guildId}_${slotId}_${user.id}`)
            .setLabel('Rejeitar Aplicação')
            .setEmoji({ id: '1501803935453679616' })
            .setStyle(ButtonStyle.Danger),
    ));

    try {
        const msg = await channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 });
        return msg.id;
    } catch (e) {
        console.error('[FormSession] Erro ao enviar log:', e);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Faz perguntas na DM sequencialmente com timeout
// ─────────────────────────────────────────────────────────────────────────────
async function runQuestionFlow(dmChannel, userId, questions, timeLimit) {
    const answers = [];

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        const qc = new ContainerBuilder().setAccentColor(0x5865F2);
        qc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${Emojis.get('question_emoji')} **Pergunta ${i + 1} de ${questions.length}**\n\n` +
            `${q.text}\n\n` +
            `-# ${Emojis.get('clock_emoji')} Você tem ${timeLimit} segundos para responder.`
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

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER DE INTERAÇÕES
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            // ── Botão: iniciar formulário ────────────────────────────────
            if (interaction.isButton() && customId.startsWith('fstart_')) {
                const parts   = customId.split('_');
                const guildId = parts[1];
                const slotId  = parts[2];
                const userId  = interaction.user.id;

                if (interaction.guild?.id !== guildId) return;

                const slots = formularios.get(guildId) || {};
                const form  = slots[slotId];

                if (!form || !form.active) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Este formulário não está disponível no momento.`,
                        ephemeral: true,
                    });
                }

                const questions = form.questions || [];
                if (questions.length === 0) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Este formulário não possui perguntas configuradas.`,
                        ephemeral: true,
                    });
                }

                if (activeSessions.has(userId)) {
                    return interaction.reply({
                        content: `${Emojis.get('warn_emoji')} Você já tem um formulário em andamento. Verifique sua DM!`,
                        ephemeral: true,
                    });
                }

                if (form.limit_per_user) {
                    const count = formularios.get(`${guildId}.submissions.${userId}.${slotId}`) || 0;
                    if (count >= form.limit_per_user) {
                        return interaction.reply({
                            content: `${Emojis.get('negative_emoji')} Você já atingiu o limite de ${form.limit_per_user} envio(s) para este formulário.`,
                            ephemeral: true,
                        });
                    }
                }

                // Abrir DM
                let dmChannel;
                try { dmChannel = await interaction.user.createDM(); } catch (e) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Não consegui abrir sua DM. Habilite as mensagens diretas e tente novamente.`,
                        ephemeral: true,
                    });
                }

                // Mensagem de boas-vindas na DM
                try {
                    const wc = new ContainerBuilder().setAccentColor(0x5865F2);
                    wc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('_messages_emoji')} ${form.name}\n` +
                        `Olá, **${interaction.user.username}**! Você iniciou o processo de aplicação.\n\n` +
                        `${Emojis.get('information_emoji')} **O que esperar:**\n` +
                        `> ${Emojis.get('question_emoji')} **${questions.length} pergunta(s)** serão feitas aqui na DM\n` +
                        `> ${Emojis.get('clock_emoji')} Você tem **${form.time_limit || 120} segundos** por pergunta\n` +
                        `> ${Emojis.get('_lapis_emoji')} Responda digitando normalmente nesta conversa\n\n` +
                        `-# A primeira pergunta aparecerá em instantes...`
                    ));
                    await dmChannel.send({ components: [wc], flags: MessageFlags.IsComponentsV2 });
                } catch (e) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Não consegui abrir sua DM. Habilite as mensagens diretas e tente novamente.`,
                        ephemeral: true,
                    });
                }

                await interaction.reply({
                    content: `${Emojis.get('confirmed_emoji')} Formulário iniciado! Verifique sua DM ${Emojis.get('_mail_emoji')}`,
                    ephemeral: true,
                });

                activeSessions.set(userId, { guildId, slotId });

                // ── Fluxo de perguntas ────────────────────────────────────
                const timeLimit = form.time_limit || 120;
                let answers     = [];

                try {
                    answers = await runQuestionFlow(dmChannel, userId, questions, timeLimit);
                } catch (e) {
                    activeSessions.delete(userId);
                    const tc = new ContainerBuilder().setAccentColor(0xFF4444);
                    tc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('warn_emoji')} Tempo Esgotado\n` +
                        `Você demorou para responder e o formulário foi **cancelado**.\n\n` +
                        `-# Tente novamente clicando no botão do formulário.`
                    ));
                    await dmChannel.send({ components: [tc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
                    return;
                }

                activeSessions.delete(userId);

                // Incrementar contagem
                if (form.limit_per_user) {
                    const count = formularios.get(`${guildId}.submissions.${userId}.${slotId}`) || 0;
                    formularios.set(`${guildId}.submissions.${userId}.${slotId}`, count + 1);
                }

                // Salvar respostas para uso no accept/reject
                const qaText = questions.map((q, i) =>
                    `**${i + 1}. ${q.text}**\n> ${answers[i] || '*Sem resposta*'}`
                ).join('\n\n');
                formularios.set(`${guildId}.responses.${userId}.${slotId}`, {
                    answers,
                    qaText,
                    username: interaction.user.username,
                    submittedAt: Date.now(),
                });

                // Mensagem de conclusão na DM
                const dc = new ContainerBuilder().setAccentColor(0x00C06B);
                dc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('confirmed_emoji')} Formulário Finalizado!\n` +
                    `Suas respostas foram **registradas** com sucesso.\n\n` +
                    `Em breve você receberá uma resposta informando se sua aplicação foi **aceita** ou **recusada**.\n\n` +
                    `-# Obrigado por participar!`
                ));
                await dmChannel.send({ components: [dc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

                // Enviar log ao canal de resultados
                const guild = client.guilds.cache.get(guildId);
                if (!guild) return;
                const currentForm = (formularios.get(guildId) || {})[slotId];
                if (!currentForm) return;
                await sendFormLog(guild, currentForm, slotId, guildId, interaction.user, answers);
                return;
            }

            // ── Botão: aceitar aplicação ─────────────────────────────────
            if (interaction.isButton() && customId.startsWith('faccept_')) {
                const parts        = customId.split('_');
                const guildId      = parts[1];
                const slotId       = parts[2];
                const targetUserId = parts[3];

                if (interaction.guild?.id !== guildId) return;

                const slots = formularios.get(guildId) || {};
                const form  = slots[slotId];
                if (!form) return;

                if (!hasStaffPermission(interaction.member, form)) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Você não tem permissão para aceitar aplicações.`,
                        ephemeral: true,
                    });
                }

                await interaction.deferUpdate();

                // Entregar cargo
                if (form.role_approved) {
                    try {
                        const member = interaction.guild.members.cache.get(targetUserId)
                            || await interaction.guild.members.fetch(targetUserId).catch(() => null);
                        if (member) await member.roles.add(form.role_approved).catch(() => {});
                    } catch (e) {}
                }

                // DM ao candidato
                try {
                    const targetUser = await client.users.fetch(targetUserId);
                    const ac = new ContainerBuilder().setAccentColor(0x00C06B);
                    ac.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('confirmed_emoji')} Aplicação Aceita!\n` +
                        `Parabéns, **${targetUser.username}**! Sua aplicação para **${form.name}** foi **aceita**.\n\n` +
                        `${Emojis.get('_staff_emoji')} **Revisado por:** ${interaction.user.username}\n` +
                        `${Emojis.get('date_emoji')} **Em:** <t:${Math.floor(Date.now() / 1000)}:F>`
                    ));
                    await targetUser.send({ components: [ac], flags: MessageFlags.IsComponentsV2 });
                } catch (e) {}

                // Atualizar log
                const saved  = formularios.get(`${guildId}.responses.${targetUserId}.${slotId}`);
                const qaText = saved?.qaText || '*Respostas não disponíveis*';

                const lc = new ContainerBuilder().setAccentColor(0x00C06B);
                lc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('confirmed_emoji')} Aplicação Aceita — ${form.name}\n` +
                    `${Emojis.get('_silueta_emoji')} **Candidato:** ${saved?.username || 'Usuário'} (<@${targetUserId}>)\n` +
                    `${Emojis.get('_staff_emoji')} **Aceito por:** ${interaction.user.username} (<@${interaction.user.id}>)\n` +
                    `${Emojis.get('date_emoji')} **Em:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                    `${Emojis.get('_lapis_emoji')} **Respostas:**\n\n${qaText}`
                ));
                lc.addSeparatorComponents(new SeparatorBuilder());
                lc.addActionRowComponents(new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('_form_accepted_done')
                        .setLabel('Aplicação Aceita')
                        .setEmoji({ id: '1501803932484108359' })
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                ));

                await interaction.editReply({ content: '', components: [lc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
                return;
            }

            // ── Botão: rejeitar aplicação (abre modal) ───────────────────
            if (interaction.isButton() && customId.startsWith('freject_')) {
                const parts        = customId.split('_');
                const guildId      = parts[1];
                const slotId       = parts[2];
                const targetUserId = parts[3];

                if (interaction.guild?.id !== guildId) return;

                const slots = formularios.get(guildId) || {};
                const form  = slots[slotId];
                if (!form) return;

                if (!hasStaffPermission(interaction.member, form)) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Você não tem permissão para rejeitar aplicações.`,
                        ephemeral: true,
                    });
                }

                const modal = new ModalBuilder()
                    .setCustomId(`frejmod_${guildId}_${slotId}_${targetUserId}`)
                    .setTitle('Motivo da Rejeição');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('motivo')
                            .setLabel('Qual o motivo da rejeição?')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                            .setMaxLength(500)
                            .setPlaceholder('Descreva o motivo pelo qual esta aplicação está sendo recusada...')
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            // ── Modal: motivo de rejeição enviado ────────────────────────
            if (interaction.isModalSubmit() && customId.startsWith('frejmod_')) {
                const parts        = customId.split('_');
                const guildId      = parts[1];
                const slotId       = parts[2];
                const targetUserId = parts[3];

                if (interaction.guild?.id !== guildId) return;

                const slots = formularios.get(guildId) || {};
                const form  = slots[slotId];
                if (!form) return;

                const motivo = interaction.fields.getTextInputValue('motivo');
                await interaction.deferUpdate();

                // DM ao candidato
                try {
                    const targetUser = await client.users.fetch(targetUserId);
                    const rc = new ContainerBuilder().setAccentColor(0xFF4444);
                    rc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('negative_emoji')} Aplicação Recusada\n` +
                        `Infelizmente, **${targetUser.username}**, sua aplicação para **${form.name}** foi **recusada**.\n\n` +
                        `${Emojis.get('information_emoji')} **Motivo:** ${motivo}\n\n` +
                        `${Emojis.get('_staff_emoji')} **Revisado por:** ${interaction.user.username}\n` +
                        `${Emojis.get('date_emoji')} **Em:** <t:${Math.floor(Date.now() / 1000)}:F>`
                    ));
                    await targetUser.send({ components: [rc], flags: MessageFlags.IsComponentsV2 });
                } catch (e) {}

                // Atualizar log
                const saved  = formularios.get(`${guildId}.responses.${targetUserId}.${slotId}`);
                const qaText = saved?.qaText || '*Respostas não disponíveis*';

                const lc = new ContainerBuilder().setAccentColor(0xFF4444);
                lc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('negative_emoji')} Aplicação Recusada — ${form.name}\n` +
                    `${Emojis.get('_silueta_emoji')} **Candidato:** ${saved?.username || 'Usuário'} (<@${targetUserId}>)\n` +
                    `${Emojis.get('_staff_emoji')} **Recusado por:** ${interaction.user.username} (<@${interaction.user.id}>)\n` +
                    `${Emojis.get('warn_emoji')} **Motivo:** ${motivo}\n` +
                    `${Emojis.get('date_emoji')} **Em:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                    `${Emojis.get('_lapis_emoji')} **Respostas:**\n\n${qaText}`
                ));
                lc.addSeparatorComponents(new SeparatorBuilder());
                lc.addActionRowComponents(new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('_form_rejected_done')
                        .setLabel('Aplicação Recusada')
                        .setEmoji({ id: '1501803935453679616' })
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true),
                ));

                await interaction.editReply({ content: '', components: [lc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
                return;
            }

        } catch (err) {
            console.error('[FormSession] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred)
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro ao processar.`, ephemeral: true });
            } catch (e) {}
        }
    },
};
