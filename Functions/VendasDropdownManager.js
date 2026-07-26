'use strict';

const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { configuracao, Emojis } = require('../Database');

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
                .setEmoji({ id: '1501804003850322052' })
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
            .setCustomId('vnd_gerenciar_dropdown')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(row2);

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

// ── Emoji picker panel ──────────────────────────────────────────────────────────
async function buildEmojiPickerPanel(interaction, client, { tipo, secaoId, subId }) {
    // tipo: 'secao' | 'sub'
    const botEmojis = Emojis.all(); // { name: id }
    const guildEmojis = [...(interaction.guild?.emojis.cache.values() || [])];

    const options = [];
    const seenIds = new Set();

    // Bot emojis first
    for (const [name, id] of Object.entries(botEmojis)) {
        if (options.length >= 23) break;
        if (!id || seenIds.has(String(id))) continue;
        seenIds.add(String(id));
        options.push({
            label: name.slice(0, 100),
            value: String(id),
            emoji: { id: String(id) },
        });
    }

    // Server emojis
    for (const emoji of guildEmojis) {
        if (options.length >= 25) break;
        if (!emoji.id || seenIds.has(emoji.id)) continue;
        seenIds.add(emoji.id);
        options.push({
            label: (emoji.name || 'emoji').slice(0, 100),
            value: emoji.id,
            emoji: { id: emoji.id },
        });
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
    buildModalAddSecao,
    buildModalMsgSecao,
    buildModalAddSub,
    handlePickEditSub,
    handlePickDelSub,
    handlePickEditSecao,
    handlePickRemoverSecao,
    gerarId,
};
