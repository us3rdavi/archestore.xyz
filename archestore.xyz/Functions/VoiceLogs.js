const { EmbedBuilder } = require('discord.js');

const voiceJoinTimestamps = new Map();

async function handleVoiceStateUpdate(oldState, newState, logChannelId, client) {
    try {
        const logChannel = await client.channels.fetch(logChannelId);
        if (!logChannel) return;

        const member = newState.member;
        const userAvatar = member.user.avatarURL({ dynamic: true, size: 512 });
        const usernameWithTag = `${member.user.tag}`;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({ name: usernameWithTag, iconURL: userAvatar })
            .setTimestamp();

        const newChannel = newState.channel ? `<#${newState.channel.id}>` : "Nenhum canal";
        const oldChannel = oldState.channel ? `<#${oldState.channel.id}>` : "Nenhum canal";

        if (!oldState.channelId && newState.channelId) {
            voiceJoinTimestamps.set(member.id, Date.now());
            embed.setDescription(`**Entrou** no canal ${newChannel}`)
                .setColor(0x5865F2);
        } else if (oldState.channelId && !newState.channelId) {
            const joinTime = voiceJoinTimestamps.get(member.id) || Date.now();
            const duration = Date.now() - joinTime;
            const durationMinutes = Math.floor(duration / 60000);
            voiceJoinTimestamps.delete(member.id);

            embed.setDescription(`**Saiu** do canal ${oldChannel} — **${durationMinutes} min**`)
                .setColor(0x5865F2);
        } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            const joinTime = voiceJoinTimestamps.get(member.id) || Date.now();
            const duration = Date.now() - joinTime;
            const durationMinutes = Math.floor(duration / 60000);
            voiceJoinTimestamps.set(member.id, Date.now());

            embed.setDescription(`**Mudou** de ${oldChannel} para ${newChannel} — **${durationMinutes} min**`)
                .setColor(0x5865F2);
        } else {
            return;
        }

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`Erro ao lidar com a atualização de estado de voz: ${error}`);
    }
}

module.exports = { handleVoiceStateUpdate };
