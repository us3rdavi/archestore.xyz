const {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} = require('discord.js');
const { Emojis } = require('../../DataBaseJson');
const { buildWebhookPanel } = require('../../ComandosSlash/Administracao/webhook.js');

const CV2 = { flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        const cid = interaction.customId;
        if (!cid) return;

        if (interaction.isChannelSelectMenu() && cid === 'webhook_canal_select') {
            const channelId = interaction.values[0];
            const channel   = interaction.guild.channels.cache.get(channelId);
            if (!channel) {
                return interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal não encontrado.`, flags: MessageFlags.Ephemeral });
            }
            await interaction.deferUpdate();
            const c = await buildWebhookPanel(interaction, channel);
            await interaction.editReply({ components: [c], ...CV2 });
            return;
        }

        if (interaction.isButton() && cid.startsWith('webhook_atualizar_')) {
            const channelId = cid.replace('webhook_atualizar_', '');
            const channel   = interaction.guild.channels.cache.get(channelId) || interaction.channel;
            await interaction.deferUpdate();
            const c = await buildWebhookPanel(interaction, channel);
            await interaction.editReply({ components: [c], ...CV2 });
            return;
        }

        if (interaction.isButton() && cid.startsWith('webhook_criar_')) {
            const channelId = cid.replace('webhook_criar_', '');
            const modal = new ModalBuilder()
                .setCustomId(`webhook_modal_criar_${channelId}`)
                .setTitle('Criar Webhook');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('webhook_nome')
                        .setLabel('Nome do Webhook')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setMaxLength(80)
                        .setPlaceholder('Ex: Notificações, Alertas...')
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('webhook_avatar')
                        .setLabel('URL do Avatar (opcional)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                        .setMaxLength(500)
                        .setPlaceholder('https://...')
                )
            );
            return interaction.showModal(modal);
        }

        if (interaction.isModalSubmit() && cid.startsWith('webhook_modal_criar_')) {
            const channelId = cid.replace('webhook_modal_criar_', '');
            const channel   = interaction.guild.channels.cache.get(channelId) || interaction.channel;
            const nome      = interaction.fields.getTextInputValue('webhook_nome');
            const avatarRaw = interaction.fields.getTextInputValue('webhook_avatar') || null;
            const avatar    = avatarRaw && avatarRaw.startsWith('http') ? avatarRaw : undefined;

            try {
                await interaction.deferUpdate();
                const webhook = await channel.createWebhook({ name: nome, avatar });

                const c = new ContainerBuilder();
                c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('confirmed_emoji')} Webhook Criado!\n` +
                    `${Emojis.get('_send_emoji')} **Nome:** ${webhook.name}\n` +
                    `${Emojis.get('information_emoji')} **Canal:** ${channel}\n` +
                    `${Emojis.get('_text_emoji')} **ID:** \`${webhook.id}\`\n\n` +
                    `${Emojis.get('_mail_emoji')} **URL do Webhook:**\n\`\`\`\n${webhook.url}\n\`\`\`\n` +
                    `-# Guarde a URL em local seguro — ela não será exibida novamente.`
                ));
                c.addSeparatorComponents(new SeparatorBuilder());
                c.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`webhook_atualizar_${channel.id}`)
                            .setLabel('Ver webhooks do canal')
                            .setEmoji({ id: '1501803920576745522' })
                            .setStyle(ButtonStyle.Secondary),
                    )
                );
                await interaction.editReply({ components: [c], ...CV2 });
            } catch (err) {
                console.error('[WebhookPainel] Erro ao criar webhook:', err);
                try {
                    const errC = new ContainerBuilder();
                    errC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `${Emojis.get('negative_emoji')} Erro ao criar webhook: ${err.message}`
                    ));
                    await interaction.editReply({ components: [errC], ...CV2 });
                } catch (_) {}
            }
            return;
        }
    },
};
