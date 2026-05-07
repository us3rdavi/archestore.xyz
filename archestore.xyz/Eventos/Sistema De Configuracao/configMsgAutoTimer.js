const { ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require("discord.js");
const { msgsauto } = require("../../DataBaseJson");

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        if (interaction.isButton()) {
            if (interaction.customId === 'timeUploadMessage') {
                const modal = new ModalBuilder()
                    .setCustomId('modalTimeInterval')
                    .setTitle('Atualizar Intervalo de Tempo')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('inputMinutes')
                                .setLabel('Novo Intervalo em Minutos')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('Exemplo: 15')
                                .setRequired(true)
                        )
                    );

                await interaction.showModal(modal);
            }
        }

        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modalTimeInterval') {
            const newInterval = interaction.fields.getTextInputValue('inputMinutes');
            const parsedInterval = parseInt(newInterval, 10);

            if (isNaN(parsedInterval)) {
                await interaction.reply({ content: '⚠️  | Por favor, insira um número válido de minutos. **(ex: 2)**', ephemeral: true });
                return;
            }

            msgsauto.set('intervalMinutes', parsedInterval);

            await interaction.reply({
                content: `${Emojis.get(`confirmed_emoji`)} Intervalo de tempo atualizado para cada **${parsedInterval}** minuto(s)!`,
                ephemeral: true
            }).catch(error => console.error('Erro ao enviar reply:', error));
        }
    }
};