const { ApplicationCommandType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { listOrders } = require("../../Functions/CentralCartAPI");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../DataBaseJson");

const STATUS_MAP = {
    APPROVED: "✅ Aprovado",
    REJECTED: "❌ Rejeitado",
    CANCELED: "🚫 Cancelado",
    REFUNDED: "↩️ Reembolsado",
    CHARGEDBACK: "⚠️ Chargeback",
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
                { name: "✅ Aprovado", value: "APPROVED" },
                { name: "❌ Rejeitado", value: "REJECTED" },
                { name: "🚫 Cancelado", value: "CANCELED" },
                { name: "↩️ Reembolsado", value: "REFUNDED" },
                { name: "⚠️ Chargeback", value: "CHARGEDBACK" },
            ]
        },
        { name: "busca", description: "Buscar por email, Discord ID ou nome", type: 3, required: false },
    ],

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const status = interaction.options.getString("status");
        const busca = interaction.options.getString("busca");

        try {
            const res = await listOrders({ status, search: busca });
            const pedidos = res.data || [];

            if (!pedidos.length) {
                return interaction.editReply({ content: `🔍 Nenhum pedido encontrado.` });
            }

            const linhas = pedidos.slice(0, 10).map(p => {
                const statusLabel = STATUS_MAP[p.status] || p.status;
                const data = p.created_at ? `<t:${Math.floor(new Date(p.created_at).getTime() / 1000)}:d>` : "N/A";
                const cliente = p.client_name || p.client_email || p.discord_id || "Desconhecido";
                return `${statusLabel} — **${cliente}** — ${p.formatted_price} — ${data} — \`${p.id}\``;
            });

            const embed = new EmbedBuilder()
                .setTitle("🧾 Pedidos CentralCart")
                .setColor(0x00b300)
                .setDescription(linhas.join("\n"))
                .setFooter({ text: `Total: ${res.meta?.total ?? pedidos.length} pedido(s) | CentralCart` })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            return interaction.editReply({ content: `❌ Erro ao listar pedidos: \`${err.message}\`` });
        }
    }
};
