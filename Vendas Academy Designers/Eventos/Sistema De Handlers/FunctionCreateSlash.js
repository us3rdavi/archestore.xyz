const client = require("../../index");
const Discord = require("discord.js");

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            // Verifica se a interação é de comando de texto (Chat Input Command)
            if (interaction.isChatInputCommand()) {

                const cmd = client.slashCommands.get(interaction.commandName);

                if (!cmd) {
                    return interaction.reply({ content: "Ocorreu algum erro amigo, o comando não foi encontrado.", ephemeral: true });
                }

                // Garantir que a interação tenha o membro corretamente configurado
                interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);

                // Executa o comando
                await cmd.run(client, interaction);

            }

            // Verifica se a interação é de Menu Contextual de Mensagem
            if (interaction.isMessageContextMenuCommand()) {
                const command = client.slashCommands.get(interaction.commandName);
                if (command) await command.run(client, interaction);
            }

            // Verifica se a interação é de Menu Contextual de Usuário
            if (interaction.isUserContextMenuCommand()) {
                const command = client.slashCommands.get(interaction.commandName);
                if (command) await command.run(client, interaction);
            }
        } catch (error) {
            console.error("Erro ao processar interação:", error);
            interaction.reply({ content: "Ocorreu um erro ao processar sua interação. Tente novamente mais tarde.", ephemeral: true });
        }
    }
};
