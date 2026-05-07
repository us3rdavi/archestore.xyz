const {
    ActionRowBuilder, StringSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao } = require("../DataBaseJson");

async function moedaConfig(interaction, client) {
    const container = new ContainerBuilder();
    container.setAccentColor(0x5865F2);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## Configuração de Moeda\nSelecione a moeda padrão para os pagamentos.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const selectRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('selectMoedaC')
            .addOptions(
                {
                    value: 'realBRL',
                    label: 'Real Brasileiro',
                    emoji: '<:loja:1371559113905016914>'
                },
                {
                    value: 'dolarUSD',
                    label: 'Dólar Americano (indisponível)',
                    emoji: '<:_money_emoji:1371605504601882664>'
                }
            )
            .setPlaceholder('Clique aqui para selecionar a moeda')
            .setMaxValues(1)
    );

    container.addActionRowComponents(selectRow);

    interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

module.exports = { moedaConfig }
