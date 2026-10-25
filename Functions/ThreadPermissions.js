'use strict';

const { PermissionFlagsBits } = require('discord.js');
const { configuracao, tickets, carrinhos } = require('../Database');
const { formatInteractionError } = require('./InteractionErrorDetails');

const SEND_IN_THREADS = PermissionFlagsBits.SendMessagesInThreads;
const VIEW_CHANNEL = PermissionFlagsBits.ViewChannel;
const MANAGE_CHANNELS = PermissionFlagsBits.ManageChannels;
const MANAGE_ROLES = PermissionFlagsBits.ManageRoles;

function permissionState(overwrite, permission) {
    if (overwrite?.allow.has(permission)) return true;
    if (overwrite?.deny.has(permission)) return false;
    return null;
}

function accessKey(parentId, userId) {
    return `threadSendAccess.${parentId}.${userId}`;
}

async function ensureThreadMemberCanMessage(parentChannel, thread, member, reason) {
    const userId = member?.id || member?.user?.id;
    if (!parentChannel || !thread || !userId) {
        throw new Error('Não foi possível identificar o canal do tópico ou o cliente.');
    }

    const guildMember = member.roles?.cache
        ? member
        : await parentChannel.guild.members.fetch(userId);
    const memberPermissions = parentChannel.permissionsFor(guildMember);
    if (!memberPermissions?.has(VIEW_CHANNEL)) {
        throw new Error('O cliente precisa ter a permissão Ver Canal no canal configurado para conseguir acessar o tópico.');
    }

    const botMember = parentChannel.guild.members.me;
    const botPermissions = botMember && parentChannel.permissionsFor(botMember);
    if (!botPermissions?.has(MANAGE_CHANNELS) && !botPermissions?.has(MANAGE_ROLES)) {
        throw new Error('O bot precisa de Gerenciar Canais ou Gerenciar Cargos para habilitar a escrita do cliente no tópico.');
    }

    const key = accessKey(parentChannel.id, userId);
    let access = configuracao.get(key);

    if (!access || !Array.isArray(access.threadIds)) {
        access = {
            baseline: permissionState(parentChannel.permissionOverwrites.cache.get(userId), SEND_IN_THREADS),
            threadIds: [],
        };
    }

    if (!access.threadIds.includes(thread.id)) {
        access.threadIds.push(thread.id);
    }
    configuracao.set(key, access);

    try {
        await parentChannel.permissionOverwrites.edit(
            userId,
            { SendMessagesInThreads: true },
            reason || 'Permitir que o cliente converse no próprio tópico privado'
        );
        if (!parentChannel.permissionsFor(guildMember)?.has(SEND_IN_THREADS)) {
            throw new Error('A permissão Enviar Mensagens em Tópicos continua bloqueada por outra configuração do canal ou cargo.');
        }
        await thread.members.add(userId);
    } catch (error) {
        await releaseThreadMemberMessaging(parentChannel, thread.id, userId).catch(() => {});
        throw error;
    }
}

async function releaseThreadMemberMessaging(parentChannel, threadId, userId) {
    if (!parentChannel || !threadId || !userId) return;

    const key = accessKey(parentChannel.id, userId);
    const access = configuracao.get(key);
    if (!access || !Array.isArray(access.threadIds)) return;

    access.threadIds = access.threadIds.filter(id => id !== threadId);
    if (access.threadIds.length > 0) {
        configuracao.set(key, access);
        return;
    }

    await parentChannel.permissionOverwrites.edit(
        userId,
        { SendMessagesInThreads: access.baseline ?? null },
        'Restaurar a permissão anterior após o encerramento do tópico'
    );

    if (access.baseline == null) {
        const overwrite = parentChannel.permissionOverwrites.cache.get(userId);
        if (overwrite && overwrite.allow.bitfield === 0n && overwrite.deny.bitfield === 0n) {
            await parentChannel.permissionOverwrites.delete(userId, 'Remover overwrite vazio criado para o tópico');
        }
    }

    configuracao.delete(key);
}

async function releaseClosedThreadAccess(thread) {
    if (!thread?.guild || !thread.id) return;

    const cart = carrinhos.get(thread.id);
    const ptOwnerId = tickets.get(`tickets.threads.${thread.id}`);
    const enOwnerId = tickets.get(`en.threads.${thread.id}`);
    const userId = cart?.userId || ptOwnerId || enOwnerId;
    if (!userId) return;

    const parentChannel = thread.parent
        || thread.guild.channels.cache.get(thread.parentId)
        || await thread.guild.channels.fetch(thread.parentId).catch(() => null);
    if (parentChannel) {
        await releaseThreadMemberMessaging(parentChannel, thread.id, userId);
    }
}

async function repairOpenThreadAccess(client) {
    const openThreads = [];
    const failures = [];
    const ptTickets = tickets.get('tickets.abertos') || {};
    const enTickets = tickets.get('en.abertos') || {};

    for (const [userId, ticket] of Object.entries(ptTickets)) {
        if (ticket?.threadId) openThreads.push({ threadId: ticket.threadId, userId });
    }
    for (const [userId, ticket] of Object.entries(enTickets)) {
        if (ticket?.threadId) openThreads.push({ threadId: ticket.threadId, userId });
    }
    for (const { id, value: cart } of carrinhos.all()) {
        if (cart?.threadId && ['aberto', 'aguardando_pagamento'].includes(cart.status)) {
            openThreads.push({ threadId: cart.threadId || id, userId: cart.userId });
        }
    }

    for (const { threadId, userId } of openThreads) {
        if (!userId) continue;
        try {
            const thread = await client.channels.fetch(threadId);
            if (!thread?.isThread()) continue;
            const parentChannel = thread.parent
                || await thread.guild.channels.fetch(thread.parentId);
            const member = await thread.guild.members.fetch(userId);
            await ensureThreadMemberCanMessage(
                parentChannel,
                thread,
                member,
                'Restaurar acesso de escrita do cliente em tópico já aberto'
            );
        } catch (error) {
            failures.push({ threadId, detail: formatInteractionError(error).slice(0, 180) });
        }
    }

    if (failures.length > 0) {
        const logChannelId = configuracao.get('ConfigChannels.systemlogs');
        const logChannel = logChannelId
            ? client.channels.cache.get(logChannelId) || await client.channels.fetch(logChannelId).catch(() => null)
            : null;
        if (logChannel?.isTextBased()) {
            const details = failures.slice(0, 5)
                .map(item => `- Tópico ${item.threadId}: ${item.detail}`)
                .join('\n');
            await logChannel.send({
                content: `Não foi possível restaurar a escrita em ${failures.length} tópico(s) existente(s):\n${details}`,
                allowedMentions: { parse: [] },
            }).catch(() => {});
        }
        console.warn(`[ThreadPermissions] Falha ao restaurar acesso em ${failures.length} tópico(s).`);
    }
}

module.exports = {
    ensureThreadMemberCanMessage,
    releaseThreadMemberMessaging,
    releaseClosedThreadAccess,
    repairOpenThreadAccess,
};
