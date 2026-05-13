const { ApplicationCommandType, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { buildMainMenu } = require('../../Functions/AnunciarBuilder');
const { hasPermission } = require('../../Functions/PermissionsCache');
const { Emojis } = require('../../Database');

module.exports = {
    name: 'anunciar',
    description: 'Crie e envie anúncios personalizados com o construtor de embeds.',
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,

    run: async (client, interaction) => {
        if (!hasPermission(interaction.user.id)) {
            return interaction.reply({
                content: `${Emojis.get('negative_emoji')} Você não possui permissão para usar esse comando.`,
                ephemeral: true
            });
        }

        const menu = buildMainMenu(interaction.user.id);
        await interaction.reply({
            ...menu,
            flags: MessageFlags.Ephemeral,
        });
    },
};
