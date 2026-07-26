'use strict';

const { configuracao } = require('../Database');

function getEfiInstance() {
    const clientId     = configuracao.get('pagamentos.EfiAPI.client_id');
    const clientSecret = configuracao.get('pagamentos.EfiAPI.client_secret');
    const certBase64   = configuracao.get('pagamentos.EfiAPI.cert_base64');

    if (!clientId || !clientSecret || !certBase64) return null;

    const EfiPay = require('sdk-node-apis-efi');
    return new EfiPay({
        sandbox: false,
        client_id: clientId,
        client_secret: clientSecret,
        certificate: certBase64,
        cert_base64: true,
    });
}

/**
 * Cria uma cobrança PIX imediata.
 * @returns {{ txid, locId, pixCopiaECola, imagemBase64, expiracao }}
 */
async function criarCobrancaPix({ valor, descricao }) {
    const efi = getEfiInstance();
    if (!efi) throw new Error('EfiBank não configurado. Configure as credenciais em /config → Definições → Configurar Efi Bank.');

    const chavepix = configuracao.get('pagamentos.EfiAPI.chavepix');
    if (!chavepix) throw new Error('Chave PIX não configurada. Configure em /config → Definições → Configurar Efi Bank.');

    const expiracao = 900; // 15 minutos

    const body = {
        calendario: { expiracao },
        valor: { original: Number(valor).toFixed(2) },
        chave: chavepix,
        solicitacaoPagador: descricao.slice(0, 140),
    };

    const charge = await efi.pixCreateImmediateCharge({}, body);
    const qr     = await efi.pixGenerateQrcode({ id: charge.loc.id }, {});

    return {
        txid: charge.txid,
        locId: charge.loc.id,
        pixCopiaECola: qr.qrcode,
        imagemBase64: qr.imagemQrcode, // data:image/png;base64,...
        expiracao,
    };
}

/**
 * Verifica o status de uma cobrança PIX.
 * @returns {{ status: 'ATIVA'|'CONCLUIDA'|'REMOVIDA_PELO_USUARIO_RECEBEDOR', e2eid: string|null, valor: string }}
 */
async function verificarPagamento(txid) {
    const efi = getEfiInstance();
    if (!efi) return null;

    const charge = await efi.pixDetailCharge({ txid }, {});
    return {
        status: charge.status,
        e2eid: charge.pix?.[0]?.endToEndId || null,
        valor: charge.valor?.original || '0.00',
        pagador: charge.pix?.[0]?.pagador || null,
    };
}

/**
 * Inicia polling de pagamento. Chama onPago quando confirmado, onExpirado quando expirado.
 */
function iniciarPolling(txid, { onPago, onExpirado, intervalMs = 10000, maxMs = 910000 }) {
    let elapsed = 0;

    const timer = setInterval(async () => {
        elapsed += intervalMs;
        try {
            const result = await verificarPagamento(txid);
            if (!result) return;

            if (result.status === 'CONCLUIDA') {
                clearInterval(timer);
                await onPago(result);
            } else if (result.status === 'REMOVIDA_PELO_USUARIO_RECEBEDOR' || elapsed >= maxMs) {
                clearInterval(timer);
                await onExpirado(result);
            }
        } catch (err) {
            console.error(`[EfiPixVendas] Erro no polling txid ${txid}:`, err.message);
        }
    }, intervalMs);

    return timer;
}

module.exports = { criarCobrancaPix, verificarPagamento, iniciarPolling };
