const {
    ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { configuracao, Emojis } = require('../DataBaseJson');

async function Gerenciar(interaction, client) {
    try {
        const corPrincipal = configuracao.get('Cores.Principal') || '#5865F2';
        let accentColor = 0x5865F2;
        try { accentColor = parseInt(corPrincipal.replace('#', ''), 16); } catch (e) {}

        const container = new ContainerBuilder();
        container;

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## ${Emojis.get('_settings_emoji')} Definições\n` +
                `Gerencie as configurações gerais do bot.`
            )
        );

        container.addSeparatorComponents(new SeparatorBuilder());

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('configcargos')
                .setLabel('Cargos')
                .setEmoji({ id: '1371593623514124510' })
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('personalizarcanais')
                .setLabel('Canais')
                .setEmoji({ id: '1371593613665894562' })
                .setStyle(2)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('formasdepagamentos')
                .setLabel('Formas de Pagamento')
                .setEmoji({ id: '1371593627477737502' })
                .setStyle(1)
        );

        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('voltar1')
                .setLabel('Menu Principal')
                .setEmoji({ id: '1371593637179297923' })
                .setStyle(2)
        );

        container.addActionRowComponents(row1);
        container.addActionRowComponents(row2);
        container.addActionRowComponents(row3);

        const payload = {
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            embeds: [],
            content: ''
        };

        if (!interaction.message) {
            await interaction.reply({ ...payload, ephemeral: true });
        } else {
            await interaction.update(payload);
        }
    } catch (error) {
        console.error('Erro na função Gerenciar:', error);
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Ocorreu um erro ao carregar as definições.', ephemeral: true });
            }
        } catch (e) {}
    }
}

module.exports = { Gerenciar };
