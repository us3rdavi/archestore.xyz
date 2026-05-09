const {
    PermissionFlagsBits,
    ApplicationCommandType,
    ChannelType,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
} = require('discord.js');
const { Emojis } = require('../../DataBaseJson');

module.exports = {
    name: 'lockall',
    description: 'Bloqueia todos os canais de texto do servidor.',
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,

    run: async (client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const guild = interaction.guild;
        const canais = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        let count = 0;

        for (const [, canal] of canais) {
            try {
                await canal.permissionOverwrites.edit(guild.roles.everyone, {
                    SendMessages: false,
                });
                count++;
            } catch (e) {
                console.log(`[LockAll] Falha: ${canal.name} — ${e.message}`);
            }
        }

        const userName = interaction.member?.displayName
            || interaction.user?.displayName
            || interaction.user?.username;

        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `## ${Emojis.get('negative_emoji')} Canais Bloqueados\n` +
            `**${userName}** · Owner\n\n` +
            `${Emojis.get('information_emoji')} **${count}** canal(is) de texto foram bloqueados com sucesso.\n` +
            `-# Permissões de envio de mensagens revogadas.`
        ));

        await interaction.editReply({
            components: [c],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
