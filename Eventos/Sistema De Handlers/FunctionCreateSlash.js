const { hasPermission } = require('../../Functions/PermissionsCache.js');
const { Emojis } = require('../../Database');

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            if (interaction.isChatInputCommand()) {
                const cmd = client.slashCommands.get(interaction.commandName);
                if (!cmd) {
                    return interaction.reply({ content: 'Ocorreu algum erro, o comando não foi encontrado.', ephemeral: true });
                }

                if (!hasPermission(interaction.user.id)) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Você não tem permissão para usar os comandos do bot.`,
                        ephemeral: true,
                    });
                }

                interaction['member'] = interaction.guild.members.cache.get(interaction.user.id);
                await cmd.run(client, interaction);
            }

            if (interaction.isMessageContextMenuCommand()) {
                const command = client.slashCommands.get(interaction.commandName);
                if (command) {
                    if (!hasPermission(interaction.user.id)) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sem permissão.`, ephemeral: true });
                    }
                    await command.run(client, interaction);
                }
            }

            if (interaction.isUserContextMenuCommand()) {
                const command = client.slashCommands.get(interaction.commandName);
                if (command) {
                    if (!hasPermission(interaction.user.id)) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sem permissão.`, ephemeral: true });
                    }
                    await command.run(client, interaction);
                }
            }
        } catch (error) {
            console.error('Erro ao processar interação:', error.message);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'Ocorreu um erro ao processar sua interação.', ephemeral: true });
                } else if (interaction.deferred && !interaction.replied) {
                    await interaction.editReply({ content: 'Ocorreu um erro ao processar sua interação.' });
                }
            } catch (replyError) {
                console.error('Erro ao responder com erro:', replyError.message);
            }
        }
    },
};
