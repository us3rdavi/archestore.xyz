const { ApplicationCommandType, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { buildMainMenu } = require('../../Functions/ProdutosBuilder');
const { hasPermission } = require('../../Functions/PermissionsCache');
const { Emojis } = require('../../Database');

module.exports = {
    name: 'produtos',
    description: 'Crie e envie anúncios dos produtos da loja com select menu integrado.',
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        if (!hasPermission(interaction.user.id)) {
            return interaction.reply({
                content: `${Emojis.get('negative_emoji')} Você não possui permissão para usar esse comando.`,
                ephemeral: true,
            });
        }

        const menu = buildMainMenu(interaction.user.id);
        await interaction.reply({
            ...menu,
            flags: MessageFlags.Ephemeral,
        });
    },
};
