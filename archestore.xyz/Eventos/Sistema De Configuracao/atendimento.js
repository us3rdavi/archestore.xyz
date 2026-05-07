const { configuracao, tickets } = require("../../DataBaseJson");
const { ModalBuilder, TextInputBuilder, EmbedBuilder, ButtonBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { Atendimentohorario } = require("../../Functions/atendimentohorario.js");
const moment = require("moment-timezone"); // Importa o moment-timezone para lidar com o fuso horário

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        if (customId === `onoffatendimentohorario24`) {
            const atualstatus = tickets.get("statushorario");
            const mudarstatus = !atualstatus;

            tickets.set("statushorario", mudarstatus);
        
            const atendimentohorario24 = tickets.get(`statushorario`) || false;

            Atendimentohorario(interaction, client)
        }

        if (customId === "confighorarioatendimento24") {
            const modal = new ModalBuilder()
                .setCustomId("Configatendimentomodal")
                .setTitle("Configurar Horario De Atendimento");

            const horario1 = new TextInputBuilder()
                .setCustomId("confighorarioabertura")
                .setLabel("Horario De Abertura")
                .setPlaceholder("Ex: 00:00")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const horario2 = new TextInputBuilder()
                .setCustomId("confighorariofechamento")
                .setLabel("Horario De Fechamento")
                .setPlaceholder("Ex: 00:00")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const row24 = new ActionRowBuilder().addComponents(horario1);
            const row244 = new ActionRowBuilder().addComponents(horario2);

            modal.addComponents(row24, row244);

            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === "Configatendimentomodal") {
                const abertura = interaction.fields.getTextInputValue("confighorarioabertura");
                const fechamento = interaction.fields.getTextInputValue("confighorariofechamento");

                const validotime24 = (time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);


                if (!validotime24(abertura) || !validotime24(fechamento)) {
                    await interaction.reply({
                        content: "**⚠️ | O formato do horário está incorreto. Por favor, insira no formato HH:mm (ex: __\`08:00\`__ ou __\`18:30\`__).**",
                        ephemeral: true
                    });
                    return;
                }
                const aberturaBR = moment.tz(abertura, "HH:mm", "America/Sao_Paulo").format("HH:mm");
                const fechamentoBR = moment.tz(fechamento, "HH:mm", "America/Sao_Paulo").format("HH:mm");
                tickets.set("horarioAbertura", aberturaBR);
                tickets.set("horarioFechamento", fechamentoBR);

                await Atendimentohorario(interaction, client);
            }
        }    
    }        
}
