const {
    PermissionFlagsBits,
    ApplicationCommandType,
    ChannelType,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
} = require('discord.js');
const { Emojis } = require('../../Database');

module.exports = {
    name: 'unlockall',
    description: 'Desbloqueia todos os canais de texto bloqueados pelo /lockall.',
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,

    run: async (client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const guild  = interaction.guild;
        const canais = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        let count = 0;

        for (const [, canal] of canais) {
            try {
                await canal.permissionOverwrites.edit(guild.roles.everyone, {
                    SendMessages: null,
                });
                count++;
            } catch (e) {
                console.log(`[UnlockAll] Falha: ${canal.name} — ${e.message}`);
            }
        }

        const userName = interaction.member?.displayName
            || interaction.user?.displayName
            || interaction.user?.username;

        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `## ${Emojis.get('confirmed_emoji')} Canais Desbloqueados\n` +
            `**${userName}** · Owner\n\n` +
            `${Emojis.get('information_emoji')} **${count}** canal(is) de texto foram desbloqueados com sucesso.\n` +
            `-# Permissões restauradas ao padrão do servidor.`
        ));

        await interaction.editReply({
            components: [c],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
