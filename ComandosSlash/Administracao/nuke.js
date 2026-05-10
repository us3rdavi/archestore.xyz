const {
  Client,
  ApplicationCommandOptionType,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { configuracao } = require('../../Database');
const emojis = require("../../Database/emojis.json");

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
      await interaction.reply({ content: `${Emojis.get('loading_emoji')} Nukando ${channelOption}...`, ephemeral: true });

      const newChannel = await channelOption.clone();

      if (configuracao.get(`AutomaticSettings.SistemaNukar.canais`)?.includes(channelOption.id)) {
        let canais = configuracao.get(`AutomaticSettings.SistemaNukar.canais`);
        let index = canais.indexOf(channelOption.id);
        canais[index] = newChannel.id;
        configuracao.set(`AutomaticSettings.SistemaNukar.canais`, canais);
      }

      const channelToDelete = interaction.guild.channels.cache.get(channelOption.id);
      if (channelToDelete) {
        await channelToDelete.delete();
      }

      await newChannel.send({
        content:
          `${Emojis.get('_ban_emoji')} **Canal nukado** por ${interaction.user}\n` +
          `-# Todas as mensagens foram apagadas e o canal foi recriado.`
      });

    } catch (error) {
      console.error(error);
      try {
        await interaction.followUp({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro ao processar o comando.`, ephemeral: true });
      } catch (err) {
        console.error("Erro ao enviar followUp:", err);
      }
    }
  },
};
