const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle 
} = require("discord.js");
const fs = require('fs');
const path = require('path');
const mensagemPach = path.resolve(__dirname, '../../DataBaseJson/msgauto.json');
const { configuracao } = require('../../DataBaseJson'); // Certifique-se de que esse arquivo exista e esteja correto

module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {
        try {
            if (interaction.isButton()) {
                if (interaction.customId === 'configmsgauto') {
                    // Atualizar embed de configuração
                    await updateConfigEmbed(interaction, client);
                } else if (interaction.customId === 'addConfig') {
                    // Criar um modal
                    const modal = new ModalBuilder()
                        .setCustomId('configModal')
                        .setTitle('Configurar Mensagem Automática');

                    // Campos do modal
                    const messageInput = new TextInputBuilder()
                        .setCustomId('messageInput')
                        .setLabel('Mensagem')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true);

                    const chatIdsInput = new TextInputBuilder()
                        .setCustomId('chatIdsInput')
                        .setLabel('IDs dos Chats (separados por vírgula)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const deleteTimeInput = new TextInputBuilder()
                        .setCustomId('deleteTimeInput')
                        .setLabel('Tempo para Deletar a Mensagem (em segundos)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const repostTimeInput = new TextInputBuilder()
                        .setCustomId('repostTimeInput')
                        .setLabel('Tempo para Repostar a Mensagem (em segundos)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    // Adicionar campos ao modal
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(messageInput),
                        new ActionRowBuilder().addComponents(chatIdsInput),
                        new ActionRowBuilder().addComponents(deleteTimeInput),
                        new ActionRowBuilder().addComponents(repostTimeInput)
                    );

                    // Mostrar modal ao usuário
                    await interaction.showModal(modal);
                } else if (interaction.customId.startsWith('deleteConfig_')) {
                    const idToDelete = parseInt(interaction.customId.split('_')[1], 10);

                    if (isNaN(idToDelete)) {
                        return interaction.reply({ content: 'ID inválido.', ephemeral: true });
                    }

                    let msgData = [];
                    if (fs.existsSync(mensagemPach)) {
                        try {
                            msgData = JSON.parse(fs.readFileSync(mensagemPach));
                            if (!Array.isArray(msgData)) {
                                console.error('O conteúdo do arquivo não é um array');
                                msgData = [];  // Caso o conteúdo não seja um array, define como array vazio
                            }
                        } catch (error) {
                            console.error('Erro ao ler ou parsear o arquivo:', error);
                            msgData = [];  // Se houver erro, define como array vazio
                        }
                    }
                    

                    msgData = msgData.filter(data => data.id !== idToDelete);

                    fs.writeFileSync(mensagemPach, JSON.stringify(msgData, null, 2));

                    // Atualizar embed de configuração
                    await updateConfigEmbed(interaction, client);
                }
            }

            if (interaction.isModalSubmit()) {
                if (interaction.customId === 'configModal') {
                    const message = interaction.fields.getTextInputValue('messageInput');
                    const chatIds = interaction.fields.getTextInputValue('chatIdsInput').split(',').map(id => id.trim());
                    const deleteTime = parseInt(interaction.fields.getTextInputValue('deleteTimeInput'), 10);
                    const repostTime = parseInt(interaction.fields.getTextInputValue('repostTimeInput'), 10);

                    // Validar entradas
                    if (isNaN(deleteTime) || isNaN(repostTime)) {
                        return interaction.reply({ content: 'Os tempos devem ser números válidos.', ephemeral: true });
                    }

                    let msgData = [];
                    if (fs.existsSync(mensagemPach)) {
                        try {
                            msgData = JSON.parse(fs.readFileSync(mensagemPach));
                            if (!Array.isArray(msgData)) {
                                console.error('O conteúdo do arquivo não é um array');
                                msgData = [];  // Caso o conteúdo não seja um array, define como array vazio
                            }
                        } catch (error) {
                            console.error('Erro ao ler ou parsear o arquivo:', error);
                            msgData = [];  // Se houver erro, define como array vazio
                        }
                    }
                    

                    msgData.push({
                        id: msgData.length + 1,
                        message: message,
                        chatIds: chatIds,
                        deleteTime: deleteTime,
                        repostTime: repostTime
                    });

                    fs.writeFileSync(mensagemPach, JSON.stringify(msgData, null, 2));

                   // await interaction.reply({ content: 'Configurações salvas com sucesso!', ephemeral: true });

                    // Atualizar embed de configuração
                    await updateConfigEmbed(interaction, client);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
};

async function updateConfigEmbed(interaction, client) {
    let msgData = [];
    if (fs.existsSync(mensagemPach)) {
        try {
            msgData = JSON.parse(fs.readFileSync(mensagemPach));
            if (!Array.isArray(msgData)) {
                console.error('O conteúdo do arquivo não é um array');
                msgData = [];  // Caso o conteúdo não seja um array, define como array vazio
            }
        } catch (error) {
            console.error('Erro ao ler ou parsear o arquivo:', error);
            msgData = [];  // Se houver erro, define como array vazio
        }
    }
    
    
    if (Array.isArray(msgData)) {
        msgData.forEach(item => {
        });
    } else {
    }

    const embed = new EmbedBuilder()
        .setTitle('Configurações de Mensagens Automáticas')
        .setColor(configuracao.get('Cores.Principal') || '0cd4cc');

    msgData.forEach(data => {
        embed.addFields([
            { name: 'ID', value: data.id.toString(), inline: true },
            { name: 'Mensagem', value: data.message, inline: true },
            { name: 'IDs dos Chats', value: data.chatIds.join(', '), inline: true },
            { name: 'Tempo para Deletar (s)', value: data.deleteTime.toString(), inline: true },
            { name: 'Tempo para Repostar (s)', value: data.repostTime.toString(), inline: true }
        ]);
    });

    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('addConfig')
                .setLabel('Adicionar Configuração')
                .setEmoji('1236318155056349224')
                .setStyle('1')
        );

    msgData.forEach(data => {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`deleteConfig_${data.id}`)
                .setLabel(`Deletar Config ${data.id}`)
                .setEmoji('1178076767567757312')
                .setStyle('4')
        );
    });

    const actionRow2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('voltarautomaticos')
                .setLabel('Voltar')
                .setEmoji('1178068047202893869')
                .setStyle('2')
        );

    try {
        // Verificar se a interação já foi respondida
        if (interaction.replied) {
            // Atualizar a interação existente
            await interaction.update({ content: '', embeds: [embed], components: [actionRow, actionRow2], ephemeral: true });
        } else {
            // Responder pela primeira vez
            await interaction.update({ content: '', embeds: [embed], components: [actionRow, actionRow2], ephemeral: true });
        }
    } catch (error) {
        console.error('Erro ao enviar/atualizar a mensagem:', error);
    }
}

