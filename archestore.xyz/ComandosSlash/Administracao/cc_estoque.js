const {
    ApplicationCommandType, PermissionFlagsBits,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../../DataBaseJson");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { listLicenseKeys, addLicenseKeys } = require("../../Functions/CentralCartAPI");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

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
            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Faltam permissões.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const sub = interaction.options.getSubcommand();
        const produtoId = interaction.options.getInteger("produto_id");

        const loading = new ContainerBuilder().setAccentColor(getAccentColor());
        loading.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Processando estoque...`));
        await interaction.editReply({ components: [loading], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

        try {
            if (sub === "ver") {
                const chaves = await listLicenseKeys(produtoId);

                if (!chaves.length) {
                    const container = new ContainerBuilder().setAccentColor(getAccentColor());
                    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `${Emojis.get('_search_emoji')} Nenhuma chave de licença no produto \`${produtoId}\`.`
                    ));
                    return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
                }

                const linhas = chaves.slice(0, 20).map((c, i) => `**${i + 1}.** ||${c.value}||`);

                const container = new ContainerBuilder();
                container.setAccentColor(getAccentColor());

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('_folder_emoji')} Estoque — Produto \`${produtoId}\`\n` +
                        `-# CentralCart — ${chaves.length} chave(s)`
                    )
                );

                container.addSeparatorComponents(new SeparatorBuilder());

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(linhas.join('\n'))
                );

                return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });

            } else if (sub === "adicionar") {
                const chavesArr = interaction.options.getString("chaves")
                    .split(",").map(c => c.trim()).filter(Boolean);

                if (!chavesArr.length) {
                    const container = new ContainerBuilder().setAccentColor(getAccentColor());
                    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Nenhuma chave válida encontrada.`));
                    return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
                }

                const res = await addLicenseKeys(produtoId, chavesArr);

                const container = new ContainerBuilder();
                container.setAccentColor(getAccentColor());

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('_folder_emoji')} Chaves adicionadas\n` +
                        `-# CentralCart`
                    )
                );

                container.addSeparatorComponents(new SeparatorBuilder());

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${Emojis.get('confirmed_emoji')} ${res.message || `${chavesArr.length} chave(s) adicionada(s).`}\n\n` +
                        `**Produto:** \`${produtoId}\`\n` +
                        `**Adicionadas:** \`${res.added_count ?? chavesArr.length}\``
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
