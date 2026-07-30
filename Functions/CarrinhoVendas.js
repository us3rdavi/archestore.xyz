'use strict';

const {
    ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags,
    ChannelType
} = require('discord.js');
const { configuracao, carrinhos, Emojis } = require('../Database');

function formatBRL(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getNextCartId() {
    const count = (configuracao.get('vendas.carrinhoCount') || 0) + 1;
    configuracao.set('vendas.carrinhoCount', count);
    return count;
}

function calcTotal(cartData) {
    let total = Number(cartData.valorUnitario) * cartData.quantidade;
    if (cartData.desconto) {
        if (cartData.desconto.tipo === 'percent') {
            total = total * (1 - cartData.desconto.valor / 100);
        } else {
            total = total - cartData.desconto.valor;
        }
    }
    return Math.max(0, total);
}

function buildCartMessage(cartData) {
    const { cartId, username, subprodutoNome, secaoNome, valorUnitario, quantidade, desconto, threadId } = cartData;

    let descontoInfo = '';
    if (desconto) {
        if (desconto.tipo === 'percent') {
            const economizado = Number(valorUnitario) * quantidade * (desconto.valor / 100);
            descontoInfo = `\n${Emojis.get('confirmed_emoji')} **Cupom:** \`${desconto.codigo}\` — \`-${desconto.valor}%\` (${formatBRL(economizado)})`;
        } else {
            descontoInfo = `\n${Emojis.get('confirmed_emoji')} **Cupom:** \`${desconto.codigo}\` — \`-${formatBRL(desconto.valor)}\``;
        }
    }

    const valorTotal = calcTotal(cartData);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## 🛒 Carrinho #${cartId} — ${username}\n\n` +
        `${Emojis.get('store_emoji')} **Produto:** \`${secaoNome}\` › \`${subprodutoNome}\`\n` +
        `${Emojis.get('dream')} **Valor unitário:** \`${formatBRL(valorUnitario)}\`\n` +
        `${Emojis.get('_folder_emoji')} **Quantidade:** \`${quantidade}x\`` +
        descontoInfo + '\n\n' +
        `${Emojis.get('pix_stamp_emoji')} **Total: \`${formatBRL(valorTotal)}\`**\n\n` +
        `-# Use os botões abaixo para gerenciar seu pedido.`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`cart_add_qty_${threadId}`)
            .setLabel('+1')
            .setEmoji({ id: '1501803905363869769' })
            .setStyle(3)
            .setDisabled(quantidade >= 99),
        new ButtonBuilder()
            .setCustomId(`cart_rem_qty_${threadId}`)
            .setLabel('-1')
            .setEmoji({ id: '1501803911655198742' })
            .setStyle(4)
            .setDisabled(quantidade <= 1),
        new ButtonBuilder()
            .setCustomId(`cart_desconto_${threadId}`)
            .setLabel('Cupom de Desconto')
            .setEmoji({ id: '1501803982849445998' })
            .setStyle(2),
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`cart_finalizar_${threadId}`)
            .setLabel('Finalizar Pedido')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId(`cart_cancel_${threadId}`)
            .setLabel('Cancelar Pedido')
            .setEmoji({ id: '1501803935453679616' })
            .setStyle(4),
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(row2);

    return {
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        embeds: [],
        content: ''
    };
}

async function criarCarrinhoThread(interaction, client, secao, subproduto) {
    // Prioridade: canal de carrinho do painel > canal global de carrinho
    let canalId = null;
    if (secao.painelId) {
        const paineis = configuracao.get('vendas.paineis') || [];
        const painel = paineis.find(p => p.id === secao.painelId);
        if (painel?.canalCarrinho) canalId = painel.canalCarrinho;
    }
    if (!canalId) canalId = configuracao.get('vendas.canais.carrinho');

    if (!canalId) {
        return interaction.reply({
            content: `${Emojis.get('negative_emoji')} Canal de carrinho não configurado. Contate um administrador.`,
            ephemeral: true
        });
    }

    const canal = interaction.guild.channels.cache.get(canalId);
    if (!canal) {
        return interaction.reply({
            content: `${Emojis.get('negative_emoji')} Canal de carrinho não encontrado. Contate um administrador.`,
            ephemeral: true
        });
    }

    const cartId = getNextCartId();
    const username = interaction.user.displayName || interaction.user.username;

    await interaction.deferReply({ ephemeral: true });

    let thread;
    try {
        thread = await canal.threads.create({
            name: `🛒 ${username} · #${cartId}`,
            type: ChannelType.PrivateThread,
            invitable: false,
        });
        await thread.members.add(interaction.user.id);
    } catch (err) {
        console.error('[CarrinhoVendas] Erro ao criar thread:', err);
        return interaction.editReply({
            content: `${Emojis.get('negative_emoji')} Erro ao criar carrinho: ${err.message}`,
        });
    }

    const cartData = {
        cartId,
        userId: interaction.user.id,
        username,
        guildId: interaction.guildId,
        threadId: thread.id,
        secaoId: secao.id,
        secaoNome: secao.nome,
        subprodutoId: subproduto.id,
        subprodutoNome: subproduto.nome,
        valorUnitario: subproduto.valor,
        quantidade: 1,
        desconto: null,
        status: 'aberto',
        criadoEm: Date.now(),
    };

    carrinhos.set(thread.id, cartData);

    await thread.send(buildCartMessage(cartData));

    await interaction.editReply({
        content: `${Emojis.get('confirmed_emoji')} Seu carrinho foi aberto em <#${thread.id}>!`,
    });
}

module.exports = { criarCarrinhoThread, buildCartMessage, formatBRL, calcTotal };
