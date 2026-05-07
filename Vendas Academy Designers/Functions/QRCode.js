const { EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { produtos, configuracao } = require("../DataBaseJson");

async function configqrcode(interaction, client) {

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`qrcode-button`)
        .setLabel(`Enviar logo`)
        .setEmoji(`1238299494181896306`)
        .setStyle(1),
      new ButtonBuilder()
        .setCustomId(`qrcode-pisicao`)
        .setLabel(`Mudar Posição`)
        .setEmoji(`1256808767325081683`)
        .setStyle(1)
    )


  const botoesvoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltarsendlogo")
      .setEmoji(`1238413255886639104`)
      .setStyle(2),
    new ButtonBuilder()
      .setCustomId(`voltar1`)
      .setEmoji('1292237216915128361')
      .setStyle(1)
  )

  if (interaction.message) {
   await interaction.update({ content: `Aqui, você pode escolher o logo da sua marca, que será exibido nos QRCodes de pagamento criados.`, components: [row2, botoesvoltar], embeds: [], ephemeral: true })
  }
}

module.exports = {
  configqrcode
}
