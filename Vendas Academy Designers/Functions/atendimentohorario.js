const { RoleSelectMenuBuilder, EmbedBuilder, InteractionType, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const { JsonDatabase } = require('wio.db');
const { tickets, configuracao } = require("../DataBaseJson/index")

async function Atendimentohorario(interaction, client) {

    const atendimentohorario24 = tickets.get(`statushorario`) || false;

    const embed = new EmbedBuilder()
    .setAuthor({ name: 'Horario Atendimento', iconURL: `https://cdn.discordapp.com/emojis/1250148517368959089.png?size=2048` })
    .setDescription(`**Configure o horario de atendimento, Ex: \`10:00\` ate as \`19:00\`, Quando o __cliente__ tente abrir fora do horário de expediente não criará um ticket.**`)
    .setThumbnail(`https://cdn.discordapp.com/attachments/1345901017513853010/1350680766903746590/dreamapps-ezgif.com-video-to-gif-converter.gif?ex=67d79efd&is=67d64d7d&hm=18e792aedd90fd83b2afa151ce3894b6c3fab6fbd7fe981c9e0b2fce29a08b42&`)
    .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
    .addFields(
        { name: '**\`Status\`**', value: atendimentohorario24 ? 'On' : 'Off' },
        { name: '**\`Horario de Abertura\`**', value: `\`${tickets.get("horarioAbertura") || `Não Definido`}\`` },
        { name: '**\`Horario de Fechamento\`**', value: `\`${tickets.get("horarioFechamento") || `Não Definido`}\`` },
    )
    .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("onoffatendimentohorario24")
            .setLabel(atendimentohorario24 ? "On" : "Off")
            .setEmoji(atendimentohorario24 ? "1371593609891283115" : "1371593615155134535")
            .setStyle(atendimentohorario24 ? 3 : 4),
        new ButtonBuilder()
            .setCustomId("confighorarioatendimento24")
            .setLabel("Configurar")
            .setEmoji("1371593610339942493")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("painelconfigticket")
            .setLabel('Voltar')
            .setEmoji("1371593637179297923")
            .setStyle(2),
    )

    await interaction.update({ embeds: [embed], components: [row], ephemeral: true })

}

module.exports = {
    Atendimentohorario
};
