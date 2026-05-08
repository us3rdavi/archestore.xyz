const { buildEmbed, buildMainDropdown, buildSubDropdown } = require('../../Functions/ConfigPainelBuilder');
const { Painel, Gerenciar2 } = require('../../Functions/Painel');
const { Emojis } = require('../../DataBaseJson');

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

                // Sistema de formulários — tratado pelo formulariosHandler via deferReply
                if (sub === 'form_create' || sub === 'form_manage') {
                    await interaction.deferReply({ ephemeral: true });
                    const { handleFormAction } = require('./formulariosHandler.js');
                    await handleFormAction(interaction, client, sub);
                    return;
                }

                // Painéis existentes — abrir nova resposta efêmera com o painel
                await interaction.deferReply({ ephemeral: true });

                if (sub === 'loja_produtos') {
                    await Gerenciar2(interaction, client);
                } else {
                    await Painel(interaction, client);
                }
                return;
            }
        } catch (err) {
            console.error('[ConfigDropdown] Erro:', err);
        }
    },
};
