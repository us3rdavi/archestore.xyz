const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { EstatisticasKing } = require("../index.js");
const { configuracao } = require("../Database");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function profileuser(interaction, userID = null) {
    if (!userID) userID = interaction.user.id;

    const PrimeiraCompra = await EstatisticasKing.FirstOrder(userID);
    const UltimaCompra = await EstatisticasKing.LastOrder(userID);
    const rendimento = await EstatisticasKing.Ranking(10, 'valorTotal', userID);

    if (PrimeiraCompra == null) return interaction.reply({ content: `Sem dados salvos`, ephemeral: true });

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## Perfil de ${interaction.user.username}\n` +
            `**Valor total gasto:** \`R$ ${Number(rendimento.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`\n` +
            `**Pedidos aprovados:** \`${rendimento.qtdCompraTotal}\`\n` +
            `**Posição no rank:** \`${rendimento.posicao}\`\n` +
            `**Primeira compra:** <t:${Math.ceil(PrimeiraCompra.data.data / 1000)}:R>\n` +
            `**Última compra:** <t:${Math.ceil(UltimaCompra.data.data / 1000)}:R>`
        )
    );

    interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        embeds: [],
        ephemeral: true
    });
}

module.exports = { profileuser }
