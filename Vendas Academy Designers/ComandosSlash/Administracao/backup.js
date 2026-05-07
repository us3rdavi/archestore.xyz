const { PermissionFlagsBits, EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ComponentType } = require("discord.js");
const { pedidos, pagamentos, carrinhos, configuracao, produtos, Temporario, BackupStorage } = require("../../DataBaseJson");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
    name: "realizar_backup",
    description: "[🤖 Moderação] Guild backup options.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,
    BackupFunction,
    
    run: async (client, interaction, message) => {
        await interaction.reply({ content: `${Emojis.get(`loading_emoji`)} Aguarde...`, ephemeral: true });
        
        // Verifica se o usuário é o dono do servidor
        if (interaction.guild.ownerId !== interaction.user.id) {
            return interaction.editReply({ 
                content: `${Emojis.get(`negative_emoji`)} Apenas o dono do servidor pode usar este comando.`, 
                ephemeral: true 
            });
        }
        
        BackupFunction(client, interaction);
    }
}

async function BackupFunction(client, interaction) {
    // Verifica se BackupStorage está definido e tem o método fetchAll
    const hasBackup = BackupStorage && typeof BackupStorage.fetchAll === "function" && BackupStorage.fetchAll()?.length > 0;

    const botao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('restaurarservidor')
            .setLabel('Restaurar servidor')
            .setEmoji(`${Emojis.get(`_transfer_emoji`)}`)
            .setDisabled(!hasBackup) // Desabilita se não houver backups
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId('salvartemplate')
            .setLabel('Salvar template')
            .setEmoji(`${Emojis.get(`_mail_emoji`)}`)
            .setStyle(2),
    );

    const botao2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('sincronizardados')
            .setLabel('Sincronizar')
            .setEmoji(`${Emojis.get(`_change_emoji`)}`)
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('apagarbackup')
            .setLabel('Apagar Backup')
            .setEmoji(`${Emojis.get(`_trash_emoji`)}`)
            .setDisabled(!hasBackup) // Desabilita se não houver backups
            .setStyle(4),
    );

    await interaction.editReply({ content: ``, components: [botao, botao2], ephemeral: true });
}
