const {
    ApplicationCommandType, PermissionFlagsBits,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../../DataBaseJson");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { listPackages } = require("../../Functions/CentralCartAPI");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

module.exports = {
    name: "cc_produtos",
    description: "Lista os produtos da sua loja CentralCart.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,
    options: [
        { name: "busca", description: "Buscar produto por nome", type: 3, required: false },
    ],

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const busca = interaction.options.getString("busca");

        const loading = new ContainerBuilder().setAccentColor(getAccentColor());
        loading.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Carregando produtos...`));
        await interaction.editReply({ components: [loading], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

        try {
            const res = await listPackages({ search: busca || null });
            const pacotes = res.data || [];

            if (!pacotes.length) {
                const container = new ContainerBuilder().setAccentColor(getAccentColor());
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `${Emojis.get('_search_emoji')} Nenhum produto encontrado${busca ? ` para **${busca}**` : ''}.`
                ));
                return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
            }

            const linhas = pacotes.slice(0, 15).map(p => {
                const estoque = p.inventory_amount === null ? '∞' : p.inventory_amount;
                const status = p.enabled ? Emojis.get('confirmed_emoji') : Emojis.get('negative_emoji');
                return `${status} \`${p.id}\` **${p.name}** — \`${p.formatted_price}\` — estoque: \`${estoque}\``;
            });

            const container = new ContainerBuilder();
            container.setAccentColor(getAccentColor());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('_cart_emoji')} Produtos${busca ? ` — "${busca}"` : ''}\n` +
                    `-# CentralCart — ${res.meta?.total ?? pacotes.length} produto(s) encontrado(s)`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(linhas.join('\n'))
            );

            await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        } catch (err) {
            const errContainer = new ContainerBuilder().setAccentColor(getAccentColor());
            errContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Erro ao listar produtos: \`${err.message}\``));
            await interaction.editReply({ components: [errContainer], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        }
    }
};
