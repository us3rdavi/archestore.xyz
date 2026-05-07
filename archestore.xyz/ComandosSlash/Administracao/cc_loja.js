const {
    ApplicationCommandType, PermissionFlagsBits,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../../DataBaseJson");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { getAppDetails } = require("../../Functions/CentralCartAPI");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

module.exports = {
    name: "cc_loja",
    description: "Exibe informações da sua loja na CentralCart.",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const loading = new ContainerBuilder().setAccentColor(getAccentColor());
        loading.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Carregando informações da loja...`));
        await interaction.editReply({ components: [loading], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

        try {
            const loja = await getAppDetails();

            const vencimento = loja.overdue_date
                ? `<t:${Math.floor(new Date(loja.overdue_date).getTime() / 1000)}:D>`
                : 'N/A';

            const container = new ContainerBuilder();
            container.setAccentColor(getAccentColor());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('store_emoji')} ${loja.name}\n` +
                    `-# CentralCart — Informações da loja`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**ID da loja:** \`${loja.id}\`\n` +
                    `**Plano:** \`${loja.plan}\`\n` +
                    `**URL:** ${loja.url}\n` +
                    `**Assinatura válida até:** ${vencimento}`
                )
            );

            await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        } catch (err) {
            const errContainer = new ContainerBuilder().setAccentColor(getAccentColor());
            errContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Erro ao buscar loja: \`${err.message}\``));
            await interaction.editReply({ components: [errContainer], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
        }
    }
};
