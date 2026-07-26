'use strict';

const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { configuracao, Emojis } = require('../Database');
const { v4: uuidv4 } = require('crypto');

function gerarId() {
    return Math.random().toString(36).slice(2, 10);
}

async function gerenciarDropdownVendas(interaction) {
    const secoes = configuracao.get('vendas.secoes') || [];

    const container = new ContainerBuilder();

    let listaSecoes = secoes.length === 0
        ? `${Emojis.get('negative_emoji')} Nenhuma seção cadastrada ainda.`
        : secoes.map((s, i) =>
            `**${i + 1}.** ${s.emoji ? `<:e:${s.emoji}>` : ''} **${s.nome}** — \`R$ ${Number(s.valor).toFixed(2)}\`\n-# ${s.descricao || 'Sem descrição'}`
          ).join('\n\n');

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('store_emoji')} Dropdown de Vendas\n` +
        `Gerencie as seções exibidas no dropdown de produtos. Máximo de **25 seções**.\n\n` +
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
    );

    const row2Buttons = [
        new ButtonBuilder()
            .setCustomId('vnd_voltar_config')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
    ];

    if (secoes.length > 0) {
        row2Buttons.unshift(
            new ButtonBuilder()
                .setCustomId('vnd_editar_secao_pick')
                .setLabel('Editar Seção')
                .setEmoji({ id: '1501804003850322052' })
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('vnd_remover_secao_pick')
                .setLabel('Remover Seção')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(4),
        );
    }

    container.addActionRowComponents(row1);
    container.addActionRowComponents(new ActionRowBuilder().addComponents(...row2Buttons));

    const payload = {
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        embeds: [],
        content: ''
    };

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
    } else {
        await interaction.update(payload);
    }
}

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
                .setLabel('Descrição (sub-descrição no dropdown)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setRequired(false)
                .setValue(secao?.descricao || '')
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('emoji')
                .setLabel('ID do Emoji do Bot (ex: 1501803947898306724)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(20)
                .setRequired(false)
                .setValue(secao?.emoji || '')
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('valor')
                .setLabel('Valor em BRL (ex: 29.90)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(10)
                .setRequired(true)
                .setValue(secao?.valor || '')
        ),
    );

    return modal;
}

async function handlePickEditSecao(interaction) {
    const secoes = configuracao.get('vendas.secoes') || [];
    if (secoes.length === 0) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Nenhuma seção para editar.`, ephemeral: true });

    const options = secoes.slice(0, 25).map(s => ({
        label: s.nome.slice(0, 100),
        value: s.id,
        description: (`R$ ${Number(s.valor).toFixed(2)} — ${s.descricao || 'Sem descrição'}`).slice(0, 100),
        ...(s.emoji ? { emoji: { id: s.emoji } } : {}),
    }));

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Editar Seção\nSelecione a seção que deseja editar.`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('vnd_select_edit_secao')
            .setPlaceholder('Selecione a seção...')
            .addOptions(options)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('vnd_gerenciar_dropdown').setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
    ));

    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
}

async function handlePickRemoverSecao(interaction) {
    const secoes = configuracao.get('vendas.secoes') || [];
    if (secoes.length === 0) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Nenhuma seção para remover.`, ephemeral: true });

    const options = secoes.slice(0, 25).map(s => ({
        label: s.nome.slice(0, 100),
        value: s.id,
        description: (`R$ ${Number(s.valor).toFixed(2)} — ${s.descricao || 'Sem descrição'}`).slice(0, 100),
        ...(s.emoji ? { emoji: { id: s.emoji } } : {}),
    }));

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_trash_emoji')} Remover Seção\nSelecione a seção que deseja remover.`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('vnd_select_rm_secao')
            .setPlaceholder('Selecione a seção...')
            .addOptions(options)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('vnd_gerenciar_dropdown').setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
    ));

    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
}

module.exports = {
    gerenciarDropdownVendas,
    buildModalAddSecao,
    handlePickEditSecao,
    handlePickRemoverSecao,
    gerarId,
};
