'use strict';

const { configuracao } = require('../Database');

function gerarId() {
    return Math.random().toString(36).slice(2, 10);
}

function listarDescontos() {
    return configuracao.get('vendas.descontos') || [];
}

function buscarDesconto(codigo) {
    const descontos = listarDescontos();
    return descontos.find(d =>
        d.codigo.toUpperCase() === codigo.trim().toUpperCase() && d.ativo !== false
    ) || null;
}

function aplicarDesconto(valorTotal, desconto) {
    if (!desconto) return { valorComDesconto: Number(valorTotal), economizado: 0 };
    let economizado = 0;
    if (desconto.tipo === 'percent') {
        economizado = Number(valorTotal) * (desconto.valor / 100);
    } else {
        economizado = desconto.valor;
    }
    const valorComDesconto = Math.max(0, Number(valorTotal) - economizado);
    return { valorComDesconto, economizado };
}

function criarDesconto({ codigo, nome, tipo, valor, usosMax }) {
    const descontos = listarDescontos();
    if (descontos.find(d => d.codigo.toUpperCase() === codigo.trim().toUpperCase())) {
        throw new Error('Já existe um desconto com esse código.');
    }
    if (!['percent', 'fixed'].includes(tipo)) throw new Error('Tipo inválido. Use "percent" ou "fixed".');
    if (isNaN(Number(valor)) || Number(valor) <= 0) throw new Error('Valor inválido.');

    const novo = {
        id: gerarId(),
        codigo: codigo.trim().toUpperCase(),
        nome: nome?.trim() || codigo.trim().toUpperCase(),
        tipo,
        valor: Number(valor),
        usosMax: (usosMax && !isNaN(Number(usosMax)) && Number(usosMax) > 0) ? Number(usosMax) : null,
        usos: 0,
        ativo: true,
        criadoEm: Date.now(),
    };
    descontos.push(novo);
    configuracao.set('vendas.descontos', descontos);
    return novo;
}

function removerDesconto(id) {
    const descontos = listarDescontos().filter(d => d.id !== id);
    configuracao.set('vendas.descontos', descontos);
}

function incrementarUso(id) {
    const descontos = listarDescontos();
    const idx = descontos.findIndex(d => d.id === id);
    if (idx === -1) return;
    descontos[idx].usos = (descontos[idx].usos || 0) + 1;
    if (descontos[idx].usosMax !== null && descontos[idx].usos >= descontos[idx].usosMax) {
        descontos[idx].ativo = false;
    }
    configuracao.set('vendas.descontos', descontos);
}

module.exports = { listarDescontos, buscarDesconto, aplicarDesconto, criarDesconto, removerDesconto, incrementarUso };
