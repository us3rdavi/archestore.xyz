const {
    ActionRowBuilder, StringSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../DataBaseJson");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function moedaConfig(interaction, client) {
    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_money_emoji')} Configuração de Moeda\n` +
            `Selecione a moeda padrão para os pagamentos do servidor.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const selectRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('selectMoedaC')
            .addOptions(
                {
                    value: 'realBRL',
                    label: 'Real Brasileiro (BRL)',
                    description: 'Pagamentos em Real Brasileiro via Pix/EFI',
                    emoji: { id: '1501803982849445998' }
                },
                {
                    value: 'dolarUSD',
                    label: 'Dólar Americano (indisponível)',
                    description: 'Em breve disponível',
                    emoji: { id: '1501803982849445998' }
                }
            )
            .setPlaceholder('Clique aqui para selecionar a moeda')
            .setMaxValues(1)
    );

    container.addActionRowComponents(selectRow);

    await interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

module.exports = { moedaConfig }
