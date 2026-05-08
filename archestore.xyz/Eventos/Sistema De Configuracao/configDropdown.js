const { buildEmbed, buildMainDropdown, buildSubDropdown, getAccentColor } = require('../../Functions/ConfigPainelBuilder');
const { Emojis, tickets, configuracao } = require('../../DataBaseJson');
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

            // Nível 1: seleção de categoria principal
            if (interaction.isStringSelectMenu() && customId.startsWith('config_main_')) {
                const userId = customId.slice('config_main_'.length);
                if (userId !== interaction.user.id) return;

                const category = interaction.values[0];
                const embed = buildEmbed(interaction, client);

                await interaction.update({
                    embeds: [embed],
                    components: [buildSubDropdown(userId, category)],
                });
                return;
            }

            // Nível 2: seleção de sub-opção
            if (interaction.isStringSelectMenu() && customId.startsWith('config_sub_')) {
                const userId = customId.slice('config_sub_'.length);
                if (userId !== interaction.user.id) return;

                const sub = interaction.values[0];

                // Voltar ao menu principal
                if (sub === 'home') {
                    const embed = buildEmbed(interaction, client);
                    await interaction.update({
                        embeds: [embed],
                        components: [buildMainDropdown(userId)],
                    });
                    return;
                }

                // Sistema de formulários — ephemeral separado
                if (sub === 'form_create' || sub === 'form_manage') {
                    await interaction.deferReply({ ephemeral: true });
                    const { handleFormAction } = require('./formulariosHandler.js');
                    await handleFormAction(interaction, client, sub);
                    return;
                }

                // --- ATENDIMENTO ---
                if (sub === 'atendimento_config') {
                    const { painelTicket } = require('../../Functions/PainelTickets.js');
                    await painelTicket(interaction, false);
                    return;
                }

                if (sub === 'atendimento_postar') {
                    const funcoes = tickets.get('tickets.funcoes');
                    const aparencia = tickets.get('tickets.aparencia');
                    if (!funcoes || Object.keys(funcoes).length === 0 || !aparencia || Object.keys(aparencia).length === 0) {
                        await interaction.deferUpdate();
                        const container = new ContainerBuilder();
                        container.setAccentColor(getAccentColor());
                        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `## ${Emojis.get('_ticket_emoji')} Postar Painel\n` +
                            `${Emojis.get('negative_emoji')} Configure as funções e aparência do ticket antes de postar.\n\n` +
                            `-# Acesse **Configurar Tickets** primeiro.`
                        ));
                        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, content: '', embeds: [] });
                        return;
                    }
                    const selectCanal = new ChannelSelectMenuBuilder()
                        .setCustomId('canalpostarticket')
                        .setPlaceholder('Selecione o canal para postar o painel de tickets')
                        .setChannelTypes(ChannelType.GuildText);
                    await interaction.update({
                        content: `${Emojis.get('_ticket_emoji')} Selecione o canal onde quer postar o painel de tickets.`,
                        components: [new ActionRowBuilder().addComponents(selectCanal)],
                        embeds: []
                    });
                    return;
                }

                // --- PROTEÇÃO ---
                if (sub === 'protecao_config') {
                    const { Avançados } = require('../../Functions/Avancados.js');
                    await Avançados(interaction, client);
                    return;
                }

                // --- AUTOMAÇÕES ---
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

                // --- MODERAÇÃO ---
                if (sub === 'moderacao_config') {
                    const { AcoesAutomaticsConfigs } = require('../../Functions/AcoesAutomatics.js');
                    await AcoesAutomaticsConfigs(interaction, client);
                    return;
                }

                // --- PERSONALIZAÇÃO ---
                if (sub === 'personalizacao_designer') {
                    const container = new ContainerBuilder();
                    container.setAccentColor(getAccentColor());
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
                            .setStyle(2),
                    ));
                    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, content: '', embeds: [] });
                    return;
                }

                if (sub === 'personalizacao_def') {
                    const { Gerenciar } = require('../../Functions/Gerenciar.js');
                    await Gerenciar(interaction, client);
                    return;
                }

                // --- PERMISSÕES ---
                if (sub === 'permissoes_config') {
                    await interaction.deferUpdate();
                    const { gerenciarPerms } = require('../../Functions/modUsersPerms.js');
                    await gerenciarPerms(interaction, client);
                    return;
                }

                // --- DEFINIÇÕES ---
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
            }
        } catch (err) {
            console.error('[ConfigDropdown] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `Ocorreu um erro ao processar sua seleção.`, ephemeral: true });
                }
            } catch (e) {}
        }
    },
};
