const { InteractionType } = require("discord.js");

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        if (interaction.type == InteractionType.ModalSubmit) {
            if (interaction.customId === 'avaliacaogerallll') {
                const estrelas = interaction.fields.getTextInputValue('1');
                const desc = interaction.fields.getTextInputValue('2');
            }
        }
    }
}
