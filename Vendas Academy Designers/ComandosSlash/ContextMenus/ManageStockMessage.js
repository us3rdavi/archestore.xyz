const Discord = require("discord.js");
const { owner } = require('../../config.json'); // Importa a lista de IDs dos proprietários
const { produtos } = require("../../DataBaseJson");
const { MessageStock } = require("../../Functions/ConfigEstoque");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
  name: "📦 Configurar Stock",
  type: Discord.ApplicationCommandType.Message,
  default_member_permissions: Discord.PermissionFlagsBits.Administrator,

  run: async (client, interaction) => {
    const ownerIdList = owner;
    if (!ownerIdList.includes(interaction.user.id)) {
        await interaction.reply({
          content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`,
          ephemeral: true
        });
        return; 
    }

    const message = await interaction.channel.messages.fetch(interaction.targetId);
    const msg = message.components[0].components[0].data;

    if (msg.type == 2) { // Button
      const campo = msg.custom_id.split('_')[1];
      const produto = msg.custom_id.split('_')[2];

      if (produto == undefined || produtos.get(produto) == null) {
        return interaction.reply({ content: `${Emojis.get(`negative_emoji`)}  Produto não encontrado.`, ephemeral: true });
      }

      MessageStock(interaction, 1, produto, campo, true, true);
    } else if (msg.type == 3) { // Select menu
      const campo = msg.options[0].value.split('_')[0];
      const produto = msg.options[0].value.split('_')[1];

      if (produto == undefined || produtos.get(produto) == null) {
        return interaction.reply({ content: `${Emojis.get(`negative_emoji`)}  Produto não encontrado.`, ephemeral: true });
      }

      const selectMenu = new Discord.StringSelectMenuBuilder()
        .setCustomId('stockhasdhvsudasd')
        .setPlaceholder('Clique aqui para selecionar')
        .addOptions(msg.options);

      const row = new Discord.ActionRowBuilder()
        .addComponents(selectMenu);

      interaction.reply({
        content: `${interaction.user} Qual estoque de \`${produto}\` deseja gerenciar?`,
        ephemeral: true,
        components: [row]
      });
    }
  }
}
