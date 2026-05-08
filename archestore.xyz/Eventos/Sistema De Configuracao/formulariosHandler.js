const {
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, RoleSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    MessageFlags,
} = require('discord.js');
const { formularios, Emojis } = require('../../DataBaseJson');

// ──────────────────────────────────────────────
// Builders de payload (retornam objetos prontos para editReply / update)
// ──────────────────────────────────────────────

function buildFormPanelPayload(guildId, slotId) {
    const slots = formularios.get(guildId) || {};
    const form = slots[slotId];

    if (!form) {
        const container = new ContainerBuilder().setAccentColor(0xFF0000);
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Formulário não encontrado.`)
        );
        return { components: [container], flags: MessageFlags.IsComponentsV2 };
    }

    const statusText = form.active ? '🟢 Ativo' : '🔴 Inativo';
    const channelInput  = form.channel_input  ? `<#${form.channel_input}>`  : '`Não definido`';
    const channelOutput = form.channel_output ? `<#${form.channel_output}>` : '`Não definido`';
    const roles = (form.roles_responsible || []).length > 0
        ? form.roles_responsible.map(r => `<@&${r}>`).join(', ')
        : '`Nenhum`';

    const container = new ContainerBuilder().setAccentColor(0x5865F2);
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_staff_emoji') || '📋'} ${form.name}\n` +
            `-# Status: ${statusText}\n\n` +
            `**Canal de Envio:** ${channelInput}\n` +
            `**Canal de Resultados:** ${channelOutput}\n` +
            `**Cargos Responsáveis:** ${roles}\n` +
            `**Botão:** \`${form.button_label}\`${form.button_emoji ? ` ${form.button_emoji}` : ''}\n` +
            `**Perguntas:** ${(form.questions || []).length}\n` +
            `**Aprovação:** ${form.approval_required ? 'Obrigatória' : 'Automática'}\n` +
            `**Limite por usuário:** ${form.limit_per_user ? form.limit_per_user + ' envio(s)' : 'Ilimitado'}`
        )
    );
    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`form_btn_canais_${guildId}_${slotId}`).setLabel('Configurar Canais').setEmoji('1501803997583904810').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`form_btn_cargos_${guildId}_${slotId}`).setLabel('Cargos Responsáveis').setEmoji('1371577447031640124').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`form_btn_botao_${guildId}_${slotId}`).setLabel('Configurar Botão').setEmoji('1371593624852234280').setStyle(ButtonStyle.Primary),
        )
    );
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`form_btn_perguntas_${guildId}_${slotId}`).setLabel('Perguntas').setEmoji('1501804003850322052').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`form_btn_categorias_${guildId}_${slotId}`).setLabel('Categorias').setEmoji('1501804013262475275').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`form_btn_aprovacao_${guildId}_${slotId}`).setLabel(`Aprovação: ${form.approval_required ? 'Ativa' : 'Inativa'}`).setEmoji('1501803932484108359').setStyle(form.approval_required ? ButtonStyle.Success : ButtonStyle.Secondary),
        )
    );
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`form_btn_limite_${guildId}_${slotId}`).setLabel('Limitar Envio').setEmoji('1371593625112285208').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`form_btn_embeds_${guildId}_${slotId}`).setLabel('Embeds').setEmoji('1501804122943389716').setStyle(ButtonStyle.Secondary),
        )
    );
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`form_btn_voltar_${guildId}_${slotId}`).setLabel('Voltar').setEmoji('1371593637179297923').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`form_btn_deletar_${guildId}_${slotId}`).setLabel('Deletar Formulário').setEmoji('1501803935453679616').setStyle(ButtonStyle.Danger),
        )
    );

    return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

function buildFormManagePayload(guildId, userId) {
    const slots = formularios.get(guildId) || {};
    const existingSlots = Object.entries(slots).filter(([, v]) => v !== null && v !== undefined);

    const container = new ContainerBuilder().setAccentColor(0x5865F2);

    if (existingSlots.length === 0) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## ${Emojis.get('_staff_emoji') || '📋'} Gerenciar Formulários\n` +
                `-# Nenhum formulário criado ainda.\n` +
                `Use **Criar Formulário** no menu /config para criar um.`
            )
        );
        return { components: [container], flags: MessageFlags.IsComponentsV2 };
    }

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_staff_emoji') || '📋'} Gerenciar Formulários\n` +
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
        ? questions.map((q, i) => `-# ${i + 1}. **${q.text}** (${q.type === 'long' ? 'Longa' : 'Curta'})`).join('\n')
        : '-# Nenhuma pergunta adicionada ainda.';

    const container = new ContainerBuilder().setAccentColor(0x5865F2);
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_lapis_emoji') || '✏️'} Perguntas — ${form.name || `Formulário ${slotId}`}\n` +
            `${qLines}\n\n-# Máximo de 5 perguntas por formulário`
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
                .setDisabled(questions.length >= 5),
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

// ──────────────────────────────────────────────
// Função pública: chamada do configDropdown após deferReply
// ──────────────────────────────────────────────

async function handleFormAction(interaction, client, action) {
    const guildId = interaction.guild.id;
    const userId  = interaction.user.id;

    if (action === 'form_create') {
        const slots = formularios.get(guildId) || {};
        let slotId = null;
        for (let i = 1; i <= 5; i++) {
            if (!slots[String(i)]) { slotId = String(i); break; }
        }
        if (!slotId) {
            await interaction.editReply({
                content: `${Emojis.get('negative_emoji')} Limite de 5 formulários atingido. Delete um antes de criar outro.`,
            });
            return;
        }

        const existingCount = Object.keys(slots).filter(k => slots[k]).length;
        slots[slotId] = {
            name: `Formulário ${existingCount + 1}`,
            created_at: new Date().toISOString(),
            channel_input: null,
            channel_output: null,
            roles_responsible: [],
            button_label: 'Abrir Formulário',
            button_emoji: null,
            questions: [],
            categories: [],
            approval_required: false,
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

// ──────────────────────────────────────────────
// Handler de eventos (botões, selects, modais)
// ──────────────────────────────────────────────

module.exports = {
    name: 'interactionCreate',
    handleFormAction,

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            // ── Select menu: lista de formulários (gerenciar) ──
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

            // ── Role select menu: cargos responsáveis ──
            if (interaction.isRoleSelectMenu() && customId.startsWith('form_roles_')) {
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

            // ── Botões de formulário ──
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

                // Deletar (mostra confirmação)
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

                // Confirmar deleção
                if (action === 'confirmdel') {
                    const slots = formularios.get(guildId) || {};
                    delete slots[slotId];
                    formularios.set(guildId, slots);
                    await interaction.deferUpdate();
                    await interaction.editReply(buildFormManagePayload(guildId, interaction.user.id));
                    return;
                }

                // Toggle aprovação
                if (action === 'aprovacao') {
                    const slots = formularios.get(guildId) || {};
                    if (slots[slotId]) {
                        slots[slotId].approval_required = !slots[slotId].approval_required;
                        formularios.set(guildId, slots);
                    }
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

                // Cargos (role select inline)
                if (action === 'cargos') {
                    const slots = formularios.get(guildId) || {};
                    const form  = slots[slotId] || {};
                    const container = new ContainerBuilder().setAccentColor(0x5865F2);
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## ${Emojis.get('_staff_emoji') || '👥'} Cargos Responsáveis\n` +
                            `Selecione os cargos que podem gerenciar os envios deste formulário.\n\n` +
                            `-# Atual: ${(form.roles_responsible || []).length > 0 ? form.roles_responsible.map(r => `<@&${r}>`).join(', ') : '`Nenhum`'}`
                        )
                    );
                    container.addSeparatorComponents(new SeparatorBuilder());
                    container.addActionRowComponents(
                        new ActionRowBuilder().addComponents(
                            new RoleSelectMenuBuilder()
                                .setCustomId(`form_roles_${guildId}_${slotId}`)
                                .setPlaceholder('Selecionar cargos...')
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

                // Botões que abrem modal
                const modalHandlers = {
                    canais: async () => {
                        const slots = formularios.get(guildId) || {};
                        const form  = slots[slotId] || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_canais_${guildId}_${slotId}`).setTitle('Configurar Canais');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('channel_input').setLabel('Canal de Envio (ID do canal)').setValue(form.channel_input || '').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('ID do canal onde os formulários serão enviados')
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('channel_output').setLabel('Canal de Resultados (ID do canal)').setValue(form.channel_output || '').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('ID do canal onde os resultados são enviados')
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
                                new TextInputBuilder().setCustomId('button_label').setLabel('Texto do Botão').setValue(form.button_label || 'Abrir Formulário').setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('button_emoji').setLabel('Emoji do Botão (Opcional)').setValue(form.button_emoji || '').setStyle(TextInputStyle.Short).setRequired(false)
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    limite: async () => {
                        const slots = formularios.get(guildId) || {};
                        const form  = slots[slotId] || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_limite_${guildId}_${slotId}`).setTitle('Limitar Envio');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('limit').setLabel('Limite de Envios por Usuário (0 = ilimitado)').setValue(form.limit_per_user ? String(form.limit_per_user) : '0').setStyle(TextInputStyle.Short).setRequired(true)
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    categorias: async () => {
                        const slots = formularios.get(guildId) || {};
                        const form  = slots[slotId] || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_categorias_${guildId}_${slotId}`).setTitle('Configurar Categorias');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('categories').setLabel('Categorias (uma por linha)').setValue((form.categories || []).join('\n')).setStyle(TextInputStyle.Paragraph).setRequired(false).setPlaceholder('Ex:\nSuporte\nDúvidas\nOutros')
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    addperg: async () => {
                        const slots = formularios.get(guildId) || {};
                        const form  = slots[slotId] || {};
                        if ((form.questions || []).length >= 5) {
                            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 5 perguntas por formulário.`, ephemeral: true });
                        }
                        const modal = new ModalBuilder().setCustomId(`form_modal_addperg_${guildId}_${slotId}`).setTitle('Adicionar Pergunta');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('question_text').setLabel('Texto da Pergunta').setStyle(TextInputStyle.Short).setMaxLength(200).setRequired(true)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('question_long').setLabel('Resposta longa? (sim/não)').setValue('não').setStyle(TextInputStyle.Short).setRequired(false)
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    embeds: async () => {
                        const slots = formularios.get(guildId) || {};
                        const form  = slots[slotId] || {};
                        const emb   = form.embed || {};
                        const modal = new ModalBuilder().setCustomId(`form_modal_embeds_${guildId}_${slotId}`).setTitle('Configurar Embed do Formulário');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('embed_title').setLabel('Título da Embed').setValue(emb.title || '').setStyle(TextInputStyle.Short).setRequired(false)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('embed_description').setLabel('Descrição da Embed').setValue(emb.description || '').setStyle(TextInputStyle.Paragraph).setRequired(false)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder().setCustomId('embed_color').setLabel('Cor da Embed (Hex, ex: 5865F2)').setValue(emb.color || '5865F2').setStyle(TextInputStyle.Short).setRequired(false)
                            )
                        );
                        await interaction.showModal(modal);
                    },
                };

                if (modalHandlers[action]) await modalHandlers[action]();
                return;
            }

            // ── Modal submits de formulário ──
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
                            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal de envio não encontrado.`, ephemeral: true });
                        slots[slotId].channel_input = channelInput;
                    } else { slots[slotId].channel_input = null; }
                    if (channelOutput) {
                        if (!interaction.guild.channels.cache.get(channelOutput))
                            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal de resultados não encontrado.`, ephemeral: true });
                        slots[slotId].channel_output = channelOutput;
                    } else { slots[slotId].channel_output = null; }
                    formularios.set(guildId, slots);
                    await interaction.update(buildFormPanelPayload(guildId, slotId));

                } else if (action === 'botao') {
                    const label = interaction.fields.getTextInputValue('button_label').trim();
                    const emoji = interaction.fields.getTextInputValue('button_emoji').trim();
                    slots[slotId].button_label = label || 'Abrir Formulário';
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

                } else if (action === 'categorias') {
                    const raw = interaction.fields.getTextInputValue('categories').trim();
                    slots[slotId].categories = raw ? raw.split('\n').map(c => c.trim()).filter(Boolean) : [];
                    formularios.set(guildId, slots);
                    await interaction.update(buildFormPanelPayload(guildId, slotId));

                } else if (action === 'addperg') {
                    const text = interaction.fields.getTextInputValue('question_text').trim();
                    const long = interaction.fields.getTextInputValue('question_long').trim().toLowerCase() === 'sim';
                    if (!slots[slotId].questions) slots[slotId].questions = [];
                    slots[slotId].questions.push({ text, type: long ? 'long' : 'short' });
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
