const { ApplicationCommandType, EmbedBuilder, Webhook, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { JsonDatabase } = require("wio.db");
const { dbembed } = require("../DataBaseJson");

async function anunciar(interaction, client) {

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("msgcontent")
        .setLabel("Definir Mensagem")
        .setStyle(2)
        .setEmoji("1248985812108841043"),
        new ButtonBuilder()
        .setCustomId("adicionarbotao")
        .setLabel("Adicionar Botão")
        .setStyle(2)
        .setEmoji("1262197019519352882")
    )

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("postarcontent")
        .setLabel("ㅤpostarㅤ")
        .setStyle(3),
        new ButtonBuilder()
        .setCustomId("previecontent")
        .setLabel("ㅤpreviewㅤ")
        .setStyle(1),
        new ButtonBuilder()
        .setCustomId("resetarcontent")
        .setLabel("ㅤresetarㅤ")
        .setStyle(4)
    )

    await interaction.update({ content: `${dbembed.get("content.mensagem") || `Nenhuma mensagem definida!` }`, components: [row, row2] })

}
async function anunciarembed24(interaction, client) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("msgembed24")
        .setLabel("Definir Embed")
        .setStyle(2)
        .setEmoji("1248985812108841043"),
        new ButtonBuilder()
        .setCustomId("adicionarbotaoembed")
        .setLabel("Adicionar Botão")
        .setStyle(2)
        .setEmoji("1262197019519352882")
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("postarembed")
        .setLabel("ㅤPostarㅤ")
        .setStyle(3),
        new ButtonBuilder()
        .setCustomId("previewembed")
        .setLabel("ㅤPreviewㅤ")
        .setStyle(1),
        new ButtonBuilder()
        .setCustomId("resetarembed")
        .setLabel("ㅤResetarㅤ")
        .setStyle(4),
        new ButtonBuilder()
        .setCustomId("atualizarembed2444")
        .setLabel("ㅤAtualizar Embedㅤ")
        .setEmoji("1270509324099129447")
        .setStyle(1)
    );

    await interaction.update({ embeds: [], content: '', components: [row, row2] });
}


module.exports = {
    anunciar,
    anunciarembed24
}
