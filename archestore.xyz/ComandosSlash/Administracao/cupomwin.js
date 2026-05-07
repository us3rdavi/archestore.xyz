const Discord = require("discord.js");
const { PermissionFlagsBits } = require("discord.js");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
  name: "set_cupom",
  description:"Envia um cupom de desconto",
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description:"Usuário a quem enviar o cupom",
      type: Discord.ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "cupom",
      description:"Código do cupom de desconto",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "canal",
      description:"Canal do produto para direcionar ao clicar em'Comprar agora'",
      type: Discord.ApplicationCommandOptionType.Channel,
      required: true,
    },
  ],
  default_member_permissions: PermissionFlagsBits.Administrator,

  run: async (client, interaction) => {
    const user = interaction.options.getUser('user');
    const cupom = interaction.options.getString('cupom');
    const channel = interaction.options.getChannel('canal');
    
    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content:  `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
    }

    const embed = new Discord.EmbedBuilder()
      .setColor('#8b008b')
      .setTitle('**Parabéns!** Você ganhou um cupom de **desconto!**')
      .setDescription(`${user} Você foi **selecionado(a)** automáticamente pelo sistema para receber um cupom **exclusivo!**\n\n**Cupom:** \`${cupom}\`\n**Aproveite para realizar sua compra agora mesmo!**`)
      .addFields({ name: 'Válido somente para o produto:', value: `<#${channel.id}>` })
      .setTimestamp()
      .setFooter({ text: 'Aproveite seu cupom antes que expire!' });

    const row = new Discord.ActionRowBuilder()
      .addComponents(
        new Discord.ButtonBuilder()
          .setLabel('Aproveitar Cupom!')
          .setEmoji("<:pinkglitter:1347324419210608640>")
          .setStyle(Discord.ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
      );

    user.send({ embeds: [embed], components: [row] })
      .then(async () => {
        interaction.reply({ content: `${Emojis.get(`confirmed_emoji`)} **Cupom** enviado com sucesso para ${user.tag}!`, ephemeral: true });
      })
      .catch(async error => {
        interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Erro ao enviar o **cupom:** ${error.message}`, ephemeral: true });
      });
  }
};
