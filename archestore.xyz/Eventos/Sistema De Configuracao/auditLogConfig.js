const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, ChannelType,
    MessageFlags
} = require('discord.js');
const { configuracao, Emojis } = require('../../DataBaseJson');

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function showAuditLogPanel(interaction, client) {
    const channelId = configuracao.get('auditlog.channel');
    const enabled = !!channelId;

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('system_emoji')} Log de Auditoria\n` +
            `Registre automaticamente todas as ações de configuração realizadas no bot em um canal dedicado.\n\n` +
            `${Emojis.get('_camp_emoji')} **Canal atual:** ${channelId ? `<#${channelId}>` : '`Nenhum configurado`'}\n` +
            `${enabled ? Emojis.get('confirmed_emoji') : Emojis.get('negative_emoji')} **Status:** ${enabled ? '`Ativo`' : '`Inativo`'}\n\n` +
            `-# Selecione um canal de texto abaixo para ativar o log de auditoria.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('setauditlogchannel')
                .setPlaceholder('Selecione o canal de log de auditoria...')
                .setChannelTypes(ChannelType.GuildText)
        )
    );

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('removeauditlogchannel')
                .setLabel('Remover Canal')
                .setEmoji({ id: '1371593634029371432' })
                .setStyle(4)
                .setDisabled(!enabled),
            new ButtonBuilder()
                .setCustomId('voltar1')
                .setLabel('Menu Principal')
                .setEmoji({ id: '1371593637179297923' })
                .setStyle(2)
        )
    );

    const payload = {
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        embeds: [],
        content: ''
    };

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
    } else {
        await interaction.update(payload);
    }
}

module.exports = {
    name: 'interactionCreate',
    showAuditLogPanel,
    run: async (interaction, client) => {
        try {
            if (interaction.isChannelSelectMenu() && interaction.customId === 'setauditlogchannel') {
                const channelId = interaction.values[0];
                configuracao.set('auditlog.channel', channelId);
                await showAuditLogPanel(interaction, client);
                await interaction.followUp({
                    content: `${Emojis.get('confirmed_emoji')} Canal de auditoria definido para <#${channelId}>!`,
                    ephemeral: true
                });
                const { logAction } = require('../../Functions/AuditLog.js');
                await logAction(client, {
                    action: 'Log de Auditoria configurado',
                    details: `Canal <#${channelId}> definido como canal de log`,
                    userId: interaction.user.id,
                    guildId: interaction.guildId
                });
                return;
            }

            if (interaction.isButton() && interaction.customId === 'removeauditlogchannel') {
                configuracao.delete('auditlog.channel');
                await showAuditLogPanel(interaction, client);
                await interaction.followUp({
                    content: `${Emojis.get('confirmed_emoji')} Canal de auditoria removido com sucesso.`,
                    ephemeral: true
                });
                return;
            }
        } catch (err) {
            console.error('[AuditLogConfig] Erro:', err);
        }
    }
};
