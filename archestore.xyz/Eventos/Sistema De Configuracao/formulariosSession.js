const {
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    MessageFlags,
} = require('discord.js');
const { formularios, Emojis } = require('../../DataBaseJson');

// Sessões ativas: userId -> dados da sessão
const activeSessions = new Map();

// ── Envia as respostas no canal de logs ──────────────────────────
async function sendFormLog(client, guild, form, slotId, guildId, user, answers) {
    const channel = guild.channels.cache.get(form.channel_output);
    if (!channel) return null;

    const questions = form.questions || [];
    const qaLines = questions.map((q, i) =>
        `**${i + 1}. ${q.text}**\n> ${answers[i] || '*Sem resposta*'}`
    ).join('\n\n');

    const avatarURL = user.displayAvatarURL({ size: 256, forceStatic: false });
    const timestamp = Math.floor(Date.now() / 1000);

    const container = new ContainerBuilder().setAccentColor(0x5865F2);
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## 📋 Nova Aplicação — ${form.name}\n` +
            `**Candidato:** ${user.username} (<@${user.id}>)\n` +
            `**Enviado em:** <t:${timestamp}:F>\n` +
            `-# ID: ${user.id}\n\n` +
            `─────────────────────────\n\n` +
            `${qaLines}`
        )
    );
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`faccept_${guildId}_${slotId}_${user.id}`)
                .setLabel('Aceitar Aplicação')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`freject_${guildId}_${slotId}_${user.id}`)
                .setLabel('Rejeitar Aplicação')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger),
        )
    );

    try {
        const msg = await channel.send({
            content: `\`📷\` ${avatarURL}`,
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
        return msg.id;
    } catch (e) {
        console.error('[FormSession] Erro ao enviar log:', e);
        return null;
    }
}

// ── Verifica se o membro tem permissão de staff ───────────────────
function hasStaffPermission(member, form) {
    if (member.permissions.has('Administrator')) return true;
    if (!form.roles_responsible || form.roles_responsible.length === 0) return true;
    return form.roles_responsible.some(r => member.roles.cache.has(r));
}

// ── Faz as perguntas na DM uma por uma ───────────────────────────
async function runQuestionFlow(dmChannel, userId, questions, timeLimit) {
    const answers = [];

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        const qContainer = new ContainerBuilder().setAccentColor(0x5865F2);
        qContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**Pergunta ${i + 1} de ${questions.length}**\n\n` +
                `${q.text}\n\n` +
                `-# ⏱️ Você tem ${timeLimit} segundos para responder.`
            )
        );
        await dmChannel.send({ components: [qContainer], flags: MessageFlags.IsComponentsV2 });

        let answer;
        try {
            answer = await new Promise((resolve, reject) => {
                const collector = dmChannel.createMessageCollector({
                    filter: m => m.author.id === userId && !m.author.bot,
                    max: 1,
                    time: timeLimit * 1000,
                });
                collector.on('collect', m => resolve(m.content));
                collector.on('end', (col, reason) => {
                    if (reason === 'time') reject(new Error('timeout'));
                });
            });
        } catch (e) {
            throw new Error('timeout');
        }

        answers.push(answer);
    }

    return answers;
}

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            // ── Iniciar formulário (botão no canal) ──────────────────────
            if (interaction.isButton() && customId.startsWith('fstart_')) {
                const [, guildId, slotId] = customId.split('_');
                const userId = interaction.user.id;

                if (interaction.guild?.id !== guildId) return;

                const slots = formularios.get(guildId) || {};
                const form  = slots[slotId];

                if (!form || !form.active) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Este formulário não está ativo no momento.`,
                        ephemeral: true,
                    });
                }

                const questions = form.questions || [];
                if (questions.length === 0) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Este formulário ainda não possui perguntas configuradas.`,
                        ephemeral: true,
                    });
                }

                // Sessão já ativa
                if (activeSessions.has(userId)) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Você já tem um formulário em andamento! Verifique sua DM 📩`,
                        ephemeral: true,
                    });
                }

                // Limite de envios
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
                try {
                    dmChannel = await interaction.user.createDM();
                } catch (e) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Não consegui te enviar uma DM. Habilite suas mensagens diretas e tente novamente.`,
                        ephemeral: true,
                    });
                }

                // Testar se DM está aberta
                try {
                    const welcomeContainer = new ContainerBuilder().setAccentColor(0x5865F2);
                    welcomeContainer.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## 📋 ${form.name}\n` +
                            `Olá, **${interaction.user.username}**! Você iniciou o formulário de aplicação.\n\n` +
                            `**${Emojis.get('information_emoji') || 'ℹ️'} Informações:**\n` +
                            `> Você tem **${form.time_limit || 120} segundos** para responder cada pergunta.\n` +
                            `> O formulário possui **${questions.length} pergunta(s)**.\n` +
                            `> Responda digitando normalmente nesta conversa.\n\n` +
                            `-# A primeira pergunta aparecerá em instantes...`
                        )
                    );
                    await dmChannel.send({ components: [welcomeContainer], flags: MessageFlags.IsComponentsV2 });
                } catch (e) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Não consegui te enviar uma DM. Habilite suas mensagens diretas e tente novamente.`,
                        ephemeral: true,
                    });
                }

                // Confirmar ao usuário no servidor
                await interaction.reply({
                    content: `${Emojis.get('confirmed_emoji') || '✅'} Formulário iniciado! Verifique sua DM 📩`,
                    ephemeral: true,
                });

                // Registrar sessão ativa
                activeSessions.set(userId, { guildId, slotId });

                // ── Fluxo de perguntas ────────────────────────────────────
                const timeLimit = form.time_limit || 120;
                let answers = [];
                let timedOut = false;

                try {
                    answers = await runQuestionFlow(dmChannel, userId, questions, timeLimit);
                } catch (e) {
                    timedOut = true;
                    activeSessions.delete(userId);

                    const toContainer = new ContainerBuilder().setAccentColor(0xFF4444);
                    toContainer.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## ⏰ Tempo Esgotado!\n` +
                            `Você demorou muito para responder. O formulário foi **cancelado**.\n\n` +
                            `-# Você pode tentar novamente clicando no botão do formulário.`
                        )
                    );
                    await dmChannel.send({ components: [toContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
                    return;
                }

                activeSessions.delete(userId);

                // Incrementar contagem de envios
                if (form.limit_per_user) {
                    const count = formularios.get(`${guildId}.submissions.${userId}.${slotId}`) || 0;
                    formularios.set(`${guildId}.submissions.${userId}.${slotId}`, count + 1);
                }

                // Salvar respostas no banco para uso no accept/reject
                const qaText = questions.map((q, i) =>
                    `**${i + 1}. ${q.text}**\n> ${answers[i] || '*Sem resposta*'}`
                ).join('\n\n');

                formularios.set(`${guildId}.responses.${userId}.${slotId}`, {
                    answers,
                    qaText,
                    submittedAt: Date.now(),
                    username: interaction.user.username,
                    avatarURL: interaction.user.displayAvatarURL({ size: 256 }),
                });

                // Mensagem de conclusão na DM
                const doneContainer = new ContainerBuilder().setAccentColor(0x00C06B);
                doneContainer.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ✅ Formulário Finalizado!\n` +
                        `Suas respostas foram **registradas com sucesso**!\n\n` +
                        `Em breve você receberá uma resposta informando se sua aplicação foi **aceita** ou **recusada**.\n\n` +
                        `-# Obrigado por participar! 🎉`
                    )
                );
                await dmChannel.send({ components: [doneContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

                // Enviar log para canal de resultados
                const guild = client.guilds.cache.get(guildId);
                if (!guild) return;

                // Re-ler form para garantir dados atuais
                const currentSlots = formularios.get(guildId) || {};
                const currentForm  = currentSlots[slotId];
                if (!currentForm) return;

                await sendFormLog(client, guild, currentForm, slotId, guildId, interaction.user, answers);
                return;
            }

            // ── Aceitar aplicação ────────────────────────────────────────
            if (interaction.isButton() && customId.startsWith('faccept_')) {
                const parts = customId.split('_');
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

                // Entregar cargo ao aprovado
                if (form.role_approved) {
                    try {
                        const member = interaction.guild.members.cache.get(targetUserId)
                            || await interaction.guild.members.fetch(targetUserId).catch(() => null);
                        if (member) {
                            await member.roles.add(form.role_approved).catch(() => {});
                        }
                    } catch (e) {}
                }

                // Notificar usuário na DM
                try {
                    const targetUser = await client.users.fetch(targetUserId);
                    const acceptDM = new ContainerBuilder().setAccentColor(0x00C06B);
                    acceptDM.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## ✅ Aplicação Aceita!\n` +
                            `Parabéns, **${targetUser.username}**! Sua aplicação para **${form.name}** foi **aceita**!\n\n` +
                            `**Revisado por:** ${interaction.user.username}\n` +
                            `**Em:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                            `-# Seja bem-vindo(a)! 🎉`
                        )
                    );
                    await targetUser.send({ components: [acceptDM], flags: MessageFlags.IsComponentsV2 });
                } catch (e) {}

                // Buscar respostas salvas para manter no log
                const savedResponse = formularios.get(`${guildId}.responses.${targetUserId}.${slotId}`);
                const qaText = savedResponse?.qaText || '*Respostas não disponíveis*';

                // Atualizar mensagem de log
                const logContainer = new ContainerBuilder().setAccentColor(0x00C06B);
                logContainer.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ✅ Aplicação Aceita — ${form.name}\n` +
                        `**Candidato:** ${savedResponse?.username || 'Usuário'} (<@${targetUserId}>)\n` +
                        `**Aceito por:** ${interaction.user.username} (<@${interaction.user.id}>)\n` +
                        `**Em:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                        `─────────────────────────\n\n` +
                        `${qaText}`
                    )
                );
                logContainer.addSeparatorComponents(new SeparatorBuilder());
                logContainer.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('_accepted_disabled')
                            .setLabel('✅ Aplicação Aceita')
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true),
                    )
                );

                await interaction.editReply({
                    content: '',
                    components: [logContainer],
                    flags: MessageFlags.IsComponentsV2,
                }).catch(() => {});

                return;
            }

            // ── Rejeitar aplicação (abre modal para motivo) ──────────────
            if (interaction.isButton() && customId.startsWith('freject_')) {
                const parts = customId.split('_');
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
                            .setLabel('Motivo da Rejeição')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                            .setMaxLength(500)
                            .setPlaceholder('Descreva o motivo pelo qual esta aplicação está sendo recusada...')
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            // ── Modal de rejeição enviado ────────────────────────────────
            if (interaction.isModalSubmit() && customId.startsWith('frejmod_')) {
                const parts = customId.split('_');
                const guildId      = parts[1];
                const slotId       = parts[2];
                const targetUserId = parts[3];

                if (interaction.guild?.id !== guildId) return;

                const slots = formularios.get(guildId) || {};
                const form  = slots[slotId];
                if (!form) return;

                const motivo = interaction.fields.getTextInputValue('motivo');

                await interaction.deferUpdate();

                // Notificar usuário na DM
                try {
                    const targetUser = await client.users.fetch(targetUserId);
                    const rejectDM = new ContainerBuilder().setAccentColor(0xFF4444);
                    rejectDM.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## ❌ Aplicação Recusada\n` +
                            `Infelizmente, **${targetUser.username}**, sua aplicação para **${form.name}** foi **recusada**.\n\n` +
                            `**Motivo:** ${motivo}\n\n` +
                            `**Revisado por:** ${interaction.user.username}\n` +
                            `**Em:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                            `-# Você pode tentar novamente mais tarde.`
                        )
                    );
                    await targetUser.send({ components: [rejectDM], flags: MessageFlags.IsComponentsV2 });
                } catch (e) {}

                // Buscar respostas salvas para manter no log
                const savedResponse = formularios.get(`${guildId}.responses.${targetUserId}.${slotId}`);
                const qaText = savedResponse?.qaText || '*Respostas não disponíveis*';

                // Atualizar mensagem de log
                const logContainer = new ContainerBuilder().setAccentColor(0xFF4444);
                logContainer.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ❌ Aplicação Recusada — ${form.name}\n` +
                        `**Candidato:** ${savedResponse?.username || 'Usuário'} (<@${targetUserId}>)\n` +
                        `**Recusado por:** ${interaction.user.username} (<@${interaction.user.id}>)\n` +
                        `**Motivo:** ${motivo}\n` +
                        `**Em:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                        `─────────────────────────\n\n` +
                        `${qaText}`
                    )
                );
                logContainer.addSeparatorComponents(new SeparatorBuilder());
                logContainer.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('_rejected_disabled')
                            .setLabel('❌ Aplicação Recusada')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true),
                    )
                );

                await interaction.editReply({
                    content: '',
                    components: [logContainer],
                    flags: MessageFlags.IsComponentsV2,
                }).catch(() => {});

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
