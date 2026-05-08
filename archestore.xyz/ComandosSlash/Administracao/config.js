const { PermissionFlagsBits, ApplicationCommandType } = require('discord.js');
const { getPermissions } = require('../../Functions/PermissionsCache.js');
const { Emojis } = require('../../DataBaseJson');
const { buildEmbed, buildMainDropdown } = require('../../Functions/ConfigPainelBuilder');

module.exports = {
    name: 'config',
    description: 'Central de configurações do servidor.',
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,

    run: async (client, interaction) => {
        try {
            const perm = await getPermissions(client.user.id);
            if (perm === null || !perm.includes(interaction.user.id)) {
                return interaction.reply({
                    content: `${Emojis.get('negative_emoji')} Faltam Permissões.`,
                    ephemeral: true,
                });
            }

            await interaction.deferReply({ ephemeral: true });

            const embed = buildEmbed(interaction, client);
            await interaction.editReply({
                embeds: [embed],
                components: [buildMainDropdown(interaction.user.id)],
            });
        } catch (err) {
            console.error('[Config] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro.`, ephemeral: true });
                } else {
                    await interaction.editReply({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro.` });
                }
            } catch (e) {}
        }
    },
};
