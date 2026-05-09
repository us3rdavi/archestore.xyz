'use strict';

const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');
const JsonDatabase = require('./JsonDatabase');
const quickStore = require('./QuickStore');

// ── Instâncias ──────────────────────────────────────────────────────────────
const produtos        = new JsonDatabase('produtos');
const automaticos     = new JsonDatabase('automaticos');
const buttons         = new JsonDatabase('buttons');
const carrinhos       = new JsonDatabase('carrinhos');
const pagamentos      = new JsonDatabase('pagamentos');
const pedidos         = new JsonDatabase('pedidos');
const estatisticas    = new JsonDatabase('estatisticas');
const configuracao    = new JsonDatabase('configuracao');
const tickets         = new JsonDatabase('tickets');
const perms           = new JsonDatabase('perms');
const PermsAvancados  = new JsonDatabase('permsavancados');
const msgsauto        = new JsonDatabase('msgsauto');
const msgauto         = new JsonDatabase('msgauto');
const dbembed         = new JsonDatabase('dbembed');
const entregaslog     = new JsonDatabase('entregaslog');
const SystemMod       = new JsonDatabase('SystemMod');
const Temporario      = new JsonDatabase('Temporario');
const Convites        = new JsonDatabase('Convites');
const GuildsInvites   = new JsonDatabase('GuildsInvites');
const refounds        = new JsonDatabase('refounds');
const Compras         = new JsonDatabase('Compras');
const painelCards     = new JsonDatabase('painelCards');
const formularios     = new JsonDatabase('formularios');
const moderacao       = new JsonDatabase('moderacao');
const General         = new JsonDatabase('General');
const GeneralKeys     = new JsonDatabase('GeneralKeys');
const autolock        = new JsonDatabase('autolock');
const BackupStorage   = new JsonDatabase('BackupStorage');
const cc_notificacoes = new JsonDatabase('cc_notificacoes');
const mensagem        = new JsonDatabase('mensagem');

// ── Emoji Store (arquivo estático) ──────────────────────────────────────────
const _emojiPath = path.join(__dirname, 'emojis.json');
let _emojiData = {};
try { _emojiData = JSON.parse(fs.readFileSync(_emojiPath, 'utf8')); } catch (e) { }

const Emojis = {
    get(key) { return _emojiData[key] ?? ''; },
    set(key, value) {
        _emojiData[key] = value;
        fs.writeFileSync(_emojiPath, JSON.stringify(_emojiData, null, 4), 'utf8');
    },
    all() { return { ..._emojiData }; },
    fetchAll() { return { ..._emojiData }; },
    reload() {
        try { _emojiData = JSON.parse(fs.readFileSync(_emojiPath, 'utf8')); } catch (e) { }
    },
};

// ── MongoDB init ─────────────────────────────────────────────────────────────
const _allDbs = [
    produtos, automaticos, buttons, carrinhos, pagamentos, pedidos,
    estatisticas, configuracao, tickets, perms, PermsAvancados,
    msgsauto, msgauto, dbembed, entregaslog, SystemMod, Temporario,
    Convites, GuildsInvites, refounds, Compras, painelCards, formularios,
    moderacao, General, GeneralKeys, autolock, BackupStorage,
    cc_notificacoes, mensagem,
];

let _mongoClient = null;

async function initDatabase() {
    const config = require('../config.json');
    const uri = config.MONGODB_URI;

    if (!uri || uri === 'SUA-MONGODB-URI-AQUI') {
        console.warn('[DB] MONGODB_URI não configurado — rodando somente em memória (dados não persistidos).');
        return;
    }

    try {
        _mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
        await _mongoClient.connect();
        const db = _mongoClient.db('archestore');
        console.log('[DB] Conectado ao MongoDB com sucesso.');

        await Promise.all(_allDbs.map(instance => instance._init(db)));
        console.log('[DB] Todas as coleções carregadas na memória.');
    } catch (err) {
        console.error('[DB] Falha ao conectar ao MongoDB:', err.message);
        console.warn('[DB] Rodando somente em memória (dados não persistidos).');
        if (_mongoClient) { try { await _mongoClient.close(); } catch (_) {} }
        _mongoClient = null;
    }
}

async function closeDatabase() {
    if (_mongoClient) await _mongoClient.close();
}

module.exports = {
    // Databases
    produtos, automaticos, buttons, carrinhos, pagamentos, pedidos,
    estatisticas, configuracao, tickets, perms, PermsAvancados,
    PermsAvançados: PermsAvancados,
    msgsauto, msgauto, dbembed, entregaslog, SystemMod, Temporario,
    Convites, GuildsInvites, refounds, Compras, painelCards, formularios,
    moderacao, General, GeneralKeys, autolock, BackupStorage,
    cc_notificacoes, mensagem,
    // Emoji store
    Emojis,
    // QuickStore (substitui QuickDB)
    quickStore,
    // Lifecycle
    initDatabase,
    closeDatabase,
};
