const { ApplicationCommandType, EmbedBuilder, Webhook, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");
const client = require("discord.js")
const { JsonDatabase } = require("wio.db");
const { produtos, configuracao } = require("../DataBaseJson");

async function automatico(interaction, client) {


        const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId("autoreact24")
            .setLabel('Auto React')
            .setEmoji("1371605384565096499")
            .setDisabled(false)
            .setStyle(2),

            new ButtonBuilder()
            .setCustomId("configmsgauto")
            .setLabel('Mensagem Automatica')
            .setEmoji("1371605445155885127")
            .setStyle(2),

            new ButtonBuilder()
            .setCustomId("configlock")
            .setLabel('Lock Automatico')
            .setEmoji("1371605629218721892")
            .setStyle(1),

        )

        const row3 = new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId("voltar1")
                .setEmoji("1371605354605051996")
                .setLabel('Voltar')
                .setStyle(2)

        )

    await interaction.update({ embeds: [], content: `Oque deseja configurar?`, ephemeral: true, components: [row2, row3]/* row4, row3]*/ })
}


module.exports = {
    automatico
}
