const { PermissionFlagsBits, EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { GerenciarCampos } = require("../../Functions/GerenciarCampos");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const Discord = require("discord.js");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
  name: "fechar_ticket",
  description:"Use para fechar um ticket",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "reason",
      description:"-",
      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
  ],
  default_member_permissions: PermissionFlagsBits.Administrator,

  run: async (client, interaction, message) => {

    const perm = await getPermissions(client.user.id)
    if (perm === null || !perm.includes(interaction.user.id)) {
      return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
    }


    const reasonaaa = interaction.options.getString('reason')


    if (interaction.channel.isThread()) {
      const ultimoIndice = interaction.channel.name.lastIndexOf('・');
      const ultimosNumeros = interaction.channel.name.slice(ultimoIndice + 1);
      await interaction.channel.delete()
      try {
        const user = await client.users.fetch(ultimosNumeros)
        await user.send({content:`Olá <@!${ultimosNumeros}> seu ticket foi fechado por ${interaction.user}.\n**Motivo:**\n${reasonaaa == null ? `Nenhum motivo declarado!` : reasonaaa}`})
      } catch (error) {
        
      }
    } else {
      interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Esse canal não é um ticket.`, ephemeral: true })
    }


  }
}
