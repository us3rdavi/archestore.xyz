const {
    ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { tickets } = require("../DataBaseJson/index");
const emojis = require("../DataBaseJson/Emojis.json");
const Emojis = { get: (name) => emojis[name] || "" };

async function Atendimentohorario(interaction, client) {
    const atendimentohorario24 = tickets.get(`statushorario`) || false;

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## Horário de Atendimento`)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const abertura = tickets.get("horarioAbertura") || 'Não Definido';
    const fechamento = tickets.get("horarioFechamento") || 'Não Definido';

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**Configure o horario de atendimento, Ex: \`10:00\` ate as \`19:00\`, Quando o __cliente__ tente abrir fora do horário de expediente não criará um ticket.**\n\n` +
            `**Status:** \`${atendimentohorario24 ? 'On' : 'Off'}\`\n` +
            `**Horário de Abertura:** \`${abertura}\`\n` +
            `**Horário de Fechamento:** \`${fechamento}\``
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

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
    );

    container.addActionRowComponents(row);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

module.exports = {
    Atendimentohorario
};
