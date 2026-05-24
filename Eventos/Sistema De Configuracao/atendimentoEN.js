const {
    ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags
} = require("discord.js");
const { tickets } = require("../../Database");
const emojis = require("../../Database/emojis.json");
const moment = require("moment-timezone");

const Emojis = { get: (name) => emojis[name] || "" };

async function AtendimentohorarioEN(interaction) {
    const ativo      = tickets.get('en_statushorario') || false;
    const abertura   = tickets.get('en_horarioAbertura')  || 'Not set';
    const fechamento = tickets.get('en_horarioFechamento') || 'Not set';

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('clock_emoji')} Service Hours (EN)\n` +
            `-# Set the period during which users can open tickets.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const statusEmoji = ativo ? Emojis.get('confirmed_emoji') : Emojis.get('negative_emoji');
    const statusLabel = ativo ? 'Enabled' : 'Disabled';

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `${statusEmoji} **Status:** \`${statusLabel}\`\n` +
            `${Emojis.get('_add_emoji')} **Opening:** \`${abertura}\`\n` +
            `${Emojis.get('_trash_emoji')} **Closing:** \`${fechamento}\`\n\n` +
            `-# When enabled, tickets can only be opened within the configured hours (Brasília time).`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('en_onoffatendimentohorario24')
                .setLabel(ativo ? 'Disable' : 'Enable')
                .setEmoji(ativo ? '1501803935453679616' : '1501803932484108359')
                .setStyle(ativo ? 4 : 3),
            new ButtonBuilder()
                .setCustomId('en_confighorarioatendimento24')
                .setLabel('Configure Hours')
                .setEmoji('1501803905363869769')
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('en_painelconfigticket')
                .setLabel('Back')
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

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        if (customId === 'en_onoffatendimentohorario24') {
            const atualstatus  = tickets.get("en_statushorario");
            const mudarstatus  = !atualstatus;
            tickets.set("en_statushorario", mudarstatus);
            await AtendimentohorarioEN(interaction);
        }

        if (customId === "en_confighorarioatendimento24") {
            const modal = new ModalBuilder()
                .setCustomId("en_Configatendimentomodal")
                .setTitle("Configure Service Hours");

            const horario1 = new TextInputBuilder()
                .setCustomId("en_confighorarioabertura")
                .setLabel("Opening Time")
                .setPlaceholder("E.g.: 08:00")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const horario2 = new TextInputBuilder()
                .setCustomId("en_confighorariofechamento")
                .setLabel("Closing Time")
                .setPlaceholder("E.g.: 18:00")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(horario1),
                new ActionRowBuilder().addComponents(horario2)
            );

            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit() && interaction.customId === "en_Configatendimentomodal") {
            const abertura   = interaction.fields.getTextInputValue("en_confighorarioabertura");
            const fechamento = interaction.fields.getTextInputValue("en_confighorariofechamento");

            const validotime = (time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

            if (!validotime(abertura) || !validotime(fechamento)) {
                await interaction.reply({
                    content: "**The time format is incorrect. Please enter in HH:mm format (e.g.: __`08:00`__ or __`18:30`__).**",
                    ephemeral: true
                });
                return;
            }

            const aberturaBR   = moment.tz(abertura,   "HH:mm", "America/Sao_Paulo").format("HH:mm");
            const fechamentoBR = moment.tz(fechamento, "HH:mm", "America/Sao_Paulo").format("HH:mm");
            tickets.set("en_horarioAbertura",   aberturaBR);
            tickets.set("en_horarioFechamento", fechamentoBR);

            await AtendimentohorarioEN(interaction);
        }
    }
};
