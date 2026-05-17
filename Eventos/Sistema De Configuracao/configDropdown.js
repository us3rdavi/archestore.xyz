const { buildMainPanel, buildSubPanel, getAccentColor } = require('../../Functions/ConfigPainelBuilder');
const { Emojis, tickets } = require('../../Database');
const {
    ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ButtonBuilder, MessageFlags
} = require('discord.js');

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            if (interaction.isStringSelectMenu() && customId.startsWith('config_main_')) {
                const userId = customId.slice('config_main_'.length);
                if (userId !== interaction.user.id) return;
                const category = interaction.values[0];
                await interaction.update({
                    components: [buildSubPanel(userId, category)],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    content: ''
                });
                return;
            }

            if (interaction.isStringSelectMenu() && customId.startsWith('config_sub_')) {
                const userId = customId.slice('config_sub_'.length);
                if (userId !== interaction.user.id) return;
                const sub = interaction.values[0];

                if (sub === 'home') {
                    await interaction.update({
                        components: [buildMainPanel(userId, interaction)],
                        flags: MessageFlags.IsComponentsV2,
                        embeds: [],
                        content: ''
                    });
                    return;
                }

                if (sub === 'form_create' || sub === 'form_manage') {
                    const { handleFormAction } = require('./formulariosHandler.js');
                    await handleFormAction(interaction, client, sub);
                    return;
                }

                if (sub === 'atendimento_config') {
                    const { painelTicket } = require('../../Functions/PainelTickets.js');
                    await painelTicket(interaction, false);
                    return;
                }

                if (sub === 'atendimento_postar') {
                    const funcoes = tickets.get('tickets.funcoes');
                    if (!funcoes || Object.keys(funcoes).length === 0) {
                        const container = new ContainerBuilder();
                        container;
                        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `## ${Emojis.get('_ticket_emoji')} Postar Painel\n` +
                            `${Emojis.get('negative_emoji')} Adicione ao menos uma **Função** antes de postar o painel.\n\n` +
                            `-# Acesse **Configurar Tickets** → **Adicionar Função** primeiro.`
                        ));
                        container.addSeparatorComponents(new SeparatorBuilder());
                        container.addActionRowComponents(new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('voltar1')
                                .setLabel('Menu Principal')
                                .setEmoji({ id: '1501803908589162537' })
                                .setStyle(2)
                        ));
                        await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, content: '', embeds: [] });
                        return;
                    }
                    const container = new ContainerBuilder();
                    container;
                    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('_ticket_emoji')} Postar Painel de Tickets\n` +
                        `Selecione o canal onde deseja postar o painel de abertura de tickets.`
                    ));
                    container.addSeparatorComponents(new SeparatorBuilder());
                    container.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId('canalpostarticket')
                            .setPlaceholder('Selecione o canal...')
                            .setChannelTypes(ChannelType.GuildText)
                    ));
                    container.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('voltar1')
                            .setLabel('Menu Principal')
                            .setEmoji({ id: '1501803908589162537' })
                            .setStyle(2)
                    ));
                    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, content: '', embeds: [] });
                    return;
                }

                if (sub === 'automacoes_msgs') {
                    const { AcoesMsgsAutomatics } = require('../../Functions/ConfigMsgsAutomatics.js');
                    await AcoesMsgsAutomatics(interaction, client);
                    return;
                }

                if (sub === 'automacoes_repost') {
                    const { AcoesRepostAutomatics } = require('../../Functions/ConfigRepostAuto.js');
                    await AcoesRepostAutomatics(interaction, client);
                    return;
                }

                if (sub === 'moderacao_config') {
                    const { AcoesAutomaticsConfigs } = require('../../Functions/AcoesAutomatics.js');
                    await AcoesAutomaticsConfigs(interaction, client);
                    return;
                }

                if (sub === 'personalizacao_designer') {
                    const container = new ContainerBuilder();
                    container;
                    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('_pincel_emoji')} Meu Bot Designer\n` +
                        `Personalize a aparência e identidade do **${client.user.username}**.`
                    ));
                    container.addSeparatorComponents(new SeparatorBuilder());
                    container.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('personalizarbot')
                            .setLabel('Editar Perfil')
                            .setEmoji({ id: '1501804122943389716' })
                            .setStyle(1),
                        new ButtonBuilder()
                            .setCustomId('coresembeds')
                            .setLabel('Cores dos Embeds')
                            .setEmoji({ id: '1501804003850322052' })
                            .setStyle(2)
                    ));
                    container.addActionRowComponents(new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('voltar1')
                            .setLabel('Menu Principal')
                            .setEmoji({ id: '1501803908589162537' })
                            .setStyle(2)
                    ));
                    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, content: '', embeds: [] });
                    return;
                }

                if (sub === 'personalizacao_def') {
                    const { Gerenciar } = require('../../Functions/Gerenciar.js');
                    await Gerenciar(interaction, client);
                    return;
                }

                if (sub === 'definicoes_gerais') {
                    const { Gerenciar } = require('../../Functions/Gerenciar.js');
                    await Gerenciar(interaction, client);
                    return;
                }

                if (sub === 'definicoes_moeda') {
                    await interaction.deferUpdate();
                    const { moedaConfig } = require('../../Functions/moedaConfig.js');
                    await moedaConfig(interaction, client);
                    return;
                }

                if (sub === 'definicoes_auditlog') {
                    const { showAuditLogPanel } = require('./auditLogConfig.js');
                    await showAuditLogPanel(interaction, client);
                    return;
                }
            }
        } catch (err) {
            if (err.code === 10062) return;
            console.error('[ConfigDropdown] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `Ocorreu um erro ao processar sua seleção.`, ephemeral: true });
                }
            } catch (e) { if (e.code !== 10062) console.error('[ConfigDropdown] Erro ao responder:', e.message); }
        }
    },
};
