const { ApplicationCommandType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { getRevenueSummary, getOperations } = require("../../Functions/CentralCartAPI");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
    name: "cc_receita",
    description: "Exibe o resumo de receita e operações da sua loja CentralCart.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const hoje = new Date();
            const from = hoje.toISOString().slice(0, 10);
            const [receita, ops] = await Promise.all([
                getRevenueSummary(),
                getOperations({ from, to: from }),
            ]);

            const fmt = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

            const embed = new EmbedBuilder()
                .setTitle("📊 Resumo de Receita — CentralCart")
                .setColor(0x00b300)
                .addFields(
                    { name: "💰 Hoje (líquido)", value: fmt(receita.today), inline: true },
                    { name: "🛒 Vendas hoje", value: `\`${receita.today_sales ?? 0}\``, inline: true },
                    { name: "\u200b", value: "\u200b", inline: true },
                    { name: "📅 Mês atual (líquido)", value: fmt(receita.month), inline: true },
                    { name: "🛒 Vendas do mês", value: `\`${receita.month_sales ?? 0}\``, inline: true },
                    { name: "\u200b", value: "\u200b", inline: true },
                    { name: "🏆 Total geral (líquido)", value: fmt(receita.all_time), inline: true },
                    { name: "✅ Aprovados hoje", value: `\`${ops.approved ?? 0}\``, inline: true },
                    { name: "⚠️ Chargebacks hoje", value: `\`${ops.charged_back ?? 0}\``, inline: true },
                )
                .setFooter({ text: "CentralCart" })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            return interaction.editReply({ content: `❌ Erro ao buscar receita: \`${err.message}\`` });
        }
    }
};
