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
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
} = require('discord.js');
const QRCode = require('qrcode');
const { configuracao, tickets, Emojis, painelCards } = require('../../DataBaseJson');
const centralCart = require('../../Functions/centralCartService');
const { CreateTicket } = require('../../Functions/CreateTicket');

// Sessões de compra em memória — eliminam conflitos SQLite do QuickDB
const sessao = new Map();
const TTL_MS = 30 * 60 * 1000; // 30 minutos

function sessaoSet(key, value) {
    sessao.set(key, { value, expireAt: Date.now() + TTL_MS });
}

function sessaoGet(key) {
    const entry = sessao.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expireAt) { sessao.delete(key); return null; }
    return entry.value;
}

function sessaoDel(key) {
    sessao.delete(key);
}

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

// Campos reais da API da CentralCart
function isPackage(p)     { return p?.is_variation_parent === true; }
function getVariants(p)   { return Array.isArray(p?.variations) ? p.variations : []; }
function formatarPreco(p) { return p?.price_display || (p?.price != null ? `R$ ${Number(p.price).toFixed(2).replace('.', ',')}` : 'N/A'); }
function isEntregaAuto(p) { return p?.chat_delivery?.enabled === true; }

// ─── Helpers persistência de cards ───────────────────────────────────────────

function cardKey(msgId) { return `cards.${msgId}`; }

function setCard(msgId, data) {
    painelCards.set(cardKey(msgId), data);
}

function getCard(msgId) {
    return painelCards.get(cardKey(msgId));
}

function deleteCard(msgId) {
    painelCards.delete(cardKey(msgId));
}

// ─── Builders de UI ──────────────────────────────────────────────────────────

function buildCardConfig(pacote, variante, nomeCustom, descCustom) {
    const base  = variante || pacote;
    const nome  = nomeCustom || base.name  || 'Produto';
    const desc  = descCustom || base.description || 'Sem descrição.';
    const preco = formatarPreco(base);
    const auto  = isEntregaAuto(base);
    const ehPkg = !variante && isPackage(pacote);

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
            `${Emojis.get('pix_stamp_emoji')} ${preco}  •  ` +
            `${auto ? `${Emojis.get('deliveredorder_emoji')} Entrega automática` : `${Emojis.get('_ticket_emoji')} Entrega manual`}` +
            `${ehPkg ? `  •  ${Emojis.get('_cart_emoji')} Package com variantes` : ''}\n\n` +
            `${desc}`
        )
    );
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ap_cfg_editar').setLabel('Editar nome/descrição').setStyle(ButtonStyle.Secondary).setEmoji({ id: '1501804003850322052' }),
            new ButtonBuilder().setCustomId('ap_cfg_postar').setLabel('Postar no Canal').setStyle(ButtonStyle.Success).setEmoji({ id: '1501803923126747178' })
        )
    );
    return container;
}

function buildCardPublico(pacote, variante, nomeCustom, descCustom) {
    const base  = variante || pacote;
    const nome  = nomeCustom || base.name  || 'Produto';
    const desc  = descCustom || base.description || 'Sem descrição.';
    const preco = formatarPreco(base);
    const auto  = isEntregaAuto(base);
    const ehPkg = !variante && isPackage(pacote);
    const vars  = ehPkg ? getVariants(pacote) : [];

    const container = new ContainerBuilder().setAccentColor(getAccentColor());
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('store_emoji')} ${nome}\n` +
            `-# ${Emojis.get('pix_stamp_emoji')} ${preco}  •  ${auto ? `${Emojis.get('deliveredorder_emoji')} Entrega automática` : `${Emojis.get('_ticket_emoji')} Entrega manual`}`
        )
    );
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));
    container.addSeparatorComponents(new SeparatorBuilder());

    if (ehPkg && vars.length > 0) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# ${Emojis.get('_cart_emoji')} Selecione a variante desejada e clique em **Comprar**.`)
        );
        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ap_pub_variante')
                    .setPlaceholder('Selecione uma variante...')
                    .addOptions(vars.slice(0, 25).map(v => ({
                        label: (v.name || 'Variante').slice(0, 100),
                        description: formatarPreco(v).slice(0, 100),
                        value: String(v.id),
                    })))
            )
        );
    } else {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# Clique em **Comprar** para iniciar sua compra.`)
        );
    }

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ap_pub_comprar').setLabel('Comprar').setStyle(ButtonStyle.Success).setEmoji({ id: '1501803932484108359' })
        )
    );
    return container;
}

// ─── Checkout ────────────────────────────────────────────────────────────────

async function processarCompra(interaction, dadosCompra) {
    const { packageId, nome, preco, entregaAuto, gateway, email, nomeCliente } = dadosCompra;

    const loadingContainer = new ContainerBuilder().setAccentColor(getAccentColor());
    loadingContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Criando pedido, aguarde...`));
    await interaction.update({ components: [loadingContainer], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

    let checkout;
    try {
        checkout = await centralCart.createCheckout({
            cart: [{ package_id: packageId, quantity: 1 }],
            client_discord: interaction.user.id,
            client_name: nomeCliente || interaction.user.globalName || interaction.user.username,
            client_email: email,
            terms: true,
            gateway,
        });
    } catch (err) {
        const c = new ContainerBuilder().setAccentColor(0xED4245);
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Erro ao criar pedido: \`${err.message}\``));
        return interaction.editReply({ components: [c], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
    }

    console.log('[Checkout] Campos retornados:', JSON.stringify(Object.keys(checkout || {})));
    console.log('[Checkout] Resposta completa:', JSON.stringify(checkout));

    const pixCode =
        checkout?.pix_code ||
        checkout?.pix?.code ||
        checkout?.pix?.brcode ||
        checkout?.brcode ||
        checkout?.emv ||
        checkout?.qr_code_text ||
        null;

    const qrBase64 =
        checkout?.qr_code ||
        checkout?.pix?.qr_code ||
        checkout?.qr_code_base64 ||
        checkout?.pix?.qr_code_base64 ||
        checkout?.qrcode ||
        null;

    const orderId  = checkout?.order_id || checkout?.id || '—';
    const valorFmt = checkout?.formatted_price || preco;
    const returnUrl = checkout?.return_url || checkout?.payment_url || null;

    if (gateway === 'PIX' && pixCode) {
        sessaoSet(`ap_pixcode_${interaction.user.id}`, pixCode);
    }

    const result = new ContainerBuilder().setAccentColor(0x57F287);
    result.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${Emojis.get('neworder_emoji')} Pedido criado!\n-# ID: \`${orderId}\``));
    result.addSeparatorComponents(new SeparatorBuilder());
    result.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**${Emojis.get('store_emoji')} Produto:** ${nome}\n` +
        `**${Emojis.get('_money_emoji')} Valor:** ${valorFmt}\n` +
        `**${Emojis.get('pix_stamp_emoji')} Método:** ${gateway === 'PIX' ? 'PIX' : 'Cartão de Crédito'}`
    ));

    const extraFiles = [];

    if (gateway === 'PIX' && pixCode) {
        result.addSeparatorComponents(new SeparatorBuilder());
        result.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `**${Emojis.get('pix_stamp_emoji')} Código PIX — Copia e Cola:**\n\`\`\`\n${pixCode}\n\`\`\``
        ));

        try {
            const qrBuffer = await QRCode.toBuffer(pixCode, { type: 'png', width: 512, margin: 2 });
            extraFiles.push(new AttachmentBuilder(qrBuffer, { name: 'qrcode.png' }));
            result.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `-# ${Emojis.get('information_emoji')} Escaneie o QR Code para pagar:`
            ));
            result.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder().setURL('attachment://qrcode.png')
                )
            );
        } catch (e) {
            console.log('[Checkout] Erro ao gerar QR Code:', e.message);
        }

        result.addSeparatorComponents(new SeparatorBuilder());
        result.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ap_copiar_pix').setLabel('Copiar código PIX').setStyle(ButtonStyle.Primary).setEmoji({ id: '1501803973383028856' })
            )
        );
    } else if (gateway === 'PIX' && !pixCode) {
        result.addSeparatorComponents(new SeparatorBuilder());
        result.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${Emojis.get('information_emoji')} Pedido criado. ${returnUrl ? `Acesse o link abaixo para pagar:` : `Aguarde o código PIX em breve.`}`
        ));
        if (returnUrl) {
            result.addTextDisplayComponents(new TextDisplayBuilder().setContent(returnUrl));
        }
    } else if (returnUrl) {
        result.addSeparatorComponents(new SeparatorBuilder());
        result.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `**${Emojis.get('information_emoji')} Acesse o link para finalizar o pagamento:**\n${returnUrl}`
        ));
    }

    if (returnUrl) {
        result.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setLabel('Ver Pedido').setStyle(ButtonStyle.Link).setURL(returnUrl)
            )
        );
    }

    await interaction.editReply({ components: [result], flags: MessageFlags.IsComponentsV2, embeds: [], content: '', files: extraFiles });

    if (entregaAuto) {
        try {
            const user = await interaction.client.users.fetch(interaction.user.id);
            const dm = new ContainerBuilder().setAccentColor(0x5865F2);
            dm.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${Emojis.get('deliveredorder_emoji')} Pedido registrado!\n-# Após confirmação do pagamento, o produto será entregue automaticamente.`));
            dm.addSeparatorComponents(new SeparatorBuilder());
            dm.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `**${Emojis.get('store_emoji')} Produto:** ${nome}\n` +
                `**${Emojis.get('_money_emoji')} Valor:** ${valorFmt}\n` +
                `**${Emojis.get('neworder_emoji')} Pedido:** \`${orderId}\``
            ));
            await user.send({ components: [dm], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        } catch (e) {}
    } else {
        try {
            const ticketFuncoes = tickets.get('tickets.funcoes');
            const primeiraFuncao = ticketFuncoes ? Object.keys(ticketFuncoes)[0] : null;
            if (primeiraFuncao) {
                await CreateTicket(interaction, primeiraFuncao);
            } else {
                await interaction.followUp({ content: `${Emojis.get('_ticket_emoji')} Produto com **entrega manual**. Nossa equipe entrará em contato em breve!`, ephemeral: true });
            }
        } catch (e) {
            await interaction.followUp({ content: `${Emojis.get('_ticket_emoji')} Produto com **entrega manual**. Nossa equipe entrará em contato em breve!`, ephemeral: true }).catch(() => {});
        }
    }
}

// ─── Handler principal ────────────────────────────────────────────────────────

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        // ── [STAFF] Selecionou produto no menu do comando (ephemeral) ─────────
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('ap_cfg_select_')) {
            const packageId = Number(interaction.values[0]);

            const loading = new ContainerBuilder().setAccentColor(getAccentColor());
            loading.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Carregando produto...`));
            await interaction.update({ components: [loading], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

            try {
                const pacote = await centralCart.getPackage(packageId);

                sessaoSet(`ap_cfg_${interaction.user.id}`, { pacote, nomeCustom: null, descCustom: null });

                await interaction.editReply({ components: [buildCardConfig(pacote, null, null, null)], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
            } catch (err) {
                const c = new ContainerBuilder().setAccentColor(0xED4245);
                c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Erro ao buscar produto: \`${err.message}\``));
                await interaction.editReply({ components: [c], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
            }
        }

        // ── [STAFF] Editar nome/descrição ─────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'ap_cfg_editar') {
            const dados = sessaoGet(`ap_cfg_${interaction.user.id}`);
            if (!dados) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sessão expirada.`, ephemeral: true });

            const modal = new ModalBuilder().setCustomId('ap_cfg_modal').setTitle('Editar nome e descrição');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('ap_nome').setLabel('Nome exibido no card').setStyle(TextInputStyle.Short)
                        .setValue(dados.nomeCustom || dados.pacote.name || '').setMaxLength(100).setRequired(false)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('ap_desc').setLabel('Descrição exibida no card').setStyle(TextInputStyle.Paragraph)
                        .setValue(dados.descCustom || dados.pacote.description || '').setMaxLength(1000).setRequired(false)
                )
            );
            await interaction.showModal(modal);
        }

        // ── [STAFF] Submeteu edição ───────────────────────────────────────────
        if (interaction.isModalSubmit() && interaction.customId === 'ap_cfg_modal') {
            const dados = sessaoGet(`ap_cfg_${interaction.user.id}`);
            if (!dados) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sessão expirada.`, ephemeral: true });

            const nomeCustom = interaction.fields.getTextInputValue('ap_nome').trim() || null;
            const descCustom = interaction.fields.getTextInputValue('ap_desc').trim() || null;
            sessaoSet(`ap_cfg_${interaction.user.id}`, { ...dados, nomeCustom, descCustom });

            await interaction.update({ components: [buildCardConfig(dados.pacote, null, nomeCustom, descCustom)], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        }

        // ── [STAFF] Postar no canal ───────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'ap_cfg_postar') {
            const dados = sessaoGet(`ap_cfg_${interaction.user.id}`);
            if (!dados) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sessão expirada.`, ephemeral: true });

            const loading = new ContainerBuilder().setAccentColor(getAccentColor());
            loading.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Postando...`));
            await interaction.update({ components: [loading], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

            const { pacote, nomeCustom, descCustom } = dados;
            try {
                const cardPublico = buildCardPublico(pacote, null, nomeCustom, descCustom);
                const msg = await interaction.channel.send({ components: [cardPublico], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

                const ehPkg = isPackage(pacote);
                setCard(msg.id, {
                    packageId:   pacote.id,
                    nome:        nomeCustom || pacote.name || 'Produto',
                    preco:       formatarPreco(pacote),
                    entregaAuto: isEntregaAuto(pacote),
                    ehPkg,
                    variantes:   ehPkg ? getVariants(pacote) : [],
                });

                sessaoDel(`ap_cfg_${interaction.user.id}`);

                const ok = new ContainerBuilder().setAccentColor(0x57F287);
                ok.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('confirmed_emoji')} Card postado com sucesso em ${interaction.channel}!`));
                await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
            } catch (err) {
                const c = new ContainerBuilder().setAccentColor(0xED4245);
                c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Erro ao postar: \`${err.message}\``));
                await interaction.editReply({ components: [c], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
            }
        }

        // ── [USUÁRIO] Selecionou variante no card público ─────────────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'ap_pub_variante') {
            const varianteId = interaction.values[0];
            const msgDados = getCard(interaction.message.id);
            if (!msgDados) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Este card não foi encontrado. Solicite ao admin que reposte o produto.`, ephemeral: true });

            const variante = (msgDados.variantes || []).find(v => String(v.id) === varianteId);
            sessaoSet(`ap_user_${interaction.user.id}_${interaction.message.id}`, {
                varianteId,
                nome:        variante?.name  || 'Variante',
                preco:       variante ? formatarPreco(variante) : msgDados.preco,
                entregaAuto: variante ? isEntregaAuto(variante) : msgDados.entregaAuto,
            });

            await interaction.deferUpdate();
        }

        // ── [USUÁRIO] Clicou em Comprar → pede nome e email via modal ─────────
        if (interaction.isButton() && interaction.customId === 'ap_pub_comprar') {
            const msgDados = getCard(interaction.message.id);
            if (!msgDados) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Este card não foi encontrado. Solicite ao admin que reposte o produto.`, ephemeral: true });

            let packageId   = msgDados.packageId;
            let nome        = msgDados.nome;
            let preco       = msgDados.preco;
            let entregaAuto = msgDados.entregaAuto;

            if (msgDados.ehPkg) {
                const selecao = sessaoGet(`ap_user_${interaction.user.id}_${interaction.message.id}`);
                if (!selecao) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Selecione uma variante no menu acima antes de clicar em Comprar.`, ephemeral: true });
                packageId   = selecao.varianteId;
                nome        = selecao.nome;
                preco       = selecao.preco;
                entregaAuto = selecao.entregaAuto;
            }

            sessaoSet(`ap_purchase_${interaction.user.id}`, { packageId, nome, preco, entregaAuto, msgId: interaction.message.id });

            const modal = new ModalBuilder().setCustomId('ap_email_modal').setTitle('Dados para o pedido');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('ap_nome_cliente').setLabel('Informe seu nome').setStyle(TextInputStyle.Short)
                        .setPlaceholder('João Silva').setRequired(true).setMaxLength(100)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('ap_email').setLabel('Seu e-mail').setStyle(TextInputStyle.Short)
                        .setPlaceholder('exemplo@email.com').setRequired(true).setMaxLength(254)
                )
            );
            await interaction.showModal(modal);
        }

        // ── [USUÁRIO] Submeteu nome+email → mostra seleção de pagamento ───────
        if (interaction.isModalSubmit() && interaction.customId === 'ap_email_modal') {
            const dadosCompra = sessaoGet(`ap_purchase_${interaction.user.id}`);
            if (!dadosCompra) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sessão expirada. Clique em Comprar novamente.`, ephemeral: true });

            const nomeCliente = interaction.fields.getTextInputValue('ap_nome_cliente').trim();
            const email = interaction.fields.getTextInputValue('ap_email').trim();
            sessaoSet(`ap_purchase_${interaction.user.id}`, { ...dadosCompra, email, nomeCliente });

            const { nome, preco } = dadosCompra;
            const container = new ContainerBuilder().setAccentColor(getAccentColor());
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${Emojis.get('pix_stamp_emoji')} Método de Pagamento\n-# Escolha como deseja pagar.`));
            container.addSeparatorComponents(new SeparatorBuilder());
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `**${Emojis.get('store_emoji')} Produto:** ${nome}\n**${Emojis.get('_money_emoji')} Valor:** ${preco}\n**${Emojis.get('information_emoji')} Nome:** ${nomeCliente}\n**${Emojis.get('information_emoji')} E-mail:** ${email}`
            ));
            container.addSeparatorComponents(new SeparatorBuilder());
            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ap_pay_pix').setLabel('PIX').setStyle(ButtonStyle.Primary).setEmoji({ id: '1501803973383028856' }),
                    new ButtonBuilder().setCustomId('ap_pay_cartao').setLabel('Cartão de Crédito').setStyle(ButtonStyle.Primary).setEmoji({ id: '1501803970337833040' }),
                    new ButtonBuilder().setCustomId('ap_pay_cancelar').setLabel('Cancelar').setStyle(ButtonStyle.Danger).setEmoji({ id: '1501803935453679616' })
                )
            );
            await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '', ephemeral: true });
        }

        // ── [USUÁRIO] Selecionou método de pagamento ──────────────────────────
        if (interaction.isButton() && (interaction.customId === 'ap_pay_pix' || interaction.customId === 'ap_pay_cartao')) {
            const gateway      = interaction.customId === 'ap_pay_pix' ? 'PIX' : 'CREDIT_CARD';
            const gatewayLabel = interaction.customId === 'ap_pay_pix' ? 'PIX' : 'Cartão de Crédito';

            const dadosCompra = sessaoGet(`ap_purchase_${interaction.user.id}`);
            if (!dadosCompra) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sessão expirada. Clique em Comprar novamente.`, ephemeral: true });

            const { nome, preco, entregaAuto, email, nomeCliente } = dadosCompra;
            const container = new ContainerBuilder().setAccentColor(getAccentColor());
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${Emojis.get('_confirm_emoji')} Confirmar Compra\n-# Revise os detalhes antes de confirmar.`));
            container.addSeparatorComponents(new SeparatorBuilder());
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `**${Emojis.get('store_emoji')} Produto:** ${nome}\n` +
                `**${Emojis.get('_money_emoji')} Valor:** ${preco}\n` +
                `**${Emojis.get('information_emoji')} Nome:** ${nomeCliente}\n` +
                `**${Emojis.get('information_emoji')} E-mail:** ${email}\n` +
                `**${Emojis.get('pix_stamp_emoji')} Pagamento:** ${gatewayLabel}\n` +
                `**${Emojis.get(entregaAuto ? 'deliveredorder_emoji' : '_ticket_emoji')} Entrega:** ${entregaAuto ? 'Automática (via DM)' : 'Manual (via Ticket)'}`
            ));
            container.addSeparatorComponents(new SeparatorBuilder());
            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ap_pay_cancelar').setLabel('Voltar').setStyle(ButtonStyle.Secondary).setEmoji({ id: '1501803908589162537' }),
                    new ButtonBuilder().setCustomId(`ap_pay_confirmar_${gateway}`).setLabel('Confirmar Compra').setStyle(ButtonStyle.Success).setEmoji({ id: '1501803932484108359' })
                )
            );
            await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        }

        // ── [USUÁRIO] Cancelou ────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'ap_pay_cancelar') {
            sessaoDel(`ap_purchase_${interaction.user.id}`);
            const c = new ContainerBuilder().setAccentColor(0xED4245);
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Compra cancelada.`));
            await interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        }

        // ── [USUÁRIO] Copiar código PIX ───────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'ap_copiar_pix') {
            const pixCode = sessaoGet(`ap_pixcode_${interaction.user.id}`);
            await interaction.deferReply({ ephemeral: true });
            if (!pixCode) {
                await interaction.editReply({ content: 'Código PIX não encontrado. Gere um novo pedido.' });
                return;
            }
            await interaction.editReply({ content: pixCode });
            return;
        }

        // ── [USUÁRIO] Confirmou compra ────────────────────────────────────────
        if (interaction.isButton() && interaction.customId.startsWith('ap_pay_confirmar_')) {
            const gateway     = interaction.customId.replace('ap_pay_confirmar_', '');
            const dadosCompra = sessaoGet(`ap_purchase_${interaction.user.id}`);
            if (!dadosCompra) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sessão expirada. Clique em Comprar novamente.`, ephemeral: true });

            sessaoDel(`ap_purchase_${interaction.user.id}`);
            if (dadosCompra.msgId) sessaoDel(`ap_user_${interaction.user.id}_${dadosCompra.msgId}`);

            await processarCompra(interaction, { ...dadosCompra, gateway });
        }
    },
};
