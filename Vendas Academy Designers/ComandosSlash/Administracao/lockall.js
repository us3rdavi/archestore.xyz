const Discord = require("discord.js");

module.exports = {
    name: "lockall",
    description: "[🔒] da Lock Em Todos os Canais.",
    type: Discord.ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        // Verifica se o membro tem permissão de Administrador
        if (!interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: `🚫 | Você não tem permissão para usar este comando. Apenas administradores podem acessá-lo.`,
                ephemeral: true
            });
        }

        const guild = interaction.guild;

        try {
            // Notifica o início do processo
            await interaction.reply({
                content: `🔒 | Iniciando o bloqueio de todos os canais. Isso pode levar alguns segundos.`,
                ephemeral: true
            });

            // Log para o console
            console.log(`Bloqueio de canais iniciado por ${interaction.user.tag} no servidor ${guild.name} (${guild.id}).`);

            const canaisTexto = guild.channels.cache.filter(
                (canal) => canal.type === Discord.ChannelType.GuildText
            );

            for (const [id, canal] of canaisTexto) {
                await canal.permissionOverwrites.edit(guild.roles.everyone, {
                    SendMessages: false
                });
                console.log(`🔒 Canal bloqueado: ${canal.name} (${id})`);
            }

            // Envia a confirmação ao usuário
            interaction.editReply({
                content: `✅ | Todos os canais de texto foram bloqueados com sucesso!`
            });

            // Log para o console
            console.log(`Todos os canais foram bloqueados no servidor ${guild.name}.`);
        } catch (error) {
            console.error(`Erro ao bloquear canais no servidor ${guild.name}:`, error);

            // Notifica o usuário em caso de erro
            interaction.editReply({
                content: `❗ | Ocorreu um erro ao tentar bloquear os canais. Verifique as permissões do bot e tente novamente.`
            });
        }
    }
};
