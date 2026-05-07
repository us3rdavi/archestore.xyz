const {
    ApplicationCommandType, PermissionFlagsBits,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../../DataBaseJson");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { getOrder } = require("../../Functions/CentralCartAPI");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

module.exports = {
    name: "cc_pedido",
    description: "Exibe os detalhes completos de um pedido CentralCart.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,
    options: [
        { name: "id", description: "ID do pedido", type: 3, required: true },
    ],

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const id = interaction.options.getString("id");

        const loading = new ContainerBuilder().setAccentColor(getAccentColor());
        loading.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Carregando pedido...`));
        await interaction.editReply({ components: [loading], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

        try {
            const p = await getOrder(id);

            const criadoEm = p.created_at ? `<t:${Math.floor(new Date(p.created_at).getTime() / 1000)}:f>` : 'N/A';
            const pagoEm = p.paid_at ? `<t:${Math.floor(new Date(p.paid_at).getTime() / 1000)}:f>` : 'N/A';
            const pacotesNomes = (p.packages || []).map(pkg => `\`${pkg.quantity}x\` ${pkg.name}`).join('\n') || 'N/A';

            const container = new ContainerBuilder();
            container.setAccentColor(getAccentColor());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('neworder_emoji')} Pedido \`${p.id}\`\n` +
                    `-# ${p.formatted_status || p.status} — ${p.formatted_gateway || p.gateway || 'N/A'}`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Cliente:** ${p.client_name || 'N/A'}\n` +
                    `**Email:** \`${p.client_email || 'N/A'}\`\n` +
                    `**Discord ID:** \`${p.discord_id || 'N/A'}\`\n` +
                    `**Valor:** \`${p.formatted_price || 'N/A'}\``
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Pacotes**\n${pacotesNomes}\n\n` +
                    `**Criado em:** ${criadoEm}\n` +
                    `**Pago em:** ${pagoEm}`
                )
            );

            await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        } catch (err) {
            const errContainer = new ContainerBuilder().setAccentColor(getAccentColor());
            errContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Erro ao buscar pedido: \`${err.message}\``));
            await interaction.editReply({ components: [errContainer], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        }
    }
};
