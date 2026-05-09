const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../Database");

function getSaudacao() {
    const brazilTime = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const hora = new Date(brazilTime).getHours();
    if (hora < 12) return 'Bom dia';
    else if (hora < 18) return 'Boa tarde';
    else return 'Boa noite';
}

async function PermsAvançados24(interaction, client) {
    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_staff_emoji')} Sistema de Permissão Avançada\n` +
            `${getSaudacao()} **${interaction.user.displayName || interaction.user.username}**, gerencie permissões avançadas de usuários específicos.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('selectmenuperm24')
            .setPlaceholder('Configuração de permissão avançada')
            .addOptions([
                {
                    label: 'Configurações De Perm de pagamento',
                    description: 'Adicionar permissão para um usuario conseguir acessar a configuração de pagamento',
                    emoji: '1259713258395537418',
                    value: 'pagamentoperm24',
                },
                {
                    label: 'Remover Permissão',
                    description: 'Retirar permissão de um usuario ( Ira tirar todas as perms avançadas dele )',
                    emoji: '1269773207544664084',
                    value: 'removerperm24',
                },
                {
                    label: 'Lista de permissões',
                    description: 'Ver Todos os usuarios com permissões Avançadas',
                    emoji: '1231917967441264740',
                    value: 'listaperm24',
                },
            ])
    );

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("permissaoadm")
            .setLabel('Voltar')
            .setEmoji('1264710894345130097')
            .setStyle(2),
    );

    container.addActionRowComponents(selectMenu);
    container.addActionRowComponents(row);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

module.exports = { PermsAvançados24 }
