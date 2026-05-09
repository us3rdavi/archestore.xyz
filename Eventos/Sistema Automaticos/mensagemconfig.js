const {
    ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, msgauto } = require('../../Database');

function getMsgData() {
    return msgauto.get('data') || [];
}

function setMsgData(data) {
    msgauto.set('data', data);
}

module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {
        try {
            if (interaction.isButton()) {
                if (interaction.customId === 'configmsgauto') {
                    await updateConfigContainer(interaction, client);
                } else if (interaction.customId === 'addConfig') {
                    const modal = new ModalBuilder()
                        .setCustomId('configModal')
                        .setTitle('Configurar Mensagem Automática');

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder().setCustomId('messageInput').setLabel('Mensagem').setStyle(TextInputStyle.Paragraph).setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder().setCustomId('chatIdsInput').setLabel('IDs dos Chats (separados por vírgula)').setStyle(TextInputStyle.Short).setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder().setCustomId('deleteTimeInput').setLabel('Tempo para Deletar a Mensagem (em segundos)').setStyle(TextInputStyle.Short).setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder().setCustomId('repostTimeInput').setLabel('Tempo para Repostar a Mensagem (em segundos)').setStyle(TextInputStyle.Short).setRequired(true)
                        )
                    );

                    await interaction.showModal(modal);
                } else if (interaction.customId.startsWith('deleteConfig_')) {
                    const idToDelete = parseInt(interaction.customId.split('_')[1], 10);

                    if (isNaN(idToDelete)) {
                        return interaction.reply({ content: 'ID inválido.', ephemeral: true });
                    }

                    let msgData = getMsgData();
                    msgData = msgData.filter(data => data.id !== idToDelete);
                    setMsgData(msgData);

                    await updateConfigContainer(interaction, client);
                }
            }

            if (interaction.isModalSubmit()) {
                if (interaction.customId === 'configModal') {
                    const message = interaction.fields.getTextInputValue('messageInput');
                    const chatIds = interaction.fields.getTextInputValue('chatIdsInput').split(',').map(id => id.trim());
                    const deleteTime = parseInt(interaction.fields.getTextInputValue('deleteTimeInput'), 10);
                    const repostTime = parseInt(interaction.fields.getTextInputValue('repostTimeInput'), 10);

                    if (isNaN(deleteTime) || isNaN(repostTime)) {
                        return interaction.reply({ content: 'Os tempos devem ser números válidos.', ephemeral: true });
                    }

                    let msgData = getMsgData();
                    msgData.push({ id: msgData.length + 1, message, chatIds, deleteTime, repostTime });
                    setMsgData(msgData);

                    await updateConfigContainer(interaction, client);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
};

async function updateConfigContainer(interaction, client) {
    const msgData = getMsgData();

    const container = new ContainerBuilder();
    container;

    let content = `## Configurações de Mensagens Automáticas\n`;
    if (msgData.length === 0) {
        content += `Nenhuma mensagem automática configurada.`;
    } else {
        for (const data of msgData) {
            content += `\n**ID:** \`${data.id}\` | **Mensagem:** ${data.message}\n**Chats:** ${data.chatIds.join(', ')} | **Deletar:** \`${data.deleteTime}s\` | **Repostar:** \`${data.repostTime}s\`\n`;
        }
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
    container.addSeparatorComponents(new SeparatorBuilder());

    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('addConfig').setLabel('Adicionar Configuração').setEmoji('1236318155056349224').setStyle(1)
    );

    for (const data of msgData) {
        actionRow.addComponents(
            new ButtonBuilder().setCustomId(`deleteConfig_${data.id}`).setLabel(`Deletar Config ${data.id}`).setEmoji('1178076767567757312').setStyle(4)
        );
    }

    container.addActionRowComponents(actionRow);
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('voltarautomaticos').setLabel('Voltar').setEmoji('1178068047202893869').setStyle(2)
        )
    );

    try {
        await interaction.update({
            content: '',
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            embeds: [],
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao enviar/atualizar a mensagem:', error);
    }
}
