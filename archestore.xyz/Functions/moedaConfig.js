const { ActionRowBuilder, TextInputBuilder, TextInputStyle, InteractionType, ModalBuilder, EmbedBuilder, ButtonBuilder, StringSelectMenuBuilder } = require("discord.js");
const { configuracao } = require("../DataBaseJson");

async function moedaConfig(interaction, client) {

        interaction.editReply({
            content: ``,
            embeds: [],
            components: [
                new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                    .setCustomId(`selectMoedaC`)
                    .addOptions(
                        {
                            value: `realBRL`,
                            label: `Real Brasileiro`,
                            emoji: `<:loja:1371559113905016914>`
                        },
                        {
                            value: `dolarUSD`,
                            label: `Dólar Americano (indisponível)`,
                            emoji: `<:_money_emoji:1371605504601882664>`
                        }
                    )
                    .setPlaceholder(`Clique aqui para selecionar a moeda`)
                    .setMaxValues(1)
                )
            ]
        })

}

module.exports = {
    moedaConfig
}