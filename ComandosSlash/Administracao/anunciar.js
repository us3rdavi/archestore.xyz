const { getPermissions } = require('../../Functions/PermissionsCache');
const { buildMainMenu } = require('../../Functions/AnunciarBuilder');
const { Emojis } = require('../../Database');

module.exports = {
    name: 'anunciar',
    description: 'Crie e envie anúncios personalizados com o construtor de embeds.',

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({
                content: `${Emojis.get('negative_emoji')} Você não possui permissão para usar esse comando.`,
                ephemeral: true
            });
        }

        await interaction.reply({ ...buildMainMenu(interaction.user.id), ephemeral: true });
    },
};
