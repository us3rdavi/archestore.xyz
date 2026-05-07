const {
    ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao } = require("../DataBaseJson");

async function configrole24(interaction, client) {
    const statusComprar = configuracao.get('ConfigRoles.statuscomprar') || false;

    const container = new ContainerBuilder();
    container.setAccentColor(0x5865F2);

    const cargoId = configuracao.get("ConfigRoles.cargocarrinho");
    const link = configuracao.get("ConfigLinks.link");

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## Autorização de Carrinho\nGerencie o cargo necessário para abrir carrinhos e o link de verificação.\n\n` +
            `**Cargo necessário:** ${cargoId ? `<@&${cargoId}>` : '`Não definido`'}\n` +
            `**Link de verificação:**\n\`\`\`${link || 'Não definido'}\`\`\`\n` +
            `**Status:** \`${statusComprar ? 'On' : 'Off'}\``
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("onoffcargo24")
            .setLabel(statusComprar ? "On" : "Off")
            .setEmoji(statusComprar ? "1371568433321214092" : "1371569230901936258")
            .setStyle(statusComprar ? 3 : 4),
        new ButtonBuilder()
            .setCustomId("configurarcargocomprar")
            .setLabel("Configurar Cargo")
            .setEmoji("1371605431868457032")
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("configurarlink")
            .setLabel("Configurar Link")
            .setEmoji("1371605431868457032")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("voltar1")
            .setLabel('Voltar')
            .setEmoji("1371605354605051996")
            .setStyle(2),
    );

    container.addActionRowComponents(row2);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

module.exports = { configrole24 }
