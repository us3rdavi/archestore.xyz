const {
  Client,
  ApplicationCommandOptionType,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { configuracao } = require('../../DataBaseJson/index.js');
const emojis = require("../../DataBaseJson/Emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

module.exports = {
  name: 'nuke',
  description:'Nuke a channel',
  options: [
    {
      name: 'channel',
      description:'The channel to nuke',
      type: ApplicationCommandOptionType.Channel,
      required: false,
      channelTypes: [ChannelType.GuildText],
    },
  ],
  default_member_permissions: PermissionFlagsBits.Administrator,

  run: async (client, interaction) => {
    const perm = await getPermissions(client.user.id);
    if (perm === null || !perm.includes(interaction.user.id)) {
        return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
    }

    const channelOption = interaction.options.getChannel('channel') || interaction.channel;

    if (!channelOption || !channelOption.isTextBased()) {
        return interaction.reply({ content: 'Você deve selecionar um canal de texto para ser nukado.', ephemeral: true });
    }

    try {
      // Responder imediatamente para evitar o erro de "Unknown interaction"
      await interaction.reply({ content: `Nukando o canal...`, ephemeral: true });

      const newChannel = await channelOption.clone();

      // Atualiza a configuração se necessário
      if (configuracao.get(`AutomaticSettings.SistemaNukar.canais`)?.includes(channelOption.id)) {
        let canais = configuracao.get(`AutomaticSettings.SistemaNukar.canais`);
        let index = canais.indexOf(channelOption.id);
        canais[index] = newChannel.id;
        configuracao.set(`AutomaticSettings.SistemaNukar.canais`, canais);
      }

      // Verifica se o canal ainda existe antes de deletar
      const channelToDelete = interaction.guild.channels.cache.get(channelOption.id);
      if (channelToDelete) {
        await channelToDelete.delete();
      }

      await newChannel.send({ content: `Nuked by \`${interaction.user.username}\`` });

    } catch (error) {
      console.error(error);
      try {
        await interaction.followUp({ content: 'Ocorreu um erro ao processar o comando.', ephemeral: true });
      } catch (err) {
        console.error("Erro ao enviar followUp:", err);
      }
    }
  },
};
