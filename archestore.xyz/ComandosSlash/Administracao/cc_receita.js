const {
    ApplicationCommandType, PermissionFlagsBits,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../../DataBaseJson");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { getRevenueSummary, getOperations } = require("../../Functions/CentralCartAPI");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

function fmt(v) {
    return `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

module.exports = {
    name: "cc_receita",
    description: "Exibe o resumo de receita e operações da sua loja CentralCart.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const loading = new ContainerBuilder().setAccentColor(getAccentColor());
        loading.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Carregando dados de receita...`));
        await interaction.editReply({ components: [loading], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

        try {
            const hoje = new Date().toISOString().slice(0, 10);
            const [receita, ops] = await Promise.all([
                getRevenueSummary(),
                getOperations({ from: hoje, to: hoje }),
            ]);

            const container = new ContainerBuilder();
            container.setAccentColor(getAccentColor());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('_money_emoji')} Resumo de Receita\n` +
                    `-# CentralCart — atualizado agora`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Hoje**\n` +
                    `Receita líquida: \`${fmt(receita.today)}\`\n` +
                    `Vendas: \`${receita.today_sales ?? 0}\`\n\n` +
                    `**Mês atual**\n` +
                    `Receita líquida: \`${fmt(receita.month)}\`\n` +
                    `Vendas: \`${receita.month_sales ?? 0}\`\n\n` +
                    `**Total geral**\n` +
                    `Receita líquida: \`${fmt(receita.all_time)}\``
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Operações de hoje**\n` +
                    `${Emojis.get('confirmedpayment_emoji')} Aprovados: \`${ops.approved ?? 0}\`   ` +
                    `${Emojis.get('failpayment_emoji')} Chargebacks: \`${ops.charged_back ?? 0}\``
                )
            );

            await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        } catch (err) {
            const errContainer = new ContainerBuilder().setAccentColor(getAccentColor());
            errContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Erro ao buscar receita: \`${err.message}\``));
            await interaction.editReply({ components: [errContainer], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        }
    }
};
