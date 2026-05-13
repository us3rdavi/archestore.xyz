'use strict';

const moment = require('moment-timezone');

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDiscordMarkdown(text) {
    if (!text) return '';
    let t = escapeHtml(text);

    // Code blocks
    t = t.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) =>
        `<pre class="code-block"><code>${code.trim()}</code></pre>`
    );
    // Inline code
    t = t.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    // Bold
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
    t = t.replace(/_(.+?)_/g, '<em>$1</em>');
    // Strikethrough
    t = t.replace(/~~(.+?)~~/g, '<del>$1</del>');
    // Underline
    t = t.replace(/__(.+?)__/g, '<u>$1</u>');
    // Blockquote
    t = t.replace(/^&gt; (.+)/gm, '<div class="blockquote"><div class="blockquote-bar"></div><span>$1</span></div>');
    // Spoiler
    t = t.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler">$1</span>');
    // Mentions
    t = t.replace(/&lt;@!?(\d+)&gt;/g, '<span class="mention">@user</span>');
    t = t.replace(/&lt;@&amp;(\d+)&gt;/g, '<span class="mention">@role</span>');
    t = t.replace(/&lt;#(\d+)&gt;/g, '<span class="mention">#channel</span>');
    // URLs
    t = t.replace(/(https?:\/\/[^\s<>"]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    // Newlines
    t = t.replace(/\n/g, '<br>');

    return t;
}

function getAvatarUrl(user) {
    if (!user) return 'https://cdn.discordapp.com/embed/avatars/0.png';
    try {
        const av = user.displayAvatarURL
            ? user.displayAvatarURL({ extension: 'png', size: 64 })
            : null;
        return av || `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;
    } catch {
        return 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
}

function getUserColor(userId) {
    const colors = ['#7289da', '#43b581', '#faa61a', '#f04747', '#b9bbbe', '#5865F2', '#57F287', '#FEE75C', '#ED4245', '#EB459E'];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

function renderEmbed(embed) {
    const color = embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : '#202225';
    let html = `<div class="embed" style="border-left-color:${color}">`;

    if (embed.author) {
        html += `<div class="embed-author">`;
        if (embed.author.iconURL || embed.author.icon_url)
            html += `<img class="embed-author-icon" src="${escapeHtml(embed.author.iconURL || embed.author.icon_url)}" alt="">`;
        html += `<span>${escapeHtml(embed.author.name || '')}</span></div>`;
    }

    if (embed.title) {
        const titleHtml = embed.url
            ? `<a href="${escapeHtml(embed.url)}" target="_blank" class="embed-title-link">${escapeHtml(embed.title)}</a>`
            : escapeHtml(embed.title);
        html += `<div class="embed-title">${titleHtml}</div>`;
    }

    if (embed.description) {
        html += `<div class="embed-description">${formatDiscordMarkdown(embed.description)}</div>`;
    }

    const fields = embed.fields || [];
    if (fields.length > 0) {
        html += `<div class="embed-fields">`;
        for (const field of fields) {
            const inlineClass = field.inline ? 'embed-field inline' : 'embed-field';
            html += `<div class="${inlineClass}">
                <div class="embed-field-name">${escapeHtml(field.name)}</div>
                <div class="embed-field-value">${formatDiscordMarkdown(field.value)}</div>
            </div>`;
        }
        html += `</div>`;
    }

    const thumbUrl = embed.thumbnail?.url || embed.thumbnail?.proxyURL;
    if (thumbUrl) {
        html += `<img class="embed-thumbnail" src="${escapeHtml(thumbUrl)}" alt="thumbnail">`;
    }

    const imgUrl = embed.image?.url || embed.image?.proxyURL;
    if (imgUrl) {
        html += `<img class="embed-image" src="${escapeHtml(imgUrl)}" alt="image">`;
    }

    if (embed.footer) {
        html += `<div class="embed-footer">`;
        if (embed.footer.iconURL || embed.footer.icon_url)
            html += `<img class="embed-footer-icon" src="${escapeHtml(embed.footer.iconURL || embed.footer.icon_url)}" alt="">`;
        html += `<span>${escapeHtml(embed.footer.text || '')}</span>`;
        if (embed.timestamp)
            html += ` <span class="embed-footer-sep">•</span> <span>${moment(embed.timestamp).tz('America/Sao_Paulo').format('DD/MM/YYYY [às] HH:mm')}</span>`;
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

function renderAttachment(att) {
    const url = att.url || att.proxyURL || '';
    const name = att.name || att.filename || 'arquivo';
    const contentType = att.contentType || att.content_type || '';

    if (contentType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(name)) {
        return `<div class="attachment"><img class="attachment-image" src="${escapeHtml(url)}" alt="${escapeHtml(name)}" loading="lazy"></div>`;
    }
    return `<div class="attachment attachment-file">
        <div class="attachment-file-icon">📄</div>
        <div class="attachment-file-info">
            <a href="${escapeHtml(url)}" target="_blank" class="attachment-file-name">${escapeHtml(name)}</a>
            ${att.size ? `<span class="attachment-file-size">${(att.size / 1024).toFixed(1)} KB</span>` : ''}
        </div>
    </div>`;
}

function sameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

function formatDateDivider(date) {
    const now = new Date();
    const d = new Date(date);
    if (sameDay(d, now)) return 'Hoje';
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (sameDay(d, yesterday)) return 'Ontem';
    return moment(d).tz('America/Sao_Paulo').format('DD [de] MMMM [de] YYYY');
}

async function generateTranscript(channel, ticketData) {
    moment.locale('pt-br');

    let messages = [];
    try {
        let lastId;
        while (true) {
            const opts = { limit: 100 };
            if (lastId) opts.before = lastId;
            const batch = await channel.messages.fetch(opts);
            if (batch.size === 0) break;
            messages = messages.concat([...batch.values()]);
            lastId = batch.last()?.id;
            if (batch.size < 100) break;
        }
        messages.reverse();
    } catch (e) {
        console.error('[Transcript] Erro ao buscar mensagens:', e.message);
    }

    const memberColors = {};
    const getMemberColor = (userId) => {
        if (!memberColors[userId]) memberColors[userId] = getUserColor(userId);
        return memberColors[userId];
    };

    let messagesHtml = '';
    let lastAuthorId = null;
    let lastMsgDate = null;

    for (const msg of messages) {
        if (msg.author?.bot && msg.author.id !== channel.client?.user?.id) {
            // skip other bots optionally - but let's include them
        }

        const msgDate = new Date(msg.createdTimestamp);
        if (!lastMsgDate || !sameDay(lastMsgDate, msgDate)) {
            messagesHtml += `<div class="date-divider">
                <div class="date-divider-line"></div>
                <span class="date-divider-text">${formatDateDivider(msgDate)}</span>
                <div class="date-divider-line"></div>
            </div>`;
            lastMsgDate = msgDate;
            lastAuthorId = null;
        }

        const isGrouped = lastAuthorId === msg.author?.id;
        const timeStr = moment(msg.createdTimestamp).tz('America/Sao_Paulo').format('HH:mm');
        const fullTimeStr = moment(msg.createdTimestamp).tz('America/Sao_Paulo').format('DD/MM/YYYY [às] HH:mm:ss');
        const authorName = msg.member?.displayName || msg.author?.globalName || msg.author?.username || 'Desconhecido';
        const authorColor = getMemberColor(msg.author?.id || '0');
        const avatarUrl = getAvatarUrl(msg.author);
        const isBot = msg.author?.bot;

        const embeds = msg.embeds || [];
        const attachments = [...(msg.attachments?.values() || [])];

        const hasContent = msg.content || embeds.length > 0 || attachments.length > 0;
        if (!hasContent) continue;

        if (!isGrouped) {
            messagesHtml += `<div class="message-group">
                <img class="avatar" src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(authorName)}" loading="lazy">
                <div class="message-group-content">
                    <div class="message-header">
                        <span class="username" style="color:${authorColor}">${escapeHtml(authorName)}</span>
                        ${isBot ? '<span class="bot-tag">BOT</span>' : ''}
                        <span class="timestamp" title="${escapeHtml(fullTimeStr)}">${timeStr}</span>
                    </div>`;
        } else {
            messagesHtml += `<div class="message-continuation">
                <span class="continuation-time" title="${escapeHtml(fullTimeStr)}">${timeStr}</span>
                <div class="message-continuation-content">`;
        }

        if (msg.content) {
            messagesHtml += `<div class="message-content">${formatDiscordMarkdown(msg.content)}</div>`;
        }

        for (const embed of embeds) {
            messagesHtml += renderEmbed(embed);
        }

        for (const att of attachments) {
            messagesHtml += renderAttachment(att);
        }

        if (!isGrouped) {
            messagesHtml += `</div></div>`;
        } else {
            messagesHtml += `</div></div>`;
        }

        lastAuthorId = msg.author?.id;
    }

    const ticketNum = ticketData?.numero || '?';
    const ticketCategoria = ticketData?.funcao || 'Desconhecida';
    const ticketUser = ticketData?.username || 'Desconhecido';
    const totalMsgs = messages.filter(m => m.content || (m.embeds?.length) || (m.attachments?.size)).length;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transcript — Ticket #${ticketNum}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --bg-primary: #313338;
            --bg-secondary: #2b2d31;
            --bg-tertiary: #1e1f22;
            --bg-accent: #232428;
            --text-primary: #dbdee1;
            --text-secondary: #b5bac1;
            --text-muted: #80848e;
            --text-link: #00a8fc;
            --brand: #5865f2;
            --green: #23a55a;
            --yellow: #f0b232;
            --red: #f23f43;
            --border: #3f4147;
            --separator: rgba(255,255,255,0.06);
            --scrollbar: #1a1b1e;
        }

        html, body {
            background: var(--bg-primary);
            color: var(--text-primary);
            font-family: 'Inter', 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 16px;
            line-height: 1.375;
            min-height: 100vh;
        }

        a { color: var(--text-link); text-decoration: none; }
        a:hover { text-decoration: underline; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: var(--scrollbar); }
        ::-webkit-scrollbar-thumb { background: #3f4147; border-radius: 4px; }

        /* Layout */
        .app { display: flex; flex-direction: column; min-height: 100vh; }

        /* Header */
        .header {
            background: var(--bg-tertiary);
            border-bottom: 1px solid var(--border);
            padding: 0 24px;
            height: 48px;
            display: flex;
            align-items: center;
            gap: 12px;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .header-icon { font-size: 20px; }
        .header-name {
            font-weight: 600;
            font-size: 16px;
            color: var(--text-primary);
        }
        .header-topic {
            font-size: 14px;
            color: var(--text-muted);
            padding-left: 12px;
            border-left: 1px solid var(--border);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .header-spacer { flex: 1; }
        .header-badge {
            background: var(--bg-accent);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 12px;
            color: var(--text-secondary);
            white-space: nowrap;
        }

        /* Info Bar */
        .info-bar {
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            padding: 12px 24px;
            display: flex;
            gap: 32px;
            flex-wrap: wrap;
        }
        .info-item { display: flex; flex-direction: column; gap: 2px; }
        .info-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { font-size: 14px; color: var(--text-primary); font-weight: 500; }
        .info-value.green { color: var(--green); }
        .info-value.brand { color: var(--brand); }

        /* Messages area */
        .messages-area {
            flex: 1;
            padding: 16px 0;
            max-width: 900px;
            width: 100%;
            margin: 0 auto;
        }

        /* Date divider */
        .date-divider {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 16px 16px 8px;
        }
        .date-divider-line { flex: 1; height: 1px; background: var(--separator); }
        .date-divider-text {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-muted);
            white-space: nowrap;
            padding: 0 4px;
        }

        /* Message group */
        .message-group {
            display: flex;
            gap: 16px;
            padding: 4px 16px 0;
            margin-top: 16px;
        }
        .message-group:hover { background: rgba(0,0,0,0.06); }

        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            flex-shrink: 0;
            margin-top: 2px;
            background: var(--bg-accent);
            object-fit: cover;
        }

        .message-group-content { flex: 1; min-width: 0; }

        .message-header {
            display: flex;
            align-items: baseline;
            gap: 8px;
            margin-bottom: 2px;
        }
        .username {
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            line-height: 1.375;
        }
        .username:hover { text-decoration: underline; }
        .timestamp {
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 400;
            cursor: default;
        }
        .bot-tag {
            background: var(--brand);
            color: #fff;
            font-size: 10px;
            font-weight: 700;
            padding: 1px 5px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        /* Continuation (grouped messages) */
        .message-continuation {
            display: flex;
            gap: 16px;
            padding: 1px 16px;
        }
        .message-continuation:hover { background: rgba(0,0,0,0.06); }
        .continuation-time {
            width: 40px;
            flex-shrink: 0;
            font-size: 11px;
            color: transparent;
            text-align: right;
            padding-top: 3px;
            cursor: default;
        }
        .message-continuation:hover .continuation-time { color: var(--text-muted); }
        .message-continuation-content { flex: 1; min-width: 0; }

        /* Message content */
        .message-content {
            font-size: 16px;
            color: var(--text-primary);
            line-height: 1.375;
            word-break: break-word;
            white-space: pre-wrap;
        }

        /* Inline code */
        .inline-code {
            background: #2e3036;
            border: 1px solid rgba(0,0,0,0.2);
            border-radius: 3px;
            padding: 0 4px;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 85%;
            color: #f8f8f2;
        }

        /* Code block */
        .code-block {
            background: #2e3036;
            border: 1px solid rgba(0,0,0,0.2);
            border-radius: 4px;
            padding: 8px 12px;
            margin: 4px 0;
            overflow-x: auto;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 14px;
            color: #f8f8f2;
            white-space: pre;
        }

        /* Blockquote */
        .blockquote {
            display: flex;
            gap: 8px;
            margin: 4px 0;
        }
        .blockquote-bar {
            width: 4px;
            background: var(--text-muted);
            border-radius: 4px;
            flex-shrink: 0;
        }

        /* Spoiler */
        .spoiler {
            background: rgba(255,255,255,0.1);
            border-radius: 3px;
            padding: 0 3px;
            cursor: pointer;
        }

        /* Mention */
        .mention {
            background: rgba(88, 101, 242, 0.3);
            color: #c9cdfb;
            border-radius: 3px;
            padding: 0 3px;
            font-weight: 500;
        }

        /* Embeds */
        .embed {
            display: flex;
            flex-direction: column;
            border-left: 4px solid #4f545c;
            background: #2b2d31;
            border-radius: 4px;
            padding: 12px 16px;
            margin: 4px 0;
            max-width: 520px;
            position: relative;
            gap: 6px;
        }
        .embed-author {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
        }
        .embed-author-icon {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            object-fit: cover;
        }
        .embed-title {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-primary);
        }
        .embed-title-link { color: var(--text-link); }
        .embed-title-link:hover { text-decoration: underline; }
        .embed-description {
            font-size: 14px;
            color: var(--text-primary);
            line-height: 1.5;
        }
        .embed-fields {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 4px;
        }
        .embed-field { display: flex; flex-direction: column; gap: 2px; flex: 0 0 100%; }
        .embed-field.inline { flex: 0 0 calc(33% - 6px); }
        .embed-field-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .embed-field-value { font-size: 14px; color: var(--text-primary); }
        .embed-thumbnail {
            position: absolute;
            top: 12px;
            right: 16px;
            width: 80px;
            height: 80px;
            border-radius: 4px;
            object-fit: cover;
        }
        .embed-image {
            max-width: 100%;
            border-radius: 4px;
            margin-top: 4px;
            max-height: 300px;
            object-fit: contain;
        }
        .embed-footer {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 4px;
        }
        .embed-footer-icon {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            object-fit: cover;
        }
        .embed-footer-sep { margin: 0 2px; }

        /* Attachments */
        .attachment { margin: 4px 0; }
        .attachment-image {
            max-width: 400px;
            max-height: 300px;
            border-radius: 4px;
            object-fit: contain;
            display: block;
        }
        .attachment-file {
            display: flex;
            align-items: center;
            gap: 12px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px 16px;
            max-width: 400px;
        }
        .attachment-file-icon { font-size: 28px; }
        .attachment-file-info { display: flex; flex-direction: column; gap: 2px; }
        .attachment-file-name { font-size: 14px; color: var(--text-link); font-weight: 500; }
        .attachment-file-name:hover { text-decoration: underline; }
        .attachment-file-size { font-size: 12px; color: var(--text-muted); }

        /* Footer */
        .footer {
            background: var(--bg-tertiary);
            border-top: 1px solid var(--border);
            padding: 12px 24px;
            text-align: center;
            font-size: 12px;
            color: var(--text-muted);
        }

        @media (max-width: 600px) {
            .header { padding: 0 12px; }
            .info-bar { padding: 10px 12px; gap: 16px; }
            .messages-area { padding: 8px 0; }
            .message-group, .message-continuation { padding-left: 10px; padding-right: 10px; }
            .embed-field.inline { flex: 0 0 100%; }
        }
    </style>
</head>
<body>
<div class="app">

    <!-- Channel Header -->
    <div class="header">
        <span class="header-icon">🎫</span>
        <span class="header-name">${escapeHtml(channel.name || `ticket-${ticketNum}`)}</span>
        <span class="header-topic">Transcript do Ticket #${ticketNum}</span>
        <div class="header-spacer"></div>
        <span class="header-badge">${totalMsgs} mensagem${totalMsgs !== 1 ? 's' : ''}</span>
    </div>

    <!-- Info Bar -->
    <div class="info-bar">
        <div class="info-item">
            <span class="info-label">Ticket</span>
            <span class="info-value brand">#${ticketNum}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Categoria</span>
            <span class="info-value">${escapeHtml(ticketCategoria)}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Aberto por</span>
            <span class="info-value">${escapeHtml(ticketUser)}</span>
        </div>
        ${ticketData?.assumidoPor ? `
        <div class="info-item">
            <span class="info-label">Atendido por</span>
            <span class="info-value green">${escapeHtml(ticketData.assumidoPor)}</span>
        </div>` : ''}
        <div class="info-item">
            <span class="info-label">Gerado em</span>
            <span class="info-value">${moment().tz('America/Sao_Paulo').format('DD/MM/YYYY [às] HH:mm')}</span>
        </div>
    </div>

    <!-- Messages -->
    <div class="messages-area">
        ${messagesHtml || '<div style="text-align:center;padding:48px;color:var(--text-muted)">Nenhuma mensagem encontrada.</div>'}
    </div>

    <!-- Footer -->
    <div class="footer">
        Transcript gerado automaticamente • Arche Store • Ticket #${ticketNum}
    </div>

</div>
</body>
</html>`;

    return html;
}

module.exports = { generateTranscript };
