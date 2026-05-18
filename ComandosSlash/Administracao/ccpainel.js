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
const { configuracao, Emojis } = require('../../Database');
const { hasPermission } = require('../../Functions/PermissionsCache');

module.exports = {
    name: 'cc-config',
    description: 'Abre o painel de gerenciamento da CentralCart.',
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        if (!hasPermission(interaction.user.id)) {
            return interaction.reply({
                content: `${Emojis.get('negative_emoji')} Você não tem permissão para acessar este painel.`,
                ephemeral: true,
            });
        }

        const adminRoleId = configuracao.get('ConfigRoles.cargoadm');
        const adminRole   = adminRoleId ? interaction.guild.roles.cache.get(adminRoleId) : null;
        const staffLabel  = adminRole ? adminRole.name : 'Owner';

        const userName = interaction.member?.displayName
            || interaction.user?.displayName
            || interaction.user?.username;

        const c = new ContainerBuilder();

        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `## ${Emojis.get('store_emoji')} CentralCart — Painel\n` +
            `**${userName}** · ${staffLabel}\n\n` +
            `${Emojis.get('information_emoji')} Selecione uma seção abaixo para visualizar e gerenciar.\n` +
            `-# Apenas usuários autorizados podem realizar alterações.`
        ));

        c.addSeparatorComponents(new SeparatorBuilder());

        c.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ccpainel_nav')
                    .setPlaceholder('Selecionar seção...')
                    .addOptions([
                        { label: 'Loja',         value: 'loja',         description: 'Informações e plano da loja',           emoji: { id: '1501803947898306724' } },
                        { label: 'Receita',      value: 'receita',      description: 'Resumo financeiro e operações do dia',  emoji: { id: '1501803982849445998' } },
                        { label: 'Produtos',     value: 'produtos',     description: 'Catálogo de produtos da loja',          emoji: { id: '1501803960393269298' } },
                        { label: 'Pedidos',      value: 'pedidos',      description: 'Histórico e gestão de pedidos',         emoji: { id: '1501803951161479208' } },
                        { label: 'Estoque',      value: 'estoque',      description: 'Chaves de licença por produto',         emoji: { id: '1501804010049634426' } },
                        { label: 'Cupons',       value: 'cupons',       description: 'Criação e gestão de cupons',            emoji: { id: '1501804052827209768' } },
                        { label: 'Top Clientes', value: 'top_clientes', description: 'Ranking dos maiores compradores',       emoji: { id: '1501804049563910285' } },
                    ])
            )
        );

        try {
            await interaction.reply({
                components: [c],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                embeds: [],
                content: '',
            });
        } catch (err) {
            console.error('[CCPainel] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred)
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro.`, ephemeral: true });
            } catch (e) {}
        }
    },
};
