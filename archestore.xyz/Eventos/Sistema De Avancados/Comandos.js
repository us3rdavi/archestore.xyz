const {
    ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { configuracao } = require("../../Database");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

function buildCommandPanel(title, desc, rows) {
    const container = new ContainerBuilder();
    container;
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${title}\n${desc}`)
    );
    container.addSeparatorComponents(new SeparatorBuilder());
    for (const row of rows) container.addActionRowComponents(row);
    return container;
}

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            async function safeReply(content) {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply(content);
                } else {
                    await interaction.reply(content);
                }
            }

            const makeRows = (idRole, idChannel) => [
                new ActionRowBuilder().addComponents(
                    new RoleSelectMenuBuilder().setCustomId(idRole).setMaxValues(1).setPlaceholder("Selecione o cargo")
                ),
                new ActionRowBuilder().addComponents(
                    new ChannelSelectMenuBuilder().setCustomId(idChannel).setChannelTypes(ChannelType.GuildText).setMaxValues(1).setPlaceholder("Selecione o canal de logs")
                )
            ];

            if (customId === 'configurar_banunban') {
                await safeReply({
                    components: [buildCommandPanel('Configuração de Ban & Unban', 'Você está configurando o comando **Ban & Unban**. Selecione o canal e o cargo abaixo:', makeRows('selecionar_cargo_banunban', 'selecionar_canal_banunban'))],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    ephemeral: true
                });
            }
            if (customId === 'selecionar_canal_banunban') {
                configuracao.set('ConfigCommands.banchannel', interaction.values[0]);
                await safeReply({ content: `Canal de logs configurado para: <#${interaction.values[0]}>`, ephemeral: true });
            }
            if (customId === 'selecionar_cargo_banunban') {
                configuracao.set('ConfigCommands.banrole', interaction.values[0]);
                await safeReply({ content: `Cargo configurado para: <@&${interaction.values[0]}>`, ephemeral: true });
            }

            if (customId === 'configurar_unlocklock') {
                await safeReply({
                    components: [buildCommandPanel('Configuração de Unlock & Lock', 'Você está configurando o comando **Unlock & Lock**. Selecione o canal e o cargo abaixo:', makeRows('selecionar_cargo_unlocklock', 'selecionar_canal_unlocklock'))],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    ephemeral: true
                });
            }
            if (customId === 'selecionar_canal_unlocklock') {
                configuracao.set('ConfigCommands.lockschannel', interaction.values[0]);
                await safeReply({ content: `Canal de logs configurado para: <#${interaction.values[0]}>`, ephemeral: true });
            }
            if (customId === 'selecionar_cargo_unlocklock') {
                configuracao.set('ConfigCommands.locksrole', interaction.values[0]);
                await safeReply({ content: `Cargo configurado para: <@&${interaction.values[0]}>`, ephemeral: true });
            }

            if (customId === 'configurar_clearnuke') {
                await safeReply({
                    components: [buildCommandPanel('Configuração de Clear & Nuke', 'Você está configurando o comando **Clear & Nuke**. Selecione o canal e o cargo abaixo:', makeRows('selecionar_cargo_clearnuke', 'selecionar_canal_clearnuke'))],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    ephemeral: true
                });
            }
            if (customId === 'selecionar_canal_clearnuke') {
                configuracao.set('ConfigCommands.nukechannel', interaction.values[0]);
                await safeReply({ content: `Canal de logs configurado para: <#${interaction.values[0]}>`, ephemeral: true });
            }
            if (customId === 'selecionar_cargo_clearnuke') {
                configuracao.set('ConfigCommands.nukerole', interaction.values[0]);
                await safeReply({ content: `Cargo configurado para: <@&${interaction.values[0]}>`, ephemeral: true });
            }

        } catch (error) {
            console.error('Erro ao processar interação:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Ocorreu um erro ao processar a interação.', ephemeral: true });
            }
        }
    }
};
