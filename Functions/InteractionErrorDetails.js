'use strict';

function formatInteractionError(err) {
    const code = String(err?.code ?? err?.status ?? err?.name ?? 'UNKNOWN').slice(0, 40);
    const message = String(err?.message || 'Erro sem detalhes')
        .replace(/(?:https?|mongodb(?:\+srv)?):\/\/\S+/gi, '[URL omitida]')
        .replace(/\b[\w-]{24,}\.[\w-]{6,}\.[\w-]{20,}\b/g, '[credencial omitida]')
        .replace(/`/g, "'")
        .replace(/\s+/g, ' ')
        .slice(0, 300);

    return `${code}: ${message}`;
}

module.exports = { formatInteractionError };
