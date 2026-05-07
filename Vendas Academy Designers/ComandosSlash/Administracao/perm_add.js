const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../../config.json"); // Importa o config.json para obter o ID do owner
const emojis = require("../../DataBaseJson/Emojis.json"); // Importa o arquivo de emojis

// Define Emojis
const Emojis = {
    get: (name) => emojis[name] || ""
};

module.exports = {
  name: "add_perm",
  description:"conceder permissão a um usuário",
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description:"Usuário que vai receber a permissão",
      type: Discord.ApplicationCommandOptionType.User,
      required: true,
    },
  ],

  run: async (client, interaction, message) => {
    const user = interaction.options.getUser('user');

    // Verifica se o autor do comando é o owner
    if (interaction.user.id !== config.owner) {
      return interaction.reply({
        content: `${Emojis.get(`negative_emoji`)} Apenas o Titular da Compra pode usar Esse Comando`,
        ephemeral: true,
      });
    }

    let perms;
    const filePath = path.join(__dirname, '..', '..', 'DataBaseJson', 'perms.json');
    try {
      if (fs.existsSync(filePath)) {
        perms = require(filePath);
      } else {
        perms = {};
      }
    } catch (error) {
      console.error("Erro ao carregar o arquivo de permissões:", error);
      return interaction.reply({
        content: `${Emojis.get(`negative_emoji`)} O arquivo de permissões não pôde ser carregado.`,
        ephemeral: true,
      });
    }

    if (!perms[user.id]) {
      perms[user.id] = user.id;
      try {
        fs.writeFileSync(filePath, JSON.stringify(perms, null, 2));
        interaction.reply({
          content: `${Emojis.get(`confirmed_emoji`)} Adicionado à lista de permissões do BOT.`,
          ephemeral: true,
        });
      } catch (error) {
        console.error("Erro ao salvar o arquivo de permissões:", error);
        interaction.reply({
          content: `${Emojis.get(`negative_emoji`)} Houve um erro ao salvar o arquivo de permissões.`,
          ephemeral: true,
        });
      }
    } else {
      return interaction.reply({
        content: `${Emojis.get(`negative_emoji`)} O usuário já possui permissão no BOT.`,
        ephemeral: true,
      });
    }
  }
};