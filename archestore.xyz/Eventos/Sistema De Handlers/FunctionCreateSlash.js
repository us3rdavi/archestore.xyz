const client = require("../../index");
const Discord = require("discord.js");

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            if (interaction.isChatInputCommand()) {
                const cmd = client.slashCommands.get(interaction.commandName);

                if (!cmd) {
                    return interaction.reply({ content: "Ocorreu algum erro, o comando não foi encontrado.", ephemeral: true });
                }

                interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);
                await cmd.run(client, interaction);
            }

            if (interaction.isMessageContextMenuCommand()) {
                const command = client.slashCommands.get(interaction.commandName);
                if (command) await command.run(client, interaction);
            }

            if (interaction.isUserContextMenuCommand()) {
                const command = client.slashCommands.get(interaction.commandName);
                if (command) await command.run(client, interaction);
            }
        } catch (error) {
            console.error("Erro ao processar interação:", error.message);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: "Ocorreu um erro ao processar sua interação. Tente novamente mais tarde.", ephemeral: true });
                } else if (interaction.deferred && !interaction.replied) {
                    await interaction.editReply({ content: "Ocorreu um erro ao processar sua interação. Tente novamente mais tarde." });
                }
            } catch (replyError) {
                console.error("Erro ao responder com erro:", replyError.message);
            }
        }
    }
};
