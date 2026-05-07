const { ApplicationCommandType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { getTopCustomers } = require("../../Functions/CentralCartAPI");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../DataBaseJson");

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
            return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const from = interaction.options.getString("inicio");
        const to = interaction.options.getString("fim");

        try {
            const res = await getTopCustomers({ from, to });
            const clientes = res.data || [];

            if (!clientes.length) {
                return interaction.editReply({ content: `🔍 Nenhum cliente encontrado no período.` });
            }

            const medals = ["🥇", "🥈", "🥉"];
            const linhas = clientes.map((c, i) => {
                const medal = medals[i] || `\`${i + 1}.\``;
                return `${medal} **${c.username}** — ${c.spent} (${c.purchases} compra${c.purchases !== 1 ? "s" : ""})`;
            });

            const titulo = from && to ? `🏆 Top Clientes — ${from} até ${to}` : "🏆 Top Clientes — CentralCart";

            const embed = new EmbedBuilder()
                .setTitle(titulo)
                .setColor(0x00b300)
                .setDescription(linhas.join("\n"))
                .setFooter({ text: "CentralCart" })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            return interaction.editReply({ content: `❌ Erro ao buscar top clientes: \`${err.message}\`` });
        }
    }
};
