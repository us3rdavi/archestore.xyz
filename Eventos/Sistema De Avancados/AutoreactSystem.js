const { configuracao } = require("../../Database");
const { ModalBuilder, TextInputBuilder, EmbedBuilder, ButtonBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
    name: "messageCreate",
    run: async (message, client) => {
        if (message.author.bot) return;

        const statusautoreact24 = configuracao.get("AutoReact.status");
        if (statusautoreact24) return;

        const emojiautoreact24 = configuracao.get("AutoReact.Emoji");
        const canalreact24 = configuracao.get("AutoReact.Canais");

        if (canalreact24 && Array.isArray(canalreact24) && canalreact24.includes(message.channel.id)) {
            try {
                await message.react(emojiautoreact24);
            } catch (error) {
                console.error("Erro ao reagir com emoji:", error);
            }
        } else {
            console.error("Canais de reação não configurados corretamente.");
        }
        
    },
};
