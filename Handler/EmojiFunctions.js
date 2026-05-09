const { Emojis } = require('../Database');

function carregarCache() {
    Emojis.reload();
}

function salvarCache() {
}

function encontrarProximoNumero() {
    const all = Emojis.all();
    let n = 1;
    while (all[n]) n++;
    return n;
}

function adicionarEmoji(emoji) {
    const n = encontrarProximoNumero();
    Emojis.set(String(n), emoji);
}

function editarEmoji(numero, novoEmoji) {
    Emojis.set(String(numero), novoEmoji);
}

function obterEmoji(numero) {
    return Emojis.get(String(numero)) || null;
}

function obterTodosEmojis() {
    return Object.entries(Emojis.all()).map(([numero, emoji]) => `${numero} - ${emoji}`);
}

function verificarEmoji(numero) {
    return Emojis.get(String(numero)) !== '';
}

module.exports = { obterEmoji, editarEmoji, adicionarEmoji, carregarCache, obterTodosEmojis, verificarEmoji };
