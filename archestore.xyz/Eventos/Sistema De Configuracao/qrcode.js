const Discord = require("discord.js");
const { obterEmoji, Emojis } = require("../../Handler/EmojiFunctions");
const { getPermissions } = require("../../Functions/PermissionsCache");
const { qrcode } = require("../../config.json");

module.exports = {
  name: 'interactionCreate',
  async run(interaction, client) {
    if (!interaction.isButton()) return;
    if (interaction.customId !== 'qrcode-button') return;

    if (qrcode === true) {
      interaction.reply({
        content: `# Assinatura não adquirida\n\n- Parece que você não comprou a assinatura de **alterar logo qr code**, se desejar pode apertar no botão abaixo, ir até nosso servidor e adquirir sua assinatura agora mesmo.`,
        components: [
          new Discord.ActionRowBuilder()
          .addComponents(
            new Discord.ButtonBuilder().setURL(`https://discord.gg/RhSEnADf27`).setLabel(`Adquirir assinatura`).setEmoji(`1238421555600556042`).setStyle(5)
          )
        ],
        ephemeral: true
      });
      return;
    }

    await interaction.deferUpdate();

    const umMinutoEmMilissegundos = 1 * 60 * 1000;
    const timeStamp = Date.now() + umMinutoEmMilissegundos;

    await interaction.followUp({
      content: `Envie imagem do seu qr code abaixo, expira <t:${Math.ceil(timeStamp / 1000)}:R>.`,
      ephemeral: true,
    });

    const attachmentCollector = interaction.channel.createMessageCollector({
      filter: (m) => m.author.id === interaction.user.id,
      time: 120000,
    });

    attachmentCollector.on('collect', async (m) => {
      try {
        if (m.attachments.size > 0) {
          const attachment = m.attachments.first();
          if (attachment.name.endsWith('.png')) {
            const axios = require('axios');
            const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });

            const filePath = await saveAttachmentToFile(response.data);
            await interaction.followUp({ content: `${Emojis ? Emojis.get('confirmed_emoji') : '✅'} QRCode trocado com sucesso!`, ephemeral: true });
          } else {
            await interaction.followUp({ content: `${Emojis ? Emojis.get('negative_emoji') : '❌'} O arquivo precisa ser \`.png\``, ephemeral: true });
          }
        } else {
          await interaction.followUp({ content: `${Emojis ? Emojis.get('negative_emoji') : '❌'} Isso não é uma imagem!`, ephemeral: true });
        }

        m.delete();
        attachmentCollector.stop();
      } catch (error) {
        console.log(error);
        await interaction.followUp({ content: `${Emojis ? Emojis.get('negative_emoji') : '❌'} Erro ao trocar o QRCode.`, ephemeral: true });
        m.delete();
      }
    });

    attachmentCollector.on('end', async () => {
      if (!attachmentCollector.collected.size) {
        interaction.followUp({ content: `${Emojis ? Emojis.get('negative_emoji') : '❌'} Você não enviou uma imagem!`, ephemeral: true });
      }
    });
  },
};

async function saveAttachmentToFile(buffer) {
  const path = require('path');
  const fs = require('fs').promises;
  const directoryName = 'Lib';
  const directoryPath = path.resolve(__dirname, '..', '..', directoryName);

  await fs.mkdir(directoryPath, { recursive: true });

  const filePath = path.join(directoryPath, 'aaaaa.png');
  await fs.writeFile(filePath, Buffer.from(buffer));
  return filePath;
}