const Discord = require("discord.js");
const { owner } = require('../../config.json');
const { produtos } = require("../../DataBaseJson");
const { GerenciarProduto } = require("../../Functions/CreateProduto");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
  name: "🧵 Configurar Produtos",
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

    if (msg.type == 2) { 
      const produto = msg.custom_id.split('_')[2];
      if (produto == undefined || produtos.get(produto) == null) {
        return interaction.reply({ content: `${Emojis.get(`negative_emoji`)}  Produto não encontrado.`, ephemeral: true });
      }
      GerenciarProduto(interaction, 3, produto);
    } else if (msg.type == 3) { 
      const campo = msg.options[0].value.split('_')[0];
      const produto = msg.options[0].value.split('_')[1];

      if (produto == undefined || produtos.get(produto) == null) {
        return interaction.reply({ content: `${Emojis.get(`negative_emoji`)}  Produto não encontrado.`, ephemeral: true });
      }
      GerenciarProduto(interaction, 3, produto);
    }
  }
}
