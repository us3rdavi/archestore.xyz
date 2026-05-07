const { EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder } = require("discord.js");

async function Gerenciar(interaction, client) {


    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("configcargos")
                .setLabel('Cargos')
                .setEmoji("1371605365799780462")
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId("personalizarcanais")
                .setLabel('Canais')
                .setEmoji("1371605612403757086")
                .setStyle(2),
        )

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("formasdepagamentos")
                .setLabel('Formas de pagamento')
                .setEmoji("1371593627477737502")
                .setStyle(1),
        )

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar00")
            .setEmoji("1371605354605051996")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji("1371580875615113307")
            .setDisabled(true)
            .setStyle(1)
    )


    if (interaction.message == undefined) {
        interaction.reply({ embeds: [], components: [row1, row2, row3], content: `O que precisa configurar?` })
    } else {
        await interaction.update({ embeds: [], components: [row1, row2, row3], content: `O que precisa configurar?` })
    }

}



module.exports = {
    Gerenciar
}
