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
} = require('discord.js');
const { configuracao, Emojis } = require('../../Database');
const {
    getAppDetails,
    listPackages,
    listOrders,
    getOrder,
    updateOrder,
    getRevenueSummary,
    getOperations,
    getTopCustomers,
    listDiscounts,
    createDiscount,
    deleteDiscount,
    listLicenseKeys,
    addLicenseKeys,
} = require('../../Functions/CentralCartAPI');

const CV2 = { flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };

// ── Estado por usuário ────────────────────────────────────────────────────────
const ccState = new Map();
function getState(userId) {
    if (!ccState.has(userId)) ccState.set(userId, { secao: null, extraData: {} });
    return ccState.get(userId);
}

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch { return 0x5865F2; }
}

// ── Seções com emojis ─────────────────────────────────────────────────────────
const SECOES = [
    { value: 'loja',         label: 'Loja',         description: 'Informações e plano da loja',          emoji: { id: '1501803947898306724' } },
    { value: 'receita',      label: 'Receita',       description: 'Resumo financeiro e operações do dia', emoji: { id: '1501803982849445998' } },
    { value: 'produtos',     label: 'Produtos',      description: 'Catálogo de produtos da loja',         emoji: { id: '1501803960393269298' } },
    { value: 'pedidos',      label: 'Pedidos',       description: 'Histórico e gestão de pedidos',        emoji: { id: '1501803951161479208' } },
    { value: 'estoque',      label: 'Estoque',       description: 'Chaves de licença por produto',        emoji: { id: '1501804010049634426' } },
    { value: 'cupons',       label: 'Cupons',        description: 'Criação e gestão de cupons',           emoji: { id: '1501804052827209768' } },
    { value: 'top_clientes', label: 'Top Clientes',  description: 'Ranking dos maiores compradores',      emoji: { id: '1501804049563910285' } },
];

const STATUS_LABEL = {
    APPROVED: 'Aprovado', REJECTED: 'Rejeitado',
    CANCELED: 'Cancelado', REFUNDED: 'Reembolsado', CHARGEDBACK: 'Chargeback',
};

function fmtBRL(v) {
    return `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Menu de navegação ─────────────────────────────────────────────────────────
function buildNav(secaoAtiva) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('ccpainel_nav')
            .setPlaceholder('Navegar para...')
            .addOptions(SECOES.map(s => ({ ...s, default: s.value === secaoAtiva })))
    );
}

// ── Builders de seção ─────────────────────────────────────────────────────────
async function buildLoja() {
    const loja = await getAppDetails();
    const vencimento = loja.overdue_date
        ? `<t:${Math.floor(new Date(loja.overdue_date).getTime() / 1000)}:D>`
        : '`N/A`';

    return {
        title: `${Emojis.get('store_emoji')} Loja`,
        text:
            `${Emojis.get('_text_emoji')} **Nome:** ${loja.name}\n` +
            `${Emojis.get('information_emoji')} **ID:** \`${loja.id}\`\n` +
            `${Emojis.get('_diamond_emoji')} **Plano:** \`${loja.plan}\`\n` +
            `${Emojis.get('_send_emoji')} **URL:** ${loja.url}\n` +
            `${Emojis.get('date_emoji')} **Assinatura até:** ${vencimento}`,
        buttons: [
            new ButtonBuilder().setCustomId('ccpainel_refresh_loja').setLabel('Atualizar').setEmoji({ id: '1501803920576745522' }).setStyle(ButtonStyle.Secondary),
        ],
    };
}

async function buildReceita() {
    const hoje = new Date().toISOString().slice(0, 10);
    const [receita, ops] = await Promise.all([
        getRevenueSummary(),
        getOperations({ from: hoje, to: hoje }),
    ]);

    return {
        title: `${Emojis.get('_money_emoji')} Receita`,
        text:
            `${Emojis.get('date_emoji')} **Hoje**\n` +
            `> Líquido: \`${fmtBRL(receita.today)}\` — Vendas: \`${receita.today_sales ?? 0}\`\n\n` +
            `${Emojis.get('_messages_emoji')} **Mês atual**\n` +
            `> Líquido: \`${fmtBRL(receita.month)}\` — Vendas: \`${receita.month_sales ?? 0}\`\n\n` +
            `${Emojis.get('_star_emoji')} **Total geral:** \`${fmtBRL(receita.all_time)}\`\n\n` +
            `${Emojis.get('information_emoji')} **Operações de hoje**\n` +
            `> ${Emojis.get('confirmedpayment_emoji')} Aprovados: \`${ops.approved ?? 0}\`   ` +
            `${Emojis.get('failpayment_emoji')} Chargebacks: \`${ops.charged_back ?? 0}\``,
        buttons: [
            new ButtonBuilder().setCustomId('ccpainel_refresh_receita').setLabel('Atualizar').setEmoji({ id: '1501803920576745522' }).setStyle(ButtonStyle.Secondary),
        ],
    };
}

async function buildProdutos(busca = null) {
    const res     = await listPackages({ search: busca || null });
    const pacotes = res.data || [];

    let text;
    if (!pacotes.length) {
        text = `${Emojis.get('_search_emoji')} Nenhum produto encontrado${busca ? ` para **${busca}**` : ''}.`;
    } else {
        const linhas = pacotes.slice(0, 15).map(p => {
            const estoque = p.inventory_amount === null ? '∞' : p.inventory_amount;
            const status  = p.enabled ? Emojis.get('confirmed_emoji') : Emojis.get('negative_emoji');
            return `${status} \`${p.id}\` **${p.name}** — \`${p.formatted_price}\` — estoque: \`${estoque}\``;
        });
        const total = res.meta?.total ?? pacotes.length;
        text = `-# ${total} produto(s)${busca ? ` — busca: "${busca}"` : ''}\n\n${linhas.join('\n')}`;
    }

    return {
        title: `${Emojis.get('_cart_emoji')} Produtos`,
        text,
        buttons: [
            new ButtonBuilder().setCustomId('ccpainel_btn_buscar_produto').setLabel('Buscar').setEmoji({ id: '1501803928973476023' }).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ccpainel_refresh_produtos').setLabel('Atualizar').setEmoji({ id: '1501803920576745522' }).setStyle(ButtonStyle.Secondary),
        ],
    };
}

async function buildPedidos(opts = {}) {
    const res     = await listOrders({ status: opts.status || null, search: opts.busca || null });
    const pedidos = res.data || [];

    let text;
    if (!pedidos.length) {
        text = `${Emojis.get('_search_emoji')} Nenhum pedido encontrado.`;
    } else {
        const linhas = pedidos.slice(0, 8).map(p => {
            const statusLabel = STATUS_LABEL[p.status] || p.status;
            const data    = p.created_at ? `<t:${Math.floor(new Date(p.created_at).getTime() / 1000)}:d>` : 'N/A';
            const cliente = p.client_name || p.client_email || p.discord_id || 'Desconhecido';
            return `**${cliente}** — \`${p.formatted_price}\` — ${statusLabel} — ${data}\n-# ID: \`${p.id}\``;
        });
        const total = res.meta?.total ?? pedidos.length;
        text = `-# ${total} pedido(s)${opts.status ? ` — ${STATUS_LABEL[opts.status]}` : ''}\n\n${linhas.join('\n\n')}`;
    }

    return {
        title: `${Emojis.get('neworder_emoji')} Pedidos`,
        text,
        buttons: [
            new ButtonBuilder().setCustomId('ccpainel_btn_ver_pedido').setLabel('Ver por ID').setEmoji({ id: '1501803928973476023' }).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ccpainel_btn_reembolso').setLabel('Reembolsar').setEmoji({ id: '1501803982849445998' }).setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ccpainel_btn_filtrar_pedidos').setLabel('Filtrar').setEmoji({ id: '1501804030605922346' }).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ccpainel_refresh_pedidos').setLabel('Atualizar').setEmoji({ id: '1501803920576745522' }).setStyle(ButtonStyle.Secondary),
        ],
    };
}

async function buildEstoque(opts = {}) {
    let text;

    if (opts.produtoId) {
        const chaves = await listLicenseKeys(opts.produtoId);
        if (!chaves.length) {
            text = `${Emojis.get('_search_emoji')} Nenhuma chave no produto \`${opts.produtoId}\`.`;
        } else {
            const linhas = chaves.slice(0, 20).map((c, i) => `**${i + 1}.** ||${c.value}||`);
            text = `${Emojis.get('_folder_emoji')} **Produto \`${opts.produtoId}\`** — ${chaves.length} chave(s)\n\n${linhas.join('\n')}`;
        }
    } else {
        text =
            `${Emojis.get('information_emoji')} Selecione uma ação abaixo.\n\n` +
            `${Emojis.get('_folder_emoji')} **Ver chaves** — lista as chaves de licença de um produto\n` +
            `${Emojis.get('_add_emoji')} **Adicionar chaves** — adiciona novas chaves a um produto`;
    }

    return {
        title: `${Emojis.get('_folder_emoji')} Estoque`,
        text,
        buttons: [
            new ButtonBuilder().setCustomId('ccpainel_btn_ver_estoque').setLabel('Ver chaves').setEmoji({ id: '1501803928973476023' }).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ccpainel_btn_add_estoque').setLabel('Adicionar chaves').setEmoji({ id: '1501803905363869769' }).setStyle(ButtonStyle.Success),
        ],
    };
}

async function buildCupons(busca = null) {
    const res    = await listDiscounts({ coupon: busca || undefined });
    const cupons = res.data || [];

    let text;
    if (!cupons.length) {
        text = `${Emojis.get('_search_emoji')} Nenhum cupom encontrado.`;
    } else {
        const linhas = cupons.slice(0, 15).map(c => {
            const valor = c.type === 'PERCENTAGE'
                ? `${c.value}%`
                : `R$ ${(c.value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            const usos = c.max_uses ? `${c.uses}/${c.max_uses}` : `${c.uses}/∞`;
            return `\`${c.id}\` **${c.coupon}** — \`${valor}\` — usos: \`${usos}\``;
        });
        text = `-# ${res.meta?.total ?? cupons.length} cupom(ns)\n\n${linhas.join('\n')}`;
    }

    return {
        title: `${Emojis.get('_diamond_emoji')} Cupons`,
        text,
        buttons: [
            new ButtonBuilder().setCustomId('ccpainel_btn_criar_cupom').setLabel('Criar cupom').setEmoji({ id: '1501803905363869769' }).setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ccpainel_btn_deletar_cupom').setLabel('Deletar cupom').setEmoji({ id: '1501803926180335727' }).setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ccpainel_refresh_cupons').setLabel('Atualizar').setEmoji({ id: '1501803920576745522' }).setStyle(ButtonStyle.Secondary),
        ],
    };
}

async function buildTopClientes(opts = {}) {
    const res      = await getTopCustomers({ from: opts.from, to: opts.to });
    const clientes = res.data || [];

    let text;
    if (!clientes.length) {
        text = `${Emojis.get('_search_emoji')} Nenhum cliente encontrado${opts.from ? ' no período' : ''}.`;
    } else {
        const linhas = clientes.map((c, i) =>
            `**${i + 1}.** **${c.username}** — \`${c.spent}\` — \`${c.purchases}\` compra(s)`
        );
        const periodo = opts.from && opts.to ? `${opts.from} até ${opts.to}` : 'todos os tempos';
        text = `-# ${periodo}\n\n${linhas.join('\n')}`;
    }

    return {
        title: `${Emojis.get('_star_emoji')} Top Clientes`,
        text,
        buttons: [
            new ButtonBuilder().setCustomId('ccpainel_btn_top_periodo').setLabel('Filtrar período').setEmoji({ id: '1501804055826141246' }).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ccpainel_refresh_top_clientes').setLabel('Atualizar').setEmoji({ id: '1501803920576745522' }).setStyle(ButtonStyle.Secondary),
        ],
    };
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
async function loadSecao(secao, extraData = {}) {
    switch (secao) {
        case 'loja':         return buildLoja();
        case 'receita':      return buildReceita();
        case 'produtos':     return buildProdutos(extraData.busca);
        case 'pedidos':      return buildPedidos(extraData);
        case 'estoque':      return buildEstoque(extraData);
        case 'cupons':       return buildCupons(extraData.busca);
        case 'top_clientes': return buildTopClientes(extraData);
        default: return {
            title: `${Emojis.get('store_emoji')} CentralCart`,
            text: `${Emojis.get('information_emoji')} Selecione uma seção no menu abaixo.`,
            buttons: [],
        };
    }
}

// ── Container principal da seção ──────────────────────────────────────────────
async function buildPainel(secao, extraData = {}) {
    const { title, text, buttons } = await loadSecao(secao, extraData);
    const c = new ContainerBuilder();

    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${title}\n-# CentralCart — Painel`
    ));
    c.addSeparatorComponents(new SeparatorBuilder());
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
    c.addSeparatorComponents(new SeparatorBuilder());
    c.addActionRowComponents(buildNav(secao));

    if (buttons.length) {
        c.addActionRowComponents(new ActionRowBuilder().addComponents(...buttons));
    }
    return c;
}

function errContainer(msg) {
    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${Emojis.get('negative_emoji')} ${msg}`
    ));
    c.addSeparatorComponents(new SeparatorBuilder());
    c.addActionRowComponents(buildNav(null));
    return c;
}

function infoContainer(secao, msg, extraButtons = []) {
    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(msg));
    c.addSeparatorComponents(new SeparatorBuilder());
    c.addActionRowComponents(buildNav(secao));
    if (extraButtons.length) {
        c.addActionRowComponents(new ActionRowBuilder().addComponents(...extraButtons));
    }
    return c;
}

// ── Handler de eventos ────────────────────────────────────────────────────────
module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {

        // ── Select menu de navegação ──────────────────────────────────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'ccpainel_nav') {
            const secao = interaction.values[0];
            const state = getState(interaction.user.id);
            state.secao     = secao;
            state.extraData = {};

            try {
                await interaction.deferUpdate();
            } catch (e) {
                return;
            }
            try {
                const c = await buildPainel(secao, {});
                await interaction.editReply({ components: [c], ...CV2 });
            } catch (err) {
                try {
                    await interaction.editReply({ components: [errContainer(String(err.message || err))], ...CV2 });
                } catch (_) {}
            }
            return;
        }

        // ── Botões de atualizar ───────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId.startsWith('ccpainel_refresh_')) {
            const secao = interaction.customId.replace('ccpainel_refresh_', '');
            const state = getState(interaction.user.id);
            state.secao = secao;

            await interaction.deferUpdate();
            try {
                const c = await buildPainel(secao, state.extraData);
                await interaction.editReply({ components: [c], ...CV2 });
            } catch (err) {
                await interaction.editReply({ components: [errContainer(err.message)], ...CV2 });
            }
            return;
        }

        // ── Botões que abrem modais ───────────────────────────────────────────

        if (interaction.isButton() && interaction.customId === 'ccpainel_btn_buscar_produto') {
            const modal = new ModalBuilder().setCustomId('ccpainel_modal_buscar_produto').setTitle('Buscar Produto');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('busca').setLabel('Termo de busca')
                        .setStyle(TextInputStyle.Short).setPlaceholder('Nome do produto...').setRequired(false).setMaxLength(100)
                )
            );
            return interaction.showModal(modal);
        }

        if (interaction.isButton() && interaction.customId === 'ccpainel_btn_ver_pedido') {
            const modal = new ModalBuilder().setCustomId('ccpainel_modal_ver_pedido').setTitle('Ver Pedido por ID');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('pedido_id').setLabel('ID do pedido')
                        .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
                )
            );
            return interaction.showModal(modal);
        }

        if (interaction.isButton() && interaction.customId === 'ccpainel_btn_reembolso') {
            const modal = new ModalBuilder().setCustomId('ccpainel_modal_reembolso').setTitle('Reembolsar Pedido');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('pedido_id').setLabel('ID do pedido')
                        .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
                )
            );
            return interaction.showModal(modal);
        }

        if (interaction.isButton() && interaction.customId === 'ccpainel_btn_filtrar_pedidos') {
            const modal = new ModalBuilder().setCustomId('ccpainel_modal_filtrar_pedidos').setTitle('Filtrar Pedidos');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('status')
                        .setLabel('Status (APPROVED, CANCELED, REFUNDED...)')
                        .setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(20)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('busca')
                        .setLabel('Busca (email, Discord ID, nome)')
                        .setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(100)
                )
            );
            return interaction.showModal(modal);
        }

        if (interaction.isButton() && interaction.customId === 'ccpainel_btn_ver_estoque') {
            const modal = new ModalBuilder().setCustomId('ccpainel_modal_ver_estoque').setTitle('Ver Chaves de Estoque');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('produto_id').setLabel('ID do produto')
                        .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
                )
            );
            return interaction.showModal(modal);
        }

        if (interaction.isButton() && interaction.customId === 'ccpainel_btn_add_estoque') {
            const modal = new ModalBuilder().setCustomId('ccpainel_modal_add_estoque').setTitle('Adicionar Chaves de Estoque');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('produto_id').setLabel('ID do produto')
                        .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('chaves')
                        .setLabel('Chaves (vírgula ou uma por linha)')
                        .setStyle(TextInputStyle.Paragraph).setRequired(true)
                )
            );
            return interaction.showModal(modal);
        }

        if (interaction.isButton() && interaction.customId === 'ccpainel_btn_criar_cupom') {
            const modal = new ModalBuilder().setCustomId('ccpainel_modal_criar_cupom').setTitle('Criar Cupom de Desconto');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('codigo').setLabel('Código do cupom')
                        .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('tipo').setLabel('Tipo: PERCENTAGE ou PRICE')
                        .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('valor').setLabel('Valor (% ou centavos para R$)')
                        .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('max_usos')
                        .setLabel('Máx. usos (vazio = ilimitado)')
                        .setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(10)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('expira_em')
                        .setLabel('Expira em (AAAA-MM-DD, opcional)')
                        .setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(10)
                )
            );
            return interaction.showModal(modal);
        }

        if (interaction.isButton() && interaction.customId === 'ccpainel_btn_deletar_cupom') {
            const modal = new ModalBuilder().setCustomId('ccpainel_modal_deletar_cupom').setTitle('Deletar Cupom');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('cupom_id').setLabel('ID do cupom')
                        .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
                )
            );
            return interaction.showModal(modal);
        }

        if (interaction.isButton() && interaction.customId === 'ccpainel_btn_top_periodo') {
            const modal = new ModalBuilder().setCustomId('ccpainel_modal_top_periodo').setTitle('Filtrar Top Clientes por Período');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('from').setLabel('Data de início (AAAA-MM-DD)')
                        .setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(10)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('to').setLabel('Data de fim (AAAA-MM-DD)')
                        .setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(10)
                )
            );
            return interaction.showModal(modal);
        }

        // ── Submissões de modal ───────────────────────────────────────────────
        if (!interaction.isModalSubmit() || !interaction.customId.startsWith('ccpainel_modal_')) return;

        const modalId = interaction.customId;
        const state   = getState(interaction.user.id);

        await interaction.deferUpdate();

        try {
            let c;

            // ─ Buscar produto ─────────────────────────────────────────────────
            if (modalId === 'ccpainel_modal_buscar_produto') {
                const busca = interaction.fields.getTextInputValue('busca').trim() || null;
                state.secao     = 'produtos';
                state.extraData = { busca };
                c = await buildPainel('produtos', { busca });
            }

            // ─ Ver pedido por ID ──────────────────────────────────────────────
            else if (modalId === 'ccpainel_modal_ver_pedido') {
                const pedidoId = interaction.fields.getTextInputValue('pedido_id').trim();
                const p        = await getOrder(pedidoId);

                const criadoEm  = p.created_at ? `<t:${Math.floor(new Date(p.created_at).getTime() / 1000)}:f>` : 'N/A';
                const pagoEm    = p.paid_at    ? `<t:${Math.floor(new Date(p.paid_at).getTime() / 1000)}:f>`    : 'N/A';
                const pacotesNomes = (p.packages || []).map(pkg => `\`${pkg.quantity}x\` ${pkg.name}`).join('\n') || 'N/A';

                const text =
                    `-# ${p.formatted_status || p.status} — ${p.formatted_gateway || p.gateway || 'N/A'}\n\n` +
                    `${Emojis.get('_silueta_emoji')} **Cliente:** ${p.client_name || 'N/A'}\n` +
                    `${Emojis.get('_mail_emoji')} **Email:** \`${p.client_email || 'N/A'}\`\n` +
                    `${Emojis.get('_staff_emoji')} **Discord ID:** \`${p.discord_id || 'N/A'}\`\n` +
                    `${Emojis.get('_money_emoji')} **Valor:** \`${p.formatted_price || 'N/A'}\`\n\n` +
                    `${Emojis.get('_cart_emoji')} **Pacotes:**\n${pacotesNomes}\n\n` +
                    `${Emojis.get('date_emoji')} **Criado em:** ${criadoEm}\n` +
                    `${Emojis.get('confirmed_emoji')} **Pago em:** ${pagoEm}`;

                const viewC = new ContainerBuilder();
                viewC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('neworder_emoji')} Pedido \`${p.id}\`\n-# CentralCart — Painel`
                ));
                viewC.addSeparatorComponents(new SeparatorBuilder());
                viewC.addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
                viewC.addSeparatorComponents(new SeparatorBuilder());
                viewC.addActionRowComponents(buildNav('pedidos'));
                viewC.addActionRowComponents(new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ccpainel_refresh_pedidos').setLabel('Voltar').setEmoji({ id: '1501803908589162537' }).setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('ccpainel_btn_reembolso').setLabel('Reembolsar este pedido').setEmoji({ id: '1501803982849445998' }).setStyle(ButtonStyle.Danger),
                ));
                c = viewC;
            }

            // ─ Reembolsar ─────────────────────────────────────────────────────
            else if (modalId === 'ccpainel_modal_reembolso') {
                const pedidoId = interaction.fields.getTextInputValue('pedido_id').trim();
                const res      = await updateOrder(pedidoId, { status: 'REFUNDED', manually_refunded: true });
                const msg =
                    `${Emojis.get('confirmed_emoji')} Pedido \`${pedidoId}\` reembolsado com sucesso.\n\n` +
                    `${Emojis.get('information_emoji')} **Status:** \`${res.formatted_status || 'REFUNDED'}\`\n` +
                    `${Emojis.get('_silueta_emoji')} **Cliente:** ${res.client_name || res.client_email || 'N/A'}`;
                state.secao     = 'pedidos';
                state.extraData = {};
                c = infoContainer('pedidos', msg, [
                    new ButtonBuilder().setCustomId('ccpainel_refresh_pedidos').setLabel('Voltar aos Pedidos').setEmoji({ id: '1501803908589162537' }).setStyle(ButtonStyle.Secondary),
                ]);
            }

            // ─ Filtrar pedidos ────────────────────────────────────────────────
            else if (modalId === 'ccpainel_modal_filtrar_pedidos') {
                const statusRaw = interaction.fields.getTextInputValue('status').trim().toUpperCase() || null;
                const busca     = interaction.fields.getTextInputValue('busca').trim() || null;
                const status    = statusRaw && STATUS_LABEL[statusRaw] ? statusRaw : null;
                state.secao     = 'pedidos';
                state.extraData = { status, busca };
                c = await buildPainel('pedidos', { status, busca });
            }

            // ─ Ver estoque ────────────────────────────────────────────────────
            else if (modalId === 'ccpainel_modal_ver_estoque') {
                const produtoId = interaction.fields.getTextInputValue('produto_id').trim();
                state.secao     = 'estoque';
                state.extraData = { produtoId };
                c = await buildPainel('estoque', { produtoId });
            }

            // ─ Adicionar chaves ───────────────────────────────────────────────
            else if (modalId === 'ccpainel_modal_add_estoque') {
                const produtoId = interaction.fields.getTextInputValue('produto_id').trim();
                const chavesRaw = interaction.fields.getTextInputValue('chaves');
                const chavesArr = chavesRaw.split(/[\n,]/).map(s => s.trim()).filter(Boolean);

                if (!chavesArr.length) {
                    c = errContainer('Nenhuma chave válida encontrada.');
                } else {
                    const res = await addLicenseKeys(parseInt(produtoId), chavesArr);
                    const msg =
                        `${Emojis.get('confirmed_emoji')} Chaves adicionadas ao produto \`${produtoId}\`.\n\n` +
                        `${Emojis.get('_folder_emoji')} **Adicionadas:** \`${res.added_count ?? chavesArr.length}\`` +
                        (res.message ? `\n${Emojis.get('information_emoji')} **Info:** ${res.message}` : '');
                    state.secao     = 'estoque';
                    state.extraData = {};
                    c = infoContainer('estoque', msg, [
                        new ButtonBuilder().setCustomId('ccpainel_btn_ver_estoque').setLabel('Ver chaves').setEmoji({ id: '1501803928973476023' }).setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('ccpainel_btn_add_estoque').setLabel('Adicionar mais').setEmoji({ id: '1501803905363869769' }).setStyle(ButtonStyle.Success),
                    ]);
                }
            }

            // ─ Criar cupom ────────────────────────────────────────────────────
            else if (modalId === 'ccpainel_modal_criar_cupom') {
                const codigo  = interaction.fields.getTextInputValue('codigo').trim();
                const tipoRaw = interaction.fields.getTextInputValue('tipo').trim().toUpperCase();
                const tipo    = ['PERCENTAGE', 'PRICE'].includes(tipoRaw) ? tipoRaw : 'PERCENTAGE';
                const valor   = parseFloat(interaction.fields.getTextInputValue('valor').trim()) || 0;
                const maxUsos = parseInt(interaction.fields.getTextInputValue('max_usos').trim()) || null;
                const expira  = interaction.fields.getTextInputValue('expira_em').trim() || null;

                const body = { coupon: codigo, type: tipo, value: valor, applies_to: [-1] };
                if (maxUsos) body.max_uses = maxUsos;
                if (expira)  body.expires_in = expira;

                const res = await createDiscount(body);
                const valorFmt = tipo === 'PERCENTAGE'
                    ? `${valor}%`
                    : `R$ ${(valor / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

                const msg =
                    `${Emojis.get('confirmed_emoji')} Cupom **${res.coupon || codigo}** criado com sucesso.\n\n` +
                    `${Emojis.get('_diamond_emoji')} **Desconto:** \`${valorFmt}\`\n` +
                    `${Emojis.get('_messages_emoji')} **Máx. usos:** ${maxUsos ? `\`${maxUsos}\`` : '`Ilimitado`'}\n` +
                    `${Emojis.get('date_emoji')} **Expira em:** ${expira ? `\`${expira}\`` : '`Sem expiração`'}`;

                state.secao     = 'cupons';
                state.extraData = {};
                c = infoContainer('cupons', msg, [
                    new ButtonBuilder().setCustomId('ccpainel_refresh_cupons').setLabel('Ver Cupons').setEmoji({ id: '1501803908589162537' }).setStyle(ButtonStyle.Secondary),
                ]);
            }

            // ─ Deletar cupom ──────────────────────────────────────────────────
            else if (modalId === 'ccpainel_modal_deletar_cupom') {
                const cupomId = parseInt(interaction.fields.getTextInputValue('cupom_id').trim());
                await deleteDiscount(cupomId);

                const msg = `${Emojis.get('confirmed_emoji')} Cupom \`${cupomId}\` deletado com sucesso.`;
                state.secao     = 'cupons';
                state.extraData = {};
                c = infoContainer('cupons', msg, [
                    new ButtonBuilder().setCustomId('ccpainel_refresh_cupons').setLabel('Ver Cupons').setEmoji({ id: '1501803908589162537' }).setStyle(ButtonStyle.Secondary),
                ]);
            }

            // ─ Filtrar Top Clientes ───────────────────────────────────────────
            else if (modalId === 'ccpainel_modal_top_periodo') {
                const from = interaction.fields.getTextInputValue('from').trim() || null;
                const to   = interaction.fields.getTextInputValue('to').trim()   || null;
                state.secao     = 'top_clientes';
                state.extraData = { from, to };
                c = await buildPainel('top_clientes', { from, to });
            }

            if (c) await interaction.editReply({ components: [c], ...CV2 });

        } catch (err) {
            await interaction.editReply({ components: [errContainer(`Erro: ${err.message}`)], ...CV2 });
        }
    },
};
