const { PermissionFlagsBits, ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
    name: `lock`,
    description:`Use para trancar o canal`,
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,

    run: async(client, interaction) => {

        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
        }

        interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false })

        interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setDescription(`Este canal ${interaction.channel} foi trancado por (${interaction.user})`)
                .setColor(`#FF0000`)
            ],
            components: [
                new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`unlockChannel`).setLabel(`Destrancar`).setStyle(2)
                )
            ]
        });

    }
}