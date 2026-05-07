const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { configuracao, produtos } = require("../../DataBaseJson");
const { agendarRepostagem } = require("../../Functions/repostagem");
const moment = require('moment-timezone');
const { AcoesRepostAutomatics } = require('../../Functions/ConfigRepostAuto');

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        if (interaction.isButton()) {
            if (interaction.customId === 'setTimeRepost') {
                const modal = new ModalBuilder()
                    .setCustomId('timeRepostModal')
                    .setTitle('Definir Horário de Repostagem');

                const timeInput = new TextInputBuilder()
                    .setCustomId('timeInput')
                    .setLabel('Horário (HH:MM)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: 14:30')
                    .setRequired(true);

                const actionRow = new ActionRowBuilder().addComponents(timeInput);
                modal.addComponents(actionRow);

                await interaction.showModal(modal);
            }
        }

        if (interaction.type === InteractionType.ModalSubmit) {
            if (interaction.customId === 'timeRepostModal') {
                const timeInput = interaction.fields.getTextInputValue('timeInput');
                const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

                if (!timeRegex.test(timeInput)) {
                    await AcoesRepostAutomatics(interaction, client);
                    await interaction.followUp({
                        content: `${Emojis.get(`negative_emoji`)} Formato de horário inválido. Use o formato HH:MM.`,
                        ephemeral: true
                    });
                    return;
                }

                configuracao.set(`Repostagem.Hora`, timeInput);

                agendarRepostagem(client);

                try {
                    await AcoesRepostAutomatics(interaction, client);
                    await interaction.followUp({
                        content: `${Emojis.get(`confirmed_emoji`)} Horário de repostagem atualizado para ${timeInput}.`,
                        embeds: [],
                        components: [],
                        ephemeral: true
                    });
                } catch (error) {
                    await AcoesRepostAutomatics(interaction, client);
                    await interaction.followUp({
                        content: `${Emojis.get(`confirmed_emoji`)} Horário de repostagem atualizado para ${timeInput}`,
                        ephemeral: true
                    });
                }
            }
        }
    }
};

async function createUpdatedEmbed(interaction, client) {
    const repostagemHora = configuracao.get(`Repostagem.Hora`) || "00:01";
    const currentTime = moment.tz("America/Sao_Paulo");

    const [hours, minutes] = repostagemHora.split(':').map(Number);
    let nextExecutionTime = moment.tz("America/Sao_Paulo").set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

    if (nextExecutionTime.isBefore(currentTime)) {
        nextExecutionTime.add(1, 'day');
    }

    const nextExecutionTimestamp = Math.floor(nextExecutionTime.valueOf() / 1000);
    const currentStatus = configuracao.get(`Repostagem.Status`);
    const todosProdutos = await produtos.all();

    return new EmbedBuilder()
        .setColor(`${configuracao.get(`Cores.Principal`) == null ? '0cd4cc' : configuracao.get('Cores.Principal')}`)
        .setTitle(`Repostagem Automática`)
        .setDescription(`Seu ${client.user.username} vai repostar seus produtos periodicamente, apagando a mensagem antiga e enviando-a novamente, para evitar denúncias nas mensagens.  
**Observação:** O sistema ajustará automaticamente o intervalo e a frequência dos reposts, considerando o fluxo de interações e a quantidade de produtos postados.`)
        .addFields(
            { name: `Próxima execução`, value: currentStatus ? `\`${nextExecutionTime.format('DD/MM/YYYY HH:mm:ss')}\`` : '`Função desativada.`', inline: true },
            { name: `Produtos existentes`, value: `\`${todosProdutos.length}\``, inline: true },
            { name: `\u200B`, value: `\u200B`, inline: true },
            { name: `Tempo até a próxima execução`, value: currentStatus ? `<t:${nextExecutionTimestamp}:R>` : '`Função desativada.`' },
            { name: `Status atual`, value: currentStatus ? '`Ativado 🟢`' : '`Desativado 🔴`', inline: true }
        )
        .setFooter(
            { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) }
        )
        .setTimestamp();
}

function createUpdatedRow(currentStatus) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("setTimeRepost")
                .setLabel('Definir horário')
                .setEmoji("1371593613665894562")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(false),
            new ButtonBuilder()
                .setCustomId(currentStatus ? "desabilityRepost" : "enableRepost")
                .setLabel(currentStatus ? 'Desabilitar função' : 'Habilitar função')
                .setEmoji(currentStatus ? "1371593615155134535" : "1371593609891283115")
                .setStyle(currentStatus ? ButtonStyle.Danger : ButtonStyle.Success)
        );
}
