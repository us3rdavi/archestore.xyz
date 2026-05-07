const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags,
    AttachmentBuilder,
} = require('discord.js');
const { QuickDB } = require('quick.db');
const { configuracao, Emojis } = require('../../DataBaseJson');
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
    if (p.formatted_price) return p.formatted_price;
    if (p.price != null) return `R$ ${Number(p.price).toFixed(2).replace('.', ',')}`;
    return 'N/A';
}

async function mostrarDetalheProduto(interaction, pacote, nomeCustom, descCustom, isUpdate) {
    const nome = nomeCustom || pacote.name || 'Produto';
    const desc = descCustom || pacote.description || pacote.short_description || 'Sem descrição.';
    const preco = formatarPreco(pacote);
    const tipo = pacote.delivery_type || pacote.type || '';
    const entregaAuto = tipo === 'automatic' || tipo === 'auto' || tipo === 'AUTOMATIC' || pacote.automatic_delivery === true;

    const container = new ContainerBuilder().setAccentColor(getAccentColor());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('store_emoji')} ${nome}\n` +
            `-# ${Emojis.get('pix_stamp_emoji')} ${preco}  •  ${entregaAuto ? `${Emojis.get('deliveredorder_emoji')} Entrega automática` : `${Emojis.get('_ticket_emoji')} Entrega manual`}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**${Emojis.get('information_emoji')} Descrição:**\n${desc}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `-# Clique em **Editar** para personalizar nome/descrição ou em **Comprar** para prosseguir.`
        )
    );

    const botoesRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`ap_editar`)
            .setLabel('Editar')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji({ id: '1501804003850322052' }),
        new ButtonBuilder()
            .setCustomId(`ap_comprar`)
            .setLabel('Comprar')
            .setStyle(ButtonStyle.Success)
            .setEmoji({ id: '1501803932484108359' })
    );

    container.addActionRowComponents(botoesRow);

    const payload = {
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        embeds: [],
        content: '',
    };

    if (isUpdate) {
        await interaction.update(payload);
    } else {
        await interaction.reply({ ...payload, ephemeral: true });
    }
}

async function gerarEEnviarPix(interaction, pacote, nomeCustom, descCustom) {
    const nome = nomeCustom || pacote.name || 'Produto';
    const preco = formatarPreco(pacote);
    const tipo = pacote.delivery_type || pacote.type || '';
    const entregaAuto = tipo === 'automatic' || tipo === 'auto' || tipo === 'AUTOMATIC' || pacote.automatic_delivery === true;

    const loadingContainer = new ContainerBuilder().setAccentColor(getAccentColor());
    loadingContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Criando seu pedido, aguarde...`)
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
            packages: [{ id: pacote.id, quantity: 1 }],
            discord_id: interaction.user.id,
            client_name: interaction.user.globalName || interaction.user.username,
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
    const valorFmt = checkout?.formatted_price || checkout?.price ? `R$ ${Number(checkout.price).toFixed(2).replace('.', ',')}` : preco;

    const container = new ContainerBuilder().setAccentColor(0x57F287);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('neworder_emoji')} Pedido criado!\n` +
            `-# ID: \`${orderId}\``
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**${Emojis.get('store_emoji')} Produto:** ${nome}\n` +
            `**${Emojis.get('_money_emoji')} Valor:** ${valorFmt}\n` +
            `**${Emojis.get('pix_stamp_emoji')} Método:** ${checkout?.formatted_gateway || checkout?.gateway || 'PIX'}`
        )
    );

    const extraFiles = [];

    if (pixCode) {
        container.addSeparatorComponents(new SeparatorBuilder());

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**${Emojis.get('pix_stamp_emoji')} Código PIX (Copia e Cola):**\n\`\`\`\n${pixCode}\n\`\`\``
            )
        );

        try {
            const imgPath = path.join(__dirname, '../../Handler/aaaaa.png');
            const gen = new qrGenerator({ imagePath: imgPath });
            const qrResult = await gen.generate(pixCode);

            if (qrResult.status === 'success') {
                const buf = Buffer.from(qrResult.response, 'base64');
                const attachment = new AttachmentBuilder(buf, { name: 'qrcode.png' });
                extraFiles.push(attachment);
                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `-# ${Emojis.get('information_emoji')} O QR Code também está disponível na imagem abaixo.`
                    )
                );
            }
        } catch (e) {
        }
    } else {
        container.addSeparatorComponents(new SeparatorBuilder());
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `${Emojis.get('information_emoji')} O link de pagamento foi gerado pela CentralCart. Verifique o painel para mais detalhes.`
            )
        );
    }

    await interaction.editReply({
        components: [container],
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
                    `## ${Emojis.get('deliveredorder_emoji')} Seu pedido foi registrado!\n` +
                    `-# Após a confirmação do pagamento, seu produto será entregue automaticamente.`
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
        } catch (e) {
        }
    } else {
        try {
            const ticketFuncoes = require('../../DataBaseJson').tickets.get('tickets.funcoes');
            const primeiraFuncao = ticketFuncoes ? Object.keys(ticketFuncoes)[0] : null;

            if (primeiraFuncao) {
                await CreateTicket(interaction, primeiraFuncao);
            } else {
                await interaction.followUp({
                    content: `${Emojis.get('_ticket_emoji')} Este produto requer **entrega manual**. Nossa equipe entrará em contato em breve!`,
                    ephemeral: true,
                });
            }
        } catch (e) {
            await interaction.followUp({
                content: `${Emojis.get('_ticket_emoji')} Este produto requer **entrega manual**. Nossa equipe entrará em contato em breve!`,
                ephemeral: true,
            }).catch(() => {});
        }
    }
}

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('ap_selecionar_')) {
            const packageId = interaction.values[0];

            const loadingContainer = new ContainerBuilder().setAccentColor(getAccentColor());
            loadingContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Carregando produto...`)
            );
            await interaction.reply({
                components: [loadingContainer],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                content: '',
                ephemeral: true,
            });

            try {
                const pacote = await centralCart.getPackage(packageId);
                await db.set(`ap_produto_${interaction.user.id}`, {
                    pacote,
                    nomeCustom: null,
                    descCustom: null,
                });

                const nome = pacote.name || 'Produto';
                const desc = pacote.description || pacote.short_description || 'Sem descrição.';
                const preco = formatarPreco(pacote);
                const tipo = pacote.delivery_type || pacote.type || '';
                const entregaAuto = tipo === 'automatic' || tipo === 'auto' || tipo === 'AUTOMATIC' || pacote.automatic_delivery === true;

                const container = new ContainerBuilder().setAccentColor(getAccentColor());

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('store_emoji')} ${nome}\n` +
                        `-# ${Emojis.get('pix_stamp_emoji')} ${preco}  •  ${entregaAuto ? `${Emojis.get('deliveredorder_emoji')} Entrega automática` : `${Emojis.get('_ticket_emoji')} Entrega manual`}`
                    )
                );

                container.addSeparatorComponents(new SeparatorBuilder());

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**${Emojis.get('information_emoji')} Descrição:**\n${desc}`
                    )
                );

                container.addSeparatorComponents(new SeparatorBuilder());

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `-# Clique em **Editar** para personalizar nome/descrição ou em **Comprar** para prosseguir.`
                    )
                );

                const botoesRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ap_editar`)
                        .setLabel('Editar')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji({ id: '1501804003850322052' }),
                    new ButtonBuilder()
                        .setCustomId(`ap_comprar`)
                        .setLabel('Comprar')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji({ id: '1501803932484108359' })
                );

                container.addActionRowComponents(botoesRow);

                await interaction.editReply({
                    components: [container],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    content: '',
                });

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


        if (interaction.isButton() && interaction.customId === 'ap_editar') {
            const dados = await db.get(`ap_produto_${interaction.user.id}`);
            if (!dados) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Sessão expirada. Use o menu novamente.`,
                    ephemeral: true,
                });
            }

            const { pacote, nomeCustom, descCustom } = dados;

            const modal = new ModalBuilder()
                .setCustomId('ap_modal_editar')
                .setTitle('Personalizar Produto');

            const nomeInput = new TextInputBuilder()
                .setCustomId('ap_nome')
                .setLabel('Nome do produto')
                .setStyle(TextInputStyle.Short)
                .setValue(nomeCustom || pacote.name || '')
                .setMaxLength(100)
                .setRequired(false);

            const descInput = new TextInputBuilder()
                .setCustomId('ap_desc')
                .setLabel('Descrição do produto')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(descCustom || pacote.description || pacote.short_description || '')
                .setMaxLength(1000)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nomeInput),
                new ActionRowBuilder().addComponents(descInput),
            );

            await interaction.showModal(modal);
        }


        if (interaction.isModalSubmit() && interaction.customId === 'ap_modal_editar') {
            const nomeCustom = interaction.fields.getTextInputValue('ap_nome').trim();
            const descCustom = interaction.fields.getTextInputValue('ap_desc').trim();

            const dados = await db.get(`ap_produto_${interaction.user.id}`);
            if (!dados) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Sessão expirada. Use o menu novamente.`,
                    ephemeral: true,
                });
            }

            const { pacote } = dados;
            const novoNome = nomeCustom || pacote.name;
            const novaDesc = descCustom || pacote.description || pacote.short_description;

            await db.set(`ap_produto_${interaction.user.id}`, {
                pacote,
                nomeCustom: novoNome,
                descCustom: novaDesc,
            });

            const preco = formatarPreco(pacote);
            const tipo = pacote.delivery_type || pacote.type || '';
            const entregaAuto = tipo === 'automatic' || tipo === 'auto' || tipo === 'AUTOMATIC' || pacote.automatic_delivery === true;

            const container = new ContainerBuilder().setAccentColor(getAccentColor());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('store_emoji')} ${novoNome}\n` +
                    `-# ${Emojis.get('pix_stamp_emoji')} ${preco}  •  ${entregaAuto ? `${Emojis.get('deliveredorder_emoji')} Entrega automática` : `${Emojis.get('_ticket_emoji')} Entrega manual`}`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**${Emojis.get('information_emoji')} Descrição:**\n${novaDesc}`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${Emojis.get('confirmed_emoji')} Informações atualizadas. Clique em **Comprar** para prosseguir.`
                )
            );

            const botoesRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`ap_editar`)
                    .setLabel('Editar')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji({ id: '1501804003850322052' }),
                new ButtonBuilder()
                    .setCustomId(`ap_comprar`)
                    .setLabel('Comprar')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji({ id: '1501803932484108359' })
            );

            container.addActionRowComponents(botoesRow);

            await interaction.update({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                content: '',
            });
        }


        if (interaction.isButton() && interaction.customId === 'ap_comprar') {
            const dados = await db.get(`ap_produto_${interaction.user.id}`);
            if (!dados) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Sessão expirada. Use o menu novamente.`,
                    ephemeral: true,
                });
            }

            const { pacote, nomeCustom, descCustom } = dados;
            const nome = nomeCustom || pacote.name || 'Produto';
            const preco = formatarPreco(pacote);
            const tipo = pacote.delivery_type || pacote.type || '';
            const entregaAuto = tipo === 'automatic' || tipo === 'auto' || tipo === 'AUTOMATIC' || pacote.automatic_delivery === true;

            const container = new ContainerBuilder().setAccentColor(getAccentColor());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('_confirm_emoji')} Confirmar Compra\n` +
                    `-# Revise os detalhes antes de confirmar.`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**${Emojis.get('store_emoji')} Produto:** ${nome}\n` +
                    `**${Emojis.get('_money_emoji')} Valor:** ${preco}\n` +
                    `**${Emojis.get(entregaAuto ? 'deliveredorder_emoji' : '_ticket_emoji')} Entrega:** ${entregaAuto ? 'Automática (via DM)' : 'Manual (via Ticket)'}`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `-# Ao confirmar, um pedido será criado e o código PIX gerado.`
                )
            );

            const botoesRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ap_cancelar')
                    .setLabel('Cancelar')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji({ id: '1501803935453679616' }),
                new ButtonBuilder()
                    .setCustomId('ap_confirmar')
                    .setLabel('Confirmar Compra')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji({ id: '1501803932484108359' })
            );

            container.addActionRowComponents(botoesRow);

            await interaction.update({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                content: '',
            });
        }


        if (interaction.isButton() && interaction.customId === 'ap_cancelar') {
            const container = new ContainerBuilder().setAccentColor(0xED4245);
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${Emojis.get('negative_emoji')} Compra cancelada. Use o menu para selecionar um produto novamente.`
                )
            );
            await interaction.update({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                content: '',
            });
        }


        if (interaction.isButton() && interaction.customId === 'ap_confirmar') {
            const dados = await db.get(`ap_produto_${interaction.user.id}`);
            if (!dados) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Sessão expirada. Use o menu novamente.`,
                    ephemeral: true,
                });
            }

            const { pacote, nomeCustom, descCustom } = dados;
            await db.delete(`ap_produto_${interaction.user.id}`);

            await gerarEEnviarPix(interaction, pacote, nomeCustom, descCustom);
        }

    },
};
