const { EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { produtos, configuracao } = require("../DataBaseJson");
const { msgsauto } = require("../DataBaseJson");

async function AcoesMsgsAutomatics(interaction, client) {

  const intervalMinutes = msgsauto.get('intervalMinutes') || 3; // Valor padrão de 3 minutos se não definido
  const interval = intervalMinutes * 60 * 1000; // Converte milissegundos em minutos

  const embed = new EmbedBuilder()
    .setColor(`${configuracao.get(`Cores.Principal`) == null ? '5865F2' : configuracao.get('Cores.Principal')}`)
    .setTitle(`Mensagens automáticas`)
    .setDescription(`Seu ${client.user.username} enviará mensagens automaticamente nos intervalos e no canal que você pré-definir.`)
    .addFields(
      {
        name: `Tempo para apagar mensagens`, value: `\`${intervalMinutes} minuto(s)\``
      }
    )
    .setFooter(
      { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) }
    )
    .setTimestamp()

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("automaticMessages") 
        .setLabel('Criar mensagem')
        .setEmoji(`1246953350067388487`)
        .setStyle(3)
        .setDisabled(false),
      new ButtonBuilder()
        .setCustomId("removeAutomaticMessages")
        .setLabel('Ver/Excluir Mensagens')
        .setEmoji(`1246953268211613747`)
        .setStyle(1)
        .setDisabled(msgsauto.get("channels")?.length <= 0),
      new ButtonBuilder()
        .setCustomId("timeUploadMessage") 
        .setLabel('Tempo de repostagem')
        .setEmoji(`1246953228655132772`)
        .setStyle(2)
        .setDisabled(false)
    )
  const botoesvoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltar_AcoesAutomaticsConfigs")
      .setLabel('Voltar')
      .setEmoji(`1238413255886639104`)
      .setStyle(2),
  )

  await interaction.update({ content: ``, components: [row2, botoesvoltar], embeds: [embed], ephemeral: true })
}




module.exports = {
  AcoesMsgsAutomatics
}

