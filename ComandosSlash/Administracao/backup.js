const {
    PermissionFlagsBits,
    ApplicationCommandType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
} = require("discord.js");
const { configuracao, Emojis } = require("../../Database");

let BackupStorage;
try {
    BackupStorage = require("../../Database").BackupStorage;
} catch (_) {}

module.exports = {
    name: "realizar_backup",
    description: "Moderação - Gerenciamento de backup do servidor.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,
    BackupFunction,

    run: async (client, interaction) => {
        if (interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({
                flags: MessageFlags.Ephemeral,
                content: `${Emojis.get('negative_emoji')} Apenas o dono do servidor pode usar este comando.`,
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        await BackupFunction(client, interaction);
    }
};

async function BackupFunction(client, interaction) {
    const hasBackup = BackupStorage &&
        typeof BackupStorage.fetchAll === "function" &&
        Object.keys(BackupStorage.fetchAll() || {}).length > 0;

    let backupInfoText = '';
    if (hasBackup) {
        const backups = BackupStorage.fetchAll();
        const keys = Object.keys(backups);
        backupInfoText = `${Emojis.get('confirmed_emoji')} **${keys.length}** backup(s) salvo(s) na nuvem.\n`;
        const latest = backups[keys[0]];
        if (latest?.data?.[0]) {
            const b = latest.data[0];
            backupInfoText +=
                `> ${Emojis.get('ecloud_emoji')} **${b.name}**\n` +
                `-# Canais: \`${b.channels?.length ?? 0}\` · Cargos: \`${b.roles?.length ?? 0}\` · Emojis: \`${b.emojis?.length ?? 0}\``;
        }
    } else {
        backupInfoText =
            `${Emojis.get('negative_emoji')} Nenhum backup salvo ainda.\n` +
            `-# Use **Sincronizar** para criar o primeiro backup do servidor.`;
    }

    const userName = interaction.member?.displayName
        || interaction.user?.displayName
        || interaction.user?.username
        || 'Administrador';

    const c = new ContainerBuilder();

    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('ecloud_emoji')} Backup do Servidor\n` +
        `**${userName}** · Owner\n\n` +
        `${Emojis.get('information_emoji')} Gerencie os backups e dados do servidor abaixo.\n` +
        `-# Apenas o dono do servidor pode realizar alterações.`
    ));

    c.addSeparatorComponents(new SeparatorBuilder());

    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${Emojis.get('confirmed_backup_emoji')} **Status do Backup**\n${backupInfoText}`
    ));

    c.addSeparatorComponents(new SeparatorBuilder());

    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${Emojis.get('_transfer_emoji')} **Restaurar** — restaura canais, cargos e configurações de um backup\n` +
        `${Emojis.get('_mail_emoji')} **Salvar template** — salva a estrutura atual como template\n` +
        `${Emojis.get('_change_emoji')} **Sincronizar** — cria/atualiza o backup do servidor agora\n` +
        `${Emojis.get('_trash_emoji')} **Apagar backup** — remove um backup salvo`
    ));

    c.addSeparatorComponents(new SeparatorBuilder());

    c.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('restaurarservidor')
                .setLabel('Restaurar servidor')
                .setEmoji({ id: '1501803997583904810' })
                .setDisabled(!hasBackup)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('salvartemplate')
                .setLabel('Salvar template')
                .setEmoji({ id: '1501804125631811674' })
                .setStyle(ButtonStyle.Secondary),
        )
    );

    c.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('sincronizardados')
                .setLabel('Sincronizar dados')
                .setEmoji({ id: '1501803920576745522' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('apagarbackup')
                .setLabel('Apagar backup')
                .setEmoji({ id: '1501803926180335727' })
                .setDisabled(!hasBackup)
                .setStyle(ButtonStyle.Danger),
        )
    );

    const payload = {
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        components: [c],
    };

    try {
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply(payload);
        } else {
            await interaction.reply(payload);
        }
    } catch (err) {
        console.error('[Backup] Erro ao renderizar painel:', err);
    }
}
