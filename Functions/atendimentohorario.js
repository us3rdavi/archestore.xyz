const {
    ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { tickets } = require("../Database");
const emojis = require("../Database/emojis.json");
const Emojis = { get: (name) => emojis[name] || "" };

async function Atendimentohorario(interaction, client) {
    const ativo    = tickets.get('statushorario') || false;
    const abertura = tickets.get('horarioAbertura')  || 'Não definido';
    const fechamento = tickets.get('horarioFechamento') || 'Não definido';

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('clock_emoji')} Horário de Atendimento\n` +
            `-# Defina o período em que os usuários podem abrir tickets.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const statusEmoji = ativo ? Emojis.get('confirmed_emoji') : Emojis.get('negative_emoji');
    const statusLabel = ativo ? 'Ativado' : 'Desativado';

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `${statusEmoji} **Status:** \`${statusLabel}\`\n` +
            `${Emojis.get('_add_emoji')} **Abertura:** \`${abertura}\`\n` +
            `${Emojis.get('_trash_emoji')} **Fechamento:** \`${fechamento}\`\n\n` +
            `-# Quando ativado, tickets só podem ser abertos dentro do horário configurado (horário de Brasília).`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('onoffatendimentohorario24')
                .setLabel(ativo ? 'Desativar' : 'Ativar')
                .setEmoji(ativo ? '1501803935453679616' : '1501803932484108359')
                .setStyle(ativo ? 4 : 3),
            new ButtonBuilder()
                .setCustomId('confighorarioatendimento24')
                .setLabel('Configurar Horário')
                .setEmoji('1501803905363869769')
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('painelconfigticket')
                .setLabel('Voltar')
                .setEmoji('1501803908589162537')
                .setStyle(2)
        )
    );

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

module.exports = { Atendimentohorario };
