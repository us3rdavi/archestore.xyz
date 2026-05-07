const {
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { produtos, configuracao } = require("../DataBaseJson");
const moment = require('moment-timezone');

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function AcoesRepostAutomatics(interaction, client) {
    const repostagemHora = configuracao.get('Repostagem.Hora') || "00:01";
    const currentStatus = configuracao.get('Repostagem.Status');

    const currentTime = moment.tz("America/Sao_Paulo");
    const [hours, minutes] = repostagemHora.split(':').map(Number);
    let nextExecutionTime = moment.tz("America/Sao_Paulo").set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

    if (nextExecutionTime.isBefore(currentTime)) {
        nextExecutionTime.add(1, 'day');
    }

    const nextExecutionTimestamp = Math.floor(nextExecutionTime.valueOf() / 1000);
    const todosProdutos = await produtos.all();

    const container = new ContainerBuilder();
    container.setAccentColor(getAccentColor());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## Repostagem Automática\n` +
            `Seu **${client.user.username}** vai repostar seus produtos periodicamente, apagando a mensagem antiga e enviando-a novamente.\n` +
            `-# O sistema ajustará automaticamente o intervalo e a frequência dos reposts.\n\n` +
            `**Próxima execução:** ${currentStatus ? `\`${nextExecutionTime.format('DD/MM/YYYY HH:mm:ss')}\`` : '`Função desativada.`'}\n` +
            `**Tempo até próxima execução:** ${currentStatus ? `<t:${nextExecutionTimestamp}:R>` : '`Função desativada.`'}\n` +
            `**Produtos existentes:** \`${todosProdutos.length}\`\n` +
            `**Status atual:** ${currentStatus ? '`Ativado`' : '`Desativado`'}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("setTimeRepost")
            .setLabel('Definir horário')
            .setEmoji('1371605573296193656')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!currentStatus),
        new ButtonBuilder()
            .setCustomId(currentStatus ? "desabilityRepost" : "enableRepost")
            .setLabel(currentStatus ? 'Desabilitar função' : 'Habilitar função')
            .setEmoji('1371605573296193656')
            .setStyle(currentStatus ? ButtonStyle.Danger : ButtonStyle.Success)
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_AcoesAutomaticsConfigs")
            .setEmoji('1371605354605051996')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('voltar1')
            .setEmoji('1371605354605051996')
            .setStyle(1)
    );

    container.addActionRowComponents(row2);
    container.addActionRowComponents(botoesvoltar);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

module.exports = { AcoesRepostAutomatics }
