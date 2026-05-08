const {
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, RoleSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    MessageFlags,
} = require('discord.js');
const { formularios, Emojis, configuracao } = require('../../DataBaseJson');

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAINEL PRINCIPAL DO FORMULÁRIO
// ─────────────────────────────────────────────────────────────────────────────
function buildFormPanelPayload(guildId, slotId) {
    const slots = formularios.get(guildId) || {};
    const form  = slots[slotId];

    if (!form) {
        const c = new ContainerBuilder().setAccentColor(0xFF4444);
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${Emojis.get('negative_emoji')} Formulário não encontrado.`
        ));
        return { components: [c], flags: MessageFlags.IsComponentsV2 };
    }

    const statusIcon    = form.active ? Emojis.get('confirmed_emoji') : Emojis.get('error');
    const statusText    = form.active ? 'Ativo' : 'Inativo';
    const chInput       = form.channel_input  ? `<#${form.channel_input}>`  : `\`Não definido\``;
    const chOutput      = form.channel_output ? `<#${form.channel_output}>` : `\`Não definido\``;
    const staffRoles    = (form.roles_responsible || []).length > 0
        ? form.roles_responsible.map(r => `<@&${r}>`).join(', ')
        : `\`Nenhum\``;
    const roleAprovado  = form.role_approved ? `<@&${form.role_approved}>` : `\`Não definido\``;
    const timeLimit     = form.time_limit || 120;
    const qtdPerguntas  = (form.questions || []).length;
    const limite        = form.limit_per_user ? `${form.limit_per_user} envio(s)` : `Ilimitado`;

    const c = new ContainerBuilder().setAccentColor(getAccentColor());
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_messages_emoji')} ${form.name}\n` +
        `-# ${statusIcon} ${statusText}\n\n` +
        `${Emojis.get('_transfer_emoji')} **Canal do Formulário:** ${chInput}\n` +
        `${Emojis.get('_folder_emoji')} **Canal de Logs:** ${chOutput}\n` +
        `${Emojis.get('_staff_emoji')} **Staff Responsável:** ${staffRoles}\n` +
        `${Emojis.get('permissions_emoji')} **Cargo ao Aprovar:** ${roleAprovado}\n` +
        `${Emojis.get('_lapis_emoji')} **Botão:** \`${form.button_label || 'Iniciar Aplicação'}\`\n` +
        `${Emojis.get('question_emoji')} **Perguntas:** ${qtdPerguntas}/10\n` +
        `${Emojis.get('clock_emoji')} **Tempo por Pergunta:** ${timeLimit}s\n` +
        `${Emojis.get('_fixe_emoji')} **Limite por Usuário:** ${limite}`
    ));
    c.addSeparatorComponents(new SeparatorBuilder());

    // Linha 1 — canais, staff, botão
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`form_btn_canais_${guildId}_${slotId}`).setLabel('Configurar Canais').setEmoji({ id: '1501803997583904810' }).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`form_btn_cargos_${guildId}_${slotId}`).setLabel('Staff Responsável').setEmoji({ id: '1501803902046048297' }).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`form_btn_botao_${guildId}_${slotId}`).setLabel('Configurar Botão').setEmoji({ id: '1501804003850322052' }).setStyle(ButtonStyle.Primary),
    ));

    // Linha 2 — perguntas, cargo aprovado, tempo
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`form_btn_perguntas_${guildId}_${slotId}`).setLabel('Perguntas').setEmoji({ id: '1501804003850322052' }).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`form_btn_cargoaprovado_${guildId}_${slotId}`).setLabel('Cargo ao Aprovar').setEmoji({ id: '1501804064596558017' }).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`form_btn_timelimit_${guildId}_${slotId}`).setLabel(`Tempo: ${timeLimit}s`).setEmoji({ id: '1501804058699366470' }).setStyle(ButtonStyle.Secondary),
    ));

    // Linha 3 — limite, aparência, nome
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`form_btn_limite_${guildId}_${slotId}`).setLabel('Limitar Envios').setEmoji({ id: '1371593625112285208' }).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`form_btn_embeds_${guildId}_${slotId}`).setLabel('Aparência').setEmoji({ id: '1501804122943389716' }).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`form_btn_nome_${guildId}_${slotId}`).setLabel('Renomear').setEmoji({ id: '1371593617868591185' }).setStyle(ButtonStyle.Secondary),
    ));

    // Linha 4 — postar
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`form_btn_postar_${guildId}_${slotId}`).setLabel('Postar Formulário').setEmoji({ id: '1501803923126747178' }).setStyle(ButtonStyle.Success),
    ));

    // Linha 5 — voltar, deletar
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`form_btn_voltar_${guildId}_${slotId}`).setLabel('Voltar').setEmoji({ id: '1371593637179297923' }).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`form_btn_deletar_${guildId}_${slotId}`).setLabel('Deletar Formulário').setEmoji({ id: '1501803935453679616' }).setStyle(ButtonStyle.Danger),
    ));

    return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTA DE FORMULÁRIOS
// ─────────────────────────────────────────────────────────────────────────────
function buildFormManagePayload(guildId, userId) {
    const slots = formularios.get(guildId) || {};
    const existing = Object.entries(slots).filter(([k, v]) =>
        v !== null && v !== undefined && !k.startsWith('submissions') && !k.startsWith('responses')
    );

    const c = new ContainerBuilder().setAccentColor(getAccentColor());

    if (existing.length === 0) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_messages_emoji')} Gerenciar Formulários\n` +
            `${Emojis.get('information_emoji')} Nenhum formulário criado ainda.\n\n` +
            `-# Use **Criar Formulário** para começar.`
        ));
        return { components: [c], flags: MessageFlags.IsComponentsV2 };
    }

    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_messages_emoji')} Gerenciar Formulários\n` +
        `Selecione um formulário para configurar.\n` +
        `-# ${existing.length}/5 slots utilizados`
    ));
    c.addSeparatorComponents(new SeparatorBuilder());
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`form_select_${userId}`)
            .setPlaceholder('Selecione um formulário...')
            .addOptions(existing.map(([slotId, form]) => ({
                label: form.name,
                value: `${guildId}_${slotId}`,
                description: `Slot ${slotId} — ${form.active ? 'Ativo' : 'Inativo'} — ${(form.questions || []).length} pergunta(s)`,
                emoji: { id: '1501804039451709441' },
            })))
    ));

    return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

// ─────────────────────────────────────────────────────────────────────────────
// PAINEL DE PERGUNTAS
// ─────────────────────────────────────────────────────────────────────────────
function buildQuestionsPanelPayload(guildId, slotId) {
    const slots     = formularios.get(guildId) || {};
    const form      = slots[slotId] || {};
    const questions = form.questions || [];

    const qLines = questions.length > 0
        ? questions.map((q, i) => `-# ${i + 1}. ${q.text}`).join('\n')
        : `-# Nenhuma pergunta adicionada ainda.`;

    const c = new ContainerBuilder().setAccentColor(getAccentColor());
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Perguntas — ${form.name || `Formulário ${slotId}`}\n` +
        `${qLines}\n\n` +
        `-# ${questions.length}/10 perguntas configuradas`
    ));
    c.addSeparatorComponents(new SeparatorBuilder());
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`form_btn_addperg_${guildId}_${slotId}`)
            .setLabel('Adicionar Pergunta')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(ButtonStyle.Success)
            .setDisabled(questions.length >= 10),
        new ButtonBuilder()
            .setCustomId(`form_btn_delperg_${guildId}_${slotId}`)
            .setLabel('Remover Última')
            .setEmoji({ id: '1501803926180335727' })
            .setStyle(ButtonStyle.Danger)
            .setDisabled(questions.length === 0),
        new ButtonBuilder()
            .setCustomId(`form_btn_voltarform_${guildId}_${slotId}`)
            .setLabel('Voltar')
            .setEmoji({ id: '1371593637179297923' })
            .setStyle(ButtonStyle.Secondary),
    ));

    return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

// ─────────────────────────────────────────────────────────────────────────────
// AÇÃO VINDA DO CONFIG DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
async function handleFormAction(interaction, client, action) {
    const guildId = interaction.guild.id;
    const userId  = interaction.user.id;

    if (action === 'form_create') {
        const slots = formularios.get(guildId) || {};
        const dataSlots = Object.entries(slots).filter(([k, v]) =>
            v !== null && v !== undefined && !k.startsWith('submissions') && !k.startsWith('responses')
        );
        if (dataSlots.length >= 5) {
            await interaction.editReply({ content: `${Emojis.get('negative_emoji')} Limite de 5 formulários atingido. Delete um antes de criar outro.` });
            return;
        }

        let slotId = null;
        for (let i = 1; i <= 5; i++) {
            if (!slots[String(i)]) { slotId = String(i); break; }
        }

        slots[slotId] = {
            name: `Formulário ${dataSlots.length + 1}`,
            created_at: new Date().toISOString(),
            channel_input: null,
            channel_output: null,
            roles_responsible: [],
            role_approved: null,
            button_label: 'Iniciar Aplicação',
            button_emoji: null,
            questions: [],
            time_limit: 120,
            limit_per_user: null,
            embed: { title: null, description: null, color: '5865F2' },
            active: false,
        };
        formularios.set(guildId, slots);
        await interaction.editReply(buildFormPanelPayload(guildId, slotId));

    } else if (action === 'form_manage') {
        await interaction.editReply(buildFormManagePayload(guildId, userId));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER DE INTERAÇÕES
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
    name: 'interactionCreate',
    handleFormAction,

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            // ── Select: lista de formulários ────────────────────────────
            if (interaction.isStringSelectMenu() && customId.startsWith('form_select_')) {
                const userId = customId.slice('form_select_'.length);
                if (userId !== interaction.user.id) return;
                const [guildId, slotId] = interaction.values[0].split('_').slice(-2).reverse().concat([]).reverse();
                const val   = interaction.values[0];
                const parts = val.split('_');
                const sid   = parts[parts.length - 1];
                const gid   = parts[parts.length - 2];
                await interaction.deferUpdate();
                await interaction.editReply(buildFormPanelPayload(gid, sid));
                return;
            }

            // ── Role select: staff responsável ──────────────────────────
            if (interaction.isRoleSelectMenu() && customId.startsWith('form_roles_resp_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const slots   = formularios.get(guildId) || {};
                if (slots[slotId]) {
                    slots[slotId].roles_responsible = interaction.values;
                    formularios.set(guildId, slots);
                }
                await interaction.deferUpdate();
                await interaction.editReply(buildFormPanelPayload(guildId, slotId));
                return;
            }

            // ── Role select: cargo ao aprovar ───────────────────────────
            if (interaction.isRoleSelectMenu() && customId.startsWith('form_roles_aprov_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const slots   = formularios.get(guildId) || {};
                if (slots[slotId]) {
                    slots[slotId].role_approved = interaction.values[0] || null;
                    formularios.set(guildId, slots);
                }
                await interaction.deferUpdate();
                await interaction.editReply(buildFormPanelPayload(guildId, slotId));
                return;
            }

            // ── Botões form_btn_* ────────────────────────────────────────
            if (interaction.isButton() && customId.startsWith('form_btn_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const action  = parts.slice(2, parts.length - 2).join('_');

                // Navegação
                if (action === 'voltar') {
                    await interaction.deferUpdate();
                    await interaction.editReply(buildFormManagePayload(guildId, interaction.user.id));
                    return;
                }
                if (action === 'voltarform') {
                    await interaction.deferUpdate();
                    await interaction.editReply(buildFormPanelPayload(guildId, slotId));
                    return;
                }

                // Perguntas
                if (action === 'perguntas') {
                    await interaction.deferUpdate();
                    await interaction.editReply(buildQuestionsPanelPayload(guildId, slotId));
                    return;
                }

                // Remover última pergunta
                if (action === 'delperg') {
                    const slots = formularios.get(guildId) || {};
                    if (slots[slotId]?.questions?.length > 0) {
                        slots[slotId].questions.pop();
                        formularios.set(guildId, slots);
                    }
                    await interaction.deferUpdate();
                    await interaction.editReply(buildQuestionsPanelPayload(guildId, slotId));
                    return;
                }

                // Deletar — confirmação
                if (action === 'deletar') {
                    const slots = formularios.get(guildId) || {};
                    const form  = slots[slotId];
                    const c = new ContainerBuilder().setAccentColor(0xFF4444);
                    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('warn_emoji')} Deletar Formulário\n` +
                        `Tem certeza que deseja deletar **${form?.name || `Formulário ${slotId}`}**?\n\n` +
                        `-# Esta ação não pode ser desfeita.`
                    ));
                    c.addSeparatorComponents(new SeparatorBuilder());
                    c.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`form_btn_confirmdel_${guildId}_${slotId}`).setLabel('Confirmar Deleção').setEmoji({ id: '1501803935453679616' }).setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId(`form_btn_voltarform_${guildId}_${slotId}`).setLabel('Cancelar').setEmoji({ id: '1371593637179297923' }).setStyle(ButtonStyle.Secondary),
                    ));
                    await interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2 });
                    return;
                }

                // Confirmar deleção
                if (action === 'confirmdel') {
                    const slots = formularios.get(guildId) || {};
                    delete slots[slotId];
                    formularios.set(guildId, slots);
                    await interaction.deferUpdate();
                    await interaction.editReply(buildFormManagePayload(guildId, interaction.user.id));
                    return;
                }

                // Cargos responsáveis
                if (action === 'cargos') {
                    const slots = formularios.get(guildId) || {};
                    const form  = slots[slotId] || {};
                    const atual = (form.roles_responsible || []).length > 0
                        ? form.roles_responsible.map(r => `<@&${r}>`).join(', ')
                        : `\`Nenhum\``;
                    const c = new ContainerBuilder().setAccentColor(getAccentColor());
                    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('_staff_emoji')} Staff Responsável\n` +
                        `Selecione os cargos que poderão aceitar e rejeitar as aplicações.\n\n` +
                        `${Emojis.get('information_emoji')} **Atual:** ${atual}`
                    ));
                    c.addSeparatorComponents(new SeparatorBuilder());
                    c.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId(`form_roles_resp_${guildId}_${slotId}`)
                            .setPlaceholder('Selecionar cargos do staff...')
                            .setMinValues(0).setMaxValues(5)
                    ));
                    c.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`form_btn_voltarform_${guildId}_${slotId}`).setLabel('Voltar').setEmoji({ id: '1371593637179297923' }).setStyle(ButtonStyle.Secondary)
                    ));
                    await interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2 });
                    return;
                }

                // Cargo ao aprovar
                if (action === 'cargoaprovado') {
                    const slots = formularios.get(guildId) || {};
                    const form  = slots[slotId] || {};
                    const atual = form.role_approved ? `<@&${form.role_approved}>` : `\`Não definido\``;
                    const c = new ContainerBuilder().setAccentColor(getAccentColor());
                    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('permissions_emoji')} Cargo ao Aprovar\n` +
                        `Selecione o cargo entregue automaticamente ao candidato ser aceito.\n\n` +
                        `${Emojis.get('information_emoji')} **Atual:** ${atual}`
                    ));
                    c.addSeparatorComponents(new SeparatorBuilder());
                    c.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId(`form_roles_aprov_${guildId}_${slotId}`)
                            .setPlaceholder('Selecionar cargo ao aprovar...')
                            .setMinValues(0).setMaxValues(1)
                    ));
                    c.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`form_btn_voltarform_${guildId}_${slotId}`).setLabel('Voltar').setEmoji({ id: '1371593637179297923' }).setStyle(ButtonStyle.Secondary)
                    ));
                    await interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2 });
                    return;
                }

                // Postar formulário
                if (action === 'postar') {
                    const slots = formularios.get(guildId) || {};
                    const form  = slots[slotId];
                    if (!form) return;

                    if (!form.channel_input) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Configure o **Canal do Formulário** antes de postar.`, ephemeral: true });
                    }
                    if (!form.channel_output) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Configure o **Canal de Logs** antes de postar.`, ephemeral: true });
                    }
                    if ((form.questions || []).length === 0) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Adicione pelo menos **uma pergunta** antes de postar.`, ephemeral: true });
                    }

                    const channel = interaction.guild.channels.cache.get(form.channel_input);
                    if (!channel) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal do formulário não encontrado. Reconfigure.`, ephemeral: true });
                    }

                    const embedColor  = parseInt((form.embed?.color || '5865F2').replace('#', ''), 16);
                    const formTitle   = form.embed?.title || form.name;
                    const formDesc    = form.embed?.description || `Clique no botão abaixo para iniciar sua aplicação.`;

                    const fc = new ContainerBuilder().setAccentColor(embedColor);
                    fc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('_messages_emoji')} ${formTitle}\n${formDesc}`
                    ));
                    fc.addSeparatorComponents(new SeparatorBuilder());

                    const startBtn = new ButtonBuilder()
                        .setCustomId(`fstart_${guildId}_${slotId}`)
                        .setLabel(form.button_label || 'Iniciar Aplicação')
                        .setStyle(ButtonStyle.Primary);

                    if (form.button_emoji) {
                        startBtn.setEmoji(/^\d+$/.test(form.button_emoji)
                            ? { id: form.button_emoji }
                            : form.button_emoji
                        );
                    }

                    fc.addActionRowComponents(new ActionRowBuilder().addComponents(startBtn));

                    try {
                        await channel.send({ components: [fc], flags: MessageFlags.IsComponentsV2 });
                        slots[slotId].active = true;
                        formularios.set(guildId, slots);
                        await interaction.reply({ content: `${Emojis.get('confirmed_emoji')} Formulário postado em ${channel} com sucesso!`, ephemeral: true });
                    } catch (e) {
                        await interaction.reply({ content: `${Emojis.get('negative_emoji')} Não consegui postar no canal. Verifique as permissões do bot.`, ephemeral: true });
                    }
                    return;
                }

                // ── Modais ────────────────────────────────────────────────
                const modalHandlers = {
                    canais: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_canais_${guildId}_${slotId}`).setTitle('Configurar Canais');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('channel_input').setLabel('Canal do Formulário (ID)').setValue(form.channel_input || '').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('ID do canal onde o painel será postado')),
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('channel_output').setLabel('Canal de Logs (ID)').setValue(form.channel_output || '').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('ID do canal onde as respostas chegarão'))
                        );
                        await interaction.showModal(modal);
                    },
                    botao: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_botao_${guildId}_${slotId}`).setTitle('Configurar Botão');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('button_label').setLabel('Texto do Botão').setValue(form.button_label || 'Iniciar Aplicação').setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true)),
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('button_emoji').setLabel('ID do Emoji (deixe vazio para nenhum)').setValue(form.button_emoji || '').setStyle(TextInputStyle.Short).setRequired(false))
                        );
                        await interaction.showModal(modal);
                    },
                    limite: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_limite_${guildId}_${slotId}`).setTitle('Limitar Envios por Usuário');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('limit').setLabel('Limite (0 = ilimitado)').setValue(form.limit_per_user ? String(form.limit_per_user) : '0').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 1 para permitir apenas um envio'))
                        );
                        await interaction.showModal(modal);
                    },
                    timelimit: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_timelimit_${guildId}_${slotId}`).setTitle('Tempo Limite por Pergunta');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('timelimit').setLabel('Segundos por Pergunta (30 a 600)').setValue(String(form.time_limit || 120)).setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 120'))
                        );
                        await interaction.showModal(modal);
                    },
                    nome: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_nome_${guildId}_${slotId}`).setTitle('Renomear Formulário');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nome').setLabel('Nome do Formulário').setValue(form.name || '').setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true))
                        );
                        await interaction.showModal(modal);
                    },
                    addperg: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        if ((form.questions || []).length >= 10)
                            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 10 perguntas atingido.`, ephemeral: true });
                        const modal = new ModalBuilder().setCustomId(`form_modal_addperg_${guildId}_${slotId}`).setTitle('Adicionar Pergunta');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('question_text').setLabel('Texto da Pergunta').setStyle(TextInputStyle.Paragraph).setMaxLength(300).setRequired(true).setPlaceholder('Digite a pergunta que será feita ao candidato...'))
                        );
                        await interaction.showModal(modal);
                    },
                    embeds: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        const emb  = form.embed || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_embeds_${guildId}_${slotId}`).setTitle('Aparência do Formulário');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('embed_title').setLabel('Título').setValue(emb.title || '').setStyle(TextInputStyle.Short).setRequired(false)),
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('embed_description').setLabel('Descrição').setValue(emb.description || '').setStyle(TextInputStyle.Paragraph).setRequired(false)),
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('embed_color').setLabel('Cor Hex (ex: 5865F2)').setValue(emb.color || '5865F2').setStyle(TextInputStyle.Short).setRequired(false))
                        );
                        await interaction.showModal(modal);
                    },
                };

                if (modalHandlers[action]) await modalHandlers[action]();
                return;
            }

            // ── Modal submits ─────────────────────────────────────────────
            if (interaction.isModalSubmit() && customId.startsWith('form_modal_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const action  = parts.slice(2, parts.length - 2).join('_');
                const slots   = formularios.get(guildId) || {};

                if (!slots[slotId])
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Formulário não encontrado.`, ephemeral: true });

                if (action === 'canais') {
                    const ci = interaction.fields.getTextInputValue('channel_input').trim();
                    const co = interaction.fields.getTextInputValue('channel_output').trim();
                    if (ci) {
                        if (!interaction.guild.channels.cache.get(ci))
                            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal do formulário não encontrado.`, ephemeral: true });
                        slots[slotId].channel_input = ci;
                    } else { slots[slotId].channel_input = null; }
                    if (co) {
                        if (!interaction.guild.channels.cache.get(co))
                            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal de logs não encontrado.`, ephemeral: true });
                        slots[slotId].channel_output = co;
                    } else { slots[slotId].channel_output = null; }
                    formularios.set(guildId, slots);
                    await interaction.update(buildFormPanelPayload(guildId, slotId));

                } else if (action === 'botao') {
                    slots[slotId].button_label = interaction.fields.getTextInputValue('button_label').trim() || 'Iniciar Aplicação';
                    slots[slotId].button_emoji = interaction.fields.getTextInputValue('button_emoji').trim() || null;
                    formularios.set(guildId, slots);
                    await interaction.update(buildFormPanelPayload(guildId, slotId));

                } else if (action === 'limite') {
                    const limit = parseInt(interaction.fields.getTextInputValue('limit').trim());
                    if (isNaN(limit) || limit < 0)
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Valor inválido. Use um número inteiro.`, ephemeral: true });
                    slots[slotId].limit_per_user = limit === 0 ? null : limit;
                    formularios.set(guildId, slots);
                    await interaction.update(buildFormPanelPayload(guildId, slotId));

                } else if (action === 'timelimit') {
                    let tl = parseInt(interaction.fields.getTextInputValue('timelimit').trim());
                    if (isNaN(tl)) tl = 120;
                    tl = Math.min(Math.max(tl, 30), 600);
                    slots[slotId].time_limit = tl;
                    formularios.set(guildId, slots);
                    await interaction.update(buildFormPanelPayload(guildId, slotId));

                } else if (action === 'nome') {
                    const nome = interaction.fields.getTextInputValue('nome').trim();
                    if (nome) slots[slotId].name = nome;
                    formularios.set(guildId, slots);
                    await interaction.update(buildFormPanelPayload(guildId, slotId));

                } else if (action === 'addperg') {
                    const text = interaction.fields.getTextInputValue('question_text').trim();
                    if (!slots[slotId].questions) slots[slotId].questions = [];
                    slots[slotId].questions.push({ text });
                    formularios.set(guildId, slots);
                    await interaction.update(buildQuestionsPanelPayload(guildId, slotId));

                } else if (action === 'embeds') {
                    const title = interaction.fields.getTextInputValue('embed_title').trim();
                    const desc  = interaction.fields.getTextInputValue('embed_description').trim();
                    const color = interaction.fields.getTextInputValue('embed_color').trim();
                    if (!slots[slotId].embed) slots[slotId].embed = {};
                    slots[slotId].embed.title       = title || null;
                    slots[slotId].embed.description = desc  || null;
                    if (color && /^#?[0-9A-Fa-f]{6}$/.test(color))
                        slots[slotId].embed.color = color.replace('#', '');
                    formularios.set(guildId, slots);
                    await interaction.update(buildFormPanelPayload(guildId, slotId));
                }
                return;
            }

        } catch (err) {
            console.error('[FormulariosHandler] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred)
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro.`, ephemeral: true });
            } catch (e) {}
        }
    },
};
