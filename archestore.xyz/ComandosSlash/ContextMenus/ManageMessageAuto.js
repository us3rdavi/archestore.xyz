const { PermissionFlagsBits, ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { msgsauto } = require("../../DataBaseJson");
const { owner } = require('../../config.json');
const { Emojis } = require("../../DataBaseJson");

module.exports = {
    name: '🔂Editar Mensagem Automática',
    type: ApplicationCommandType.Message,
    default_member_permissions: PermissionFlagsBits.Administrator,

    run: async (client, interaction) => {
        const ownerIdList = owner;
        if (!ownerIdList.includes(interaction.user.id)) {
            await interaction.reply({
                content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`,
                ephemeral: true
            });
            return;
        }

        const targetMessage = await interaction.channel.messages.fetch(interaction.targetId);
        const channels = msgsauto.get('channels') || [];
        const channelData = channels.find(c => c.id === targetMessage.channelId && c.lastMessageId === targetMessage.id);

        if (!channelData) {
            await interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Mensagem Automática não encontrada na base de dados.`, ephemeral: true });
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId('editAutoMessageModal')
            .setTitle('Editar Mensagem Automática');

        const messageInput = new TextInputBuilder()
            .setCustomId('messageContent')
            .setLabel('Conteúdo da Mensagem')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Insira o novo conteúdo da mensagem aqui')
            .setValue(targetMessage.content)
            .setRequired(true);

        const fileInput = new TextInputBuilder()
            .setCustomId('fileUrl')
            .setLabel('Link do arquivo (imagem/gif) - opcional')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Inserir link aqui (opcional)')
            .setValue(channelData.file || '')
            .setRequired(false);

        const row1 = new ActionRowBuilder().addComponents(messageInput);
        const row2 = new ActionRowBuilder().addComponents(fileInput);

        modal.addComponents(row1, row2);

        await interaction.showModal(modal);

        try {
            const submittedModal = await interaction.awaitModalSubmit({ time: 900000 });
            const newMessageContent = submittedModal.fields.getTextInputValue('messageContent');
            const newFileUrl = submittedModal.fields.getTextInputValue('fileUrl').trim();


            channelData.message = newMessageContent;
            if (newFileUrl !== '') {
                channelData.file = newFileUrl;
            } else {
                delete channelData.file;
            }

            msgsauto.set('channels', channels);
            await submittedModal.reply({ content: `${Emojis.get(`confirmed_emoji`)} Mensagem atualizada com sucesso! Aguarde ela ser repostada pelo sistema.`, ephemeral: true });
        } catch (error) {
            if (error.code === 'INTERACTION_COLLECTOR_ERROR') {
                await interaction.followUp({ content: `${Emojis.get(`negative_emoji`)} O tempo para editar a mensagem expirou, tente novamente.`, ephemeral: true });
            } else {
                console.error("Erro ao atualizar mensagem automática", error);
                await interaction.followUp({ content: `${Emojis.get(`negative_emoji`)} Algo deu errado, tente novamente.`, ephemeral: true });
            }
        }
    }
};
