const { configuracao, tickets } = require("../../DataBaseJson");
const { ModalBuilder, TextInputBuilder, EmbedBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        const avaliacaoIds = ["1avaliacao24", "2avaliacao24", "3avaliacao24", "4avaliacao24", "5avaliacao24"];
        const avaliacaoNotas = {
            "1avaliacao24": "01",
            "2avaliacao24": "02",
            "3avaliacao24": "03",
            "4avaliacao24": "04",
            "5avaliacao24": "05"
        };

        if (avaliacaoIds.includes(customId)) {
            const modal = new ModalBuilder()
                .setCustomId(`feedbackModal_${customId}`)
                .setTitle("Avaliação de Atendimento");

            const feedback24 = new TextInputBuilder()
                .setCustomId("feedbackimput24")
                .setLabel("Digite a sua avaliação sobre o atendimento")
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder("Escreva seu feedback aqui...")
                .setRequired(true);

            const sla24 = new ActionRowBuilder().addComponents(feedback24);
            modal.addComponents(sla24);

            return await interaction.showModal(modal);
        }

        if (customId.startsWith("feedbackModal_")) {
            const feedback = interaction.fields.getTextInputValue("feedbackimput24");
        
            const feedbackChannelId24 = configuracao.get("ConfigChannels.feedbackticket");
        
            if (!feedbackChannelId24) {
                return await interaction.reply({ content: `> **Erro: Canal de feedback não configurado.**`, ephemeral: true });
            }
        
            const feedbackChannel24 = await client.channels.fetch(feedbackChannelId24).catch(() => null);
        
            if (!feedbackChannel24) {
                return await interaction.reply({ content: `> **Erro: Canal de feedback não encontrado ou inacessível.**`, ephemeral: true });
            }
        
            const customid24 = customId.split("_")[1];
            const nota24 = avaliacaoNotas[customid24] || "Nota Não Identificada";
        
            let assumidoPor = 'Ninguém';
            const embedDaMensagem = interaction.message.embeds[0];
        
            if (embedDaMensagem) {
                const assumidoPorField = embedDaMensagem.fields.find(field => field.name.includes("Assumido por"));
                if (assumidoPorField) {
                    assumidoPor = assumidoPorField.value;
                }
            }
        
            const embed = new EmbedBuilder()
                .setAuthor({ 
                    name: 'Sistema de Avaliação', 
                    iconURL: 'https://cdn.discordapp.com/emojis/1253516691636490301.gif?size=2048' 
                })
                .setDescription('**Os __\`Feedbacks\`__ São essenciais para contribuir com a melhoria contínua da loja**')
                .setThumbnail('https://cdn.discordapp.com/emojis/1058853531249037464.gif?size=2048')
                .setColor('#5865F2')
                .addFields(
                    { 
                        name: '⭐ | **Nota**', 
                        value: `**${nota24}/05**`, 
                        inline: true 
                    },
                    { 
                        name: '💬 | **Feedback**', 
                        value: `**\`${feedback}\`**`, 
                        inline: true 
                    },
                    { 
                        name: '👥 | **Assumido por**', 
                        value: `**${assumidoPor}**`, 
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `Enviado por ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
                })
                .setTimestamp()
                .setImage('https://cdn.discordapp.com/attachments/1108614550512287744/1128391021459640410/visual.png');
            
        
            await feedbackChannel24.send({ embeds: [embed] });
        
            await interaction.update({ content: `** > ✔ | Enviado com sucesso**`, components: [] });
        }
        

    },
};
