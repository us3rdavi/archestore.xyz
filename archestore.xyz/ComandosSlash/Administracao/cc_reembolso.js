const { ApplicationCommandType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { updateOrder } = require("../../Functions/CentralCartAPI");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
    name: "cc_reembolso",
    description: "Reembolsa um pedido na CentralCart.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,
    options: [
        { name: "id", description: "ID do pedido a ser reembolsado", type: 3, required: true },
    ],

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const id = interaction.options.getString("id");

        try {
            const res = await updateOrder(id, { status: "REFUNDED", manually_refunded: true });

            const embed = new EmbedBuilder()
                .setTitle("↩️ Pedido Reembolsado")
                .setColor(0xff9900)
                .addFields(
                    { name: "🆔 Pedido", value: `\`${id}\``, inline: true },
                    { name: "📌 Novo status", value: res.formatted_status || "REFUNDED", inline: true },
                    { name: "👤 Cliente", value: res.client_name || res.client_email || "N/A", inline: true },
                )
                .setFooter({ text: "CentralCart" })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            return interaction.editReply({ content: `❌ Erro ao reembolsar pedido: \`${err.message}\`` });
        }
    }
};
