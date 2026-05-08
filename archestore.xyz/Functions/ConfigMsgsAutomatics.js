const {
    ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, msgsauto } = require("../DataBaseJson");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function AcoesMsgsAutomatics(interaction, client) {
    const intervalMinutes = msgsauto.get('intervalMinutes') || 3;

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## Mensagens Automáticas\n` +
            `Seu **${client.user.username}** enviará mensagens automaticamente nos intervalos e no canal que você pré-definir.\n\n` +
            `**Tempo para apagar mensagens:** \`${intervalMinutes} minuto(s)\``
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("automaticMessages")
            .setLabel('Criar mensagem')
            .setEmoji('1246953350067388487')
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId("removeAutomaticMessages")
            .setLabel('Ver/Excluir Mensagens')
            .setEmoji('1246953268211613747')
            .setStyle(1)
            .setDisabled(!(msgsauto.get("channels")?.length > 0)),
        new ButtonBuilder()
            .setCustomId("timeUploadMessage")
            .setLabel('Tempo de repostagem')
            .setEmoji('1246953228655132772')
            .setStyle(2)
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_AcoesAutomaticsConfigs")
            .setLabel('Voltar')
            .setEmoji('1238413255886639104')
            .setStyle(2),
    );

    container.addActionRowComponents(row2);
    container.addActionRowComponents(botoesvoltar);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

module.exports = { AcoesMsgsAutomatics }
