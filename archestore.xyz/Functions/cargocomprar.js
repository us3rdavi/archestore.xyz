const {
    ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao } = require("../Database");

async function configrole24(interaction, client) {
    const statusComprar = configuracao.get('ConfigRoles.statuscomprar') || false;

    const container = new ContainerBuilder();
    container;

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
            .setEmoji(statusComprar ? "1501803935453679616" : "1501803932484108359")
            .setStyle(statusComprar ? 3 : 4),
        new ButtonBuilder()
            .setCustomId("configurarcargocomprar")
            .setLabel("Configurar Cargo")
            .setEmoji("1501804030605922346")
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("configurarlink")
            .setLabel("Configurar Link")
            .setEmoji("1501804030605922346")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("voltar1")
            .setLabel('Voltar')
            .setEmoji("1501804030605922346")
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
