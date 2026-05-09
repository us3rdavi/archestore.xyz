const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { msgauto } = require("../../Database");

module.exports = {
    name: "ready",
    run: async (client) => {
        function loadMsgData() {
            return msgauto.get('data') || [];
        }

        const checkAndSendMessage = async (data) => {
            if (!data || !Array.isArray(data.chatIds)) return;

            for (const chatId of data.chatIds) {
                const channel = client.channels.cache.get(chatId);
                if (channel) {
                    try {
                        const disabledButton = new ButtonBuilder()
                            .setCustomId('system_message')
                            .setLabel('Mensagem Do Sistema')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true);

                        const row = new ActionRowBuilder().addComponents(disabledButton);

                        const message = await channel.send({
                            content: data.message,
                            components: [row]
                        });

                        setTimeout(async () => {
                            await message.delete().catch(console.error);
                            setTimeout(() => {
                                checkAndSendMessage(data);
                            }, data.repostTime * 1000);
                        }, data.deleteTime * 1000);
                    } catch (error) {
                        console.error(`Erro ao enviar mensagem para o canal ${chatId}:`, error);
                    }
                } else {
                    console.error(`Canal com ID ${chatId} não encontrado.`);
                }
            }
        };

        const startSendingMessages = (msgData) => {
            for (const data of msgData) {
                checkAndSendMessage(data);
            }
        };

        startSendingMessages(loadMsgData());

        setInterval(() => {
            startSendingMessages(loadMsgData());
        }, 60000);
    }
};
