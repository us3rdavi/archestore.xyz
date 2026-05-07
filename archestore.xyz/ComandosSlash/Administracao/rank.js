const {
    ApplicationCommandType, ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { pedidos, pagamentos, carrinhos, configuracao, produtos, Emojis } = require("../../DataBaseJson");
const { EstatisticasKing } = require("../../index.js");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

module.exports = {
    name: "rank",
    description: "Use para ver a classificação de gastos do servidor",
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction, message) => {
        const rank = await EstatisticasKing.Ranking(10000, 'valorTotal');

        if (rank.length === 0) {
            return interaction.reply({ content: `${Emojis.get('negative_emoji')} Não há dados suficientes para gerar um ranking.`, ephemeral: true });
        }

        const pageSize = 10;
        const totalPages = Math.ceil(rank.length / pageSize);
        let page = 1;

        const buildContainer = () => {
            const startIdx = (page - 1) * pageSize;
            const endIdx = startIdx + pageSize;
            const currentPage = rank.slice(startIdx, endIdx);

            let msg = '';
            for (let index = 0; index < currentPage.length; index++) {
                const element = currentPage[index];
                msg += `**${startIdx + index + 1}.** <@!${element.userID}>, total de \`R$ ${Number(element.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\` gastos e \`${element.qtdCompraTotal}\` pedido(s).\n`;
            }

            const container = new ContainerBuilder();
            container.setAccentColor(getAccentColor());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## Ranking de gastos\n${msg}`)
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('previous').setEmoji('1191798275616018432').setStyle(2),
                new ButtonBuilder().setCustomId('info').setLabel(`${page}/${totalPages}`).setStyle(2).setDisabled(true),
                new ButtonBuilder().setCustomId('next').setEmoji('1191798327596032102').setStyle(2)
            );

            container.addActionRowComponents(row);
            return container;
        };

        await interaction.reply({
            components: [buildContainer()],
            flags: MessageFlags.IsComponentsV2,
            embeds: [],
            ephemeral: true
        }).then(msg => {
            const filter = i => {
                i.deferUpdate();
                return i.customId === 'previous' || i.customId === 'next';
            };

            const collector = msg.createMessageComponentCollector({ filter, time: 120000 });

            collector.on('collect', async i => {
                if (i.customId === 'previous' && page > 1) page--;
                else if (i.customId === 'next' && page < totalPages) page++;
                await interaction.editReply({
                    components: [buildContainer()],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: []
                });
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ components: [], embeds: [], content: 'Seu tempo expirou. Utilize /rank novamente.' });
                }
            });
        });
    }
}
