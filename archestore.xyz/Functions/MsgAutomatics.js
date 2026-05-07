const { ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require("discord.js");
const { msgsauto } = require("../DataBaseJson");

async function sendMessage(client) {
    const intervalMinutes = msgsauto.get('intervalMinutes') || 3; // Valor padrão de 3 minutos se não definido
    const interval = intervalMinutes * 60 * 1000; // Converte minutos em milissegundos

    const channels = msgsauto.get('channels');

    if (!channels || channels.length === 0) {
        return;
    }

    if (!Array.isArray(channels)) {
        console.error('Erro: a lista de canais não está definida corretamente.');
        return;
    }

    for (const channelInfo of channels) {
        const channel = await client.channels.fetch(channelInfo.id).catch(e => {
            console.error(`Erro ao buscar o canal: ${channelInfo.id}`, e);
            return null;
        });

        if (!channel) {
            continue; 
        }

        if (channelInfo.lastMessageId) {
            try {
                const messageToDelete = await channel.messages.fetch(channelInfo.lastMessageId);
                await messageToDelete.delete();
            } catch (error) {
                console.error(`Erro ao deletar a mensagem: ${channelInfo.lastMessageId}`, error);
            }
        }

        const button = new ButtonBuilder()
            .setCustomId('system_message')
            .setLabel('Mensagem Automática')
            .setStyle(2)
            .setDisabled(true);

        const row = new ActionRowBuilder().addComponents(button);
        const options = {
            content: channelInfo.message,
            components: [row]
        };

        if (channelInfo.file) {
            const attachment = new AttachmentBuilder(channelInfo.file);
            options.files = [attachment];
        }

        try {
            const sentMessage = await channel.send(options);
            channelInfo.lastMessageId = sentMessage.id; 
            msgsauto.set('channels', channels); 
        } catch (error) {
            console.error(`Erro ao enviar mensagem no canal ${channelInfo.id}:`, error);
        }
    }

    setTimeout(() => sendMessage(client), interval); // Usa o intervalo definido na base de dados
}

module.exports = {
    sendMessage
};
