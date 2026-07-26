'use strict';

const {
    ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags, AttachmentBuilder
} = require('discord.js');
const { configuracao, pagamentos, Emojis } = require('../../Database');
const { criarCobrancaPix, iniciarPolling } = require('../../Functions/EfiPixVendas');
const { logPagamentoPendente, logCompraConfirmada } = require('../../Functions/VendasLogs');

function formatBRL(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Sessão temporária: userId → { secaoId, sectionNome, valorUnitario, quantidade }
const sessoes = new Map();

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            // ── Usuário seleciona um produto no dropdown de vendas ───────────
            if (interaction.isStringSelectMenu() && customId === 'vnd_comprar_select') {
                const secaoId = interaction.values[0].replace('vnd_', '');
                const secoes  = configuracao.get('vendas.secoes') || [];
                const secao   = secoes.find(s => s.id === secaoId);

                if (!secao) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Produto não encontrado. Tente novamente.`, ephemeral: true });
                }

                // Verifica se EfiBank está configurado
                const efiAtivo  = configuracao.get('pagamentos.EfiOnOff') === true;
                const efiConfig = !!configuracao.get('pagamentos.EfiAPI.client_id');
                if (!efiAtivo || !efiConfig) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} O sistema de pagamento PIX não está habilitado no momento. Contate um administrador.`,
                        ephemeral: true
                    });
                }

                // Salva sessão e abre modal de quantidade
                sessoes.set(interaction.user.id, { secaoId: secao.id, sectionNome: secao.nome, valorUnitario: secao.valor });

                const modal = new ModalBuilder()
                    .setCustomId('vnd_modal_quantidade')
                    .setTitle(`Comprar — ${secao.nome}`);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('quantidade')
                            .setLabel(`Quantidade (valor unit.: ${formatBRL(secao.valor)})`)
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Ex: 1')
                            .setMinLength(1)
                            .setMaxLength(3)
                            .setRequired(true)
                    )
                );

                await interaction.showModal(modal);
                return;
            }

            // ── Modal de quantidade submetido ───────────────────────────────
            if (interaction.isModalSubmit() && customId === 'vnd_modal_quantidade') {
                const sessao = sessoes.get(interaction.user.id);
                if (!sessao) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sessão expirada. Selecione o produto novamente.`, ephemeral: true });
                }

                const qtdRaw    = interaction.fields.getTextInputValue('quantidade').trim();
                const quantidade = parseInt(qtdRaw, 10);

                if (isNaN(quantidade) || quantidade < 1 || quantidade > 100) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Quantidade inválida. Digite um número entre 1 e 100.`, ephemeral: true });
                }

                const valorUnitario = Number(sessao.valorUnitario);
                const valorTotal    = (valorUnitario * quantidade).toFixed(2);

                sessoes.delete(interaction.user.id);

                // Responde imediatamente para não deixar expirar o modal
                await interaction.deferReply({ ephemeral: true });

                // Mostra tela "gerando PIX..."
                const containerCarregando = new ContainerBuilder();
                containerCarregando.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('loading_emoji')} Gerando cobrança PIX...\n` +
                    `**Produto:** \`${sessao.sectionNome}\`\n` +
                    `**Quantidade:** \`${quantidade}x\`\n` +
                    `**Total:** \`${formatBRL(valorTotal)}\`\n\n` +
                    `-# Aguarde um momento...`
                ));
                await interaction.editReply({ components: [containerCarregando], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

                // Cria cobrança PIX
                let cobranca;
                try {
                    cobranca = await criarCobrancaPix({
                        valor: valorTotal,
                        descricao: `${sessao.sectionNome} x${quantidade}`,
                    });
                } catch (err) {
                    console.error('[VendasDropdown] Erro ao criar cobrança:', err);
                    await interaction.editReply({
                        content: `${Emojis.get('negative_emoji')} Erro ao gerar cobrança PIX: ${err.message}`,
                        components: [], embeds: []
                    });
                    return;
                }

                const { txid, pixCopiaECola, imagemBase64, expiracao } = cobranca;
                const expiresAt = Math.floor(Date.now() / 1000) + expiracao;

                // Salva pagamento no banco
                pagamentos.set(`venda_${txid}`, {
                    txid,
                    userId: interaction.user.id,
                    userTag: interaction.user.tag || interaction.user.username,
                    userAvatar: interaction.user.displayAvatarURL({ size: 256 }),
                    guildId: interaction.guildId,
                    sectionId: sessao.secaoId,
                    sectionNome: sessao.sectionNome,
                    quantidade,
                    valorUnitario: valorUnitario.toFixed(2),
                    valorTotal,
                    status: 'ATIVA',
                    criadoEm: Date.now(),
                    expiradoEm: Date.now() + expiracao * 1000,
                    e2eid: null,
                });

                // Log de pagamento pendente
                await logPagamentoPendente(client, {
                    guildId: interaction.guildId,
                    userId: interaction.user.id,
                    userTag: interaction.user.tag || interaction.user.username,
                    userAvatar: interaction.user.displayAvatarURL({ size: 256 }),
                    sectionNome: sessao.sectionNome,
                    quantidade,
                    valorUnitario: valorUnitario.toFixed(2),
                    valorTotal,
                    txid,
                    expiracao,
                });

                // Monta a imagem do QR code
                let files = [];
                try {
                    const base64Data = imagemBase64.replace(/^data:image\/\w+;base64,/, '');
                    const buffer = Buffer.from(base64Data, 'base64');
                    files = [new AttachmentBuilder(buffer, { name: 'qrcode.png' })];
                } catch (e) {}

                // Monta tela de pagamento
                const containerPix = new ContainerBuilder();
                containerPix.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('pix_stamp_emoji')} Pague via PIX\n` +
                    `**Produto:** \`${sessao.sectionNome}\`\n` +
                    `**Quantidade:** \`${quantidade}x\`\n` +
                    `**Total:** \`${formatBRL(valorTotal)}\`\n\n` +
                    `${Emojis.get('clock_emoji')} **Expira:** <t:${expiresAt}:R>\n\n` +
                    `**PIX Copia e Cola:**\n\`\`\`\n${pixCopiaECola}\n\`\`\`\n` +
                    `-# Escaneie o QR code abaixo ou copie o código acima.`
                ));

                const replyPayload = {
                    components: [containerPix],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    content: '',
                };
                if (files.length > 0) replyPayload.files = files;

                await interaction.editReply(replyPayload);

                // Inicia polling de confirmação
                iniciarPolling(txid, {
                    onPago: async (result) => {
                        // Atualiza banco
                        pagamentos.set(`venda_${txid}`, {
                            ...pagamentos.get(`venda_${txid}`),
                            status: 'CONCLUIDA',
                            e2eid: result.e2eid,
                        });

                        // Log de compra confirmada
                        await logCompraConfirmada(client, {
                            guildId: interaction.guildId,
                            userId: interaction.user.id,
                            userTag: interaction.user.tag || interaction.user.username,
                            userAvatar: interaction.user.displayAvatarURL({ size: 256 }),
                            sectionNome: sessao.sectionNome,
                            quantidade,
                            valorUnitario: valorUnitario.toFixed(2),
                            valorTotal,
                            txid,
                            e2eid: result.e2eid,
                            pagador: result.pagador,
                        });

                        // Notifica o usuário
                        try {
                            const containerPago = new ContainerBuilder();
                            containerPago.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                `## ${Emojis.get('confirmed_emoji')} Pagamento Confirmado!\n` +
                                `Obrigado pela sua compra, <@${interaction.user.id}>!\n\n` +
                                `${Emojis.get('store_emoji')} **Produto:** \`${sessao.sectionNome}\`\n` +
                                `${Emojis.get('_folder_emoji')} **Quantidade:** \`${quantidade}x\`\n` +
                                `${Emojis.get('pix_stamp_emoji')} **Total pago:** \`${formatBRL(valorTotal)}\`\n` +
                                `${Emojis.get('_settings_emoji')} **TxID:** \`${txid}\`\n\n` +
                                `-# Sua compra foi registrada. Aguarde a entrega do produto.`
                            ));
                            await interaction.editReply({ components: [containerPago], flags: MessageFlags.IsComponentsV2, embeds: [], content: '', files: [] });
                        } catch (e) { /* interação pode ter expirado */ }
                    },

                    onExpirado: async () => {
                        pagamentos.set(`venda_${txid}`, {
                            ...pagamentos.get(`venda_${txid}`),
                            status: 'EXPIRADA',
                        });

                        try {
                            const containerExp = new ContainerBuilder();
                            containerExp.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                `## ${Emojis.get('negative_emoji')} Cobrança expirada\n` +
                                `Seu PIX de \`${formatBRL(valorTotal)}\` expirou sem pagamento.\n\n` +
                                `-# Se desejar comprar novamente, selecione o produto no menu.`
                            ));
                            await interaction.editReply({ components: [containerExp], flags: MessageFlags.IsComponentsV2, embeds: [], content: '', files: [] });
                        } catch (e) { /* interação pode ter expirado */ }
                    },
                });

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
