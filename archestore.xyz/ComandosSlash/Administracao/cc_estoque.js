const { ApplicationCommandType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { listLicenseKeys, addLicenseKeys } = require("../../Functions/CentralCartAPI");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
    name: "cc_estoque",
    description: "Gerencia o estoque (chaves de licença) de um produto CentralCart.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "ver",
            description: "Lista as chaves de licença de um produto.",
            type: 1,
            options: [
                { name: "produto_id", description: "ID do produto", type: 4, required: true },
            ]
        },
        {
            name: "adicionar",
            description: "Adiciona chaves de licença a um produto (separe por vírgula).",
            type: 1,
            options: [
                { name: "produto_id", description: "ID do produto", type: 4, required: true },
                { name: "chaves", description: "Chaves separadas por vírgula (ex: CHAVE1,CHAVE2)", type: 3, required: true },
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
        const produtoId = interaction.options.getInteger("produto_id");

        try {
            if (sub === "ver") {
                const chaves = await listLicenseKeys(produtoId);

                if (!chaves.length) {
                    return interaction.editReply({ content: `🔍 Nenhuma chave de licença no produto \`${produtoId}\`.` });
                }

                const linhas = chaves.slice(0, 20).map((c, i) => `\`${i + 1}.\` ||${c.value}||`);

                const embed = new EmbedBuilder()
                    .setTitle(`🔑 Chaves do produto \`${produtoId}\``)
                    .setColor(0x00b300)
                    .setDescription(linhas.join("\n"))
                    .setFooter({ text: `Total: ${chaves.length} chave(s) | CentralCart` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });

            } else if (sub === "adicionar") {
                const chavesStr = interaction.options.getString("chaves");
                const chavesArr = chavesStr.split(",").map(c => c.trim()).filter(Boolean);

                if (!chavesArr.length) {
                    return interaction.editReply({ content: `❌ Nenhuma chave válida encontrada.` });
                }

                const res = await addLicenseKeys(produtoId, chavesArr);

                const embed = new EmbedBuilder()
                    .setTitle("✅ Chaves adicionadas!")
                    .setColor(0x00b300)
                    .setDescription(res.message || `${chavesArr.length} chave(s) adicionada(s).`)
                    .addFields(
                        { name: "📦 Produto", value: `\`${produtoId}\``, inline: true },
                        { name: "🔑 Qtd. adicionada", value: `\`${res.added_count ?? chavesArr.length}\``, inline: true },
                    )
                    .setFooter({ text: "CentralCart" })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }
        } catch (err) {
            return interaction.editReply({ content: `❌ Erro: \`${err.message}\`` });
        }
    }
};
