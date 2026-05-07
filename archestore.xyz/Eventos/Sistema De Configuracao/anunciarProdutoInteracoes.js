const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags,
    AttachmentBuilder,
} = require('discord.js');
const { QuickDB } = require('quick.db');
const { configuracao, tickets, Emojis } = require('../../DataBaseJson');
const centralCart = require('../../Functions/centralCartService');
const { CreateTicket } = require('../../Functions/CreateTicket');
const { qrGenerator } = require('../../Lib/QRCodeLib');
const path = require('path');

const db = new QuickDB();

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

function formatarPreco(p) {
    if (!p) return 'N/A';
    if (p.formatted_price) return p.formatted_price;
    if (p.price != null) return `R$ ${Number(p.price).toFixed(2).replace('.', ',')}`;
    return 'N/A';
}

function isPackage(pacote) {
    const produtos = pacote.products || pacote.variants || pacote.items || [];
    return Array.isArray(produtos) && produtos.length > 0;
}

function getVariants(pacote) {
    return pacote.products || pacote.variants || pacote.items || [];
}

function isEntregaAuto(pacote) {
    const tipo = (pacote.delivery_type || pacote.type || '').toLowerCase();
    return tipo === 'automatic' || tipo === 'auto' || pacote.automatic_delivery === true;
}

// ─── Builders ────────────────────────────────────────────────────────────────

function buildCardConfig(pacote, variante, nomeCustom, descCustom) {
    const nome = nomeCustom || (variante ? variante.name : pacote.name) || 'Produto';
    const desc = descCustom || (variante ? (variante.description || variante.short_description) : (pacote.description || pacote.short_description)) || 'Sem descrição.';
    const preco = formatarPreco(variante || pacote);
    const entregaAuto = isEntregaAuto(variante || pacote);
    const ehPackage = !variante && isPackage(pacote);

    const container = new ContainerBuilder().setAccentColor(getAccentColor());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_settings_emoji')} Pré-visualização do Card\n` +
            `-# Assim ficará o card postado no canal.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**${Emojis.get('store_emoji')} ${nome}**\n` +
            `${Emojis.get('pix_stamp_emoji')} ${preco}  •  ${entregaAuto ? `${Emojis.get('deliveredorder_emoji')} Entrega automática` : `${Emojis.get('_ticket_emoji')} Entrega manual`}${ehPackage ? `  •  ${Emojis.get('_cart_emoji')} Package com variantes` : ''}\n\n` +
            `${desc}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ap_cfg_editar')
                .setLabel('Editar nome/descrição')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji({ id: '1501804003850322052' }),
            new ButtonBuilder()
                .setCustomId('ap_cfg_postar')
                .setLabel('Postar no Canal')
                .setStyle(ButtonStyle.Success)
                .setEmoji({ id: '1501803923126747178' })
        )
    );

    return container;
}

function buildCardPublico(pacote, variante, nomeCustom, descCustom) {
    const nome = nomeCustom || (variante ? variante.name : pacote.name) || 'Produto';
    const desc = descCustom || (variante ? (variante.description || variante.short_description) : (pacote.description || pacote.short_description)) || 'Sem descrição.';
    const preco = formatarPreco(variante || pacote);
    const entregaAuto = isEntregaAuto(variante || pacote);
    const ehPackage = !variante && isPackage(pacote);
    const variantes = ehPackage ? getVariants(pacote) : [];

    const container = new ContainerBuilder().setAccentColor(getAccentColor());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('store_emoji')} ${nome}\n` +
            `-# ${Emojis.get('pix_stamp_emoji')} ${preco}  •  ${entregaAuto ? `${Emojis.get('deliveredorder_emoji')} Entrega automática` : `${Emojis.get('_ticket_emoji')} Entrega manual`}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(desc)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    if (ehPackage && variantes.length > 0) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `-# ${Emojis.get('_cart_emoji')} Selecione a variante desejada e clique em **Comprar**.`
            )
        );

        const selectVariante = new StringSelectMenuBuilder()
            .setCustomId('ap_pub_variante')
            .setPlaceholder('Selecione uma variante...')
            .addOptions(
                variantes.slice(0, 25).map(v => ({
                    label: (v.name || 'Variante').slice(0, 100),
                    description: formatarPreco(v).slice(0, 100),
                    value: String(v.id),
                }))
            );

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(selectVariante)
        );
    } else {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `-# Clique em **Comprar** para iniciar sua compra.`
            )
        );
    }

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ap_pub_comprar')
                .setLabel('Comprar')
                .setStyle(ButtonStyle.Success)
                .setEmoji({ id: '1501803932484108359' })
        )
    );

    return container;
}

// ─── Checkout + entrega ───────────────────────────────────────────────────────

async function processarCompra(interaction, dadosCompra) {
    const { packageId, nome, preco, entregaAuto, gateway } = dadosCompra;

    const loadingContainer = new ContainerBuilder().setAccentColor(getAccentColor());
    loadingContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Criando pedido, aguarde...`)
    );
    await interaction.update({
        components: [loadingContainer],
        flags: MessageFlags.IsComponentsV2,
        embeds: [],
        content: '',
    });

    let checkout;
    try {
        checkout = await centralCart.createCheckout({
            packages: [{ id: packageId, quantity: 1 }],
            discord_id: interaction.user.id,
            client_name: interaction.user.globalName || interaction.user.username,
            gateway: gateway,
        });
    } catch (err) {
        const errContainer = new ContainerBuilder().setAccentColor(0xED4245);
        errContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `${Emojis.get('negative_emoji')} Erro ao criar pedido: \`${err.message}\``
            )
        );
        return interaction.editReply({
            components: [errContainer],
            flags: MessageFlags.IsComponentsV2,
            embeds: [],
            content: '',
        });
    }

    const pixCode =
        checkout?.payment?.pix_code ||
        checkout?.pix_code ||
        checkout?.pix?.code ||
        checkout?.qr_code ||
        checkout?.qr_code_text ||
        null;

    const orderId = checkout?.id || checkout?.order_id || checkout?.internal_id || '—';
    const valorFmt = checkout?.formatted_price || preco;

    const resultContainer = new ContainerBuilder().setAccentColor(0x57F287);

    resultContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('neworder_emoji')} Pedido criado!\n` +
            `-# ID: \`${orderId}\``
        )
    );

    resultContainer.addSeparatorComponents(new SeparatorBuilder());

    resultContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**${Emojis.get('store_emoji')} Produto:** ${nome}\n` +
            `**${Emojis.get('_money_emoji')} Valor:** ${valorFmt}\n` +
            `**${Emojis.get('pix_stamp_emoji')} Método:** ${checkout?.formatted_gateway || gateway}`
        )
    );

    const extraFiles = [];

    if (pixCode) {
        resultContainer.addSeparatorComponents(new SeparatorBuilder());
        resultContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**${Emojis.get('pix_stamp_emoji')} Código PIX — Copia e Cola:**\n\`\`\`\n${pixCode}\n\`\`\``
            )
        );

        try {
            const imgPath = path.join(__dirname, '../../Handler/aaaaa.png');
            const gen = new qrGenerator({ imagePath: imgPath });
            const qrResult = await gen.generate(pixCode);
            if (qrResult.status === 'success') {
                const buf = Buffer.from(qrResult.response, 'base64');
                extraFiles.push(new AttachmentBuilder(buf, { name: 'qrcode.png' }));
                resultContainer.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `-# ${Emojis.get('information_emoji')} QR Code disponível na imagem abaixo.`
                    )
                );
            }
        } catch (e) {}
    }

    await interaction.editReply({
        components: [resultContainer],
        flags: MessageFlags.IsComponentsV2,
        embeds: [],
        content: '',
        files: extraFiles,
    });

    if (entregaAuto) {
        try {
            const user = await interaction.client.users.fetch(interaction.user.id);
            const dmContainer = new ContainerBuilder().setAccentColor(0x5865F2);
            dmContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('deliveredorder_emoji')} Pedido registrado!\n` +
                    `-# Após confirmação do pagamento, o produto será entregue automaticamente.`
                )
            );
            dmContainer.addSeparatorComponents(new SeparatorBuilder());
            dmContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**${Emojis.get('store_emoji')} Produto:** ${nome}\n` +
                    `**${Emojis.get('_money_emoji')} Valor:** ${valorFmt}\n` +
                    `**${Emojis.get('neworder_emoji')} Pedido:** \`${orderId}\``
                )
            );
            await user.send({
                components: [dmContainer],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                content: '',
            });
        } catch (e) {}
    } else {
        try {
            const ticketFuncoes = tickets.get('tickets.funcoes');
            const primeiraFuncao = ticketFuncoes ? Object.keys(ticketFuncoes)[0] : null;
            if (primeiraFuncao) {
                await CreateTicket(interaction, primeiraFuncao);
            } else {
                await interaction.followUp({
                    content: `${Emojis.get('_ticket_emoji')} Produto com **entrega manual**. Nossa equipe entrará em contato em breve!`,
                    ephemeral: true,
                });
            }
        } catch (e) {
            await interaction.followUp({
                content: `${Emojis.get('_ticket_emoji')} Produto com **entrega manual**. Nossa equipe entrará em contato em breve!`,
                ephemeral: true,
            }).catch(() => {});
        }
    }
}

// ─── Handler principal ────────────────────────────────────────────────────────

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        // ── [STAFF] Selecionou produto no menu de configuração ────────────────
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('ap_cfg_select_')) {
            const packageId = interaction.values[0];

            await interaction.deferUpdate();

            try {
                const pacote = await centralCart.getPackage(packageId);
                const ehPackage = isPackage(pacote);
                const variantes = ehPackage ? getVariants(pacote) : [];

                await db.set(`ap_cfg_${interaction.user.id}`, {
                    pacote,
                    varianteId: null,
                    variante: null,
                    nomeCustom: null,
                    descCustom: null,
                });

                if (ehPackage && variantes.length > 0) {
                    // É package: pedir para selecionar variante
                    const container = new ContainerBuilder().setAccentColor(getAccentColor());

                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## ${Emojis.get('_cart_emoji')} ${pacote.name || 'Package'}\n` +
                            `-# Este é um package com variantes. Selecione qual variante anunciar, ou poste o package inteiro com todas as opções.`
                        )
                    );

                    container.addSeparatorComponents(new SeparatorBuilder());

                    const selectVariante = new StringSelectMenuBuilder()
                        .setCustomId('ap_cfg_variante')
                        .setPlaceholder('Selecione uma variante específica...')
                        .addOptions(
                            variantes.slice(0, 25).map(v => ({
                                label: (v.name || 'Variante').slice(0, 100),
                                description: formatarPreco(v).slice(0, 100),
                                value: String(v.id),
                            }))
                        );

                    container.addActionRowComponents(
                        new ActionRowBuilder().addComponents(selectVariante)
                    );

                    container.addActionRowComponents(
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('ap_cfg_package_inteiro')
                                .setLabel('Postar package inteiro (com todas as variantes)')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji({ id: '1501803960393269298' })
                        )
                    );

                    await interaction.editReply({
                        components: [container],
                        flags: MessageFlags.IsComponentsV2,
                        embeds: [],
                        content: '',
                    });
                } else {
                    // Produto normal: mostrar config
                    const configCard = buildCardConfig(pacote, null, null, null);
                    await interaction.editReply({
                        components: [configCard],
                        flags: MessageFlags.IsComponentsV2,
                        embeds: [],
                        content: '',
                    });
                }

            } catch (err) {
                const errContainer = new ContainerBuilder().setAccentColor(0xED4245);
                errContainer.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${Emojis.get('negative_emoji')} Erro ao buscar produto: \`${err.message}\``
                    )
                );
                await interaction.editReply({
                    components: [errContainer],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    content: '',
                });
            }
        }

        // ── [STAFF] Selecionou variante específica do package ─────────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'ap_cfg_variante') {
            const varianteId = interaction.values[0];
            const dados = await db.get(`ap_cfg_${interaction.user.id}`);
            if (!dados) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sessão expirada. Execute o comando novamente.`, ephemeral: true });

            const variante = getVariants(dados.pacote).find(v => String(v.id) === varianteId) || { id: varianteId };

            await db.set(`ap_cfg_${interaction.user.id}`, {
                ...dados,
                varianteId,
                variante,
            });

            const configCard = buildCardConfig(dados.pacote, variante, dados.nomeCustom, dados.descCustom);
            await interaction.update({
                components: [configCard],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                content: '',
            });
        }

        // ── [STAFF] Optou por postar o package inteiro ────────────────────────
        if (interaction.isButton() && interaction.customId === 'ap_cfg_package_inteiro') {
            const dados = await db.get(`ap_cfg_${interaction.user.id}`);
            if (!dados) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sessão expirada.`, ephemeral: true });

            await db.set(`ap_cfg_${interaction.user.id}`, { ...dados, varianteId: null, variante: null });

            const configCard = buildCardConfig(dados.pacote, null, dados.nomeCustom, dados.descCustom);
            await interaction.update({
                components: [configCard],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                content: '',
            });
        }

        // ── [STAFF] Clicou em Editar ──────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'ap_cfg_editar') {
            const dados = await db.get(`ap_cfg_${interaction.user.id}`);
            if (!dados) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sessão expirada.`, ephemeral: true });

            const { pacote, variante, nomeCustom, descCustom } = dados;
            const base = variante || pacote;

            const modal = new ModalBuilder()
                .setCustomId('ap_cfg_modal')
                .setTitle('Editar nome e descrição');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('ap_nome')
                        .setLabel('Nome exibido no card')
                        .setStyle(TextInputStyle.Short)
                        .setValue(nomeCustom || base.name || '')
                        .setMaxLength(100)
                        .setRequired(false)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('ap_desc')
                        .setLabel('Descrição exibida no card')
                        .setStyle(TextInputStyle.Paragraph)
                        .setValue(descCustom || base.description || base.short_description || '')
                        .setMaxLength(1000)
                        .setRequired(false)
                )
            );

            await interaction.showModal(modal);
        }

        // ── [STAFF] Submeteu modal de edição ──────────────────────────────────
        if (interaction.isModalSubmit() && interaction.customId === 'ap_cfg_modal') {
            const dados = await db.get(`ap_cfg_${interaction.user.id}`);
            if (!dados) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sessão expirada.`, ephemeral: true });

            const nomeCustom = interaction.fields.getTextInputValue('ap_nome').trim() || null;
            const descCustom = interaction.fields.getTextInputValue('ap_desc').trim() || null;

            await db.set(`ap_cfg_${interaction.user.id}`, { ...dados, nomeCustom, descCustom });

            const configCard = buildCardConfig(dados.pacote, dados.variante, nomeCustom, descCustom);
            await interaction.update({
                components: [configCard],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                content: '',
            });
        }

        // ── [STAFF] Clicou em Postar no Canal ────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'ap_cfg_postar') {
            const dados = await db.get(`ap_cfg_${interaction.user.id}`);
            if (!dados) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sessão expirada.`, ephemeral: true });

            await interaction.deferUpdate();

            const { pacote, variante, nomeCustom, descCustom } = dados;

            try {
                const cardPublico = buildCardPublico(pacote, variante, nomeCustom, descCustom);

                const msg = await interaction.channel.send({
                    components: [cardPublico],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    content: '',
                });

                const ehPackage = !variante && isPackage(pacote);
                await db.set(`ap_msg_${msg.id}`, {
                    packageId: variante ? variante.id : pacote.id,
                    pacoteId: pacote.id,
                    nome: nomeCustom || (variante ? variante.name : pacote.name) || 'Produto',
                    desc: nomeCustom || (variante ? (variante.description || '') : (pacote.description || '')),
                    preco: formatarPreco(variante || pacote),
                    entregaAuto: isEntregaAuto(variante || pacote),
                    ehPackage,
                    variantes: ehPackage ? getVariants(pacote) : [],
                });

                await db.delete(`ap_cfg_${interaction.user.id}`);

                const successContainer = new ContainerBuilder().setAccentColor(0x57F287);
                successContainer.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${Emojis.get('confirmed_emoji')} Card de compra postado com sucesso no canal ${interaction.channel}!`
                    )
                );

                await interaction.editReply({
                    components: [successContainer],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    content: '',
                });

            } catch (err) {
                const errContainer = new ContainerBuilder().setAccentColor(0xED4245);
                errContainer.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${Emojis.get('negative_emoji')} Erro ao postar: \`${err.message}\``
                    )
                );
                await interaction.editReply({
                    components: [errContainer],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    content: '',
                });
            }
        }

        // ── [USUÁRIO] Selecionou variante no card público ─────────────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'ap_pub_variante') {
            const varianteId = interaction.values[0];
            const msgDados = await db.get(`ap_msg_${interaction.message.id}`);

            if (!msgDados) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Este card expirou. Peça ao staff para postar um novo.`,
                    ephemeral: true,
                });
            }

            const variante = (msgDados.variantes || []).find(v => String(v.id) === varianteId);
            const nome = variante ? variante.name : 'Produto';
            const preco = variante ? formatarPreco(variante) : msgDados.preco;

            await db.set(`ap_user_${interaction.user.id}_${interaction.message.id}`, {
                varianteId,
                nome,
                preco,
                entregaAuto: msgDados.entregaAuto,
            });

            const container = new ContainerBuilder().setAccentColor(getAccentColor());
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${Emojis.get('confirmed_emoji')} **${nome}** selecionado — ${preco}\nAgora clique em **Comprar** para prosseguir.`
                )
            );

            await interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                content: '',
                ephemeral: true,
            });
        }

        // ── [USUÁRIO] Clicou em Comprar no card público ───────────────────────
        if (interaction.isButton() && interaction.customId === 'ap_pub_comprar') {
            const msgDados = await db.get(`ap_msg_${interaction.message.id}`);

            if (!msgDados) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Este card expirou. Peça ao staff para postar um novo.`,
                    ephemeral: true,
                });
            }

            let packageId = msgDados.packageId;
            let nome = msgDados.nome;
            let preco = msgDados.preco;
            const entregaAuto = msgDados.entregaAuto;

            if (msgDados.ehPackage) {
                const selecaoUsuario = await db.get(`ap_user_${interaction.user.id}_${interaction.message.id}`);
                if (!selecaoUsuario) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Selecione uma variante no menu acima antes de continuar.`,
                        ephemeral: true,
                    });
                }
                packageId = selecaoUsuario.varianteId;
                nome = selecaoUsuario.nome;
                preco = selecaoUsuario.preco;
            }

            await db.set(`ap_purchase_${interaction.user.id}`, {
                packageId,
                nome,
                preco,
                entregaAuto,
                msgId: interaction.message.id,
            });

            const container = new ContainerBuilder().setAccentColor(getAccentColor());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('pix_stamp_emoji')} Método de Pagamento\n` +
                    `-# Escolha como deseja pagar.`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**${Emojis.get('store_emoji')} Produto:** ${nome}\n` +
                    `**${Emojis.get('_money_emoji')} Valor:** ${preco}`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('ap_pay_pix')
                        .setLabel('PIX')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji({ id: '1501803973383028856' }),
                    new ButtonBuilder()
                        .setCustomId('ap_pay_cartao')
                        .setLabel('Cartão de Crédito')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji({ id: '1501803970337833040' }),
                    new ButtonBuilder()
                        .setCustomId('ap_pay_cancelar')
                        .setLabel('Cancelar')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji({ id: '1501803935453679616' })
                )
            );

            await interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                content: '',
                ephemeral: true,
            });
        }

        // ── [USUÁRIO] Selecionou método de pagamento ──────────────────────────
        if (interaction.isButton() && (interaction.customId === 'ap_pay_pix' || interaction.customId === 'ap_pay_cartao')) {
            const gateway = interaction.customId === 'ap_pay_pix' ? 'PIX' : 'CREDIT_CARD';
            const gatewayLabel = interaction.customId === 'ap_pay_pix' ? 'PIX' : 'Cartão de Crédito';

            const dadosCompra = await db.get(`ap_purchase_${interaction.user.id}`);
            if (!dadosCompra) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Sessão expirada. Clique em Comprar novamente.`,
                    ephemeral: true,
                });
            }

            const { nome, preco, entregaAuto } = dadosCompra;

            const container = new ContainerBuilder().setAccentColor(getAccentColor());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('_confirm_emoji')} Confirmar Compra\n` +
                    `-# Revise os detalhes abaixo antes de confirmar.`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**${Emojis.get('store_emoji')} Produto:** ${nome}\n` +
                    `**${Emojis.get('_money_emoji')} Valor:** ${preco}\n` +
                    `**${Emojis.get('pix_stamp_emoji')} Pagamento:** ${gatewayLabel}\n` +
                    `**${Emojis.get(entregaAuto ? 'deliveredorder_emoji' : '_ticket_emoji')} Entrega:** ${entregaAuto ? 'Automática (via DM)' : 'Manual (via Ticket)'}`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('ap_pay_cancelar')
                        .setLabel('Voltar')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji({ id: '1501803908589162537' }),
                    new ButtonBuilder()
                        .setCustomId(`ap_pay_confirmar_${gateway}`)
                        .setLabel('Confirmar Compra')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji({ id: '1501803932484108359' })
                )
            );

            await interaction.update({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                content: '',
            });
        }

        // ── [USUÁRIO] Cancelou ────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'ap_pay_cancelar') {
            await db.delete(`ap_purchase_${interaction.user.id}`);
            const container = new ContainerBuilder().setAccentColor(0xED4245);
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${Emojis.get('negative_emoji')} Compra cancelada.`
                )
            );
            await interaction.update({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                content: '',
            });
        }

        // ── [USUÁRIO] Confirmou compra ────────────────────────────────────────
        if (interaction.isButton() && interaction.customId.startsWith('ap_pay_confirmar_')) {
            const gateway = interaction.customId.replace('ap_pay_confirmar_', '');
            const dadosCompra = await db.get(`ap_purchase_${interaction.user.id}`);

            if (!dadosCompra) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Sessão expirada. Clique em Comprar novamente.`,
                    ephemeral: true,
                });
            }

            await db.delete(`ap_purchase_${interaction.user.id}`);
            if (dadosCompra.msgId) {
                await db.delete(`ap_user_${interaction.user.id}_${dadosCompra.msgId}`);
            }

            await processarCompra(interaction, { ...dadosCompra, gateway });
        }

    },
};
