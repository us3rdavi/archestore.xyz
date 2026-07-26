'use strict';

const {
    ApplicationCommandOptionType,
    ActionRowBuilder, StringSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { configuracao, Emojis } = require('../../Database');
const { hasPermission } = require('../../Functions/PermissionsCache');

module.exports = {
    name: 'postarvendas',
    description: 'Posta o painel de vendas com dropdown de produtos em um canal.',
    options: [
        {
            name: 'canal',
            description: 'Canal onde o painel de vendas será postado.',
            type: ApplicationCommandOptionType.Channel,
            required: true,
        },
    ],

    run: async (interaction, client) => {
        // Verifica permissão
        if (!hasPermission(interaction.user.id) && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Você não tem permissão para usar este comando.`, ephemeral: true });
        }

        const secoes = configuracao.get('vendas.secoes') || [];
        if (secoes.length === 0) {
            return interaction.reply({
                content: `${Emojis.get('negative_emoji')} Nenhuma seção configurada no dropdown de vendas. Acesse \`/config\` → **Vendas** → **Dropdown de Produtos** para adicionar seções.`,
                ephemeral: true,
            });
        }

        const channel = interaction.options.getChannel('canal');
        if (!channel) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Canal não encontrado.`, ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        try {
            const options = secoes.slice(0, 25).map(s => ({
                label: s.nome.slice(0, 100),
                value: `vnd_${s.id}`,
                description: (s.descricao || '').slice(0, 100) || undefined,
                ...(s.emoji ? { emoji: { id: s.emoji } } : {}),
            }));

            const container = new ContainerBuilder();
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `## ${Emojis.get('store_emoji')} Loja\n` +
                `Selecione um produto abaixo para iniciar sua compra.\n` +
                `-# Pagamento via PIX automático — confirmação instantânea.`
            ));
            container.addSeparatorComponents(new SeparatorBuilder());
            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('vnd_comprar_select')
                        .setPlaceholder('Selecione um produto...')
                        .addOptions(options)
                )
            );

            await channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });

            await interaction.editReply({
                content: `${Emojis.get('confirmed_emoji')} Painel de vendas postado em <#${channel.id}> com **${secoes.length}** produto(s).`,
            });
        } catch (err) {
            console.error('[postarvendas] Erro:', err);
            await interaction.editReply({ content: `${Emojis.get('negative_emoji')} Erro ao postar o painel: ${err.message}` });
        }
    },
};
