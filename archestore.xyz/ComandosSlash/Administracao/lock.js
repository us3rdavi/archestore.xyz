const {
    PermissionFlagsBits, ApplicationCommandType,
    ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis, configuracao } = require("../../DataBaseJson");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

module.exports = {
    name: 'lock',
    description: 'Use para trancar o canal',
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Faltam permissões.`, ephemeral: true });
        }

        interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });

        const container = new ContainerBuilder();
        container.setAccentColor(getAccentColor());

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `Este canal ${interaction.channel} foi trancado por ${interaction.user}`
            )
        );

        container.addSeparatorComponents(new SeparatorBuilder());

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('unlockChannel').setLabel('Destrancar').setStyle(2)
            )
        );

        interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            embeds: []
        });
    }
}
