const Discord = require("discord.js");
const { hasPermission } = require("../../Functions/PermissionsCache.js");
const emojis = require("../../Database/emojis.json");
const Emojis = { get: (name) => emojis[name] || "" };

module.exports = {
    name: "say",
    description: "Enviar Mensagem",
    type: Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'texto',
            description: 'O que deseja enviar?',
            type: Discord.ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        if (!hasPermission(interaction.user.id)) {
            return interaction.reply({
                content: `${Emojis.get('negative_emoji')} Você não possui permissão para usar esse comando.`,
                ephemeral: true
            });
        }

        let dados = interaction.options.getString('texto');
        await interaction.reply({ content: `${Emojis.get('confirmed_emoji')} Mensagem enviada com êxito. Verifique agora mesmo!`, ephemeral: true });
        await interaction.channel.send({ content: `${dados}` });
        setTimeout(() => { interaction.deleteReply(); }, 5000);
    }
};
