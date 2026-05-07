const {
    ApplicationCommandType, PermissionFlagsBits,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../../DataBaseJson");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { listOrders } = require("../../Functions/CentralCartAPI");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

const STATUS_LABEL = {
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    CANCELED: 'Cancelado',
    REFUNDED: 'Reembolsado',
    CHARGEDBACK: 'Chargeback',
};

module.exports = {
    name: "cc_pedidos",
    description: "Lista os pedidos da sua loja CentralCart.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "status",
            description: "Filtrar por status do pedido",
            type: 3,
            required: false,
            choices: [
                { name: "Aprovado", value: "APPROVED" },
                { name: "Rejeitado", value: "REJECTED" },
                { name: "Cancelado", value: "CANCELED" },
                { name: "Reembolsado", value: "REFUNDED" },
                { name: "Chargeback", value: "CHARGEDBACK" },
            ]
        },
        { name: "busca", description: "Buscar por email, Discord ID ou nome", type: 3, required: false },
    ],

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const status = interaction.options.getString("status");
        const busca = interaction.options.getString("busca");

        const loading = new ContainerBuilder().setAccentColor(getAccentColor());
        loading.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Carregando pedidos...`));
        await interaction.editReply({ components: [loading], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

        try {
            const res = await listOrders({ status, search: busca });
            const pedidos = res.data || [];

            if (!pedidos.length) {
                const container = new ContainerBuilder().setAccentColor(getAccentColor());
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('_search_emoji')} Nenhum pedido encontrado.`));
                return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
            }

            const linhas = pedidos.slice(0, 10).map(p => {
                const statusLabel = STATUS_LABEL[p.status] || p.status;
                const data = p.created_at ? `<t:${Math.floor(new Date(p.created_at).getTime() / 1000)}:d>` : 'N/A';
                const cliente = p.client_name || p.client_email || p.discord_id || 'Desconhecido';
                return `**${cliente}** — \`${p.formatted_price}\` — ${statusLabel} — ${data}\n-# ID: \`${p.id}\``;
            });

            const container = new ContainerBuilder();
            container.setAccentColor(getAccentColor());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('neworder_emoji')} Pedidos\n` +
                    `-# CentralCart — ${res.meta?.total ?? pedidos.length} pedido(s)${status ? ` — ${STATUS_LABEL[status]}` : ''}`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(linhas.join('\n\n'))
            );

            await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        } catch (err) {
            const errContainer = new ContainerBuilder().setAccentColor(getAccentColor());
            errContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Erro ao listar pedidos: \`${err.message}\``));
            await interaction.editReply({ components: [errContainer], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        }
    }
};
