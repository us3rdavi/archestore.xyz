const { ActionRowBuilder, TextInputBuilder, TextInputStyle, InteractionType, ModalBuilder } = require("discord.js");
const { msgsauto } = require("../../DataBaseJson");
const { AcoesMsgsAutomatics } = require("../../Functions/ConfigMsgsAutomatics");

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        if (interaction.isButton()) {
            if (interaction.customId === 'automaticMessages') {
                const channel = client.channels.cache.get(interaction.channelId);
                const message = await channel.messages.fetch(interaction.message.id);

                const modal = new ModalBuilder()
                    .setCustomId('updateMessageModal')
                    .setTitle('Atualizar/Adicionar Mensagem');

                const channelIdInput = new TextInputBuilder()
                    .setCustomId('channelId')
                    .setLabel('Id do canal')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Qual o id do canal?')
                    .setRequired(true)
                    .setValue(channel.id);

                const messageInput = new TextInputBuilder()
                    .setCustomId('message')
                    .setLabel('Mensagem')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Mensagem a ser enviada')
                    .setRequired(true)
                    .setValue(message.content);

                const fileInput = new TextInputBuilder()
                    .setCustomId('fileUrl')
                    .setLabel('Link do arquivo (imagem/gif) - opcional')
                    .setStyle(TextInputStyle.Short)
					.setRequired(false)
                    .setPlaceholder('Inserir link aqui (opcional)');

                const row1 = new ActionRowBuilder().addComponents(channelIdInput);
                const row2 = new ActionRowBuilder().addComponents(messageInput);
                const row3 = new ActionRowBuilder().addComponents(fileInput);

                modal.addComponents(row1, row2, row3);
                await interaction.showModal(modal);
            }
        }

        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'updateMessageModal') {
            const channelId = interaction.fields.getTextInputValue('channelId');
            const msgContent = interaction.fields.getTextInputValue('message');
            const fileUrl = interaction.fields.getTextInputValue('fileUrl').trim(); 

            if (fileUrl && !fileUrl.startsWith('https://')) {
                interaction.reply({ content: '⚠️ | O link do file deve começar com "https://".', ephemeral: true });
                return;
            }

            const channels = msgsauto.get('channels') || [];
            const channelIndex = channels.findIndex(c => c.id === channelId);

            if (channelIndex !== -1) {
                channels[channelIndex].message = msgContent;
                if (fileUrl !== '') {  // Verifica se algum link foi fornecido
                    channels[channelIndex].file = fileUrl;
                }
                channels[channelIndex].lastMessageId = "";
            } else {
                const newChannel = {
                    id: channelId,
                    message: msgContent,
                    lastMessageId: ""
                };
                if (fileUrl !== '') {  // Adiciona o link do arquivo, se fornecido
                    newChannel.file = fileUrl;
                }
                channels.push(newChannel);
            }

            msgsauto.set('channels', channels);
            await AcoesMsgsAutomatics(interaction, client);
            interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Mensagem adicionada com sucesso!`, ephemeral: true });
        }
    }
};