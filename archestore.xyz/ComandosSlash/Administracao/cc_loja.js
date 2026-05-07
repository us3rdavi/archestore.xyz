const { ApplicationCommandType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { getAppDetails } = require("../../Functions/CentralCartAPI");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
    name: "cc_loja",
    description: "Exibe informações da sua loja na CentralCart.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const loja = await getAppDetails();

            const embed = new EmbedBuilder()
                .setTitle(`🏪 ${loja.name}`)
                .setColor(loja.primary_color || 0x00b300)
                .setThumbnail(loja.logo || null)
                .addFields(
                    { name: "🆔 ID da Loja", value: `\`${loja.id}\``, inline: true },
                    { name: "📦 Plano", value: `\`${loja.plan}\``, inline: true },
                    { name: "🌐 URL", value: `[Acessar loja](${loja.url})`, inline: true },
                    { name: "📅 Assinatura válida até", value: loja.overdue_date ? `<t:${Math.floor(new Date(loja.overdue_date).getTime() / 1000)}:D>` : "N/A", inline: true },
                )
                .setFooter({ text: "CentralCart" })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            return interaction.editReply({ content: `❌ Erro ao buscar loja: \`${err.message}\`` });
        }
    }
};
