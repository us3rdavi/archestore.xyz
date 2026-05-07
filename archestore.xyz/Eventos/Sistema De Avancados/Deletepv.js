const { } = require("discord.js");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
    name:"interactionCreate",
    run: async( interaction, client) => {
        if(interaction.isButton() && interaction.customId === "limpardm") {

            const DM = await interaction.user.createDM();

            const lastMessage = await DM.messages.fetch({ limit: 1 });
            if (lastMessage.size == 0) {
                await interaction.reply({
                    content: `${Emojis.get(`negative_emoji`)} Não encontrei nenhuma mensagem em minha DM Com Você.`,
                    ephemeral: true
                });
                return;
            };
    
            await interaction.reply({
                content: `> 🔁 | Limpando minha DM Com A Sua! Aguarde ...`,
                ephemeral: true
            });
    
            const messagesToDelete = await DM.messages.fetch({ limit: 100 });
    
            let deletedCount = 0;
            for (const message of messagesToDelete.values()) {
    
                if (message.author.bot) {
                    await message.delete().catch(console.error);
                    deletedCount++;
                };
    
                await interaction.editReply({
                    content: `> 🔁 | **${deletedCount}** mensagens apagadas ...`,
                    ephemeral: true
                });
    
            };
    
            await interaction.editReply({
                content: `${Emojis.get(`confirmed_emoji`)} Foram excluídas **${deletedCount}** mensagens em minha DM.`,
                ephemeral: true
            });

        }
    }
}