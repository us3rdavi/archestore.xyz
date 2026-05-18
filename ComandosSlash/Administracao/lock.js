const {
    PermissionFlagsBits,
    ApplicationCommandType,
    ActionRowBuilder,
    ButtonBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
} = require('discord.js');
const { getPermissions } = require('../../Functions/PermissionsCache.js');
const { Emojis } = require('../../Database');

module.exports = {
    name: 'lock',
    description: 'Tranca o canal atual.',
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            const errContainer = new ContainerBuilder();
            errContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${Emojis.get('negative_emoji')} Você não tem permissão para usar este comando.`
                )
            );
            return interaction.reply({
                components: [errContainer],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
        }

        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });

        const userName = interaction.member?.displayName
            || interaction.user?.displayName
            || interaction.user?.username;

        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `## ${Emojis.get('negative_emoji')} Canal Bloqueado\n` +
            `**${userName}** · Owner\n\n` +
            `${Emojis.get('information_emoji')} O canal ${interaction.channel} foi trancado com sucesso.\n` +
            `-# Apenas administradores podem enviar mensagens.`
        ));
        c.addSeparatorComponents(new SeparatorBuilder());
        c.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('unlockChannel').setLabel('Destrancar').setStyle(2)
            )
        );

        await interaction.reply({
            components: [c],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
