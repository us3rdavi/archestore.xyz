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
    description: 'Configura e posta um card de compra no canal (somente staff).',
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

        await interaction.deferReply({ ephemeral: true });

        const loadingContainer = new ContainerBuilder().setAccentColor(getAccentColor());
        loadingContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Carregando produtos da CentralCart...`)
        );
        await interaction.editReply({
            components: [loadingContainer],
            flags: MessageFlags.IsComponentsV2,
            embeds: [],
            content: '',
        });

        try {
            const res = await centralCart.listPackages();
            const pacotes = (res.data || res || []).filter(p => p.enabled !== false);

            if (!pacotes.length) {
                const vazio = new ContainerBuilder().setAccentColor(0xED4245);
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
                    `## ${Emojis.get('_settings_emoji')} Configuração — Anunciar Produto\n` +
                    `-# Selecione o produto ou package que deseja postar no canal.`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `-# Esta mensagem é visível apenas para você. Após configurar, o card de compra será postado publicamente.`
                )
            );

            const chunks = [];
            for (let i = 0; i < pacotes.length; i += 25) {
                chunks.push(pacotes.slice(i, i + 25));
            }

            for (let idx = 0; idx < Math.min(chunks.length, 5); idx++) {
                const chunk = chunks[idx];
                const select = new StringSelectMenuBuilder()
                    .setCustomId(`ap_cfg_select_${idx}`)
                    .setPlaceholder(chunks.length > 1 ? `[${idx + 1}] Selecione um produto` : 'Selecione um produto para anunciar')
                    .addOptions(
                        chunk.map(p => ({
                            label: (p.name || 'Produto').slice(0, 100),
                            description: (p.is_variation_parent ? `📦 Package — ${p.price_display || 'Ver variantes'}` : (p.price_display || (p.price != null ? `R$ ${p.price}` : 'Ver detalhes'))).slice(0, 100),
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
            const errContainer = new ContainerBuilder().setAccentColor(0xED4245);
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
