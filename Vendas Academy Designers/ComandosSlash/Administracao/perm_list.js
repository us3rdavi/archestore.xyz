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
  name: "ver_perms",
  description: "[⭐️] ver todos os usuários que têm permissão",
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    // Verifica se o autor do comando é o owner
    if (interaction.user.id !== config.owner) {
      return interaction.reply({
        content: `${Emojis.get(`negative_emoji`)} Apenas o Titular da Compra pode usar esse comando`,
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

    // Se não houver usuários com permissão
    if (Object.keys(perms).length === 0) {
      return interaction.reply({
        content: `${Emojis.get(`negative_emoji`)} Não há usuários com permissão no BOT.`,
        ephemeral: true,
      });
    }

    // Criar a lista de usuários com permissão
    const usersWithPerm = Object.keys(perms).map(userId => {
      const user = client.users.cache.get(userId);
      return user ? user.tag : `Usuário com ID ${userId} não encontrado`;
    });

    // Criar a mensagem com ">" apenas na primeira linha
    let content = "\`\📝\` **Usuários com permissão para gerenciar o BOT:**\n\n";
    content += `> ${usersWithPerm[0]}\n`;
    for (let i = 1; i < usersWithPerm.length; i++) {
      content += `${usersWithPerm[i]}\n`;
    }

    // Exibindo os usuários com permissão
    return interaction.reply({
      content,
      ephemeral: true,
    });
  },
};
