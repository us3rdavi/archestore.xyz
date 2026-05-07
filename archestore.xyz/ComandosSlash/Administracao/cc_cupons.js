const { ApplicationCommandType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { listDiscounts, deleteDiscount } = require("../../Functions/CentralCartAPI");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
    name: "cc_cupons",
    description: "Lista ou deleta cupons de desconto da CentralCart.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "listar",
            description: "Lista os cupons da loja.",
            type: 1,
            options: [
                { name: "codigo", description: "Buscar por código", type: 3, required: false },
            ]
        },
        {
            name: "deletar",
            description: "Deleta um cupom pelo ID.",
            type: 1,
            options: [
                { name: "id", description: "ID do cupom", type: 4, required: true },
            ]
        },
    ],

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const sub = interaction.options.getSubcommand();

        try {
            if (sub === "listar") {
                const codigo = interaction.options.getString("codigo");
                const res = await listDiscounts({ coupon: codigo });
                const cupons = res.data || [];

                if (!cupons.length) {
                    return interaction.editReply({ content: `🔍 Nenhum cupom encontrado.` });
                }

                const linhas = cupons.slice(0, 15).map(c => {
                    const valor = c.type === "PERCENTAGE" ? `${c.value}%` : `R$ ${(c.value / 100).toFixed(2)}`;
                    const usos = c.max_uses ? `${c.uses}/${c.max_uses}` : `${c.uses}/∞`;
                    return `\`${c.id}\` **${c.coupon}** — ${valor} — usos: ${usos}`;
                });

                const embed = new EmbedBuilder()
                    .setTitle("🎟️ Cupons — CentralCart")
                    .setColor(0x00b300)
                    .setDescription(linhas.join("\n"))
                    .setFooter({ text: `Total: ${res.meta?.total ?? cupons.length} cupom(ns) | CentralCart` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });

            } else if (sub === "deletar") {
                const id = interaction.options.getInteger("id");
                await deleteDiscount(id);

                return interaction.editReply({ content: `✅ Cupom \`${id}\` deletado com sucesso.` });
            }
        } catch (err) {
            return interaction.editReply({ content: `❌ Erro: \`${err.message}\`` });
        }
    }
};
