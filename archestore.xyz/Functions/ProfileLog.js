const { EmbedBuilder } = require('discord.js');
const emojis = require('../DataBaseJson/Emojis.json');
const Emojis = { get: (name) => emojis[name] || "" };

async function handleProfileUpdate(oldMember, newMember, logChannelId, client) {
    try {
        const logChannel = await client.channels.fetch(logChannelId);
        if (!logChannel) return;

        if (oldMember.nickname !== newMember.nickname) {
            const embedNickname = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle(`${Emojis.get('_lapis_emoji')} Mudança de Nickname`)
                .setDescription(`${newMember.user.tag} alterou seu nickname`)
                .addFields(
                    { name: 'Antigo', value: oldMember.nickname || 'Nenhum', inline: true },
                    { name: 'Novo', value: newMember.nickname || 'Nenhum', inline: true }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embedNickname] });
        }

        if (oldMember.user.avatarURL() !== newMember.user.avatarURL()) {
            const embedAvatar = new EmbedBuilder()
                .setColor(0x1ABC9C)
                .setTitle(`${Emojis.get('photo_emoji')} Mudança de Avatar`)
                .setDescription(`${newMember.user.tag} atualizou seu avatar`)
                .setThumbnail(newMember.user.avatarURL())
                .addFields(
                    { name: 'Info', value: 'Avatar atualizado para o mostrado à direita.', inline: false }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embedAvatar] });
        }
    } catch (error) {
        console.error(`Erro ao lidar com a atualização de perfil: ${error}`);
    }
}

module.exports = { handleProfileUpdate };
