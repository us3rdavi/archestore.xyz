const { RoleSelectMenuBuilder, EmbedBuilder, InteractionType, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const Discord = require("discord.js");
const { JsonDatabase } = require('wio.db');
const { relikia } = require("../DataBaseJson");

async function AutoClear(interaction, client) {
  if (!relikia) {
    console.error("🚫 Erro: O banco de dados 'relikia' não está definido.");
    return interaction.reply({ content: "Erro interno: Banco de dados não encontrado!", ephemeral: true });
  }

  try {
    const canalautoclear = await relikia.get("autoclear.channel") || "Nenhum canal selecionado";
    const tempoclear = await relikia.get("autoclear.time") || 0;

    interaction.update({
      content: '',
      embeds: [
        new Discord.EmbedBuilder()
          .setTitle(`Configurando \`AutoClear\``)
          .setDescription(`Você acessou a aba de **AutoClear**. Suas **informações** e os **botões de configurações** estão abaixo. **Configure tudo!**`)
          .addFields(
            {
              name: `🚪 | Canal AutoClear:`,
              value: canalautoclear !== "Nenhum canal selecionado" ? `<#${canalautoclear}>` : canalautoclear,
              inline: true
            },
            {
              name: `⏰ | Tempo AutoClear:`,
              value: `${tempoclear} segundos`,
              inline: true
            },
          )
      ],
      components: [
        new Discord.ActionRowBuilder()
          .addComponents(
            new Discord.ButtonBuilder()
              .setCustomId(`autoclearcanal`)
              .setLabel("Configurar Canal")
              .setEmoji("1243060434630869035")
              .setStyle(2),
            new Discord.ButtonBuilder()
              .setCustomId(`autocleartempo`)
              .setLabel("Configurar Tempo")
              .setEmoji("1207761646152458351")
              .setStyle(2),
          ),
        new Discord.ActionRowBuilder()
          .addComponents(
            new Discord.ButtonBuilder()
              .setCustomId('iniciarautoclear')
              .setLabel('Ligar AutoClear')
              .setEmoji(`1248749835109011468`)
              .setStyle(1),
            new Discord.ButtonBuilder()
              .setCustomId('pararautoclear')
              .setLabel('Desligar AutoClear')
              .setEmoji(`1248749849466376333`)
              .setStyle(2),
            new Discord.ButtonBuilder()
              .setCustomId('voltarautomaticos')
              .setEmoji('1237422652050899084')
              .setStyle(2)
          )
      ]
    });
  } catch (error) {
    console.error("🚫 Erro ao obter dados do banco:", error);
    return interaction.reply({ content: "Erro ao acessar o banco de dados!", ephemeral: true });
  }
}

module.exports = {
  AutoClear
};
