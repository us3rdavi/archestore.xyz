const Discord = require("discord.js");
const config = require("../../config.json");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
    name: "say",
    description: "[🤖] Enviar Mensagem",
    type: Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'texto',
            description: 'O que deseja enviar?',
            type: Discord.ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {  // Corrigido 'Client' para 'client'
        const perm = await getPermissions(client.user.id);  // Corrigido 'Client' para 'client'
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `❌️ Você não possui permissão para usar esse comando.`, ephemeral: true });
        } else {
            let dados = interaction.options.getString('texto');
            await interaction.reply({ content: `✅️ Mensagem enviada com êxito. Verifique agora mesmo!`, ephemeral: true });
            await interaction.channel.send({ content: `${dados}` });  // Corrigido para 'await'
            setTimeout(() => { interaction.deleteReply(); }, 5000);
        }
    }
};
