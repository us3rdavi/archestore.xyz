const { ApplicationCommandType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { createDiscount } = require("../../Functions/CentralCartAPI");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
    name: "cc_cupom_criar",
    description: "Cria um cupom de desconto na CentralCart.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,
    options: [
        { name: "codigo", description: "Código do cupom (letras, números, hífens, underlines)", type: 3, required: true },
        {
            name: "tipo",
            description: "Tipo do desconto",
            type: 3,
            required: true,
            choices: [
                { name: "Porcentagem (%)", value: "PERCENTAGE" },
                { name: "Valor fixo (R$)", value: "PRICE" },
            ]
        },
        { name: "valor", description: "Valor do desconto (% ou centavos para R$)", type: 10, required: true },
        { name: "max_usos", description: "Quantidade máxima de usos (opcional)", type: 4, required: false },
        { name: "expira_em", description: "Data de expiração (AAAA-MM-DD, opcional)", type: 3, required: false },
    ],

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const codigo = interaction.options.getString("codigo");
        const tipo = interaction.options.getString("tipo");
        const valor = interaction.options.getNumber("valor");
        const max_usos = interaction.options.getInteger("max_usos");
        const expira = interaction.options.getString("expira_em");

        try {
            const body = {
                coupon: codigo,
                type: tipo,
                value: valor,
                applies_to: [-1],
            };
            if (max_usos) body.max_uses = max_usos;
            if (expira) body.expires_in = expira;

            const res = await createDiscount(body);

            const valorFmt = tipo === "PERCENTAGE" ? `${valor}%` : `R$ ${(valor / 100).toFixed(2).replace('.', ',')}`;

            const embed = new EmbedBuilder()
                .setTitle("🎟️ Cupom criado com sucesso!")
                .setColor(0x00b300)
                .addFields(
                    { name: "🏷️ Código", value: `\`${res.coupon || codigo}\``, inline: true },
                    { name: "💸 Desconto", value: valorFmt, inline: true },
                    { name: "🔢 Máx. usos", value: max_usos ? `\`${max_usos}\`` : "Ilimitado", inline: true },
                    { name: "📅 Expira em", value: expira || "Sem expiração", inline: true },
                )
                .setFooter({ text: "CentralCart" })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            return interaction.editReply({ content: `❌ Erro ao criar cupom: \`${err.message}\`` });
        }
    }
};
