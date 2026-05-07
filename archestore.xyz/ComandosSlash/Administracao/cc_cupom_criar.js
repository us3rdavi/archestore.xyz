const {
    ApplicationCommandType, PermissionFlagsBits,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../../DataBaseJson");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { createDiscount } = require("../../Functions/CentralCartAPI");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

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
            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const codigo = interaction.options.getString("codigo");
        const tipo = interaction.options.getString("tipo");
        const valor = interaction.options.getNumber("valor");
        const max_usos = interaction.options.getInteger("max_usos");
        const expira = interaction.options.getString("expira_em");

        const loading = new ContainerBuilder().setAccentColor(getAccentColor());
        loading.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Criando cupom...`));
        await interaction.editReply({ components: [loading], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

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

            const valorFmt = tipo === "PERCENTAGE"
                ? `\`${valor}%\``
                : `\`R$ ${(valor / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\``;

            const container = new ContainerBuilder();
            container.setAccentColor(getAccentColor());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('_diamond_emoji')} Cupom criado\n` +
                    `-# CentralCart`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Código:** \`${res.coupon || codigo}\`\n` +
                    `**Desconto:** ${valorFmt}\n` +
                    `**Máx. usos:** ${max_usos ? `\`${max_usos}\`` : '`Ilimitado`'}\n` +
                    `**Expira em:** ${expira ? `\`${expira}\`` : '`Sem expiração`'}`
                )
            );

            await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        } catch (err) {
            const errContainer = new ContainerBuilder().setAccentColor(getAccentColor());
            errContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Erro ao criar cupom: \`${err.message}\``));
            await interaction.editReply({ components: [errContainer], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        }
    }
};
