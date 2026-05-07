const {
    ApplicationCommandType,
    ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { Emojis, configuracao } = require("../../DataBaseJson");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

module.exports = {
    name: "deletealltickets",
    description: "Deleta todos os tickets",
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Faltam permissões.`, ephemeral: true });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('delete').setLabel('Deletar').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('cancel').setLabel('Cancelar').setStyle(ButtonStyle.Secondary)
        );

        const reply = await interaction.reply({
            content: `Deseja realmente deletar todos os tickets?`,
            components: [row],
            ephemeral: true,
            fetchReply: true
        });

        const filter = i => ['delete', 'cancel'].includes(i.customId) && i.user.id === interaction.user.id;
        const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'delete') {
                await i.update({ content: `${Emojis.get('loading_emoji')} Deletando Tickets...`, components: [] });

                const allThreads = await interaction.guild.channels.fetchActiveThreads();
                let count = 0;

                for (const thread of allThreads.threads.values()) {
                    if (!thread.name.includes('carrinho')) {
                        await thread.delete();
                        count++;
                    }
                }

                const container = new ContainerBuilder();
                container.setAccentColor(getAccentColor());
                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## Tickets Deletados\n${Emojis.get('confirmed_emoji')} Todos os **${count}** tickets foram deletados com sucesso`
                    )
                );

                return interaction.editReply({
                    content: '',
                    components: [container],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: []
                });
            } else if (i.customId === 'cancel') {
                await i.update({ content: `${Emojis.get('confirmed_emoji')} Ação cancelada.`, components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: '> Tempo esgotado. Ação cancelada.', components: [] });
            }
        });
    }
};
