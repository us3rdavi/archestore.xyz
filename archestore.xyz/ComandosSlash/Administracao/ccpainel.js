const {
    ApplicationCommandType,
    PermissionFlagsBits,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    MessageFlags,
} = require('discord.js');
const { configuracao, Emojis } = require('../../DataBaseJson');
const { getPermissions } = require('../../Functions/PermissionsCache');

module.exports = {
    name: 'ccpainel',
    description: 'Abre o painel de gerenciamento da CentralCart.',
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({
                content: `${Emojis.get('negative_emoji')} Faltam permissões.`,
                ephemeral: true,
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const cor = configuracao.get('Cores.Principal') || '5865F2';
        const accent = (() => { try { return parseInt(cor.replace('#', ''), 16); } catch { return 0x5865F2; } })();

        const c = new ContainerBuilder().setAccentColor(accent);

        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `## ${Emojis.get('store_emoji')} CentralCart — Painel\n` +
            `-# Selecione uma seção no menu abaixo para começar.`
        ));

        c.addSeparatorComponents(new SeparatorBuilder());

        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `**${Emojis.get('store_emoji')} Loja** — informações da loja\n` +
            `**${Emojis.get('_money_emoji')} Receita** — resumo financeiro\n` +
            `**${Emojis.get('_cart_emoji')} Produtos** — lista de produtos\n` +
            `**${Emojis.get('neworder_emoji')} Pedidos** — pedidos recentes\n` +
            `**${Emojis.get('_folder_emoji')} Estoque** — chaves de licença\n` +
            `**${Emojis.get('_diamond_emoji')} Cupons** — cupons de desconto\n` +
            `**${Emojis.get('_star_emoji')} Top Clientes** — maiores compradores`
        ));

        c.addSeparatorComponents(new SeparatorBuilder());

        c.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ccpainel_nav')
                    .setPlaceholder('Selecionar seção...')
                    .addOptions([
                        { label: 'Loja',         value: 'loja',         description: 'Informações da loja' },
                        { label: 'Receita',      value: 'receita',      description: 'Resumo de receita e operações' },
                        { label: 'Produtos',     value: 'produtos',     description: 'Lista de produtos da loja' },
                        { label: 'Pedidos',      value: 'pedidos',      description: 'Pedidos recentes' },
                        { label: 'Estoque',      value: 'estoque',      description: 'Chaves de licença por produto' },
                        { label: 'Cupons',       value: 'cupons',       description: 'Cupons de desconto' },
                        { label: 'Top Clientes', value: 'top_clientes', description: 'Maiores compradores' },
                    ])
            )
        );

        await interaction.editReply({
            components: [c],
            flags: MessageFlags.IsComponentsV2,
            embeds: [],
            content: '',
        });
    },
};
