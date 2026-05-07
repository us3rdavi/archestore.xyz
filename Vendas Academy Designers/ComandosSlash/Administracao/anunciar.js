const {ActivityType, ApplicationCommandOptionType, EmbedBuilder, cleanContent, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const { getPermissions } = require("../../Functions/PermissionsCache.js");

module.exports = {
    name: "anunciar",
    description: "[🤖] Envie um anúncio no servidor.",

    run: async (client, interaction) => {

    const perm = await getPermissions(client.user.id);
    if (perm === null || !perm.includes(interaction.user.id)) {
          return interaction.reply({ content: `❌️ Você não possui permissão para usar esse comando.`, ephemeral: true });
    }

    await interaction.reply({ content: '`💬 Escolha o tipo de aviso que deseja fazer.`', components: [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId("contentanunciar24")
            .setLabel("Mensagem")
            .setStyle(2),
            new ButtonBuilder()
            .setCustomId("embedanunciar24")
            .setLabel("Embed")
            .setStyle(2)
        )
    ], ephemeral: true })

    },
};
