const {
    ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../Database");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function Painel(interaction, client) {
    try {
        const container = new ContainerBuilder();
        container;

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## ${Emojis.get('_settings_emoji')} Painel de Configuração\n` +
                `Olá **${interaction.user.displayName || interaction.user.username}**, bem-vindo ao painel de configuração.\n\n` +
                `-# Use o menu abaixo para navegar pelas categorias.`
            )
        );

        container.addSeparatorComponents(new SeparatorBuilder());

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("painelconfigticket")
                .setLabel("Central de Atendimento")
                .setEmoji("1501804043121725490")
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId("painelpersonalizar")
                .setLabel('Meu Bot Designer')
                .setEmoji("1501804122943389716")
                .setStyle(1),
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("gerenciarconfigs")
                .setLabel('Definições')
                .setEmoji("1501804030605922346")
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId("configavançadas24")
                .setLabel('Proteção')
                .setEmoji("1501804118292037765")
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId("eaffaawwawa")
                .setLabel('Automações')
                .setEmoji("1501804019184828507")
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId("actionsautomations")
                .setLabel('Moderação')
                .setEmoji("1501804067616325723")
                .setStyle(2),
        );

        container.addActionRowComponents(row1);
        container.addActionRowComponents(row2);

        await interaction.editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            content: '',
            embeds: []
        });

    } catch (error) {
        console.error("Erro na função Painel:", error);
        try {
            await interaction.editReply("Ocorreu um erro ao carregar o painel.");
        } catch (e) {}
    }
}

async function Gerenciar2(interaction, client) {
    try {
        await interaction.editReply({ content: `${Emojis.get('negative_emoji')} Sistema de loja interna foi desativado.`, embeds: [], components: [] });
    } catch (error) {
        console.error("Erro na função Gerenciar2:", error);
    }
}

async function definirduvidas(interaction, client) {
    try {
        const infoduvidas = configuracao.get(`BotaoDuvidas`);
        const container = new ContainerBuilder();
        container;

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## ${Emojis.get('question_emoji')} Botão de Dúvidas\n` +
                `Senhor(a) **${interaction.user.username}**, configure o botão de dúvidas.\n\n` +
                `**${Emojis.get('_text_emoji')} Nome do Botão:** \`${infoduvidas?.nomebotao ? infoduvidas.nomebotao : 'Não Definido'}\`\n` +
                `**${Emojis.get('_lapis_emoji')} Emoji do Botão:** ${infoduvidas?.emoji ? infoduvidas.emoji : '`Sem Emoji`'}\n` +
                `**${Emojis.get('_send_emoji')} Link do Botão:** ${infoduvidas?.linkbotao ? infoduvidas.linkbotao : '`Não Definido`'}`
            )
        );

        container.addSeparatorComponents(new SeparatorBuilder());

        const botao = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ativarbotaoduvidas')
                .setLabel(`${infoduvidas?.status ? `Botão Ativado` : `Botão Desativado`}`)
                .setEmoji({ id: '1501804030605922346' })
                .setStyle(infoduvidas?.status ? 3 : 4),
            new ButtonBuilder()
                .setCustomId('botaoduvidas')
                .setLabel('Definir botão de dúvidas')
                .setEmoji({ id: '1501804003850322052' })
                .setStyle(2),
        );

        const botao2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("voltar3")
                .setLabel('Voltar ao Atendimento')
                .setEmoji({ id: '1501803908589162537' })
                .setStyle(2)
        );

        container.addActionRowComponents(botao);
        container.addActionRowComponents(botao2);

        const payload = {
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            content: '',
            embeds: []
        };

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(payload);
        } else {
            await interaction.update(payload);
        }
    } catch (error) {
        console.error("Erro na função definirduvidas:", error);
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: "Ocorreu um erro.", ephemeral: true });
            }
        } catch (e) {}
    }
}

module.exports = {
    Painel,
    Gerenciar2,
    definirduvidas
};
