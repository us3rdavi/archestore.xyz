const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const { listOrders, getOrder, getPackage } = require('./CentralCartAPI');
const { configuracao, Emojis, cc_notificacoes } = require('../Database');

const DIAS_AVISO_EXPIRACAO = 3;
const DEFAULT_STATE = { order_notified: [], expiry_warn_notified: [], expiry_notified: [] };

function loadState() {
    return cc_notificacoes.get('state') || { ...DEFAULT_STATE };
}

function saveState(state) {
    cc_notificacoes.set('state', state);
}

function getAccentColor() {
    try {
        const cor = (configuracao.get('Cores.Principal') || '5865F2').replace('#', '');
        return parseInt(cor, 16);
    } catch (e) {
        return 0x5865F2;
    }
}

function formatarData(isoString) {
    try {
        return new Date(isoString).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    } catch (e) {
        return isoString || 'N/A';
    }
}

async function enviarDMCompra(client, order) {
    const discordId = order.discord_id;
    if (!discordId) return;

    try {
        const user = await client.users.fetch(discordId);
        if (!user) return;

        const pacotes = (order.packages || [])
            .map(p => `${p.quantity || 1}x ${p.name}`)
            .join('\n') || 'N/A';
        const gateway = order.formatted_gateway || order.gateway || 'N/A';
        const valor = order.formatted_price || `R$ ${order.price || '0,00'}`;

        const container = new ContainerBuilder();
        container;
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## ${Emojis.get('confirmedpayment_emoji')} Sua compra foi concluída!\nAgradecemos pela sua compra! Abaixo estão os detalhes do seu pedido.`
            )
        );
        container.addSeparatorComponents(new SeparatorBuilder());
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**${Emojis.get('store_emoji')} Pacote(s):**\n${pacotes}\n\n**${Emojis.get('pix_stamp_emoji')} Método de pagamento:**\n${gateway}\n\n**${Emojis.get('confirmed_emoji')} Valor total:**\n${valor}`
            )
        );

        await user.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            embeds: [],
            content: '',
        });

        console.log(`[CCNotif] DM de compra enviada para ${discordId} (pedido ${order.internal_id || order.id})`);
    } catch (e) {
        console.error(`[CCNotif] Erro ao enviar DM de compra para ${discordId}:`, e.message);
    }
}

async function enviarDMExpirando(client, order, nomePacote, diasRestantes) {
    const discordId = order.discord_id;
    if (!discordId) return;

    try {
        const user = await client.users.fetch(discordId);
        if (!user) return;

        const dataCompra = formatarData(order.paid_at);

        const container = new ContainerBuilder();
        container;
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## ${Emojis.get('clock_emoji')} Seu pacote expira em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}!\nMas não se preocupe! Você pode renová-lo na nossa loja.`
            )
        );
        container.addSeparatorComponents(new SeparatorBuilder());
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**${Emojis.get('store_emoji')} Pacote:**\n${nomePacote}\n\n**${Emojis.get('date_emoji')} Data de compra:**\n${dataCompra}`
            )
        );

        await user.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            embeds: [],
            content: '',
        });

        console.log(`[CCNotif] DM de expiração em breve enviada para ${discordId} (${nomePacote})`);
    } catch (e) {
        console.error(`[CCNotif] Erro ao enviar DM de expiração em breve para ${discordId}:`, e.message);
    }
}

async function enviarDMExpirado(client, order, nomePacote) {
    const discordId = order.discord_id;
    if (!discordId) return;

    try {
        const user = await client.users.fetch(discordId);
        if (!user) return;

        const dataCompra = formatarData(order.paid_at);

        const container = new ContainerBuilder();
        container;
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## ${Emojis.get('negative_emoji')} Seu pacote expirou!\nMas não se preocupe! Você pode obtê-lo novamente na nossa loja.`
            )
        );
        container.addSeparatorComponents(new SeparatorBuilder());
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**${Emojis.get('store_emoji')} Pacote:**\n${nomePacote}\n\n**${Emojis.get('date_emoji')} Data de compra:**\n${dataCompra}`
            )
        );

        await user.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            embeds: [],
            content: '',
        });

        console.log(`[CCNotif] DM de pacote expirado enviada para ${discordId} (${nomePacote})`);
    } catch (e) {
        console.error(`[CCNotif] Erro ao enviar DM de pacote expirado para ${discordId}:`, e.message);
    }
}

const packageExpiryCache = {};

async function getExpiryDays(packageId) {
    if (!packageId) return null;
    if (packageExpiryCache[packageId] !== undefined) return packageExpiryCache[packageId];
    try {
        const pkg = await getPackage(packageId);
        const days = pkg?.expiry_days ?? null;
        packageExpiryCache[packageId] = days;
        return days;
    } catch (e) {
        packageExpiryCache[packageId] = null;
        return null;
    }
}

async function verificarNovosOrders(client) {
    const state = loadState();
    let changed = false;

    try {
        const data = await listOrders({ page: 1, status: 'APPROVED' });
        const orders = (data?.data || data || []);

        for (const orderSummary of orders) {
            const id = orderSummary.internal_id || orderSummary.id;
            if (!id) continue;
            if (state.order_notified.includes(String(id))) continue;

            let order = orderSummary;
            try {
                order = await getOrder(id);
            } catch (e) {
                console.error(`[CCNotif] Erro ao buscar detalhes do pedido ${id}:`, e.message);
                state.order_notified.push(String(id));
                changed = true;
                continue;
            }

            if (order.discord_id) {
                await enviarDMCompra(client, order);
            }

            state.order_notified.push(String(id));
            changed = true;
        }

        if (changed) saveState(state);
    } catch (e) {
        console.error('[CCNotif] Erro ao verificar novos pedidos:', e.message);
    }
}

async function verificarExpiracao(client) {
    const state = loadState();
    let changed = false;
    const agora = Date.now();

    try {
        const data = await listOrders({ page: 1, status: 'APPROVED' });
        const orders = (data?.data || data || []);

        for (const orderSummary of orders) {
            const id = orderSummary.internal_id || orderSummary.id;
            if (!id) continue;

            let order;
            try {
                order = await getOrder(id);
            } catch (e) {
                continue;
            }

            if (!order.discord_id || !order.paid_at) continue;

            const pkgs = order.packages || [];
            for (const pkg of pkgs) {
                let expiryDays = pkg.expiry_days;

                if (expiryDays == null && pkg.id) {
                    expiryDays = await getExpiryDays(pkg.id);
                }

                if (!expiryDays) continue;

                const paidAt = new Date(order.paid_at).getTime();
                const expiryTs = paidAt + (expiryDays * 24 * 60 * 60 * 1000);
                const diasRestantes = Math.ceil((expiryTs - agora) / (24 * 60 * 60 * 1000));
                const nomePacote = pkg.name || 'Pacote';
                const pkgKey = `${id}_${pkg.id || pkg.name}`;

                if (diasRestantes <= DIAS_AVISO_EXPIRACAO && diasRestantes > 0) {
                    if (!state.expiry_warn_notified.includes(pkgKey)) {
                        await enviarDMExpirando(client, order, nomePacote, diasRestantes);
                        state.expiry_warn_notified.push(pkgKey);
                        changed = true;
                    }
                }

                if (diasRestantes <= 0) {
                    if (!state.expiry_notified.includes(pkgKey)) {
                        await enviarDMExpirado(client, order, nomePacote);
                        state.expiry_notified.push(pkgKey);
                        changed = true;
                    }
                }
            }
        }

        if (changed) saveState(state);
    } catch (e) {
        console.error('[CCNotif] Erro ao verificar expirações:', e.message);
    }
}

function iniciarNotificacoes(client) {
    console.log('[CCNotif] Sistema de notificações CentralCart iniciado.');

    verificarNovosOrders(client).catch(e => console.error('[CCNotif]', e.message));

    setInterval(() => {
        verificarNovosOrders(client).catch(e => console.error('[CCNotif]', e.message));
    }, 2 * 60 * 1000);

    verificarExpiracao(client).catch(e => console.error('[CCNotif]', e.message));

    setInterval(() => {
        verificarExpiracao(client).catch(e => console.error('[CCNotif]', e.message));
    }, 60 * 60 * 1000);
}

module.exports = { iniciarNotificacoes };
