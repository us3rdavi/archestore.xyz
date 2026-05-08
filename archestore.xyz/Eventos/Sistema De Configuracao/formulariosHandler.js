const {
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, RoleSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    MessageFlags, ChannelSelectMenuBuilder, ChannelType,
} = require('discord.js');
const { formularios, Emojis, configuracao } = require('../../DataBaseJson');

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

function buildFormPanelPayload(guildId, slotId) {
    const slots = formularios.get(guildId) || {};
    const form = slots[slotId];

    if (!form) {
        const container = new ContainerBuilder().setAccentColor(0xFF0000);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Formulário não encontrado.`));
        return { components: [container], flags: MessageFlags.IsComponentsV2 };
    }

    const statusText = form.active ? '🟢 Ativo' : '🔴 Inativo';
    const channelInput  = form.channel_input  ? `<#${form.channel_input}>`  : '`Não definido`';
    const channelOutput = form.channel_output ? `<#${form.channel_output}>` : '`Não definido`';
    const roles = (form.roles_responsible || []).length > 0
        ? form.roles_responsible.map(r => `<@&${r}>`).join(', ')
        : '`Nenhum`';
    const roleAprovado = form.role_approved ? `<@&${form.role_approved}>` : '`Não definido`';
    const timeLimit = form.time_limit || 120;

    const container = new ContainerBuilder().setAccentColor(getAccentColor());
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## 📋 ${form.name}\n` +
            `-# Status: ${statusText}\n\n` +
            `**Canal do Formulário:** ${channelInput}\n` +
            `**Canal de Logs:** ${channelOutput}\n` +
            `**Staff Responsável:** ${roles}\n` +
            `**Cargo ao Aprovar:** ${roleAprovado}\n` +
            `**Botão:** \`${form.button_label}\`${form.button_emoji ? ` ${form.button_emoji}` : ''}\n` +
            `**Perguntas:** ${(form.questions || []).length}/10\n` +
            `**Tempo por Pergunta:** ${timeLimit}s\n` +
            `**Limite por Usuário:** ${form.limit_per_user ? form.limit_per_user + ' envio(s)' : 'Ilimitado'}`
        )
    );
    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`form_btn_canais_${guildId}_${slotId}`).setLabel('Configurar Canais').setEmoji('1501803997583904810').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`form_btn_cargos_${guildId}_${slotId}`).setLabel('Staff Responsável').setEmoji('1371577447031640124').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`form_btn_botao_${guildId}_${slotId}`).setLabel('Configurar Botão').setEmoji('1371593624852234280').setStyle(ButtonStyle.Primary),
        )
    );
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`form_btn_perguntas_${guildId}_${slotId}`).setLabel('Perguntas').setEmoji('1501804003850322052').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`form_btn_cargoaprovado_${guildId}_${slotId}`).setLabel('Cargo ao Aprovar').setEmoji('1371593630166421525').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`form_btn_timelimit_${guildId}_${slotId}`).setLabel(`Tempo: ${timeLimit}s`).setEmoji('1229787808936230975').setStyle(ButtonStyle.Secondary),
        )
    );
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`form_btn_limite_${guildId}_${slotId}`).setLabel('Limitar Envio').setEmoji('1371593625112285208').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`form_btn_embeds_${guildId}_${slotId}`).setLabel('Aparência').setEmoji('1501804122943389716').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`form_btn_nome_${guildId}_${slotId}`).setLabel('Renomear').setEmoji('1371593617868591185').setStyle(ButtonStyle.Secondary),
        )
    );
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`form_btn_postar_${guildId}_${slotId}`).setLabel('📤 Postar Formulário').setStyle(ButtonStyle.Success),
        )
    );
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`form_btn_voltar_${guildId}_${slotId}`).setLabel('Voltar').setEmoji('1371593637179297923').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`form_btn_deletar_${guildId}_${slotId}`).setLabel('Deletar').setEmoji('1501803935453679616').setStyle(ButtonStyle.Danger),
        )
    );

    return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

function buildFormManagePayload(guildId, userId) {
    const slots = formularios.get(guildId) || {};
    const existingSlots = Object.entries(slots).filter(([k, v]) => v !== null && v !== undefined && !k.startsWith('submissions') && !k.startsWith('responses'));

    const container = new ContainerBuilder().setAccentColor(getAccentColor());

    if (existingSlots.length === 0) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## 📋 Gerenciar Formulários\n` +
                `-# Nenhum formulário criado ainda.\n` +
                `Use **Criar Formulário** no menu /config para criar um.`
            )
        );
        return { components: [container], flags: MessageFlags.IsComponentsV2 };
    }

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## 📋 Gerenciar Formulários\n` +
            `Selecione o formulário que deseja configurar.\n` +
            `-# ${existingSlots.length}/5 slots utilizados`
        )
    );
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`form_select_${userId}`)
                .setPlaceholder('Selecione um formulário...')
                .addOptions(
                    existingSlots.map(([slotId, form]) => ({
                        label: form.name,
                        value: `${guildId}_${slotId}`,
                        description: `Slot ${slotId} — ${form.active ? 'Ativo' : 'Inativo'} — ${(form.questions || []).length} pergunta(s)`,
                        emoji: { id: '1371593612386635887' },
                    }))
                )
        )
    );

    return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

function buildQuestionsPanelPayload(guildId, slotId) {
    const slots = formularios.get(guildId) || {};
    const form = slots[slotId] || {};
    const questions = form.questions || [];

    const qLines = questions.length > 0
        ? questions.map((q, i) => `-# ${i + 1}. **${q.text}**`).join('\n')
        : '-# Nenhuma pergunta adicionada ainda.';

    const container = new ContainerBuilder().setAccentColor(getAccentColor());
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ✏️ Perguntas — ${form.name || `Formulário ${slotId}`}\n` +
            `${qLines}\n\n-# Máximo de 10 perguntas por formulário`
        )
    );
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`form_btn_addperg_${guildId}_${slotId}`)
                .setLabel('Adicionar Pergunta')
                .setEmoji('1501804003850322052')
                .setStyle(ButtonStyle.Success)
                .setDisabled(questions.length >= 10),
            new ButtonBuilder()
                .setCustomId(`form_btn_delperg_${guildId}_${slotId}`)
                .setLabel('Remover Última')
                .setEmoji('1501803935453679616')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(questions.length === 0),
            new ButtonBuilder()
                .setCustomId(`form_btn_voltarform_${guildId}_${slotId}`)
                .setLabel('Voltar')
                .setEmoji('1371593637179297923')
                .setStyle(ButtonStyle.Secondary),
        )
    );

    return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

async function handleFormAction(interaction, client, action) {
    const guildId = interaction.guild.id;
    const userId  = interaction.user.id;

    if (action === 'form_create') {
        const slots = formularios.get(guildId) || {};
        const dataSlots = Object.entries(slots).filter(([k, v]) => v !== null && v !== undefined && !k.startsWith('submissions') && !k.startsWith('responses'));
        let slotId = null;
        for (let i = 1; i <= 5; i++) {
            if (!slots[String(i)]) { slotId = String(i); break; }
        }
        if (!slotId) {
            await interaction.editReply({ content: `${Emojis.get('negative_emoji')} Limite de 5 formulários atingido. Delete um antes de criar outro.` });
            return;
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

module.exports = {
    name: 'interactionCreate',
    handleFormAction,

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            if (interaction.isStringSelectMenu() && customId.startsWith('form_select_')) {
                const userId = customId.slice('form_select_'.length);
                if (userId !== interaction.user.id) return;
                const value = interaction.values[0];
                const parts = value.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                await interaction.deferUpdate();
                await interaction.editReply(buildFormPanelPayload(guildId, slotId));
                return;
            }

            if (interaction.isRoleSelectMenu() && customId.startsWith('form_roles_resp_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const slots = formularios.get(guildId) || {};
                if (slots[slotId]) {
                    slots[slotId].roles_responsible = interaction.values;
                    formularios.set(guildId, slots);
                }
                await interaction.deferUpdate();
                await interaction.editReply(buildFormPanelPayload(guildId, slotId));
                return;
            }

            if (interaction.isRoleSelectMenu() && customId.startsWith('form_roles_aprov_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const slots = formularios.get(guildId) || {};
                if (slots[slotId]) {
                    slots[slotId].role_approved = interaction.values[0] || null;
                    formularios.set(guildId, slots);
                }
                await interaction.deferUpdate();
                await interaction.editReply(buildFormPanelPayload(guildId, slotId));
                return;
            }

            if (interaction.isButton() && customId.startsWith('form_btn_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const action  = parts.slice(2, parts.length - 2).join('_');

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

                if (action === 'deletar') {
                    const slots = formularios.get(guildId) || {};
                    const form  = slots[slotId];
                    const container = new ContainerBuilder().setAccentColor(0xFF0000);
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## ${Emojis.get('negative_emoji')} Deletar Formulário\n` +
                            `Tem certeza que deseja deletar **${form?.name || `Formulário ${slotId}`}**?\n\n` +
                            `-# Esta ação é irreversível!`
                        )
                    );
                    container.addSeparatorComponents(new SeparatorBuilder());
                    container.addActionRowComponents(
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId(`form_btn_confirmdel_${guildId}_${slotId}`).setLabel('Confirmar Deleção').setEmoji('1501803935453679616').setStyle(ButtonStyle.Danger),
                            new ButtonBuilder().setCustomId(`form_btn_voltarform_${guildId}_${slotId}`).setLabel('Cancelar').setEmoji('1371593637179297923').setStyle(ButtonStyle.Secondary),
                        )
                    );
                    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
                    return;
                }

                if (action === 'confirmdel') {
                    const slots = formularios.get(guildId) || {};
                    delete slots[slotId];
                    formularios.set(guildId, slots);
                    await interaction.deferUpdate();
                    await interaction.editReply(buildFormManagePayload(guildId, interaction.user.id));
                    return;
                }

                if (action === 'perguntas') {
                    await interaction.deferUpdate();
                    await interaction.editReply(buildQuestionsPanelPayload(guildId, slotId));
                    return;
                }

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

                if (action === 'cargos') {
                    const slots = formularios.get(guildId) || {};
                    const form  = slots[slotId] || {};
                    const container = new ContainerBuilder().setAccentColor(getAccentColor());
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## 👥 Staff Responsável\n` +
                            `Selecione os cargos que podem aceitar ou rejeitar aplicações deste formulário.\n\n` +
                            `-# Atual: ${(form.roles_responsible || []).length > 0 ? form.roles_responsible.map(r => `<@&${r}>`).join(', ') : '`Nenhum`'}`
                        )
                    );
                    container.addSeparatorComponents(new SeparatorBuilder());
                    container.addActionRowComponents(
                        new ActionRowBuilder().addComponents(
                            new RoleSelectMenuBuilder()
                                .setCustomId(`form_roles_resp_${guildId}_${slotId}`)
                                .setPlaceholder('Selecionar cargos responsáveis...')
                                .setMinValues(0)
                                .setMaxValues(5)
                        )
                    );
                    container.addActionRowComponents(
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId(`form_btn_voltarform_${guildId}_${slotId}`).setLabel('Voltar').setEmoji('1371593637179297923').setStyle(ButtonStyle.Secondary)
                        )
                    );
                    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
                    return;
                }

                if (action === 'cargoaprovado') {
                    const slots = formularios.get(guildId) || {};
                    const form  = slots[slotId] || {};
                    const container = new ContainerBuilder().setAccentColor(getAccentColor());
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## 🎖️ Cargo ao Aprovar\n` +
                            `Selecione o cargo que será entregue automaticamente ao usuário quando sua aplicação for aceita.\n\n` +
                            `-# Atual: ${form.role_approved ? `<@&${form.role_approved}>` : '`Não definido`'}`
                        )
                    );
                    container.addSeparatorComponents(new SeparatorBuilder());
                    container.addActionRowComponents(
                        new ActionRowBuilder().addComponents(
                            new RoleSelectMenuBuilder()
                                .setCustomId(`form_roles_aprov_${guildId}_${slotId}`)
                                .setPlaceholder('Selecionar cargo ao aprovar...')
                                .setMinValues(0)
                                .setMaxValues(1)
                        )
                    );
                    container.addActionRowComponents(
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId(`form_btn_voltarform_${guildId}_${slotId}`).setLabel('Voltar').setEmoji('1371593637179297923').setStyle(ButtonStyle.Secondary)
                        )
                    );
                    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
                    return;
                }

                if (action === 'postar') {
                    const slots = formularios.get(guildId) || {};
                    const form  = slots[slotId];
                    if (!form) return;
                    if (!form.channel_input) {
                        await interaction.reply({ content: `${Emojis.get('negative_emoji')} Configure o **Canal do Formulário** antes de postar.`, ephemeral: true });
                        return;
                    }
                    if (!form.channel_output) {
                        await interaction.reply({ content: `${Emojis.get('negative_emoji')} Configure o **Canal de Logs** antes de postar.`, ephemeral: true });
                        return;
                    }
                    if ((form.questions || []).length === 0) {
                        await interaction.reply({ content: `${Emojis.get('negative_emoji')} Adicione pelo menos **uma pergunta** antes de postar.`, ephemeral: true });
                        return;
                    }

                    const channel = interaction.guild.channels.cache.get(form.channel_input);
                    if (!channel) {
                        await interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal do formulário não encontrado. Reconfigure.`, ephemeral: true });
                        return;
                    }

                    const embedColor = parseInt((form.embed?.color || '5865F2').replace('#', ''), 16);
                    const formContainer = new ContainerBuilder().setAccentColor(embedColor);
                    formContainer.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## ${form.embed?.title || form.name}\n` +
                            `${form.embed?.description || 'Clique no botão abaixo para iniciar sua aplicação.'}`
                        )
                    );
                    formContainer.addSeparatorComponents(new SeparatorBuilder());

                    const startBtn = new ButtonBuilder()
                        .setCustomId(`fstart_${guildId}_${slotId}`)
                        .setLabel(form.button_label || 'Iniciar Aplicação')
                        .setStyle(ButtonStyle.Primary);

                    if (form.button_emoji) {
                        const isCustom = /^\d+$/.test(form.button_emoji);
                        startBtn.setEmoji(isCustom ? { id: form.button_emoji } : form.button_emoji);
                    }

                    formContainer.addActionRowComponents(
                        new ActionRowBuilder().addComponents(startBtn)
                    );

                    try {
                        await channel.send({ components: [formContainer], flags: MessageFlags.IsComponentsV2 });
                        slots[slotId].active = true;
                        formularios.set(guildId, slots);
                        await interaction.reply({ content: `${Emojis.get('confirmed_emoji')} Formulário postado em ${channel} com sucesso!`, ephemeral: true });
                    } catch (e) {
                        await interaction.reply({ content: `${Emojis.get('negative_emoji')} Não consegui postar no canal. Verifique as permissões do bot.`, ephemeral: true });
                    }
                    return;
                }

                const modalHandlers = {
                    canais: async () => {
                        const slots = formularios.get(guildId) || {};
                        const form  = slots[slotId] || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_canais_${guildId}_${slotId}`).setTitle('Configurar Canais');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('channel_input').setLabel('Canal do Formulário (ID)').setValue(form.channel_input || '').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('ID do canal onde o painel será postado')
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('channel_output').setLabel('Canal de Logs (ID)').setValue(form.channel_output || '').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('ID do canal onde as respostas serão enviadas')
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    botao: async () => {
                        const slots = formularios.get(guildId) || {};
                        const form  = slots[slotId] || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_botao_${guildId}_${slotId}`).setTitle('Configurar Botão');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('button_label').setLabel('Texto do Botão').setValue(form.button_label || 'Iniciar Aplicação').setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('button_emoji').setLabel('Emoji do Botão (ID ou unicode)').setValue(form.button_emoji || '').setStyle(TextInputStyle.Short).setRequired(false)
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    limite: async () => {
                        const slots = formularios.get(guildId) || {};
                        const form  = slots[slotId] || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_limite_${guildId}_${slotId}`).setTitle('Limitar Envios');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('limit').setLabel('Limite por Usuário (0 = ilimitado)').setValue(form.limit_per_user ? String(form.limit_per_user) : '0').setStyle(TextInputStyle.Short).setRequired(true)
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    timelimit: async () => {
                        const slots = formularios.get(guildId) || {};
                        const form  = slots[slotId] || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_timelimit_${guildId}_${slotId}`).setTitle('Tempo Limite por Pergunta');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('timelimit').setLabel('Tempo em Segundos (ex: 120)').setValue(String(form.time_limit || 120)).setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Mínimo: 30, Máximo: 600')
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    nome: async () => {
                        const slots = formularios.get(guildId) || {};
                        const form  = slots[slotId] || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_nome_${guildId}_${slotId}`).setTitle('Renomear Formulário');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('nome').setLabel('Nome do Formulário').setValue(form.name || '').setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true)
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    addperg: async () => {
                        const slots = formularios.get(guildId) || {};
                        const form  = slots[slotId] || {};
                        if ((form.questions || []).length >= 10) {
                            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 10 perguntas por formulário.`, ephemeral: true });
                        }
                        const modal = new ModalBuilder().setCustomId(`form_modal_addperg_${guildId}_${slotId}`).setTitle('Adicionar Pergunta');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('question_text').setLabel('Texto da Pergunta').setStyle(TextInputStyle.Paragraph).setMaxLength(300).setRequired(true).setPlaceholder('Digite a pergunta que será feita ao candidato...')
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    embeds: async () => {
                        const slots = formularios.get(guildId) || {};
                        const form  = slots[slotId] || {};
                        const emb   = form.embed || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_embeds_${guildId}_${slotId}`).setTitle('Aparência do Formulário');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('embed_title').setLabel('Título').setValue(emb.title || '').setStyle(TextInputStyle.Short).setRequired(false)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('embed_description').setLabel('Descrição').setValue(emb.description || '').setStyle(TextInputStyle.Paragraph).setRequired(false)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('embed_color').setLabel('Cor (Hex, ex: 5865F2)').setValue(emb.color || '5865F2').setStyle(TextInputStyle.Short).setRequired(false)
                            )
                        );
                        await interaction.showModal(modal);
                    },
                };

                if (modalHandlers[action]) await modalHandlers[action]();
                return;
            }

            if (interaction.isModalSubmit() && customId.startsWith('form_modal_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const action  = parts.slice(2, parts.length - 2).join('_');

                const slots = formularios.get(guildId) || {};
                if (!slots[slotId]) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Formulário não encontrado.`, ephemeral: true });
                }

                if (action === 'canais') {
                    const channelInput  = interaction.fields.getTextInputValue('channel_input').trim();
                    const channelOutput = interaction.fields.getTextInputValue('channel_output').trim();
                    if (channelInput) {
                        if (!interaction.guild.channels.cache.get(channelInput))
                            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal do formulário não encontrado.`, ephemeral: true });
                        slots[slotId].channel_input = channelInput;
                    } else { slots[slotId].channel_input = null; }
                    if (channelOutput) {
                        if (!interaction.guild.channels.cache.get(channelOutput))
                            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal de logs não encontrado.`, ephemeral: true });
                        slots[slotId].channel_output = channelOutput;
                    } else { slots[slotId].channel_output = null; }
                    formularios.set(guildId, slots);
                    await interaction.update(buildFormPanelPayload(guildId, slotId));

                } else if (action === 'botao') {
                    const label = interaction.fields.getTextInputValue('button_label').trim();
                    const emoji = interaction.fields.getTextInputValue('button_emoji').trim();
                    slots[slotId].button_label = label || 'Iniciar Aplicação';
                    slots[slotId].button_emoji = emoji || null;
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
                    if (isNaN(tl) || tl < 30) tl = 30;
                    if (tl > 600) tl = 600;
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
                    const title       = interaction.fields.getTextInputValue('embed_title').trim();
                    const description = interaction.fields.getTextInputValue('embed_description').trim();
                    const color       = interaction.fields.getTextInputValue('embed_color').trim();
                    if (!slots[slotId].embed) slots[slotId].embed = {};
                    slots[slotId].embed.title       = title || null;
                    slots[slotId].embed.description = description || null;
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
