'use strict';

const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { configuracao, Emojis } = require('../Database');

const PAGE_SIZE = 25;

// ── Helpers de emoji ───────────────────────────────────────────────────────────
function buildBotEmojiOptionsList() {
    const allEmojis = Emojis.all();
    const options = [];
    for (const [name, val] of Object.entries(allEmojis)) {
        const match = typeof val === 'string' ? val.match(/^<(a?):([^:]+):(\d+)>$/) : null;
        const eid = match ? match[3] : (typeof val === 'string' && /^\d+$/.test(val.trim()) ? val.trim() : null);
        if (!eid) continue;
        options.push({
            label: (name.replace(/_emoji$/, '').replace(/_/g, ' ') || 'emoji').slice(0, 100),
            value: eid,
            emoji: { id: eid, animated: !!(match && match[1] === 'a') },
        });
    }
    return options;
}

function buildServerEmojiOptionsList(guild) {
    return [...(guild?.emojis.cache.values() || [])].map(e => ({
        label: ((e.name || 'emoji').replace(/_/g, ' ')).slice(0, 100),
        value: e.id,
        emoji: { id: e.id, animated: !!e.animated },
    }));
}

function gerarId() {
    return Math.random().toString(36).slice(2, 10);
}

// ── Painel principal: lista de seções ──────────────────────────────────────────
async function gerenciarDropdownVendas(interaction) {
    const secoes = configuracao.get('vendas.secoes') || [];

    const listaSecoes = secoes.length === 0
        ? `${Emojis.get('negative_emoji')} Nenhuma seção cadastrada ainda.`
        : secoes.map((s, i) => {
            const nSub = (s.subprodutos || []).length;
            return `**${i + 1}.** ${s.emoji ? `<:e:${s.emoji}> ` : ''}**${s.nome}** — \`${nSub} subproduto(s)\`\n-# ${s.descricao || 'Sem descrição'}`;
        }).join('\n\n');

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Seções do Painel de Vendas\n` +
        `Gerencie as seções exibidas no dropdown. Cada seção contém subprodutos selecionáveis. Máx. **25 seções**.\n\n` +
        listaSecoes
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vnd_add_secao')
            .setLabel('Adicionar Seção')
            .setEmoji({ id: '1501803905363869769' })
            .setStyle(3)
            .setDisabled(secoes.length >= 25),
        new ButtonBuilder()
            .setCustomId('vnd_config_secao_pick')
            .setLabel('Configurar Seção')
            .setEmoji({ id: '1501804003850322052' })
            .setStyle(1)
            .setDisabled(secoes.length === 0),
    );

    const row2Btns = [
        new ButtonBuilder()
            .setCustomId('vnd_voltar_config')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
    ];
    if (secoes.length > 0) {
        row2Btns.unshift(
            new ButtonBuilder()
                .setCustomId('vnd_editar_secao_pick')
                .setLabel('Editar Info')
                .setEmoji({ id: '1501804039451709441' })
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('vnd_remover_secao_pick')
                .setLabel('Remover')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(4),
        );
    }

    container.addActionRowComponents(row1);
    container.addActionRowComponents(new ActionRowBuilder().addComponents(...row2Btns));

    const payload = { components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
    } else {
        await interaction.update(payload);
    }
}

// ── Picker: escolhe qual seção configurar ───────────────────────────────────────
async function handlePickConfigSecao(interaction) {
    const secoes = configuracao.get('vendas.secoes') || [];
    if (secoes.length === 0) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Nenhuma seção disponível.`, ephemeral: true });

    const options = secoes.slice(0, 25).map(s => ({
        label: s.nome.slice(0, 100),
        value: s.id,
        description: `${(s.subprodutos || []).length} subproduto(s) — ${s.descricao || 'Sem descrição'}`.slice(0, 100),
        ...(s.emoji ? { emoji: { id: s.emoji } } : {}),
    }));

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_settings_emoji')} Configurar Seção\nSelecione a seção que deseja configurar.`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('vnd_select_config_secao').setPlaceholder('Selecione a seção...').addOptions(options)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('vnd_gerenciar_dropdown').setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
    ));

    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
}

// ── Painel de configuração da seção ────────────────────────────────────────────
async function buildSecaoConfigPanel(interaction, secao) {
    const subprodutos = secao.subprodutos || [];
    const listaSub = subprodutos.length === 0
        ? `-# Nenhum subproduto cadastrado.`
        : subprodutos.map((sp, i) =>
            `**${i + 1}.** ${sp.emoji ? `<:e:${sp.emoji}> ` : ''}**${sp.nome}** — \`R$ ${Number(sp.valor).toFixed(2)}\`\n-# ${sp.descricao || 'Sem descrição'}`
          ).join('\n');

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${secao.emoji ? `<:e:${secao.emoji}> ` : ''}${secao.nome}\n` +
        `-# ID: \`${secao.id}\`\n\n` +
        `${Emojis.get('_text_emoji')} **Descrição:** ${secao.descricao || '`Não definida`'}\n` +
        `${Emojis.get('_lapis_emoji')} **Mensagem do painel:** ${secao.mensagem ? `\`${secao.mensagem.slice(0, 60)}${secao.mensagem.length > 60 ? '...' : ''}\`` : '`Não definida`'}\n` +
        `${Emojis.get('store_emoji')} **Emoji:** ${secao.emoji ? `<:e:${secao.emoji}>` : '`Não definido`'}\n\n` +
        `**Subprodutos (${subprodutos.length}):**\n${listaSub}`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`vnd_secao_info_${secao.id}`)
            .setLabel('Editar Info')
            .setEmoji({ id: '1501804003850322052' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`vnd_secao_msg_${secao.id}`)
            .setLabel('Mensagem do Painel')
            .setEmoji({ id: '1501803917640732722' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`vnd_secao_emoji_${secao.id}`)
            .setLabel('Configurar Emoji')
            .setEmoji({ id: '1501803982849445998' })
            .setStyle(2),
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`vnd_sub_panel_${secao.id}`)
            .setLabel('Gerenciar Subprodutos')
            .setEmoji({ id: '1501803947898306724' })
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId(`vnd_secao_builder_${secao.id}`)
            .setLabel('Editar Visual (Realtime)')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(3),
    );
    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vnd_gerenciar_dropdown')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(row2);
    container.addActionRowComponents(row3);

    const payload = { components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
    } else {
        await interaction.update(payload);
    }
}

// ── Painel de subprodutos ───────────────────────────────────────────────────────
async function buildSubprodutosPanel(interaction, secao) {
    const subprodutos = secao.subprodutos || [];
    const listaSub = subprodutos.length === 0
        ? `${Emojis.get('negative_emoji')} Nenhum subproduto cadastrado.`
        : subprodutos.map((sp, i) =>
            `**${i + 1}.** ${sp.emoji ? `<:e:${sp.emoji}> ` : ''}**${sp.nome}** — \`R$ ${Number(sp.valor).toFixed(2)}\`\n-# ${sp.descricao || 'Sem descrição'}`
          ).join('\n\n');

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Subprodutos — ${secao.nome}\n` +
        `Gerencie os subprodutos desta seção. Máx. **25 subprodutos**.\n\n` +
        listaSub
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`vnd_add_sub_${secao.id}`)
            .setLabel('Adicionar Subproduto')
            .setEmoji({ id: '1501803905363869769' })
            .setStyle(3)
            .setDisabled(subprodutos.length >= 25),
    );

    const row2Btns = [
        new ButtonBuilder()
            .setCustomId(`vnd_secao_cfg_${secao.id}`)
            .setLabel('Voltar à Seção')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
    ];
    if (subprodutos.length > 0) {
        row2Btns.unshift(
            new ButtonBuilder()
                .setCustomId(`vnd_sub_edit_pick_${secao.id}`)
                .setLabel('Editar')
                .setEmoji({ id: '1501804003850322052' })
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId(`vnd_sub_del_pick_${secao.id}`)
                .setLabel('Remover')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(4),
            new ButtonBuilder()
                .setCustomId(`vnd_sub_emoji_pick_${secao.id}`)
                .setLabel('Emoji')
                .setEmoji({ id: '1501803982849445998' })
                .setStyle(2),
        );
    }
    if (subprodutos.length >= 2) {
        row2Btns.push(
            new ButtonBuilder()
                .setCustomId(`vnd_sub_reorder_${secao.id}`)
                .setLabel('Reorganizar')
                .setEmoji({ id: '1501803947898306724' })
                .setStyle(2),
        );
    }

    container.addActionRowComponents(row1);
    container.addActionRowComponents(new ActionRowBuilder().addComponents(...row2Btns));

    const payload = { components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
    } else {
        await interaction.update(payload);
    }
}

// ── Picker: escolhe subproduto para configurar emoji ───────────────────────────
async function buildSubEmojiPickerPanel(interaction, secaoId) {
    const secoes = configuracao.get('vendas.secoes') || [];
    const secao = secoes.find(s => s.id === secaoId);
    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
    const subs = secao.subprodutos || [];
    if (subs.length === 0) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Nenhum subproduto disponível.`, ephemeral: true });

    const options = subs.slice(0, 25).map(sp => ({
        label: sp.nome.slice(0, 100),
        value: sp.id,
        description: (`R$ ${Number(sp.valor).toFixed(2)}${sp.emoji ? ' · tem emoji' : ''}`).slice(0, 100),
        ...(sp.emoji ? { emoji: { id: sp.emoji } } : {}),
    }));

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Emoji do Subproduto\n` +
        `Selecione o subproduto que deseja configurar o emoji.`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`vnd_select_sub_emoji_${secaoId}`)
            .setPlaceholder('Selecione o subproduto...')
            .addOptions(options)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`vnd_sub_panel_${secaoId}`)
            .setLabel('Cancelar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2)
    ));

    const payload = { components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };
    if (interaction.deferred || interaction.replied) await interaction.editReply(payload);
    else await interaction.update(payload);
}

// ── Painel de emojis do bot ou servidor para subproduto ────────────────────────
async function buildSubEmojiSourcePanel(interaction, secaoId, subId, source, page) {
    const secoes = configuracao.get('vendas.secoes') || [];
    const secao = secoes.find(s => s.id === secaoId);
    const sub = secao && (secao.subprodutos || []).find(sp => sp.id === subId);

    const allOptions = source === 'server'
        ? buildServerEmojiOptionsList(interaction.guild)
        : buildBotEmojiOptionsList();

    const totalPages = Math.max(1, Math.ceil(allOptions.length / PAGE_SIZE));
    const safePage = Math.max(0, Math.min(page, totalPages - 1));
    const pageOptions = allOptions.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

    const sourceLabel = source === 'server' ? 'Servidor' : 'Bot';
    const otherSource = source === 'server' ? 'bot' : 'server';
    const otherLabel = source === 'server' ? 'Bot' : 'Servidor';

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Emojis do ${sourceLabel}${sub ? ` — **${sub.nome}**` : ''}\n` +
        `-# Página ${safePage + 1}/${totalPages} · ${allOptions.length} emojis disponíveis`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    // Botões: trocar fonte + remover emoji atual
    const toggleRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`vnd_sub_emoji_${otherSource}_0_${secaoId}_${subId}`)
            .setLabel(`Emojis do ${otherLabel}`)
            .setEmoji({ id: '1501803947898306724' })
            .setStyle(2),
    );
    if (sub?.emoji) {
        toggleRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`vnd_sub_emoji_rm_${secaoId}_${subId}`)
                .setLabel('Remover Emoji')
                .setEmoji({ id: '1501803926180335727' })
                .setStyle(4)
        );
    }
    container.addActionRowComponents(toggleRow);

    if (allOptions.length === 0) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `-# Nenhum emoji do ${sourceLabel.toLowerCase()} disponível.`
        ));
        container.addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`vnd_sub_panel_${secaoId}`).setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
        ));
    } else {
        const selId = source === 'server'
            ? `vnd_sub_emojisel_svr_${secaoId}_${subId}`
            : `vnd_sub_emojisel_bot_${secaoId}_${subId}`;
        container.addActionRowComponents(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(selId)
                .setPlaceholder(`Emojis ${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, allOptions.length)} de ${allOptions.length}...`)
                .addOptions(pageOptions)
        ));

        const navRow = new ActionRowBuilder();
        if (safePage > 0) {
            navRow.addComponents(new ButtonBuilder()
                .setCustomId(`vnd_sub_emoji_${source}_${safePage - 1}_${secaoId}_${subId}`)
                .setLabel('Anterior').setEmoji({ id: '1501803911655198742' }).setStyle(2));
        }
        navRow.addComponents(new ButtonBuilder()
            .setCustomId(`vnd_sub_panel_${secaoId}`)
            .setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2));
        if (safePage < totalPages - 1) {
            navRow.addComponents(new ButtonBuilder()
                .setCustomId(`vnd_sub_emoji_${source}_${safePage + 1}_${secaoId}_${subId}`)
                .setLabel('Próxima').setEmoji({ id: '1501803914654257326' }).setStyle(2));
        }
        container.addActionRowComponents(navRow);
    }

    const payload = { components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };
    if (interaction.deferred || interaction.replied) await interaction.editReply(payload);
    else await interaction.update(payload);
}

// ── Emoji picker panel ──────────────────────────────────────────────────────────
async function buildEmojiPickerPanel(interaction, client, { tipo, secaoId, subId }) {
    // tipo: 'secao' | 'sub'
    // Usa os mesmos helpers já existentes (que extraem corretamente o snowflake
    // das strings <:name:id> armazenadas no banco de emojis).
    const botOptions    = buildBotEmojiOptionsList();
    const serverOptions = buildServerEmojiOptionsList(interaction.guild);

    // Mescla sem duplicatas, limitado a 25 opções do Discord
    const seenIds = new Set();
    const options = [];
    for (const opt of [...botOptions, ...serverOptions]) {
        if (options.length >= 25) break;
        if (seenIds.has(opt.value)) continue;
        seenIds.add(opt.value);
        options.push(opt);
    }

    if (options.length === 0) {
        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Nenhum emoji disponível. Adicione emojis ao bot ou servidor primeiro.`, ephemeral: true });
    }

    const selectId = tipo === 'secao' ? `vnd_set_emoji_s_${secaoId}` : `vnd_set_emoji_p_${secaoId}_${subId}`;

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Selecionar Emoji\n` +
        `Escolha um emoji do bot ou do servidor para usar ${tipo === 'secao' ? 'nesta seção' : 'neste subproduto'}.`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId(selectId).setPlaceholder('Escolha um emoji...').addOptions(options)
    ));

    const backId = tipo === 'secao' ? `vnd_secao_cfg_${secaoId}` : `vnd_sub_panel_${secaoId}`;
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(backId).setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
    ));

    const payload = { components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
    } else {
        await interaction.update(payload);
    }
}

// ── Emoji picker paginado para seção (bot/servidor com troca de fonte) ────────────
async function buildSecaoEmojiSourcePanel(interaction, secaoId, source, page) {
    const secoes = configuracao.get('vendas.secoes') || [];
    const secao = secoes.find(s => s.id === secaoId);

    const allOptions = source === 'server'
        ? buildServerEmojiOptionsList(interaction.guild)
        : buildBotEmojiOptionsList();

    const totalPages = Math.max(1, Math.ceil(allOptions.length / PAGE_SIZE));
    const safePage = Math.max(0, Math.min(page, totalPages - 1));
    const pageOptions = allOptions.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

    const sourceLabel = source === 'server' ? 'Servidor' : 'Bot';
    const otherSource = source === 'server' ? 'bot' : 'server';
    const otherLabel  = source === 'server' ? 'Bot' : 'Servidor';

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Emojis do ${sourceLabel}${secao ? ` — **${secao.nome}**` : ''}\n` +
        `-# Página ${safePage + 1}/${totalPages} · ${allOptions.length} emojis disponíveis`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    // Linha: trocar fonte + remover emoji atual (se houver)
    const toggleRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`vnd_secao_emoji_${otherSource}_0_${secaoId}`)
            .setLabel(`Emojis do ${otherLabel}`)
            .setEmoji({ id: '1501803947898306724' })
            .setStyle(2),
    );
    if (secao?.emoji) {
        toggleRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`vnd_secao_emoji_rm_${secaoId}`)
                .setLabel('Remover Emoji')
                .setEmoji({ id: '1501803926180335727' })
                .setStyle(4)
        );
    }
    container.addActionRowComponents(toggleRow);

    if (allOptions.length === 0) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `-# Nenhum emoji do ${sourceLabel.toLowerCase()} disponível.`
        ));
        container.addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`vnd_secao_cfg_${secaoId}`).setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
        ));
    } else {
        container.addActionRowComponents(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`vnd_set_emoji_s_${secaoId}`)
                .setPlaceholder(`Emojis ${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, allOptions.length)} de ${allOptions.length}...`)
                .addOptions(pageOptions)
        ));

        const navRow = new ActionRowBuilder();
        if (safePage > 0) {
            navRow.addComponents(new ButtonBuilder()
                .setCustomId(`vnd_secao_emoji_${source}_${safePage - 1}_${secaoId}`)
                .setLabel('Anterior').setEmoji({ id: '1501803911655198742' }).setStyle(2));
        }
        navRow.addComponents(new ButtonBuilder()
            .setCustomId(`vnd_secao_cfg_${secaoId}`)
            .setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2));
        if (safePage < totalPages - 1) {
            navRow.addComponents(new ButtonBuilder()
                .setCustomId(`vnd_secao_emoji_${source}_${safePage + 1}_${secaoId}`)
                .setLabel('Próxima').setEmoji({ id: '1501803914654257326' }).setStyle(2));
        }
        container.addActionRowComponents(navRow);
    }

    const payload = { components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };
    if (interaction.deferred || interaction.replied) await interaction.editReply(payload);
    else await interaction.update(payload);
}

// ── Reorganizar subprodutos — passo 1: escolher qual mover ─────────────────────
async function buildSubReorderPickPanel(interaction, secaoId) {
    const secoes = configuracao.get('vendas.secoes') || [];
    const secao = secoes.find(s => s.id === secaoId);
    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
    const subs = secao.subprodutos || [];

    const lista = subs.map((sp, i) =>
        `**${i + 1}.** ${sp.emoji ? `<:e:${sp.emoji}> ` : ''}**${sp.nome}** — \`R$ ${Number(sp.valor).toFixed(2)}\``
    ).join('\n');

    const options = subs.slice(0, 25).map((sp, i) => ({
        label: `${i + 1}. ${sp.nome}`.slice(0, 100),
        value: sp.id,
        description: `R$ ${Number(sp.valor).toFixed(2)}`.slice(0, 100),
        ...(sp.emoji ? { emoji: { id: sp.emoji } } : {}),
    }));

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Reorganizar Subprodutos — ${secao.nome}\n` +
        `Selecione o subproduto que deseja mover de posição.\n\n` +
        lista
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`vnd_sub_reorder_sel_${secaoId}`)
            .setPlaceholder('Selecione o subproduto a mover...')
            .addOptions(options)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`vnd_sub_panel_${secaoId}`)
            .setLabel('Cancelar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2)
    ));

    const payload = { components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };
    if (interaction.deferred || interaction.replied) await interaction.editReply(payload);
    else await interaction.update(payload);
}

// ── Reorganizar subprodutos — passo 2: mover o subproduto escolhido ─────────────
async function buildSubReorderMovePanel(interaction, secaoId, subId) {
    const secoes = configuracao.get('vendas.secoes') || [];
    const secao = secoes.find(s => s.id === secaoId);
    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
    const subs = secao.subprodutos || [];
    const idx = subs.findIndex(sp => sp.id === subId);
    if (idx === -1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Subproduto não encontrado.`, ephemeral: true });

    const sub = subs[idx];
    const total = subs.length;
    const pos = idx + 1; // 1-based

    const lista = subs.map((sp, i) => {
        const marker = sp.id === subId ? '▶ ' : `${i + 1}. `;
        const bold = sp.id === subId ? `**${sp.nome}**` : sp.nome;
        return `${marker}${sp.emoji ? `<:e:${sp.emoji}> ` : ''}${bold}`;
    }).join('\n');

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Movendo: **${sub.nome}**\n` +
        `-# Posição atual: **${pos}** de **${total}**\n\n` +
        lista
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`vnd_sub_mv_top_${secaoId}_${subId}`)
            .setLabel('Início')
            .setEmoji({ id: '1501803914654257326' })
            .setStyle(2)
            .setDisabled(idx === 0),
        new ButtonBuilder()
            .setCustomId(`vnd_sub_mv_up_${secaoId}_${subId}`)
            .setLabel('Subir')
            .setEmoji({ id: '1501803911655198742' })
            .setStyle(2)
            .setDisabled(idx === 0),
        new ButtonBuilder()
            .setCustomId(`vnd_sub_mv_down_${secaoId}_${subId}`)
            .setLabel('Descer')
            .setEmoji({ id: '1501803914654257326' })
            .setStyle(2)
            .setDisabled(idx === total - 1),
        new ButtonBuilder()
            .setCustomId(`vnd_sub_mv_bot_${secaoId}_${subId}`)
            .setLabel('Fim')
            .setEmoji({ id: '1501803911655198742' })
            .setStyle(2)
            .setDisabled(idx === total - 1),
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`vnd_sub_reorder_${secaoId}`)
            .setLabel('Escolher outro')
            .setEmoji({ id: '1501803947898306724' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`vnd_sub_panel_${secaoId}`)
            .setLabel('Concluído')
            .setEmoji({ id: '1501803917640732722' })
            .setStyle(3),
    ));

    const payload = { components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };
    if (interaction.deferred || interaction.replied) await interaction.editReply(payload);
    else await interaction.update(payload);
}

// ── Modal: adicionar/editar seção ───────────────────────────────────────────────
function buildModalAddSecao(secao = null) {
    const modal = new ModalBuilder()
        .setCustomId(secao ? `vnd_modal_edit_secao_${secao.id}` : 'vnd_modal_add_secao')
        .setTitle(secao ? 'Editar Seção' : 'Adicionar Seção');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('nome')
                .setLabel('Nome da Seção (label no dropdown)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setRequired(true)
                .setValue(secao?.nome || '')
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('descricao')
                .setLabel('Descrição (sub-texto no dropdown)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setRequired(false)
                .setValue(secao?.descricao || '')
        ),
    );
    return modal;
}

// ── Modal: mensagem do painel da seção ──────────────────────────────────────────
function buildModalMsgSecao(secao) {
    const modal = new ModalBuilder()
        .setCustomId(`vnd_modal_msg_secao_${secao.id}`)
        .setTitle('Mensagem do Painel — ' + secao.nome.slice(0, 30));

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('mensagem')
                .setLabel('Mensagem exibida ao abrir a seção')
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(1000)
                .setRequired(false)
                .setPlaceholder('Ex: Escolha seu plano VIP abaixo. Entrega automática após o pagamento.')
                .setValue(secao?.mensagem || '')
        ),
    );
    return modal;
}

// ── Modal: adicionar/editar subproduto ──────────────────────────────────────────
function buildModalAddSub(secaoId, sub = null) {
    const modal = new ModalBuilder()
        .setCustomId(sub ? `vnd_modal_edit_sub_${secaoId}_${sub.id}` : `vnd_modal_add_sub_${secaoId}`)
        .setTitle(sub ? 'Editar Subproduto' : 'Adicionar Subproduto');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('nome')
                .setLabel('Nome do produto')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setRequired(true)
                .setValue(sub?.nome || '')
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('descricao')
                .setLabel('Descrição (aparece no dropdown)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setRequired(false)
                .setValue(sub?.descricao || '')
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('valor')
                .setLabel('Preço em BRL (ex: 29.90)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(10)
                .setRequired(true)
                .setValue(sub?.valor || '')
        ),
    );
    return modal;
}

// ── Picker: editar subproduto ───────────────────────────────────────────────────
async function handlePickEditSub(interaction, secaoId) {
    const secoes = configuracao.get('vendas.secoes') || [];
    const secao = secoes.find(s => s.id === secaoId);
    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
    const subs = secao.subprodutos || [];
    if (subs.length === 0) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Nenhum subproduto para editar.`, ephemeral: true });

    const options = subs.slice(0, 25).map(sp => ({
        label: sp.nome.slice(0, 100),
        value: sp.id,
        description: (`R$ ${Number(sp.valor).toFixed(2)} — ${sp.descricao || 'Sem descrição'}`).slice(0, 100),
        ...(sp.emoji ? { emoji: { id: sp.emoji } } : {}),
    }));

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${Emojis.get('_lapis_emoji')} Editar Subproduto\nSelecione o subproduto a editar.`));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId(`vnd_select_sub_edit_${secaoId}`).setPlaceholder('Selecione...').addOptions(options)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`vnd_sub_panel_${secaoId}`).setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
    ));

    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
}

// ── Picker: remover subproduto ──────────────────────────────────────────────────
async function handlePickDelSub(interaction, secaoId) {
    const secoes = configuracao.get('vendas.secoes') || [];
    const secao = secoes.find(s => s.id === secaoId);
    if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
    const subs = secao.subprodutos || [];
    if (subs.length === 0) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Nenhum subproduto para remover.`, ephemeral: true });

    const options = subs.slice(0, 25).map(sp => ({
        label: sp.nome.slice(0, 100),
        value: sp.id,
        description: (`R$ ${Number(sp.valor).toFixed(2)} — ${sp.descricao || 'Sem descrição'}`).slice(0, 100),
        ...(sp.emoji ? { emoji: { id: sp.emoji } } : {}),
    }));

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${Emojis.get('_trash_emoji')} Remover Subproduto\nSelecione o subproduto a remover.`));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId(`vnd_select_sub_del_${secaoId}`).setPlaceholder('Selecione...').addOptions(options)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`vnd_sub_panel_${secaoId}`).setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
    ));

    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
}

// ── Picker: editar seção (info básica) ─────────────────────────────────────────
async function handlePickEditSecao(interaction) {
    const secoes = configuracao.get('vendas.secoes') || [];
    if (secoes.length === 0) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Nenhuma seção para editar.`, ephemeral: true });

    const options = secoes.slice(0, 25).map(s => ({
        label: s.nome.slice(0, 100),
        value: s.id,
        description: (`${(s.subprodutos || []).length} sub(s) — ${s.descricao || 'Sem descrição'}`).slice(0, 100),
        ...(s.emoji ? { emoji: { id: s.emoji } } : {}),
    }));

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${Emojis.get('_lapis_emoji')} Editar Info da Seção\nSelecione a seção que deseja editar.`));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('vnd_select_edit_secao').setPlaceholder('Selecione a seção...').addOptions(options)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('vnd_gerenciar_dropdown').setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
    ));

    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
}

// ── Picker: remover seção ───────────────────────────────────────────────────────
async function handlePickRemoverSecao(interaction) {
    const secoes = configuracao.get('vendas.secoes') || [];
    if (secoes.length === 0) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Nenhuma seção para remover.`, ephemeral: true });

    const options = secoes.slice(0, 25).map(s => ({
        label: s.nome.slice(0, 100),
        value: s.id,
        description: (`${(s.subprodutos || []).length} sub(s) — ${s.descricao || 'Sem descrição'}`).slice(0, 100),
        ...(s.emoji ? { emoji: { id: s.emoji } } : {}),
    }));

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${Emojis.get('_trash_emoji')} Remover Seção\nSelecione a seção que deseja remover.`));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('vnd_select_rm_secao').setPlaceholder('Selecione a seção...').addOptions(options)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('vnd_gerenciar_dropdown').setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
    ));

    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
}

module.exports = {
    gerenciarDropdownVendas,
    handlePickConfigSecao,
    buildSecaoConfigPanel,
    buildSubprodutosPanel,
    buildEmojiPickerPanel,
    buildSubEmojiPickerPanel,
    buildSubEmojiSourcePanel,
    buildSecaoEmojiSourcePanel,
    buildSubReorderPickPanel,
    buildSubReorderMovePanel,
    buildModalAddSecao,
    buildModalMsgSecao,
    buildModalAddSub,
    handlePickEditSub,
    handlePickDelSub,
    handlePickEditSecao,
    handlePickRemoverSecao,
    gerarId,
};
