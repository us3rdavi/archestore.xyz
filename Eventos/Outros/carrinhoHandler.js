'use strict';

/**
 * Handler dos botões do carrinho de vendas.
 * Gerencia: +qty, -qty, cupom, cancelar, finalizar, pagamento PIX.
 */

const {
    ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, AttachmentBuilder
} = require('discord.js');
const { carrinhos, Emojis, configuracao, pagamentos } = require('../../Database');
const { buildCartMessage, formatBRL, calcTotal } = require('../../Functions/CarrinhoVendas');
const { buscarDesconto, incrementarUso } = require('../../Functions/DescontoVendas');
const { criarCobrancaPix, iniciarPolling } = require('../../Functions/EfiPixVendas');
const { logPagamentoPendente, logCompraConfirmada } = require('../../Functions/VendasLogs');

function isCartOwnerOrAdmin(interaction, cartData) {
    if (cartData.userId === interaction.user.id) return true;
    const member = interaction.member;
    if (!member) return false;
    if (member.permissions.has('ManageGuild')) return true;
    const adminRoles = configuracao.get('Permissoes.cargos') || [];
    return adminRoles.some(roleId => member.roles.cache.has(roleId));
}

async function refreshCartMessage(interaction, cartData) {
    const msg = buildCartMessage(cartData);
    try {
        await interaction.message.edit(msg);
    } catch (e) { /* mensagem pode ter sido deletada */ }
}

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            // ── +1 quantidade ──────────────────────────────────────────────────────
            if (interaction.isButton() && customId.startsWith('cart_add_qty_')) {
                const threadId = customId.slice('cart_add_qty_'.length);
                const cart = carrinhos.get(threadId);
                if (!cart || cart.status !== 'aberto') return interaction.reply({ content: `${Emojis.get('negative_emoji')} Carrinho não encontrado ou já fechado.`, ephemeral: true });
                if (!isCartOwnerOrAdmin(interaction, cart)) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sem permissão.`, ephemeral: true });
                if (cart.quantidade >= 99) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Quantidade máxima atingida.`, ephemeral: true });

                cart.quantidade += 1;
                carrinhos.set(threadId, cart);
                await interaction.deferUpdate();
                await refreshCartMessage(interaction, cart);
                return;
            }

            // ── -1 quantidade ──────────────────────────────────────────────────────
            if (interaction.isButton() && customId.startsWith('cart_rem_qty_')) {
                const threadId = customId.slice('cart_rem_qty_'.length);
                const cart = carrinhos.get(threadId);
                if (!cart || cart.status !== 'aberto') return interaction.reply({ content: `${Emojis.get('negative_emoji')} Carrinho não encontrado ou já fechado.`, ephemeral: true });
                if (!isCartOwnerOrAdmin(interaction, cart)) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sem permissão.`, ephemeral: true });
                if (cart.quantidade <= 1) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Quantidade mínima é 1.`, ephemeral: true });

                cart.quantidade -= 1;
                carrinhos.set(threadId, cart);
                await interaction.deferUpdate();
                await refreshCartMessage(interaction, cart);
                return;
            }

            // ── Cupom de desconto ──────────────────────────────────────────────────
            if (interaction.isButton() && customId.startsWith('cart_desconto_')) {
                const threadId = customId.slice('cart_desconto_'.length);
                const cart = carrinhos.get(threadId);
                if (!cart || cart.status !== 'aberto') return interaction.reply({ content: `${Emojis.get('negative_emoji')} Carrinho não encontrado.`, ephemeral: true });
                if (!isCartOwnerOrAdmin(interaction, cart)) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sem permissão.`, ephemeral: true });

                const modal = new ModalBuilder()
                    .setCustomId(`cart_modal_desc_${threadId}`)
                    .setTitle('Cupom de Desconto');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('codigo')
                            .setLabel('Código do cupom')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Ex: PROMO10')
                            .setMaxLength(50)
                            .setRequired(true)
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            // ── Modal de cupom ─────────────────────────────────────────────────────
            if (interaction.isModalSubmit() && customId.startsWith('cart_modal_desc_')) {
                const threadId = customId.slice('cart_modal_desc_'.length);
                const cart = carrinhos.get(threadId);
                if (!cart || cart.status !== 'aberto') return interaction.reply({ content: `${Emojis.get('negative_emoji')} Carrinho não encontrado.`, ephemeral: true });

                const codigo = interaction.fields.getTextInputValue('codigo').trim();
                const desconto = buscarDesconto(codigo);

                if (!desconto) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Cupom \`${codigo}\` inválido ou expirado.`, ephemeral: true });
                }

                cart.desconto = { id: desconto.id, codigo: desconto.codigo, tipo: desconto.tipo, valor: desconto.valor };
                carrinhos.set(threadId, cart);

                const valorDesc = desconto.tipo === 'percent'
                    ? `${desconto.valor}%`
                    : formatBRL(desconto.valor);

                await interaction.deferUpdate();
                await refreshCartMessage(interaction, cart);
                try {
                    await interaction.followUp({ content: `${Emojis.get('confirmed_emoji')} Cupom **${desconto.codigo}** aplicado! Desconto de \`${valorDesc}\`.`, ephemeral: true });
                } catch (e) { /* interação pode ter expirado */ }
                return;
            }

            // ── Cancelar carrinho ──────────────────────────────────────────────────
            if (interaction.isButton() && customId.startsWith('cart_cancel_')) {
                const threadId = customId.slice('cart_cancel_'.length);
                const cart = carrinhos.get(threadId);
                if (!cart || cart.status !== 'aberto') return interaction.reply({ content: `${Emojis.get('negative_emoji')} Carrinho não encontrado.`, ephemeral: true });
                if (!isCartOwnerOrAdmin(interaction, cart)) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sem permissão.`, ephemeral: true });

                cart.status = 'cancelado';
                carrinhos.set(threadId, cart);

                const container = new ContainerBuilder();
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('negative_emoji')} Pedido Cancelado\n` +
                    `Carrinho **#${cart.cartId}** foi cancelado por <@${interaction.user.id}>.\n\n` +
                    `-# Este canal será fechado em instantes.`
                ));
                await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

                const thread = interaction.channel;
                setTimeout(async () => {
                    try { await thread.setArchived(true); } catch (e) { }
                }, 5000);
                return;
            }

            // ── Finalizar pedido → gerar PIX ───────────────────────────────────────
            if (interaction.isButton() && customId.startsWith('cart_finalizar_')) {
                const threadId = customId.slice('cart_finalizar_'.length);
                const cart = carrinhos.get(threadId);
                if (!cart || cart.status !== 'aberto') return interaction.reply({ content: `${Emojis.get('negative_emoji')} Carrinho não encontrado.`, ephemeral: true });
                if (!isCartOwnerOrAdmin(interaction, cart)) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sem permissão.`, ephemeral: true });

                const efiAtivo = configuracao.get('pagamentos.EfiOnOff') === true;
                const efiConfig = !!configuracao.get('pagamentos.EfiAPI.client_id');
                if (!efiAtivo || !efiConfig) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Pagamento PIX não disponível no momento.`, ephemeral: true });
                }

                await interaction.deferUpdate();

                // Tela de carregamento
                const containerLoad = new ContainerBuilder();
                containerLoad.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('loading_emoji')} Gerando cobrança PIX...\n` +
                    `-# Aguarde enquanto processamos seu pedido.`
                ));
                await interaction.message.edit({ components: [containerLoad], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

                const valorTotal = calcTotal(cart);
                const descricaoPix = `${cart.subprodutoNome} x${cart.quantidade}`.slice(0, 140);

                let cobranca;
                try {
                    cobranca = await criarCobrancaPix({ valor: valorTotal.toFixed(2), descricao: descricaoPix });
                } catch (err) {
                    console.error('[CarrinhoHandler] Erro ao criar cobrança:', err);
                    const containerErr = new ContainerBuilder();
                    containerErr.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('negative_emoji')} Erro ao gerar PIX\n\`${err.message}\`\n\n-# Tente novamente ou contate um administrador.`
                    ));
                    containerErr.addSeparatorComponents(new SeparatorBuilder());
                    containerErr.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`cart_finalizar_${threadId}`)
                            .setLabel('Tentar novamente')
                            .setEmoji({ id: '1501803923126747178' })
                            .setStyle(3),
                        new ButtonBuilder()
                            .setCustomId(`cart_cancel_${threadId}`)
                            .setLabel('Cancelar')
                            .setStyle(4)
                    ));
                    await interaction.message.edit({ components: [containerErr], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
                    return;
                }

                const { txid, pixCopiaECola, qrcodePngBuffer, expiracao } = cobranca;
                const expiresAt = Math.floor(Date.now() / 1000) + expiracao;

                // Salva pagamento no banco
                cart.status = 'aguardando_pagamento';
                cart.txid = txid;
                carrinhos.set(threadId, cart);

                pagamentos.set(`venda_${txid}`, {
                    txid,
                    userId: cart.userId,
                    userTag: interaction.user.tag || interaction.user.username,
                    userAvatar: interaction.user.displayAvatarURL({ size: 256 }),
                    guildId: cart.guildId,
                    threadId,
                    cartId: cart.cartId,
                    secaoId: cart.secaoId,
                    secaoNome: cart.secaoNome,
                    subprodutoNome: cart.subprodutoNome,
                    quantidade: cart.quantidade,
                    valorUnitario: cart.valorUnitario,
                    valorTotal: valorTotal.toFixed(2),
                    desconto: cart.desconto || null,
                    status: 'ATIVA',
                    criadoEm: Date.now(),
                    expiradoEm: Date.now() + expiracao * 1000,
                    e2eid: null,
                });

                // Log de pagamento pendente
                await logPagamentoPendente(client, {
                    guildId: cart.guildId,
                    userId: cart.userId,
                    userTag: interaction.user.tag || interaction.user.username,
                    userAvatar: interaction.user.displayAvatarURL({ size: 256 }),
                    sectionNome: `${cart.secaoNome} › ${cart.subprodutoNome}`,
                    quantidade: cart.quantidade,
                    valorUnitario: cart.valorUnitario,
                    valorTotal: valorTotal.toFixed(2),
                    txid,
                    expiracao,
                });

                // QR Code como arquivo PNG
                let files = [];
                try {
                    if (qrcodePngBuffer) files = [new AttachmentBuilder(qrcodePngBuffer, { name: 'qrcode.png' })];
                } catch (e) { }

                // Mensagem do carrinho com PIX
                const containerPix = new ContainerBuilder();
                containerPix.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('pix_stamp_emoji')} Pague via PIX\n\n` +
                    `🛒 **Carrinho:** #${cart.cartId} — ${cart.username}\n` +
                    `${Emojis.get('store_emoji')} **Produto:** \`${cart.secaoNome}\` › \`${cart.subprodutoNome}\`\n` +
                    `${Emojis.get('_folder_emoji')} **Quantidade:** \`${cart.quantidade}x\`\n` +
                    `${Emojis.get('pix_stamp_emoji')} **Total:** \`${formatBRL(valorTotal)}\`\n` +
                    `${Emojis.get('clock_emoji')} **Expira:** <t:${expiresAt}:R>\n\n` +
                    `-# Escaneie o QR Code abaixo ou use o código Copia e Cola.`
                ));
                containerPix.addSeparatorComponents(new SeparatorBuilder());
                containerPix.addActionRowComponents(new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`cart_reenviar_pix_${threadId}`)
                        .setLabel('Reenviar Código PIX')
                        .setEmoji({ id: '1501803923126747178' })
                        .setStyle(2),
                ));

                const payPayload = { components: [containerPix], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };
                if (files.length > 0) payPayload.files = files;
                await interaction.message.edit(payPayload);

                // Mensagem limpa com apenas o código PIX (para mobile copiar)
                await interaction.channel.send(pixCopiaECola);

                // Polling de confirmação
                iniciarPolling(txid, {
                    onPago: async (result) => {
                        const cartNow = carrinhos.get(threadId) || cart;
                        cartNow.status = 'pago';
                        carrinhos.set(threadId, cartNow);

                        pagamentos.set(`venda_${txid}`, {
                            ...pagamentos.get(`venda_${txid}`),
                            status: 'CONCLUIDA',
                            e2eid: result.e2eid,
                        });

                        await logCompraConfirmada(client, {
                            guildId: cart.guildId,
                            userId: cart.userId,
                            userTag: interaction.user.tag || interaction.user.username,
                            userAvatar: interaction.user.displayAvatarURL({ size: 256 }),
                            sectionNome: `${cart.secaoNome} › ${cart.subprodutoNome}`,
                            quantidade: cart.quantidade,
                            valorUnitario: cart.valorUnitario,
                            valorTotal: valorTotal.toFixed(2),
                            txid,
                            e2eid: result.e2eid,
                            pagador: result.pagador,
                        });

                        // Se cupom, incrementar uso
                        if (cart.desconto?.id) incrementarUso(cart.desconto.id);

                        try {
                            const thread = client.channels.cache.get(threadId);
                            if (thread) {
                                const containerPago = new ContainerBuilder();
                                containerPago.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                    `## ${Emojis.get('confirmed_emoji')} Pagamento Confirmado!\n\n` +
                                    `Obrigado pela sua compra, <@${cart.userId}>!\n\n` +
                                    `${Emojis.get('store_emoji')} **Produto:** \`${cart.secaoNome}\` › \`${cart.subprodutoNome}\`\n` +
                                    `${Emojis.get('_folder_emoji')} **Quantidade:** \`${cart.quantidade}x\`\n` +
                                    `${Emojis.get('pix_stamp_emoji')} **Total pago:** \`${formatBRL(valorTotal)}\`\n` +
                                    `${Emojis.get('_settings_emoji')} **TxID:** \`${txid}\`\n\n` +
                                    `-# Sua compra foi registrada. Aguarde a entrega do produto.`
                                ));
                                await thread.send({ components: [containerPago], flags: MessageFlags.IsComponentsV2 });
                            }
                        } catch (e) { }
                    },

                    onExpirado: async () => {
                        const cartNow = carrinhos.get(threadId) || cart;
                        if (cartNow.status === 'aguardando_pagamento') {
                            cartNow.status = 'aberto';
                            cartNow.txid = null;
                            carrinhos.set(threadId, cartNow);
                        }
                        pagamentos.set(`venda_${txid}`, { ...pagamentos.get(`venda_${txid}`), status: 'EXPIRADA' });

                        try {
                            const thread = client.channels.cache.get(threadId);
                            if (thread) {
                                const containerExp = new ContainerBuilder();
                                containerExp.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                    `## ${Emojis.get('negative_emoji')} PIX Expirado\n` +
                                    `Seu código PIX de \`${formatBRL(valorTotal)}\` expirou sem pagamento.\n\n` +
                                    `-# Se desejar tentar novamente, use o botão abaixo.`
                                ));
                                containerExp.addSeparatorComponents(new SeparatorBuilder());
                                containerExp.addActionRowComponents(new ActionRowBuilder().addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(`cart_finalizar_${threadId}`)
                                        .setLabel('Gerar novo PIX')
                                        .setEmoji({ id: '1501803923126747178' })
                                        .setStyle(3),
                                    new ButtonBuilder()
                                        .setCustomId(`cart_cancel_${threadId}`)
                                        .setLabel('Cancelar')
                                        .setStyle(4)
                                ));
                                await thread.send({ components: [containerExp], flags: MessageFlags.IsComponentsV2 });
                            }
                        } catch (e) { }
                    },
                });

                return;
            }

            // ── Reenviar código PIX limpo ──────────────────────────────────────────
            if (interaction.isButton() && customId.startsWith('cart_reenviar_pix_')) {
                const threadId = customId.slice('cart_reenviar_pix_'.length);
                const cart = carrinhos.get(threadId);
                if (!cart || cart.status !== 'aguardando_pagamento' || !cart.txid) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Nenhum pagamento pendente neste carrinho.`, ephemeral: true });
                }
                if (!isCartOwnerOrAdmin(interaction, cart)) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sem permissão.`, ephemeral: true });

                // Busca o pixCopiaECola do pagamento salvo — não foi persistido, então re-gera
                await interaction.reply({ content: `${Emojis.get('negative_emoji')} Para obter um novo código PIX, o anterior precisa expirar. O código já foi enviado como mensagem de texto neste canal acima.`, ephemeral: true });
                return;
            }

        } catch (err) {
            if (err.code === 10062) return;
            console.error('[CarrinhoHandler] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro. Tente novamente.`, ephemeral: true });
                }
            } catch (e) { if (e.code !== 10062) console.error(e.message); }
        }
    },
};
