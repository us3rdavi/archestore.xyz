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

                const member = interaction.guild?.members.cache.get(interaction.user.id) || interaction.member;
                if (!hasPermission(interaction.user.id, member)) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Você não tem permissão para usar os comandos do bot.`,
                        ephemeral: true,
                    });
                }

                interaction['member'] = member;
                await cmd.run(client, interaction);
            }

            if (interaction.isMessageContextMenuCommand()) {
                const command = client.slashCommands.get(interaction.commandName);
                if (command) {
                    const m = interaction.guild?.members.cache.get(interaction.user.id) || interaction.member;
                    if (!hasPermission(interaction.user.id, m)) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sem permissão.`, ephemeral: true });
                    }
                    await command.run(client, interaction);
                }
            }

            if (interaction.isUserContextMenuCommand()) {
                const command = client.slashCommands.get(interaction.commandName);
                if (command) {
                    const m = interaction.guild?.members.cache.get(interaction.user.id) || interaction.member;
                    if (!hasPermission(interaction.user.id, m)) {
                        return interaction.reply({ content: `${Emojis.get('negative_emoji')} Sem permissão.`, ephemeral: true });
                    }
                    await command.run(client, interaction);
                }
            }
        } catch (error) {
            // 10062 = "Unknown interaction" — token expirado (processo duplo durante restart).
            // Ignorar silenciosamente, pois não há como responder a uma interação morta.
            if (error.code === 10062) return;
            console.error('Erro ao processar interação:', error.message);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'Ocorreu um erro ao processar sua interação.', ephemeral: true });
                } else if (interaction.deferred && !interaction.replied) {
                    await interaction.editReply({ content: 'Ocorreu um erro ao processar sua interação.' });
                }
            } catch (replyError) {
                if (replyError.code === 10062) return;
                console.error('Erro ao responder com erro:', replyError.message);
            }
        }
    },
};
