const {
    ApplicationCommandType, PermissionFlagsBits,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../../DataBaseJson");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { listDiscounts, deleteDiscount } = require("../../Functions/CentralCartAPI");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

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
            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const sub = interaction.options.getSubcommand();

        const loading = new ContainerBuilder().setAccentColor(getAccentColor());
        loading.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Processando...`));
        await interaction.editReply({ components: [loading], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

        try {
            if (sub === "listar") {
                const codigo = interaction.options.getString("codigo");
                const res = await listDiscounts({ coupon: codigo });
                const cupons = res.data || [];

                if (!cupons.length) {
                    const container = new ContainerBuilder().setAccentColor(getAccentColor());
                    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('_search_emoji')} Nenhum cupom encontrado.`));
                    return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
                }

                const linhas = cupons.slice(0, 15).map(c => {
                    const valor = c.type === "PERCENTAGE"
                        ? `${c.value}%`
                        : `R$ ${(c.value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                    const usos = c.max_uses ? `${c.uses}/${c.max_uses}` : `${c.uses}/∞`;
                    return `\`${c.id}\` **${c.coupon}** — \`${valor}\` — usos: \`${usos}\``;
                });

                const container = new ContainerBuilder();
                container.setAccentColor(getAccentColor());

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('_diamond_emoji')} Cupons\n` +
                        `-# CentralCart — ${res.meta?.total ?? cupons.length} cupom(ns)`
                    )
                );

                container.addSeparatorComponents(new SeparatorBuilder());

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(linhas.join('\n'))
                );

                return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

            } else if (sub === "deletar") {
                const id = interaction.options.getInteger("id");
                await deleteDiscount(id);

                const container = new ContainerBuilder();
                container.setAccentColor(getAccentColor());

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${Emojis.get('confirmed_emoji')} Cupom \`${id}\` deletado com sucesso.`
                    )
                );

                return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
            }
        } catch (err) {
            const errContainer = new ContainerBuilder().setAccentColor(getAccentColor());
            errContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Erro: \`${err.message}\``));
            await interaction.editReply({ components: [errContainer], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        }
    }
};
