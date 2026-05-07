const Discord = require("discord.js");
const emojis = require("../../DataBaseJson/Emojis.json");
const Emojis = { get: (name) => emojis[name] || "" };

module.exports = {
    name: "lockall",
    description:"da Lock Em Todos os Canais.",
    type: Discord.ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: `${Emojis.get('_ban_emoji')} Você não tem permissão para usar este comando. Apenas administradores podem acessá-lo.`,
                ephemeral: true
            });
        }

        const guild = interaction.guild;

        try {
            await interaction.reply({
                content: `${Emojis.get('loading_emoji')} Iniciando o bloqueio de todos os canais. Isso pode levar alguns segundos.`,
                ephemeral: true
            });

            console.log(`Bloqueio de canais iniciado por ${interaction.user.tag} no servidor ${guild.name} (${guild.id}).`);

            const canaisTexto = guild.channels.cache.filter(
                (canal) => canal.type === Discord.ChannelType.GuildText
            );

            for (const [id, canal] of canaisTexto) {
                await canal.permissionOverwrites.edit(guild.roles.everyone, {
                    SendMessages: false
                });
                console.log(`[LOG] Canal bloqueado: ${canal.name} (${id})`);
            }

            interaction.editReply({
                content: `${Emojis.get('confirmed_emoji')} Todos os canais de texto foram bloqueados com sucesso!`
            });

            console.log(`Todos os canais foram bloqueados no servidor ${guild.name}.`);
        } catch (error) {
            console.error(`Erro ao bloquear canais no servidor ${guild.name}:`, error);

            interaction.editReply({
                content: `${Emojis.get('warn_emoji')} Ocorreu um erro ao tentar bloquear os canais. Verifique as permissões do bot e tente novamente.`
            });
        }
    }
};
