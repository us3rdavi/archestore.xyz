const { ApplicationCommandType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { listPackages } = require("../../Functions/CentralCartAPI");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../DataBaseJson");

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
            return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const busca = interaction.options.getString("busca");

        try {
            const res = await listPackages({ search: busca || null });
            const pacotes = res.data || [];

            if (!pacotes.length) {
                return interaction.editReply({ content: `🔍 Nenhum produto encontrado${busca ? ` para \`${busca}\`` : ""}.` });
            }

            const linhas = pacotes.slice(0, 15).map((p, i) => {
                const estoque = p.inventory_amount === null ? "∞" : p.inventory_amount;
                const status = p.enabled ? "✅" : "❌";
                return `${status} \`${p.id}\` **${p.name}** — ${p.formatted_price} (estoque: ${estoque})`;
            });

            const embed = new EmbedBuilder()
                .setTitle(`📦 Produtos CentralCart${busca ? ` — "${busca}"` : ""}`)
                .setColor(0x00b300)
                .setDescription(linhas.join("\n"))
                .setFooter({ text: `Total: ${res.meta?.total ?? pacotes.length} produto(s) | CentralCart` })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            return interaction.editReply({ content: `❌ Erro ao listar produtos: \`${err.message}\`` });
        }
    }
};
