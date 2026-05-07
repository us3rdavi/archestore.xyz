const { ChannelType, Permissions, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const automaticosPath = path.resolve(__dirname, '../../DataBaseJson/msgauto.json');

module.exports = {
    name: "ready",
    run: async (client) => {
        let msgData = [];

        const loadMsgData = () => {
            if (fs.existsSync(automaticosPath)) {
                try {
                    const rawData = fs.readFileSync(automaticosPath, 'utf8');
                    const parsedData = JSON.parse(rawData);
                    if (Array.isArray(parsedData)) {
                        msgData = parsedData;
                    } else {
                        console.error("Erro: O arquivo de mensagens automáticas não contém um array válido.");
                        msgData = [];
                    }
                } catch (error) {
                    console.error("Erro ao carregar a base de dados:", error);
                    msgData = [];
                }
            } else {
                msgData = [];
            }
        };

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

        const startSendingMessages = () => {
            for (const data of msgData) {
                checkAndSendMessage(data);
            }
        };

        // Carregar dados de mensagens automáticas inicialmente
        loadMsgData();
        startSendingMessages();

        // Observar mudanças no arquivo de configuração
        chokidar.watch(automaticosPath).on('change', () => {
            loadMsgData();
            startSendingMessages();
        });
    }
};
