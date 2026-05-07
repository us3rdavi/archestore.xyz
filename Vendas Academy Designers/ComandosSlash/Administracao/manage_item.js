const { PermissionFlagsBits, EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const { GerenciarCampos2 } = require("../../Functions/GerenciarCampos");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../DataBaseJson");
const db = new QuickDB();

module.exports = {
  name: "gerenciar_item",
  description: "[🤖] Use para configurar minhas funções",
  type: ApplicationCommandType.ChatInput,
  options: [{ name: "item", description: "-", type: 3, required: true, autocomplete: true }],
  default_member_permissions: PermissionFlagsBits.Administrator,


  run: async (client, interaction, message) => {

    const perm = await getPermissions(client.user.id)
    if (perm === null || !perm.includes(interaction.user.id)) {
      return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
    }

    if (interaction.options._hoistedOptions[0].value == 'nada') return interaction.reply({ content: `Nenhum item registrado em seu BOT`, ephemeral: true })


    const separarpor_ = interaction.options._hoistedOptions[0].value.split('_')
    const produtoname = separarpor_[0]
    const camponame = separarpor_[1]

    GerenciarCampos2(interaction, camponame, produtoname)



  }
}
