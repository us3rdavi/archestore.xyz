const { ApplicationCommandType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { getOrder } = require("../../Functions/CentralCartAPI");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
    name: "cc_pedido",
    description: "Exibe os detalhes completos de um pedido CentralCart.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,
    options: [
        { name: "id", description: "ID do pedido", type: 3, required: true },
    ],

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const id = interaction.options.getString("id");

        try {
            const p = await getOrder(id);

            const pacotesNomes = (p.packages || []).map(pkg => `• ${pkg.name} (x${pkg.quantity})`).join("\n") || "N/A";
            const criadoEm = p.created_at ? `<t:${Math.floor(new Date(p.created_at).getTime() / 1000)}:f>` : "N/A";
            const pagoEm = p.paid_at ? `<t:${Math.floor(new Date(p.paid_at).getTime() / 1000)}:f>` : "N/A";

            const embed = new EmbedBuilder()
                .setTitle(`🧾 Pedido \`${p.id}\``)
                .setColor(p.status === "APPROVED" ? 0x00b300 : p.status === "REFUNDED" ? 0xff9900 : 0xff0000)
                .addFields(
                    { name: "👤 Cliente", value: p.client_name || "N/A", inline: true },
                    { name: "📧 Email", value: p.client_email || "N/A", inline: true },
                    { name: "🎮 Discord ID", value: p.discord_id || "N/A", inline: true },
                    { name: "💰 Valor", value: p.formatted_price || "N/A", inline: true },
                    { name: "📌 Status", value: p.formatted_status || p.status || "N/A", inline: true },
                    { name: "💳 Gateway", value: p.formatted_gateway || p.gateway || "N/A", inline: true },
                    { name: "📦 Pacotes", value: pacotesNomes, inline: false },
                    { name: "📅 Criado em", value: criadoEm, inline: true },
                    { name: "✅ Pago em", value: pagoEm, inline: true },
                )
                .setFooter({ text: "CentralCart" })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            return interaction.editReply({ content: `❌ Erro ao buscar pedido: \`${err.message}\`` });
        }
    }
};
