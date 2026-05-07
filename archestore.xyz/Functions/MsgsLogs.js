const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emojis = require('../DataBaseJson/Emojis.json');
const Emojis = { get: (name) => emojis[name] || "" };

async function handleDeletedMessage(message, logChannelId, client) {
    if (message.author.bot) return;

    try {
        const logChannel = await client.channels.fetch(logChannelId);
        if (!logChannel) return;

        const deleteEmbed = new EmbedBuilder()
            .setTitle(`${Emojis.get('_trash_emoji')} Mensagem Apagada`)
            .setColor(0x5865F2)
            .addFields(
                { name: 'Canal', value: `${message.channel}`, inline: true },
                { name: 'Autor', value: `${message.author} (${message.author.tag})`, inline: true },
                { name: 'Conteúdo', value: message.content || '*Mensagem não disponível*' }
            )
            .setTimestamp()
            .setFooter({ text: 'Hora da exclusão' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Ir ao Canal')
                    .setEmoji({ id: '1501804010049634426' })
                    .setStyle(ButtonStyle.Link)
                    .setURL(message.channel.url)
            );

        await logChannel.send({ embeds: [deleteEmbed], components: [row] });
    } catch (error) {
        console.error(`Erro ao enviar mensagem de exclusão: ${error}`);
    }
}

async function handleUpdatedMessage(oldMessage, newMessage, logChannelId, client) {
    if (newMessage.author.bot || oldMessage.content === newMessage.content) return;

    try {
        const logChannel = await client.channels.fetch(logChannelId);
        if (!logChannel) return;

        const updateEmbed = new EmbedBuilder()
            .setTitle(`${Emojis.get('_lapis_emoji')} Mensagem Editada`)
            .setColor(0x5865F2)
            .addFields(
                { name: 'Canal', value: `${oldMessage.channel}`, inline: true },
                { name: 'Autor', value: `${oldMessage.author} (${oldMessage.author.tag})`, inline: true },
                { name: 'Antes', value: oldMessage.content || '*Mensagem não disponível*' },
                { name: 'Depois', value: newMessage.content || '*Mensagem não disponível*' }
            )
            .setTimestamp()
            .setFooter({ text: 'Hora da edição' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Ver Mensagem Editada')
                    .setEmoji({ id: '1501803928973476023' })
                    .setStyle(ButtonStyle.Link)
                    .setURL(newMessage.url),
                new ButtonBuilder()
                    .setLabel('Ir ao Canal')
                    .setEmoji({ id: '1501804010049634426' })
                    .setStyle(ButtonStyle.Link)
                    .setURL(newMessage.channel.url)
            );

        await logChannel.send({ embeds: [updateEmbed], components: [row] });
    } catch (error) {
        console.error(`Erro ao enviar mensagem de edição: ${error}`);
    }
}

module.exports = { handleDeletedMessage, handleUpdatedMessage };
