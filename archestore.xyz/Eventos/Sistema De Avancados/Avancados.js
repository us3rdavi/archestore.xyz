const {
    ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionType,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { configuracao } = require("../../DataBaseJson");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

function getSaudacao() {
    const brazilTime = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const hora = new Date(brazilTime).getHours();
    if (hora < 12) return 'Bom dia';
    else if (hora < 18) return 'Boa tarde';
    else return 'Boa noite';
}

function buildPanel(title, desc, fields) {
    const container = new ContainerBuilder();
    container.setAccentColor(getAccentColor());

    let content = `## ${title}\n${desc}`;
    for (const [label, value] of fields) {
        content += `\n**${label}** ${value}`;
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
    return container;
}

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        if (customId === 'select_menu' && interaction.values.includes('banunba24')) {
            const container = buildPanel(
                'Ban & Unban',
                `${getSaudacao()} ${interaction.user}, você está configurando o comando **Ban & Unban**`,
                [
                    ['Canal Atual:', `<#${configuracao.get("ConfigCommands.banchannel") || 'Não Definido'}>`],
                    ['Cargo Atual:', `<@&${configuracao.get("ConfigCommands.banrole") || 'Não Definido'}>`]
                ]
            );

            container.addSeparatorComponents(new SeparatorBuilder());
            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('configurar_banunban').setLabel('Configurar').setEmoji("1248985812108841043").setStyle(1),
                    new ButtonBuilder().setCustomId("comandosperm").setLabel("Voltar").setEmoji('1178068047202893869').setStyle(2),
                )
            );

            await interaction.update({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                ephemeral: true
            });
        }

        if (customId === 'select_menu' && interaction.values.includes('unlocklock24')) {
            const container = buildPanel(
                'Unlock & Lock',
                `${getSaudacao()} ${interaction.user}, você está configurando o comando **Unlock & Lock**`,
                [
                    ['Canal Atual:', `<#${configuracao.get("ConfigCommands.lockschannel") || 'Não Definido'}>`],
                    ['Cargo Atual:', `<@&${configuracao.get("ConfigCommands.locksrole") || 'Não Definido'}>`]
                ]
            );

            container.addSeparatorComponents(new SeparatorBuilder());
            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('configurar_unlocklock').setLabel('Configurar').setEmoji("1248985812108841043").setStyle(1),
                    new ButtonBuilder().setCustomId("comandosperm").setLabel("Voltar").setEmoji('1178068047202893869').setStyle(2),
                )
            );

            await interaction.update({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                ephemeral: true
            });
        }

        if (customId === 'select_menu' && interaction.values.includes('clearnuke24')) {
            const container = buildPanel(
                'Clear & Nuke',
                `${getSaudacao()} ${interaction.user}, você está configurando o comando **Clear & Nuke**`,
                [
                    ['Canal Atual:', `<#${configuracao.get("ConfigCommands.nukechannel") || 'Não Definido'}>`],
                    ['Cargo Atual:', `<@&${configuracao.get("ConfigCommands.nukerole") || 'Não Definido'}>`]
                ]
            );

            container.addSeparatorComponents(new SeparatorBuilder());
            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('configurar_clearnuke').setLabel('Configurar').setEmoji("1248985812108841043").setStyle(1),
                    new ButtonBuilder().setCustomId("comandosperm").setLabel("Voltar").setEmoji('1178068047202893869').setStyle(2),
                )
            );

            await interaction.update({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                ephemeral: true
            });
        }
    }
};
