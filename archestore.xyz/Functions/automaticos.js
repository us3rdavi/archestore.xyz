const {
    ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../Database");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function automatico(interaction, client) {
    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('dream')} Automações\nEscolha o sistema que deseja configurar.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("autoreact24")
            .setLabel('Auto React')
            .setEmoji("1501804030605922346")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("configmsgauto")
            .setLabel('Mensagem Automática')
            .setEmoji("1501803905363869769")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("configlock")
            .setLabel('Lock Automático')
            .setEmoji("1501803926180335727")
            .setStyle(1),
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar1")
            .setEmoji("1501804030605922346")
            .setLabel('Voltar')
            .setStyle(2)
    );

    container.addActionRowComponents(row2);
    container.addActionRowComponents(row3);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

module.exports = { automatico }
