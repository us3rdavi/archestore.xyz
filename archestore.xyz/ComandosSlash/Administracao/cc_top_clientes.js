const {
    ApplicationCommandType, PermissionFlagsBits,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../../DataBaseJson");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { getTopCustomers } = require("../../Functions/CentralCartAPI");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

module.exports = {
    name: "cc_top_clientes",
    description: "Exibe os 10 maiores compradores da loja CentralCart.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,
    options: [
        { name: "inicio", description: "Data de início (AAAA-MM-DD)", type: 3, required: false },
        { name: "fim", description: "Data de fim (AAAA-MM-DD)", type: 3, required: false },
    ],

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const from = interaction.options.getString("inicio");
        const to = interaction.options.getString("fim");

        const loading = new ContainerBuilder().setAccentColor(getAccentColor());
        loading.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Carregando top clientes...`));
        await interaction.editReply({ components: [loading], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

        try {
            const res = await getTopCustomers({ from, to });
            const clientes = res.data || [];

            if (!clientes.length) {
                const container = new ContainerBuilder().setAccentColor(getAccentColor());
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('_search_emoji')} Nenhum cliente encontrado no período.`));
                return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
            }

            const linhas = clientes.map((c, i) => {
                return `**${i + 1}.** **${c.username}** — \`${c.spent}\` — \`${c.purchases}\` compra${c.purchases !== 1 ? 's' : ''}`;
            });

            const subtitulo = from && to ? `${from} até ${to}` : 'todos os tempos';

            const container = new ContainerBuilder();
            container.setAccentColor(getAccentColor());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('_star_emoji')} Top Clientes\n` +
                    `-# CentralCart — ${subtitulo}`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(linhas.join('\n'))
            );

            await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        } catch (err) {
            const errContainer = new ContainerBuilder().setAccentColor(getAccentColor());
            errContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Erro ao buscar top clientes: \`${err.message}\``));
            await interaction.editReply({ components: [errContainer], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        }
    }
};
