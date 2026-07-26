'use strict';

/**
 * Handler do painel público de vendas.
 * Gerencia seleção de seção e subproduto → criação de carrinho.
 */

const {
    ActionRowBuilder, StringSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { configuracao, Emojis } = require('../../Database');
const { criarCarrinhoThread } = require('../../Functions/CarrinhoVendas');

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            // ── Usuário seleciona uma seção no dropdown público ───────────────────
            if (interaction.isStringSelectMenu() && customId === 'vnd_comprar_select') {
                const rawValue = interaction.values[0]; // formato: vnd_[secaoId]
                const secaoId = rawValue.replace(/^vnd_/, '');
                const secoes = configuracao.get('vendas.secoes') || [];
                const secao = secoes.find(s => s.id === secaoId);

                if (!secao) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Produto não encontrado. Tente novamente.`, ephemeral: true });
                }

                const subprodutos = secao.subprodutos || [];
                if (subprodutos.length === 0) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Esta seção não possui produtos disponíveis no momento. Contate um administrador.`,
                        ephemeral: true
                    });
                }

                const efiAtivo = configuracao.get('pagamentos.EfiOnOff') === true;
                const efiConfig = !!configuracao.get('pagamentos.EfiAPI.client_id');
                if (!efiAtivo || !efiConfig) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} O sistema de pagamento PIX não está habilitado no momento. Contate um administrador.`,
                        ephemeral: true
                    });
                }

                // Usa builderData da seção se existir, senão exibe o layout padrão
                const { buildFinalSecaoContainer } = require('../../Functions/VendasPainelBuilder');
                const container = buildFinalSecaoContainer(secao.builderData || null, secao, subprodutos);

                await interaction.reply({
                    components: [container],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    content: '',
                    ephemeral: true
                });
                return;
            }

            // ── Usuário seleciona um subproduto ───────────────────────────────────
            if (interaction.isStringSelectMenu() && customId === 'vnd_sub_select') {
                const value = interaction.values[0]; // vndsub_[secaoId]_[subId]
                const withoutPrefix = value.replace(/^vndsub_/, '');
                const underscoreIdx = withoutPrefix.indexOf('_');
                if (underscoreIdx === -1) return;
                const secaoId = withoutPrefix.slice(0, underscoreIdx);
                const subId   = withoutPrefix.slice(underscoreIdx + 1);

                const secoes = configuracao.get('vendas.secoes') || [];
                const secao = secoes.find(s => s.id === secaoId);
                if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });

                const subprodutos = secao.subprodutos || [];
                const subproduto = subprodutos.find(sp => sp.id === subId);
                if (!subproduto) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Produto não encontrado.`, ephemeral: true });

                await criarCarrinhoThread(interaction, client, secao, subproduto);
                return;
            }

        } catch (err) {
            if (err.code === 10062) return;
            console.error('[VendasDropdownHandler] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro. Tente novamente.`, ephemeral: true });
                }
            } catch (e) { if (e.code !== 10062) console.error('[VendasDropdownHandler] Erro ao responder:', e.message); }
        }
    },
};
