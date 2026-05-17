const {
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, RoleSelectMenuBuilder, ChannelSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MediaGalleryBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    MessageFlags, ChannelType,
} = require('discord.js');
const { formularios, Emojis, configuracao } = require('../../Database');
const { BOT_EMOJI_OPTIONS } = require('../../Functions/TicketAparenciaBuilder');

// Lock para evitar duplicação de perguntas por double-submit
const pergLock = new Set();

// ─────────────────────────────────────────────────────────────────────────────
// EDITOR DE APARÊNCIA (LIVE PREVIEW — Component V2) — estado por usuário
// ─────────────────────────────────────────────────────────────────────────────
const formEmbedSessions = new Map();

const EMB_NAV_OPTIONS = [
    { label: 'Menu Principal', value: 'main',        description: 'Voltar ao menu do editor',      emoji: { id: '1501804019184828507' } },
    { label: 'Título',         value: 'title',       description: 'Editar título do formulário',   emoji: { id: '1501804003850322052' } },
    { label: 'Descrição',      value: 'description', description: 'Editar texto de descrição',     emoji: { id: '1501804039451709441' } },
    { label: 'Imagem',         value: 'image',       description: 'Editar banner/imagem',          emoji: { id: '1501803928973476023' } },
    { label: 'Footer',         value: 'footer',      description: 'Editar texto do rodapé',        emoji: { id: '1501804120615555132' } },
];

const EMB_SECTION_LABELS = {
    title: 'Título', description: 'Descrição', image: 'URL da Imagem', footer: 'Texto do Footer',
};

function buildFormEmbedPreviewContainer(data, formName, placeholderLabel) {
    const title = data.title || formName || 'Formulário';
    const desc  = data.description || 'Selecione uma opção abaixo para iniciar sua aplicação.';
    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `-# ${Emojis.get('_search_emoji')} Pré-visualização — como o formulário aparecerá no servidor\n\n` +
        `## ${Emojis.get('_messages_emoji')} ${title}\n${desc}`
    ));
    if (data.image) {
        try {
            c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems({ media: { url: data.image } }));
        } catch (e) {}
    }
    c.addSeparatorComponents(new SeparatorBuilder());
    if (data.footer) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${data.footer}`));
    }
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('_form_prev_disabled')
            .setPlaceholder(placeholderLabel || 'Selecione uma área para iniciar seu formulário...')
            .setDisabled(true)
            .addOptions([{ label: 'Selecione uma área para iniciar seu formulário...', value: '_prev' }])
    ));
    return c;
}

function buildFormEmbedEditorContainer(userId, guildId, slotId, section, data) {
    const titleVal = data.title       ? `\`${data.title.slice(0, 45)}\``              : '`Não definido`';
    const descVal  = data.description ? `\`${data.description.slice(0, 35)}...\``     : '`Não definida`';
    const imgVal   = data.image       ? `${Emojis.get('confirmed_emoji')} Definida`   : `${Emojis.get('negative_emoji')} Nenhuma`;
    const ftrVal   = data.footer      ? `\`${data.footer.slice(0, 45)}\``             : '`Nenhum`';

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Editor de Aparência\n` +
        `-# As alterações são refletidas na pré-visualização acima em tempo real.\n\n` +
        `${Emojis.get('_text_emoji')} **Título:** ${titleVal}\n` +
        `${Emojis.get('_messages_emoji')} **Descrição:** ${descVal}\n` +
        `${Emojis.get('_search_emoji')} **Imagem:** ${imgVal}\n` +
        `${Emojis.get('_fixe_emoji')} **Footer:** ${ftrVal}`
    ));
    c.addSeparatorComponents(new SeparatorBuilder());
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`form_emb_nav_${userId}_${guildId}_${slotId}`)
            .setPlaceholder('Selecionar propriedade para editar...')
            .addOptions(EMB_NAV_OPTIONS.map(o => ({ ...o, default: o.value === (section || 'main') })))
    ));
    if (section && section !== 'main') {
        const label = EMB_SECTION_LABELS[section] || section;
        c.addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`form_emb_set_${section}_${userId}_${guildId}_${slotId}`)
                .setLabel(`Definir ${label.split(' ')[0]}`)
                .setEmoji({ id: '1501804003850322052' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`form_emb_remove_${section}_${userId}_${guildId}_${slotId}`)
                .setLabel('Remover')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`form_emb_save_${userId}_${guildId}_${slotId}`)
                .setLabel('Salvar')
                .setEmoji({ id: '1501803932484108359' })
                .setStyle(ButtonStyle.Success),
        ));
    } else {
        c.addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`form_emb_save_${userId}_${guildId}_${slotId}`)
                .setLabel('Salvar Aparência')
                .setEmoji({ id: '1501803932484108359' })
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`form_emb_reset_${userId}_${guildId}_${slotId}`)
                .setLabel('Resetar')
                .setEmoji({ id: '1501803926180335727' })
                .setStyle(ButtonStyle.Danger),
        ));
    }
    return c;
}

const EMB_CV2 = { flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };

function buildFormEmbedMainMenu(userId, guildId, slotId) {
    const sess        = formEmbedSessions.get(userId) || { data: {} };
    const formName    = sess.formName || `Formulário ${slotId}`;
    const form        = (formularios.get(guildId) || {})[slotId] || {};
    return {
        components: [
            buildFormEmbedPreviewContainer(sess.data, formName, form.button_label),
            buildFormEmbedEditorContainer(userId, guildId, slotId, 'main', sess.data),
        ],
        ...EMB_CV2,
    };
}

function buildFormEmbedSection(userId, guildId, slotId, section) {
    const sess        = formEmbedSessions.get(userId) || { data: {} };
    const formName    = sess.formName || `Formulário ${slotId}`;
    const form        = (formularios.get(guildId) || {})[slotId] || {};
    return {
        components: [
            buildFormEmbedPreviewContainer(sess.data, formName, form.button_label),
            buildFormEmbedEditorContainer(userId, guildId, slotId, section, sess.data),
        ],
        ...EMB_CV2,
    };
}

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
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${Emojis.get('negative_emoji')} Formulário não encontrado.`
        ));
        return { components: [c], flags: MessageFlags.IsComponentsV2 };
    }

    const statusIcon   = form.active ? Emojis.get('confirmed_emoji') : Emojis.get('error');
    const statusText   = form.active ? 'Ativo' : 'Inativo';
    const chInput      = form.channel_input  ? `<#${form.channel_input}>`  : `\`Não definido\``;
    const chOutput     = form.channel_output ? `<#${form.channel_output}>` : `\`Não definido\``;
    const staffRoles   = (form.roles_responsible || []).length > 0
        ? form.roles_responsible.map(r => `<@&${r}>`).join(', ')
        : `\`Nenhum\``;
    const roleAprovado = form.role_approved ? `<@&${form.role_approved}>` : `\`Não definido\``;
    const timeLimit    = form.time_limit || 120;
    const qtdPerguntas = (form.questions || []).length;
    const limite       = form.limit_per_user ? `${form.limit_per_user} envio(s)` : `Ilimitado`;

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_messages_emoji')} ${form.name}\n` +
        `-# ${statusIcon} ${statusText}\n\n` +
        `${Emojis.get('_transfer_emoji')} **Canal do Formulário:** ${chInput}\n` +
        `${Emojis.get('_folder_emoji')} **Canal de Logs:** ${chOutput}\n` +
        `${Emojis.get('_staff_emoji')} **Staff Responsável:** ${staffRoles}\n` +
        `${Emojis.get('permissions_emoji')} **Cargo ao Aprovar:** ${roleAprovado}\n` +
        `${Emojis.get('_lapis_emoji')} **Placeholder:** \`${form.button_label || 'Selecione uma área para iniciar seu formulário...'}\`\n` +
        `${Emojis.get('_lapis_emoji')} **Perguntas:** ${qtdPerguntas}/10\n` +
        `${Emojis.get('clock_emoji')} **Tempo por Pergunta:** ${timeLimit}s\n` +
        `${Emojis.get('_fixe_emoji')} **Limite por Usuário:** ${limite}`
    ));
    c.addSeparatorComponents(new SeparatorBuilder());

    // Select menu de configurações
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`form_config_select_${guildId}_${slotId}`)
            .setPlaceholder('Selecione uma opção para configurar...')
            .addOptions([
                { label: 'Configurar Canais',    value: 'canais',       description: 'Canal do formulário e canal de logs',          emoji: { id: '1501803997583904810' } },
                { label: 'Staff Responsável',    value: 'cargos',       description: 'Cargos com acesso às respostas',               emoji: { id: '1501803902046048297' } },
                { label: 'Configurar Menu',      value: 'botao',        description: 'Placeholder e emoji do select menu',           emoji: { id: '1501804003850322052' } },
                { label: 'Perguntas',            value: 'perguntas',    description: 'Adicionar e remover perguntas',                emoji: { id: '1502520447340777482' } },
                { label: 'Cargo ao Aprovar',     value: 'cargoaprovado', description: 'Cargo concedido ao aprovar candidato',        emoji: { id: '1501804064596558017' } },
                { label: 'Tempo por Pergunta',   value: 'timelimit',    description: 'Segundos disponíveis para cada pergunta',      emoji: { id: '1501804058699366470' } },
                { label: 'Limitar Envios',       value: 'limite',       description: 'Quantidade máxima de envios por usuário',      emoji: { id: '1501804061719007232' } },
                { label: 'Aparência',            value: 'embeds',         description: 'Título, descrição e imagem do formulário',       emoji: { id: '1501804122943389716' } },
                { label: 'Opções do Menu',       value: 'selectoptions',  description: 'Gerenciar opções do select menu do painel',      emoji: { id: '1501804013262475275' } },
                { label: 'Renomear',             value: 'nome',           description: 'Alterar o nome interno do formulário',           emoji: { id: '1501804003850322052' } },
            ])
    ));

    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`form_btn_postar_${guildId}_${slotId}`)
            .setLabel('Postar Formulário')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(ButtonStyle.Success),
    ));

    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`form_btn_voltar_${guildId}_${slotId}`)
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`form_btn_deletar_${guildId}_${slotId}`)
            .setLabel('Deletar Formulário')
            .setEmoji({ id: '1501803926180335727' })
            .setStyle(ButtonStyle.Danger),
    ));

    return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

// ─────────────────────────────────────────────────────────────────────────────
// PAINEL DE CONFIGURAÇÃO DE CANAIS (ChannelSelectMenu)
// ─────────────────────────────────────────────────────────────────────────────
function buildChannelConfigPayload(guildId, slotId) {
    const form = (formularios.get(guildId) || {})[slotId] || {};
    const chInput  = form.channel_input  ? `<#${form.channel_input}>`  : `\`Não definido\``;
    const chOutput = form.channel_output ? `<#${form.channel_output}>` : `\`Não definido\``;

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_transfer_emoji')} Configurar Canais\n` +
        `Configure os canais do formulário usando os menus abaixo.\n\n` +
        `${Emojis.get('_messages_emoji')} **Canal do Formulário:** ${chInput}\n` +
        `-# O painel com o botão de aplicação será postado neste canal.\n\n` +
        `${Emojis.get('_folder_emoji')} **Canal de Logs:** ${chOutput}\n` +
        `-# As respostas dos candidatos aparecerão neste canal.`
    ));
    c.addSeparatorComponents(new SeparatorBuilder());

    // Select canal do formulário
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId(`form_chanin_${guildId}_${slotId}`)
            .setPlaceholder('Selecionar canal do formulário...')
            .addChannelTypes(ChannelType.GuildText)
            .setMinValues(1)
            .setMaxValues(1)
    ));

    // Select canal de logs
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId(`form_chanout_${guildId}_${slotId}`)
            .setPlaceholder('Selecionar canal de logs...')
            .addChannelTypes(ChannelType.GuildText)
            .setMinValues(1)
            .setMaxValues(1)
    ));

    // Voltar
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`form_btn_voltarform_${guildId}_${slotId}`)
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(ButtonStyle.Secondary),
    ));

    return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTA DE FORMULÁRIOS
// ─────────────────────────────────────────────────────────────────────────────
function buildFormManagePayload(guildId, userId) {
    const slots    = formularios.get(guildId) || {};
    const existing = Object.entries(slots).filter(([k, v]) =>
        v !== null && v !== undefined &&
        !k.startsWith('submissions') && !k.startsWith('responses')
    );

    const c = new ContainerBuilder();

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

    const c = new ContainerBuilder();
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
            .setEmoji({ id: '1501803908589162537' })
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
        const slots     = formularios.get(guildId) || {};
        const dataSlots = Object.entries(slots).filter(([k, v]) =>
            v !== null && v !== undefined &&
            !k.startsWith('submissions') && !k.startsWith('responses')
        );
        if (dataSlots.length >= 5) {
            await interaction.reply({
                content: `${Emojis.get('negative_emoji')} Limite de 5 formulários atingido. Delete um antes de criar outro.`,
                ephemeral: true,
            });
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
            button_label: 'Selecione uma área para iniciar seu formulário...',
            button_emoji: null,
            selectOptions: [{ label: 'Selecione uma área para iniciar seu formulário...', emoji: null, description: '' }],
            questions: [],
            time_limit: 120,
            limit_per_user: null,
            embed: { title: null, description: null, color: '5865F2' },
            active: false,
        };
        formularios.set(guildId, slots);
        await interaction.reply({ ephemeral: true, ...buildFormPanelPayload(guildId, slotId) });
        const { logAction } = require('../../Functions/AuditLog.js');
        logAction(client, { action: 'Formulário Criado', details: `Slot \`${slotId}\` criado`, userId, guildId });

    } else if (action === 'form_manage') {
        await interaction.reply({ ephemeral: true, ...buildFormManagePayload(guildId, userId) });
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

            // ── Select: lista de formulários ─────────────────────────────
            if (interaction.isStringSelectMenu() && customId.startsWith('form_select_')) {
                const userId = customId.slice('form_select_'.length);
                if (userId !== interaction.user.id) return;
                const val   = interaction.values[0];
                const parts = val.split('_');
                const sid   = parts[parts.length - 1];
                const gid   = parts[parts.length - 2];
                await interaction.deferUpdate();
                await interaction.editReply(buildFormPanelPayload(gid, sid));
                return;
            }

            // ── StringSelect: form_config_select (painel do formulário) ──
            if (interaction.isStringSelectMenu() && customId.startsWith('form_config_select_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const action  = interaction.values[0];

                // Ações que abrem modais — NÃO defere antes
                const modalActions = {
                    botao: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        const modal = new ModalBuilder()
                            .setCustomId(`form_modal_botao_${guildId}_${slotId}`)
                            .setTitle('Configurar Menu');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('button_label')
                                    .setLabel('Placeholder do Menu')
                                    .setValue(form.button_label || 'Selecione uma área para iniciar seu formulário...')
                                    .setStyle(TextInputStyle.Short)
                                    .setMaxLength(80)
                                    .setRequired(true)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('button_emoji')
                                    .setLabel('ID do Emoji do bot (deixe vazio p/ nenhum)')
                                    .setValue(form.button_emoji || '')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(false)
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    limite: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        const modal = new ModalBuilder()
                            .setCustomId(`form_modal_limite_${guildId}_${slotId}`)
                            .setTitle('Limitar Envios por Usuário');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('limit')
                                    .setLabel('Limite (0 = ilimitado)')
                                    .setValue(form.limit_per_user ? String(form.limit_per_user) : '0')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                                    .setPlaceholder('Ex: 1 para permitir somente um envio')
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    timelimit: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        const modal = new ModalBuilder()
                            .setCustomId(`form_modal_timelimit_${guildId}_${slotId}`)
                            .setTitle('Tempo Limite por Pergunta');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('timelimit')
                                    .setLabel('Segundos por Pergunta (30 — 600)')
                                    .setValue(String((formularios.get(guildId) || {})[slotId]?.time_limit || 120))
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                                    .setPlaceholder('Ex: 120')
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    nome: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        const modal = new ModalBuilder()
                            .setCustomId(`form_modal_nome_${guildId}_${slotId}`)
                            .setTitle('Renomear Formulário');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('nome')
                                    .setLabel('Nome do Formulário')
                                    .setValue(form.name || '')
                                    .setStyle(TextInputStyle.Short)
                                    .setMaxLength(80)
                                    .setRequired(true)
                            )
                        );
                        await interaction.showModal(modal);
                    },
                };

                if (modalActions[action]) {
                    await modalActions[action]();
                    return;
                }

                // Ações de navegação — defere e abre painel
                await interaction.deferUpdate();

                if (action === 'canais') {
                    await interaction.editReply(buildChannelConfigPayload(guildId, slotId));
                } else if (action === 'cargos') {
                    await interaction.editReply(buildStaffConfigPayload(guildId, slotId));
                } else if (action === 'perguntas') {
                    await interaction.editReply(buildQuestionsPanelPayload(guildId, slotId));
                } else if (action === 'cargoaprovado') {
                    await interaction.editReply(buildAprovadoConfigPayload(guildId, slotId));
                } else if (action === 'embeds') {
                    const form = (formularios.get(guildId) || {})[slotId] || {};
                    const emb  = form.embed || {};
                    formEmbedSessions.set(interaction.user.id, {
                        guildId, slotId,
                        formName: form.name || `Formulário ${slotId}`,
                        data: {
                            title:       emb.title       || null,
                            description: emb.description || null,
                            image:       emb.image       || null,
                            footer:      emb.footer      || null,
                        }
                    });
                    await interaction.editReply(buildFormEmbedMainMenu(interaction.user.id, guildId, slotId));
                } else if (action === 'selectoptions') {
                    await interaction.editReply(buildSelectOptionsPanel(guildId, slotId));
                }
                return;
            }

            // ── ChannelSelect: canal do formulário ────────────────────────
            if (interaction.isChannelSelectMenu() && customId.startsWith('form_chanin_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const slots   = formularios.get(guildId) || {};
                if (slots[slotId]) {
                    slots[slotId].channel_input = interaction.values[0] || null;
                    formularios.set(guildId, slots);
                    const { logAction } = require('../../Functions/AuditLog.js');
                    logAction(client, { action: 'Canal do Formulário configurado', details: `Slot \`${slotId}\`: <#${interaction.values[0]}>`, userId: interaction.user.id, guildId });
                }
                await interaction.deferUpdate();
                await interaction.editReply(buildChannelConfigPayload(guildId, slotId));
                return;
            }

            // ── ChannelSelect: canal de logs ──────────────────────────────
            if (interaction.isChannelSelectMenu() && customId.startsWith('form_chanout_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const slots   = formularios.get(guildId) || {};
                if (slots[slotId]) {
                    slots[slotId].channel_output = interaction.values[0] || null;
                    formularios.set(guildId, slots);
                    const { logAction } = require('../../Functions/AuditLog.js');
                    logAction(client, { action: 'Canal de Logs do Formulário configurado', details: `Slot \`${slotId}\`: <#${interaction.values[0]}>`, userId: interaction.user.id, guildId });
                }
                await interaction.deferUpdate();
                await interaction.editReply(buildChannelConfigPayload(guildId, slotId));
                return;
            }

            // ── RoleSelect: staff responsável ─────────────────────────────
            if (interaction.isRoleSelectMenu() && customId.startsWith('form_roles_resp_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const slots   = formularios.get(guildId) || {};
                if (slots[slotId]) {
                    slots[slotId].roles_responsible = interaction.values;
                    formularios.set(guildId, slots);
                    const { logAction } = require('../../Functions/AuditLog.js');
                    logAction(client, { action: 'Cargos Responsáveis do Formulário configurados', details: `Slot \`${slotId}\`: ${interaction.values.map(r => `<@&${r}>`).join(', ')}`, userId: interaction.user.id, guildId });
                }
                await interaction.deferUpdate();
                await interaction.editReply(buildStaffConfigPayload(guildId, slotId));
                return;
            }

            // ── RoleSelect: cargo ao aprovar ──────────────────────────────
            if (interaction.isRoleSelectMenu() && customId.startsWith('form_roles_aprov_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const slots   = formularios.get(guildId) || {};
                if (slots[slotId]) {
                    slots[slotId].role_approved = interaction.values[0] || null;
                    formularios.set(guildId, slots);
                    const { logAction } = require('../../Functions/AuditLog.js');
                    logAction(client, { action: 'Cargo de Aprovação do Formulário configurado', details: `Slot \`${slotId}\`: <@&${interaction.values[0]}>`, userId: interaction.user.id, guildId });
                }
                await interaction.deferUpdate();
                await interaction.editReply(buildAprovadoConfigPayload(guildId, slotId));
                return;
            }

            // ── Botões form_btn_* ─────────────────────────────────────────
            if (interaction.isButton() && customId.startsWith('form_btn_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const action  = parts.slice(2, parts.length - 2).join('_');

                // Navegação — voltar para lista
                if (action === 'voltar') {
                    await interaction.deferUpdate();
                    await interaction.editReply(buildFormManagePayload(guildId, interaction.user.id));
                    return;
                }

                // Navegação — voltar para painel do form
                if (action === 'voltarform') {
                    await interaction.deferUpdate();
                    await interaction.editReply(buildFormPanelPayload(guildId, slotId));
                    return;
                }

                // Canais — abre painel com ChannelSelectMenus
                if (action === 'canais') {
                    await interaction.deferUpdate();
                    await interaction.editReply(buildChannelConfigPayload(guildId, slotId));
                    return;
                }

                // Perguntas — abre painel
                if (action === 'perguntas') {
                    await interaction.deferUpdate();
                    await interaction.editReply(buildQuestionsPanelPayload(guildId, slotId));
                    return;
                }

                // Remover última pergunta
                if (action === 'delperg') {
                    const slots = formularios.get(guildId) || {};
                    if (slots[slotId]?.questions?.length > 0) {
                        const removedQ = slots[slotId].questions[slots[slotId].questions.length - 1];
                        slots[slotId].questions.pop();
                        formularios.set(guildId, slots);
                        const { logAction } = require('../../Functions/AuditLog.js');
                        logAction(client, { action: 'Pergunta do Formulário removida', details: `Slot \`${slotId}\`: \`${removedQ?.text || 'desconhecida'}\``, userId: interaction.user.id, guildId });
                    }
                    await interaction.deferUpdate();
                    await interaction.editReply(buildQuestionsPanelPayload(guildId, slotId));
                    return;
                }

                // Cargos do staff
                if (action === 'cargos') {
                    await interaction.deferUpdate();
                    await interaction.editReply(buildStaffConfigPayload(guildId, slotId));
                    return;
                }

                // Cargo ao aprovar
                if (action === 'cargoaprovado') {
                    await interaction.deferUpdate();
                    await interaction.editReply(buildAprovadoConfigPayload(guildId, slotId));
                    return;
                }

                // Deletar — confirmação
                if (action === 'deletar') {
                    const form = (formularios.get(guildId) || {})[slotId];
                    const c = new ContainerBuilder();
                    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('warn_emoji')} Deletar Formulário\n` +
                        `Tem certeza que deseja deletar **${form?.name || `Formulário ${slotId}`}**?\n\n` +
                        `-# Esta ação não pode ser desfeita.`
                    ));
                    c.addSeparatorComponents(new SeparatorBuilder());
                    c.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`form_btn_confirmdel_${guildId}_${slotId}`)
                            .setLabel('Confirmar Deleção')
                            .setEmoji({ id: '1501803926180335727' })
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId(`form_btn_voltarform_${guildId}_${slotId}`)
                            .setLabel('Cancelar')
                            .setEmoji({ id: '1501803908589162537' })
                            .setStyle(ButtonStyle.Secondary),
                    ));
                    await interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2 });
                    return;
                }

                // Confirmar deleção
                if (action === 'confirmdel') {
                    const slots = formularios.get(guildId) || {};
                    const formName = slots[slotId]?.name || `Formulário ${slotId}`;
                    delete slots[slotId];
                    formularios.set(guildId, slots);
                    const { logAction } = require('../../Functions/AuditLog.js');
                    logAction(client, { action: 'Formulário deletado', details: `Nome: \`${formName}\`, Slot: \`${slotId}\``, userId: interaction.user.id, guildId });
                    await interaction.deferUpdate();
                    await interaction.editReply(buildFormManagePayload(guildId, interaction.user.id));
                    return;
                }

                // Postar formulário
                if (action === 'postar') {
                    const slots = formularios.get(guildId) || {};
                    const form  = slots[slotId];
                    if (!form) return;

                    if (!form.channel_input)
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Configure o **Canal do Formulário** antes de postar.`, ephemeral: true });
                    if (!form.channel_output)
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Configure o **Canal de Logs** antes de postar.`, ephemeral: true });
                    if ((form.questions || []).length === 0)
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Adicione pelo menos **uma pergunta** antes de postar.`, ephemeral: true });

                    const channel = interaction.guild.channels.cache.get(form.channel_input);
                    if (!channel)
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal do formulário não encontrado. Reconfigure.`, ephemeral: true });

                    const embedColor = parseInt((form.embed?.color || '5865F2').replace('#', ''), 16);
                    const formTitle  = form.embed?.title || form.name;
                    const formDesc   = form.embed?.description || `Clique no botão abaixo para iniciar sua aplicação.`;

                    const fc = new ContainerBuilder();
                    fc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('_messages_emoji')} ${formTitle}\n${formDesc}`
                    ));
                    if (form.embed?.image) {
                        try { fc.addMediaGalleryComponents(new MediaGalleryBuilder().addItems({ media: { url: form.embed.image } })); } catch (e) {}
                    }
                    fc.addSeparatorComponents(new SeparatorBuilder());

                    const rawOpts = form.selectOptions && form.selectOptions.length > 0
                        ? form.selectOptions
                        : [{ label: 'Selecione uma área para iniciar seu formulário...', emoji: null, description: '' }];
                    const selectOpts = rawOpts.slice(0, 25).map((opt, i) => {
                        const o = { label: (opt.label || 'Opção').slice(0, 100), value: String(i) };
                        if (opt.description) o.description = opt.description.slice(0, 100);
                        if (opt.emoji && /^\d+$/.test(opt.emoji)) o.emoji = { id: opt.emoji };
                        return o;
                    });
                    fc.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`fstart_${guildId}_${slotId}`)
                            .setPlaceholder(form.button_label || 'Selecione uma área para iniciar seu formulário...')
                            .addOptions(selectOpts)
                    ));

                    try {
                        await channel.send({ components: [fc], flags: MessageFlags.IsComponentsV2 });
                        slots[slotId].active = true;
                        formularios.set(guildId, slots);
                        const { logAction } = require('../../Functions/AuditLog.js');
                        logAction(client, { action: 'Formulário postado', details: `Nome: \`${form.name}\`, Canal: <#${form.channel_input}>`, userId: interaction.user.id, guildId });
                        await interaction.reply({
                            content: `${Emojis.get('confirmed_emoji')} Formulário postado em ${channel} com sucesso!`,
                            ephemeral: true,
                        });
                    } catch (e) {
                        await interaction.reply({
                            content: `${Emojis.get('negative_emoji')} Não consegui postar no canal. Verifique as permissões do bot.`,
                            ephemeral: true,
                        });
                    }
                    return;
                }

                // ── Modais ────────────────────────────────────────────────
                const modalHandlers = {
                    botao: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        const modal = new ModalBuilder()
                            .setCustomId(`form_modal_botao_${guildId}_${slotId}`)
                            .setTitle('Configurar Menu');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('button_label')
                                    .setLabel('Placeholder do Menu')
                                    .setValue(form.button_label || 'Selecione uma área para iniciar seu formulário...')
                                    .setStyle(TextInputStyle.Short)
                                    .setMaxLength(80)
                                    .setRequired(true)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('button_emoji')
                                    .setLabel('ID do Emoji do bot (deixe vazio p/ nenhum)')
                                    .setValue(form.button_emoji || '')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(false)
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    limite: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        const modal = new ModalBuilder()
                            .setCustomId(`form_modal_limite_${guildId}_${slotId}`)
                            .setTitle('Limitar Envios por Usuário');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('limit')
                                    .setLabel('Limite (0 = ilimitado)')
                                    .setValue(form.limit_per_user ? String(form.limit_per_user) : '0')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                                    .setPlaceholder('Ex: 1 para permitir somente um envio')
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    timelimit: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        const modal = new ModalBuilder()
                            .setCustomId(`form_modal_timelimit_${guildId}_${slotId}`)
                            .setTitle('Tempo Limite por Pergunta');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('timelimit')
                                    .setLabel('Segundos por Pergunta (30 — 600)')
                                    .setValue(String(form.time_limit || 120))
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                                    .setPlaceholder('Ex: 120')
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    nome: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        const modal = new ModalBuilder()
                            .setCustomId(`form_modal_nome_${guildId}_${slotId}`)
                            .setTitle('Renomear Formulário');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('nome')
                                    .setLabel('Nome do Formulário')
                                    .setValue(form.name || '')
                                    .setStyle(TextInputStyle.Short)
                                    .setMaxLength(80)
                                    .setRequired(true)
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    addperg: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        if ((form.questions || []).length >= 10)
                            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 10 perguntas atingido.`, ephemeral: true });
                        const modal = new ModalBuilder()
                            .setCustomId(`form_modal_addperg_${guildId}_${slotId}`)
                            .setTitle('Adicionar Pergunta');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('question_text')
                                    .setLabel('Texto da Pergunta')
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setMaxLength(300)
                                    .setRequired(true)
                                    .setPlaceholder('Digite a pergunta que será feita ao candidato...')
                            )
                        );
                        await interaction.showModal(modal);
                    },
                    embeds: async () => {
                        const form = (formularios.get(guildId) || {})[slotId] || {};
                        const emb  = form.embed || {};
                        formEmbedSessions.set(interaction.user.id, {
                            guildId, slotId,
                            formName: form.name || `Formulário ${slotId}`,
                            data: {
                                title:       emb.title       || null,
                                description: emb.description || null,
                                image:       emb.image       || null,
                                footer:      emb.footer      || null,
                            }
                        });
                        await interaction.reply({
                            ephemeral: true,
                            ...buildFormEmbedMainMenu(interaction.user.id, guildId, slotId)
                        });
                    },
                };

                if (modalHandlers[action]) await modalHandlers[action]();
                return;
            }

            // ── Modal: adicionar opção do select menu ─────────────────────
            if (interaction.isModalSubmit() && customId.startsWith('form_modal_addopt_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const slots   = formularios.get(guildId) || {};
                if (!slots[slotId]) return;
                const label = interaction.fields.getTextInputValue('opt_label').trim();
                const desc  = interaction.fields.getTextInputValue('opt_desc').trim();
                if (!label) return interaction.reply({ content: `${Emojis.get('negative_emoji')} O nome da opção não pode estar vazio.`, ephemeral: true });
                if (!slots[slotId].selectOptions) slots[slotId].selectOptions = [];
                if (slots[slotId].selectOptions.length >= 25)
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 25 opções atingido.`, ephemeral: true });
                slots[slotId].selectOptions.push({ label: label.slice(0, 100), emoji: null, description: desc.slice(0, 100) });
                formularios.set(guildId, slots);
                await interaction.update(buildSelectOptionsPanel(guildId, slotId));
                return;
            }

            // ── Modal: editar opção do select menu ────────────────────────
            if (interaction.isModalSubmit() && customId.startsWith('form_modal_editopt_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const optIdx  = parseInt(parts[parts.length - 3]);
                const slots   = formularios.get(guildId) || {};
                if (!slots[slotId]) return;
                const label = interaction.fields.getTextInputValue('opt_label').trim();
                const desc  = interaction.fields.getTextInputValue('opt_desc').trim();
                if (!label) return interaction.reply({ content: `${Emojis.get('negative_emoji')} O nome da opção não pode estar vazio.`, ephemeral: true });
                if (!slots[slotId].selectOptions) slots[slotId].selectOptions = [];
                if (slots[slotId].selectOptions[optIdx]) {
                    slots[slotId].selectOptions[optIdx].label = label.slice(0, 100);
                    slots[slotId].selectOptions[optIdx].description = desc.slice(0, 100);
                    formularios.set(guildId, slots);
                }
                await interaction.update(buildOptionEditPanel(guildId, slotId, optIdx));
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

                const { logAction } = require('../../Functions/AuditLog.js');

                if (action === 'botao') {
                    slots[slotId].button_label = interaction.fields.getTextInputValue('button_label').trim() || 'Selecione uma área para iniciar seu formulário...';
                    slots[slotId].button_emoji = interaction.fields.getTextInputValue('button_emoji').trim() || null;
                    formularios.set(guildId, slots);
                    logAction(client, { action: 'Botão do Formulário configurado', details: `Slot \`${slotId}\`: \`${slots[slotId].button_label}\``, userId: interaction.user.id, guildId });
                    await interaction.update(buildFormPanelPayload(guildId, slotId));

                } else if (action === 'limite') {
                    const limit = parseInt(interaction.fields.getTextInputValue('limit').trim());
                    if (isNaN(limit) || limit < 0)
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Valor inválido. Use um número inteiro positivo.`, ephemeral: true });
                    slots[slotId].limit_per_user = limit === 0 ? null : limit;
                    formularios.set(guildId, slots);
                    logAction(client, { action: 'Limite de envios do Formulário configurado', details: `Slot \`${slotId}\`: \`${limit === 0 ? 'ilimitado' : limit}\``, userId: interaction.user.id, guildId });
                    await interaction.update(buildFormPanelPayload(guildId, slotId));

                } else if (action === 'timelimit') {
                    let tl = parseInt(interaction.fields.getTextInputValue('timelimit').trim());
                    if (isNaN(tl)) tl = 120;
                    tl = Math.min(Math.max(tl, 30), 600);
                    slots[slotId].time_limit = tl;
                    formularios.set(guildId, slots);
                    logAction(client, { action: 'Tempo limite do Formulário configurado', details: `Slot \`${slotId}\`: \`${tl}s\``, userId: interaction.user.id, guildId });
                    await interaction.update(buildFormPanelPayload(guildId, slotId));

                } else if (action === 'nome') {
                    const nome = interaction.fields.getTextInputValue('nome').trim();
                    if (nome) slots[slotId].name = nome;
                    formularios.set(guildId, slots);
                    logAction(client, { action: 'Formulário renomeado', details: `Slot \`${slotId}\` → \`${nome}\``, userId: interaction.user.id, guildId });
                    await interaction.update(buildFormPanelPayload(guildId, slotId));

                } else if (action === 'addperg') {
                    // Lock anti-duplicação
                    const lockKey = `${guildId}_${slotId}_${interaction.user.id}`;
                    if (pergLock.has(lockKey)) return;
                    pergLock.add(lockKey);
                    try {
                        const text = interaction.fields.getTextInputValue('question_text').trim();
                        if (!text) return;
                        const freshSlots = formularios.get(guildId) || {};
                        if (!freshSlots[slotId]) return;
                        if (!freshSlots[slotId].questions) freshSlots[slotId].questions = [];
                        if (freshSlots[slotId].questions.length >= 10)
                            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Limite de 10 perguntas atingido.`, ephemeral: true });
                        freshSlots[slotId].questions.push({ text });
                        formularios.set(guildId, freshSlots);
                        logAction(client, { action: 'Pergunta adicionada ao Formulário', details: `Slot \`${slotId}\`: \`${text.slice(0, 80)}\``, userId: interaction.user.id, guildId });
                        await interaction.update(buildQuestionsPanelPayload(guildId, slotId));
                    } finally {
                        setTimeout(() => pergLock.delete(lockKey), 2000);
                    }

                }
                return;
            }

            // ── Opções do Select Menu: navegar ao painel principal ────────
            if (interaction.isButton() && customId.startsWith('form_sopts_main_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                await interaction.deferUpdate();
                await interaction.editReply(buildSelectOptionsPanel(guildId, slotId));
                return;
            }

            // ── Opções do Select Menu: selecionar opção para editar ───────
            if (interaction.isStringSelectMenu() && customId.startsWith('form_sopts_pick_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const optIdx  = parseInt(interaction.values[0]);
                await interaction.deferUpdate();
                await interaction.editReply(buildOptionEditPanel(guildId, slotId, optIdx));
                return;
            }

            // ── Opções do Select Menu: botão adicionar (abre modal) ───────
            if (interaction.isButton() && customId.startsWith('form_sopts_add_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const modal = new ModalBuilder()
                    .setCustomId(`form_modal_addopt_${guildId}_${slotId}`)
                    .setTitle('Adicionar Opção ao Menu');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('opt_label')
                            .setLabel('Nome da Opção')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(100)
                            .setRequired(true)
                            .setPlaceholder('Ex: Selecione uma área para iniciar seu formulário...')
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('opt_desc')
                            .setLabel('Sub-descrição (opcional)')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(100)
                            .setRequired(false)
                            .setPlaceholder('Ex: Clique para começar')
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            // ── Opções do Select Menu: navegar ao painel de edição ────────
            if (interaction.isButton() && customId.startsWith('form_sopts_edit_')) {
                const withoutPrefix = customId.slice('form_sopts_edit_'.length);
                const parts   = withoutPrefix.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const optIdx  = parseInt(parts[parts.length - 3]);
                await interaction.deferUpdate();
                await interaction.editReply(buildOptionEditPanel(guildId, slotId, optIdx));
                return;
            }

            // ── Opções do Select Menu: editar nome e descrição (modal) ────
            if (interaction.isButton() && customId.startsWith('form_sopts_editlabel_')) {
                const withoutPrefix = customId.slice('form_sopts_editlabel_'.length);
                const parts   = withoutPrefix.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const optIdx  = parseInt(parts[parts.length - 3]);
                const slots   = formularios.get(guildId) || {};
                const opt     = (slots[slotId]?.selectOptions || [])[optIdx] || {};
                const modal = new ModalBuilder()
                    .setCustomId(`form_modal_editopt_${optIdx}_${guildId}_${slotId}`)
                    .setTitle(`Editar Opção ${optIdx + 1}`);
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('opt_label')
                            .setLabel('Nome da Opção')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(100)
                            .setRequired(true)
                            .setValue(opt.label || '')
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('opt_desc')
                            .setLabel('Sub-descrição (opcional)')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(100)
                            .setRequired(false)
                            .setValue(opt.description || '')
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            // ── Opções do Select Menu: remover opção ──────────────────────
            if (interaction.isButton() && customId.startsWith('form_sopts_del_')) {
                const withoutPrefix = customId.slice('form_sopts_del_'.length);
                const parts   = withoutPrefix.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const optIdx  = parseInt(parts[parts.length - 3]);
                const slots   = formularios.get(guildId) || {};
                if (slots[slotId]?.selectOptions) {
                    slots[slotId].selectOptions.splice(optIdx, 1);
                    if (slots[slotId].selectOptions.length === 0)
                        slots[slotId].selectOptions = [{ label: 'Selecione uma área para iniciar seu formulário...', emoji: null, description: '' }];
                    formularios.set(guildId, slots);
                }
                await interaction.deferUpdate();
                await interaction.editReply(buildSelectOptionsPanel(guildId, slotId));
                return;
            }

            // ── Opções do Select Menu: abrir seletor de emoji ─────────────
            if (interaction.isButton() && customId.startsWith('form_sopts_emoji_')) {
                const withoutPrefix = customId.slice('form_sopts_emoji_'.length);
                const parts   = withoutPrefix.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const optIdx  = parseInt(parts[parts.length - 3]);
                await interaction.deferUpdate();
                await interaction.editReply(buildOptionEmojiPicker(interaction.guild, guildId, slotId, optIdx));
                return;
            }

            // ── Opções do Select Menu: emoji do bot selecionado ───────────
            if (interaction.isStringSelectMenu() && customId.startsWith('form_sopts_botoji_')) {
                const withoutPrefix = customId.slice('form_sopts_botoji_'.length);
                const parts   = withoutPrefix.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const optIdx  = parseInt(parts[parts.length - 3]);
                const emojiId = interaction.values[0];
                const slots   = formularios.get(guildId) || {};
                if (slots[slotId]?.selectOptions?.[optIdx]) {
                    slots[slotId].selectOptions[optIdx].emoji = emojiId === 'sem_emoji' ? null : emojiId;
                    formularios.set(guildId, slots);
                }
                await interaction.deferUpdate();
                await interaction.editReply(buildOptionEditPanel(guildId, slotId, optIdx));
                return;
            }

            // ── Opções do Select Menu: emoji do servidor selecionado ──────
            if (interaction.isStringSelectMenu() && customId.startsWith('form_sopts_svroji_')) {
                const withoutPrefix = customId.slice('form_sopts_svroji_'.length);
                const parts   = withoutPrefix.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const optIdx  = parseInt(parts[parts.length - 3]);
                const emojiId = interaction.values[0];
                const slots   = formularios.get(guildId) || {};
                if (slots[slotId]?.selectOptions?.[optIdx]) {
                    slots[slotId].selectOptions[optIdx].emoji = emojiId;
                    formularios.set(guildId, slots);
                }
                await interaction.deferUpdate();
                await interaction.editReply(buildOptionEditPanel(guildId, slotId, optIdx));
                return;
            }

            // ── Opções do Select Menu: remover emoji ──────────────────────
            if (interaction.isButton() && customId.startsWith('form_sopts_noji_')) {
                const withoutPrefix = customId.slice('form_sopts_noji_'.length);
                const parts   = withoutPrefix.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const optIdx  = parseInt(parts[parts.length - 3]);
                const slots   = formularios.get(guildId) || {};
                if (slots[slotId]?.selectOptions?.[optIdx]) {
                    slots[slotId].selectOptions[optIdx].emoji = null;
                    formularios.set(guildId, slots);
                }
                await interaction.deferUpdate();
                await interaction.editReply(buildOptionEditPanel(guildId, slotId, optIdx));
                return;
            }

            // ── Editor de Aparência: select de navegação ──────────────────
            if (interaction.isStringSelectMenu() && customId.startsWith('form_emb_nav_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const userId  = parts[parts.length - 3];
                if (userId !== interaction.user.id) return;
                const section = interaction.values[0];
                if (section === 'main') {
                    await interaction.update(buildFormEmbedMainMenu(userId, guildId, slotId));
                } else {
                    await interaction.update(buildFormEmbedSection(userId, guildId, slotId, section));
                }
                return;
            }

            // ── Editor de Aparência: botão salvar ────────────────────────
            if (interaction.isButton() && customId.startsWith('form_emb_save_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const userId  = parts[parts.length - 3];
                if (userId !== interaction.user.id) return;
                const sess  = formEmbedSessions.get(userId);
                const slots = formularios.get(guildId) || {};
                if (slots[slotId]) {
                    if (!slots[slotId].embed) slots[slotId].embed = {};
                    const d = sess?.data || {};
                    slots[slotId].embed.title       = d.title       || null;
                    slots[slotId].embed.description = d.description || null;
                    slots[slotId].embed.image       = d.image       || null;
                    slots[slotId].embed.footer      = d.footer      || null;
                    formularios.set(guildId, slots);
                    const { logAction } = require('../../Functions/AuditLog.js');
                    logAction(client, { action: 'Aparência do Formulário salva', details: `Slot \`${slotId}\``, userId: interaction.user.id, guildId });
                }
                formEmbedSessions.delete(userId);
                const savedC = new ContainerBuilder();
                savedC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('confirmed_emoji')} Aparência Salva!\n` +
                    `A aparência do formulário foi atualizada com sucesso.\n\n` +
                    `-# Feche esta mensagem ou reabra o editor para continuar editando.`
                ));
                await interaction.update({
                    components: [savedC],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    content: '',
                });
                return;
            }

            // ── Editor de Aparência: botão reset ─────────────────────────
            if (interaction.isButton() && customId.startsWith('form_emb_reset_')) {
                const parts   = customId.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const userId  = parts[parts.length - 3];
                if (userId !== interaction.user.id) return;
                const prevSess = formEmbedSessions.get(userId) || {};
                formEmbedSessions.set(userId, { guildId, slotId, formName: prevSess.formName, data: {} });
                await interaction.update(buildFormEmbedMainMenu(userId, guildId, slotId));
                return;
            }

            // ── Editor de Aparência: botão remover propriedade ───────────
            if (interaction.isButton() && customId.startsWith('form_emb_remove_')) {
                const withoutPrefix = customId.slice('form_emb_remove_'.length);
                const parts   = withoutPrefix.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const userId  = parts[parts.length - 3];
                const section = parts.slice(0, parts.length - 3).join('_');
                if (userId !== interaction.user.id) return;
                const sess = formEmbedSessions.get(userId) || { guildId, slotId, data: {} };
                delete sess.data[section];
                formEmbedSessions.set(userId, sess);
                await interaction.update(buildFormEmbedSection(userId, guildId, slotId, section));
                return;
            }

            // ── Editor de Aparência: botão definir (abre modal) ──────────
            if (interaction.isButton() && customId.startsWith('form_emb_set_')) {
                const withoutPrefix = customId.slice('form_emb_set_'.length);
                const parts   = withoutPrefix.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const userId  = parts[parts.length - 3];
                const section = parts.slice(0, parts.length - 3).join('_');
                if (userId !== interaction.user.id) return;
                const sess  = formEmbedSessions.get(userId) || { data: {} };
                const label = EMB_SECTION_LABELS[section] || section;
                const modal = new ModalBuilder()
                    .setCustomId(`form_emb_modal_${section}_${userId}_${guildId}_${slotId}`)
                    .setTitle(`Definir ${label.split(' ')[0]}`);
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('section_value')
                            .setLabel(label)
                            .setStyle(section === 'description' ? TextInputStyle.Paragraph : TextInputStyle.Short)
                            .setValue(sess.data[section] || '')
                            .setRequired(false)
                            .setMaxLength(section === 'description' ? 2000 : 256)
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            // ── Editor de Aparência: submit do modal ─────────────────────
            if (interaction.isModalSubmit() && customId.startsWith('form_emb_modal_')) {
                const withoutPrefix = customId.slice('form_emb_modal_'.length);
                const parts   = withoutPrefix.split('_');
                const slotId  = parts[parts.length - 1];
                const guildId = parts[parts.length - 2];
                const userId  = parts[parts.length - 3];
                const section = parts.slice(0, parts.length - 3).join('_');
                if (userId !== interaction.user.id) return;
                const value = interaction.fields.getTextInputValue('section_value').trim();
                const sess  = formEmbedSessions.get(userId) || { guildId, slotId, data: {} };
                if (value) {
                    sess.data[section] = value;
                } else {
                    delete sess.data[section];
                }
                formEmbedSessions.set(userId, sess);
                await interaction.update(buildFormEmbedSection(userId, guildId, slotId, section));
                return;
            }

        } catch (err) {
            if (err.code === 10062) return;
            console.error('[FormulariosHandler] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred)
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro.`, ephemeral: true });
            } catch (e) { if (e.code !== 10062) console.error('[FormulariosHandler] Erro ao responder:', e.message); }
        }
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBPAINÉIS INTERNOS
// ─────────────────────────────────────────────────────────────────────────────
function buildStaffConfigPayload(guildId, slotId) {
    const form  = (formularios.get(guildId) || {})[slotId] || {};
    const atual = (form.roles_responsible || []).length > 0
        ? form.roles_responsible.map(r => `<@&${r}>`).join(', ')
        : `\`Nenhum\``;

    const c = new ContainerBuilder();
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
            .setMinValues(0)
            .setMaxValues(5)
    ));
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`form_btn_voltarform_${guildId}_${slotId}`)
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(ButtonStyle.Secondary)
    ));
    return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

function buildAprovadoConfigPayload(guildId, slotId) {
    const form  = (formularios.get(guildId) || {})[slotId] || {};
    const atual = form.role_approved ? `<@&${form.role_approved}>` : `\`Não definido\``;

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('permissions_emoji')} Cargo ao Aprovar\n` +
        `Selecione o cargo entregue automaticamente quando o candidato for aceito.\n\n` +
        `${Emojis.get('information_emoji')} **Atual:** ${atual}`
    ));
    c.addSeparatorComponents(new SeparatorBuilder());
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
            .setCustomId(`form_roles_aprov_${guildId}_${slotId}`)
            .setPlaceholder('Selecionar cargo ao aprovar...')
            .setMinValues(0)
            .setMaxValues(1)
    ));
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`form_btn_voltarform_${guildId}_${slotId}`)
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(ButtonStyle.Secondary)
    ));
    return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

// ─────────────────────────────────────────────────────────────────────────────
// PAINEL DE OPÇÕES DO SELECT MENU
// ─────────────────────────────────────────────────────────────────────────────
function buildSelectOptionsPanel(guildId, slotId) {
    const form    = (formularios.get(guildId) || {})[slotId] || {};
    const options = form.selectOptions && form.selectOptions.length > 0
        ? form.selectOptions
        : [{ label: 'Selecione uma área para iniciar seu formulário...', emoji: null, description: '' }];

    const optLines = options.map((o, i) => {
        const emojiStr = o.emoji ? `<:e:${o.emoji}>` : '`sem emoji`';
        const descStr  = o.description ? ` — ${o.description}` : '';
        return `-# ${i + 1}. **${o.label}**${descStr} | ${emojiStr}`;
    }).join('\n');

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Opções do Select Menu\n` +
        `-# Configure as opções que aparecerão no dropdown do formulário postado.\n\n` +
        `${optLines}\n\n` +
        `-# ${options.length}/25 opções configuradas`
    ));
    c.addSeparatorComponents(new SeparatorBuilder());

    if (options.length > 0) {
        c.addActionRowComponents(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`form_sopts_pick_${guildId}_${slotId}`)
                .setPlaceholder('Selecione uma opção para editar...')
                .addOptions(options.slice(0, 25).map((o, i) => {
                    const entry = { label: (o.label || 'Opção').slice(0, 100), value: String(i) };
                    if (o.description) entry.description = o.description.slice(0, 100);
                    if (o.emoji && /^\d+$/.test(o.emoji)) entry.emoji = { id: o.emoji };
                    return entry;
                }))
        ));
    }

    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`form_sopts_add_${guildId}_${slotId}`)
            .setLabel('Adicionar Opção')
            .setEmoji({ id: '1501803905363869769' })
            .setStyle(ButtonStyle.Success)
            .setDisabled(options.length >= 25),
        new ButtonBuilder()
            .setCustomId(`form_btn_voltarform_${guildId}_${slotId}`)
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(ButtonStyle.Secondary),
    ));

    return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

// ─────────────────────────────────────────────────────────────────────────────
// PAINEL DE EDIÇÃO DE UMA OPÇÃO
// ─────────────────────────────────────────────────────────────────────────────
function buildOptionEditPanel(guildId, slotId, optIdx) {
    const form    = (formularios.get(guildId) || {})[slotId] || {};
    const options = form.selectOptions || [];
    const opt     = options[optIdx];

    if (!opt) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${Emojis.get('negative_emoji')} Opção não encontrada.`
        ));
        return { components: [c], flags: MessageFlags.IsComponentsV2 };
    }

    const emojiStr = opt.emoji ? `<:e:${opt.emoji}>` : '`Sem emoji`';

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Editar Opção ${optIdx + 1}\n\n` +
        `${Emojis.get('_text_emoji')} **Nome:** \`${opt.label || 'Sem nome'}\`\n` +
        `${Emojis.get('_messages_emoji')} **Sub-descrição:** \`${opt.description || 'Nenhuma'}\`\n` +
        `${Emojis.get('_ticket_emoji')} **Emoji:** ${emojiStr}`
    ));
    c.addSeparatorComponents(new SeparatorBuilder());
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`form_sopts_editlabel_${optIdx}_${guildId}_${slotId}`)
            .setLabel('Editar Nome e Descrição')
            .setEmoji({ id: '1501804003850322052' })
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`form_sopts_emoji_${optIdx}_${guildId}_${slotId}`)
            .setLabel('Trocar Emoji')
            .setEmoji({ id: '1501804043121725490' })
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`form_sopts_del_${optIdx}_${guildId}_${slotId}`)
            .setLabel('Remover')
            .setEmoji({ id: '1501803935453679616' })
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(`form_sopts_main_${guildId}_${slotId}`)
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(ButtonStyle.Secondary),
    ));

    return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

// ─────────────────────────────────────────────────────────────────────────────
// SELETOR DE EMOJI PARA OPÇÃO
// ─────────────────────────────────────────────────────────────────────────────
function buildOptionEmojiPicker(guild, guildId, slotId, optIdx) {
    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_ticket_emoji')} Escolher Emoji — Opção ${optIdx + 1}\n` +
        `-# Selecione um emoji do bot ou do servidor para esta opção.`
    ));
    c.addSeparatorComponents(new SeparatorBuilder());

    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`form_sopts_botoji_${optIdx}_${guildId}_${slotId}`)
            .setPlaceholder('Emojis do bot...')
            .addOptions(BOT_EMOJI_OPTIONS.slice(0, 25))
    ));

    const serverEmojis = guild?.emojis?.cache
        ? [...guild.emojis.cache.values()].filter(e => !e.animated).slice(0, 25)
        : [];
    if (serverEmojis.length > 0) {
        c.addActionRowComponents(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`form_sopts_svroji_${optIdx}_${guildId}_${slotId}`)
                .setPlaceholder('Emojis do servidor...')
                .addOptions(serverEmojis.map(e => ({
                    label: e.name.slice(0, 100),
                    value: e.id,
                    emoji: { id: e.id },
                })))
        ));
    }

    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`form_sopts_noji_${optIdx}_${guildId}_${slotId}`)
            .setLabel('Sem Emoji')
            .setEmoji({ id: '1501803935453679616' })
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`form_sopts_edit_${optIdx}_${guildId}_${slotId}`)
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(ButtonStyle.Secondary),
    ));

    return { components: [c], flags: MessageFlags.IsComponentsV2 };
}
