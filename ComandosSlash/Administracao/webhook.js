const {
    ApplicationCommandType,
    PermissionFlagsBits,
    ChannelType,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    MessageFlags,
} = require('discord.js');
const { Emojis } = require('../../Database');

async function buildWebhookPanel(interaction, channel) {
    const ch = channel || interaction.channel;
    let webhookCount = 0;
    let webhookLines = '';

    try {
        const hooks = await ch.fetchWebhooks();
        webhookCount = hooks.size;
        if (webhookCount > 0) {
            webhookLines = '\n' + hooks.map(h =>
                `> ${Emojis.get('_send_emoji')} **${h.name}** — \`${h.id}\``
            ).join('\n');
        }
    } catch (_) {}

    const userName = interaction.member?.displayName
        || interaction.user?.displayName
        || interaction.user?.username;

    const c = new ContainerBuilder();

    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_send_emoji')} Gerenciar Webhooks\n` +
        `**${userName}** · Owner\n\n` +
        `${Emojis.get('information_emoji')} Configure e crie webhooks nos canais do servidor.\n` +
        `-# Apenas usuários autorizados podem gerenciar webhooks.`
    ));

    c.addSeparatorComponents(new SeparatorBuilder());

    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${Emojis.get('_messages_emoji')} **Canal selecionado:** ${ch}\n` +
        `${Emojis.get('information_emoji')} **Webhooks existentes:** \`${webhookCount}\`` +
        (webhookCount > 0 ? webhookLines : `\n-# Nenhum webhook neste canal ainda.`)
    ));

    c.addSeparatorComponents(new SeparatorBuilder());

    c.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`webhook_criar_${ch.id}`)
                .setLabel('Criar Webhook')
                .setEmoji({ id: '1501803905363869769' })
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`webhook_atualizar_${ch.id}`)
                .setLabel('Atualizar')
                .setEmoji({ id: '1501803920576745522' })
                .setStyle(ButtonStyle.Secondary),
        )
    );

    c.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('webhook_canal_select')
                .setPlaceholder('Mudar canal...')
                .setChannelTypes(ChannelType.GuildText)
        )
    );

    return c;
}

module.exports = {
    name: 'criarwebhook',
    description: 'Gerencia e cria webhooks nos canais do servidor.',
    type: ApplicationCommandType.ChatInput,
    buildWebhookPanel,

    run: async (client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const c = await buildWebhookPanel(interaction, interaction.channel);
        await interaction.editReply({
            components: [c],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
