const {
    ApplicationCommandType,
    PermissionFlagsBits,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    MessageFlags,
} = require('discord.js');
const { configuracao, Emojis } = require('../../DataBaseJson');
const { getPermissions } = require('../../Functions/PermissionsCache');
const centralCart = require('../../Functions/centralCartService');

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

module.exports = {
    name: 'anunciarproduto',
    description: 'Publica uma mensagem de loja com seleção de produtos da CentralCart.',
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({
                content: `${Emojis.get('negative_emoji')} Você não possui permissão para usar esse comando.`,
                ephemeral: true,
            });
        }

        await interaction.deferReply({ ephemeral: false });

        const loadingContainer = new ContainerBuilder().setAccentColor(getAccentColor());
        loadingContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Carregando produtos da loja...`)
        );
        await interaction.editReply({
            components: [loadingContainer],
            flags: MessageFlags.IsComponentsV2,
            embeds: [],
            content: '',
        });

        try {
            const res = await centralCart.listPackages({ all: true });
            const pacotes = (res.data || res || []).filter(p => p.enabled !== false);

            if (!pacotes.length) {
                const vazio = new ContainerBuilder().setAccentColor(getAccentColor());
                vazio.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${Emojis.get('negative_emoji')} Nenhum produto disponível na loja no momento.`
                    )
                );
                return interaction.editReply({
                    components: [vazio],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    content: '',
                });
            }

            const container = new ContainerBuilder().setAccentColor(getAccentColor());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('store_emoji')} Loja\n` +
                    `-# Selecione um produto abaixo para iniciar sua compra.`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            const chunks = [];
            for (let i = 0; i < pacotes.length; i += 25) {
                chunks.push(pacotes.slice(i, i + 25));
            }

            for (let idx = 0; idx < Math.min(chunks.length, 5); idx++) {
                const chunk = chunks[idx];
                const select = new StringSelectMenuBuilder()
                    .setCustomId(`ap_selecionar_${idx}`)
                    .setPlaceholder(chunks.length > 1 ? `[${idx + 1}] Selecione um produto` : 'Selecione um produto')
                    .addOptions(
                        chunk.map(p => ({
                            label: (p.name || 'Produto').slice(0, 100),
                            description: (p.formatted_price || `R$ ${p.price}`).slice(0, 100),
                            value: String(p.id),
                        }))
                    );

                container.addActionRowComponents(
                    new ActionRowBuilder().addComponents(select)
                );
            }

            await interaction.editReply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                content: '',
            });

        } catch (err) {
            const errContainer = new ContainerBuilder().setAccentColor(getAccentColor());
            errContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${Emojis.get('negative_emoji')} Erro ao carregar produtos: \`${err.message}\``
                )
            );
            await interaction.editReply({
                components: [errContainer],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                content: '',
            });
        }
    },
};
