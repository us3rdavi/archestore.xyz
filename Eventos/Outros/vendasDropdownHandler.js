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
const { getSecoesFilhas } = require('../../Functions/VendasDropdownManager');

function buildSecaoContainer(secao, secoes) {
    const children = getSecoesFilhas(secoes, secao.id);
    const { buildFinalSecaoContainer } = require('../../Functions/VendasPainelBuilder');
    return buildFinalSecaoContainer(secao.builderData || null, secao, secao.subprodutos || [], children);
}

function buildPreviousScreen(secao, secoes) {
    const parent = secao.parentId && secoes.find(s => s.id === secao.parentId);
    if (parent) return buildSecaoContainer(parent, secoes);

    const roots = secoes.filter(s => !s.parentId && (!secao.painelId || s.painelId === secao.painelId));
    const paineis = configuracao.get('vendas.paineis') || [];
    const painel = paineis.find(p => p.id === secao.painelId);
    const data = painel?.data || configuracao.get('vendas.painelData') || null;
    const { buildFinalPainelContainer } = require('../../Functions/VendasPainelBuilder');
    return buildFinalPainelContainer(data, roots);
}

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            // ── Usuário navega pelas seções do painel público ──────────────────────
            if (interaction.isStringSelectMenu() &&
                (customId === 'vnd_comprar_select' || customId.startsWith('vnd_subsection_select_'))) {
                const parentId = customId.startsWith('vnd_subsection_select_')
                    ? customId.slice('vnd_subsection_select_'.length)
                    : null;
                const secaoId = customId === 'vnd_comprar_select'
                    ? interaction.values[0].replace(/^vnd_/, '')
                    : interaction.values[0];
                const secoes = configuracao.get('vendas.secoes') || [];
                const secao = secoes.find(s => s.id === secaoId);

                if (!secao || (parentId ? secao.parentId !== parentId : !!secao.parentId)) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada. Tente novamente.`, ephemeral: true });
                }

                const container = buildSecaoContainer(secao, secoes);
                const payload = { components: [container], flags: MessageFlags.IsComponentsV2 };
                if (parentId) await interaction.update(payload);
                else await interaction.reply({ ...payload, ephemeral: true });
                return;
            }

            if (interaction.isButton() && customId.startsWith('vnd_secao_back_')) {
                const secaoId = customId.slice('vnd_secao_back_'.length);
                const secoes = configuracao.get('vendas.secoes') || [];
                const secao = secoes.find(s => s.id === secaoId);
                if (!secao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Seção não encontrada.`, ephemeral: true });
                await interaction.update({
                    components: [buildPreviousScreen(secao, secoes)],
                    flags: MessageFlags.IsComponentsV2,
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

                const efiAtivo = configuracao.get('pagamentos.EfiOnOff') === true;
                const efiConfig = !!configuracao.get('pagamentos.EfiAPI.client_id');
                if (!efiAtivo || !efiConfig) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} O sistema de pagamento PIX não está habilitado no momento. Contate um administrador.`,
                        ephemeral: true
                    });
                }

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
