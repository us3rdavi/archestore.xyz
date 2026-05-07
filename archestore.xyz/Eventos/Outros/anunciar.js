const { ModalBuilder, TextInputBuilder, ButtonStyle, ButtonBuilder, TextInputStyle, ActionRowBuilder, ChannelSelectMenuBuilder } = require("discord.js");
const { dbembed } = require("../../DataBaseJson/index.js");
const { anunciar } = require("../../Functions/anunciar.js");

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        if (customId === "msgcontent") {
            const modal = new ModalBuilder()
                .setCustomId("definirMensagem")
                .setTitle("Definir Mensagem");

            const mensagemInput = new TextInputBuilder()
                .setCustomId("mensagemContent")
                .setLabel("INSIRA O CONTEÚDO DA MENSAGEM")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const imageInput = new TextInputBuilder()
                .setCustomId("imagemContent")
                .setLabel("INSIRA A URL DA IMAGEM (Opcional)")
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            const actionRowMensagem = new ActionRowBuilder().addComponents(mensagemInput);
            const actionRowImagem = new ActionRowBuilder().addComponents(imageInput);

            modal.addComponents(actionRowMensagem, actionRowImagem);

            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === "definirMensagem") {
                const mensagemContent = interaction.fields.getTextInputValue("mensagemContent").replace(/\\n/g, "\n");
                const imagemContent = interaction.fields.getTextInputValue("imagemContent");
                const imagemValida = /\.(jpeg|jpg|gif|png|webp|bmp|svg|tiff|ico)(\?.*)?$/i.test(imagemContent);
        
                if (imagemContent && !imagemValida) {
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} URL da imagem inválida. Por favor, insira uma URL de imagem válida.`, ephemeral: true });
                }
        
                dbembed.set("content.mensagem", mensagemContent);
                if (imagemContent) dbembed.set("content.imagem", imagemContent);
        
                await anunciar(interaction, client);
            }
        }
        

        if (customId === "adicionarbotao") {
            const modal = new ModalBuilder()
                .setCustomId("adicionarbotao2")
                .setTitle("Definir Botão");

            const sla4 = new TextInputBuilder()
                .setCustomId("namebutton4")
                .setLabel("INSIRA O TÍTULO DO BOTÃO")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const sla24 = new TextInputBuilder()
                .setCustomId("linkbutton4")
                .setLabel("INSIRA A URL DO BOTÃO")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const sla244 = new TextInputBuilder()
                .setCustomId("emojibutton4")
                .setLabel("INSIRA O EMOJI DO BOTÃO")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const a24 = new ActionRowBuilder().addComponents(sla4);
            const a244 = new ActionRowBuilder().addComponents(sla244);
            const b24 = new ActionRowBuilder().addComponents(sla24);

            modal.addComponents(a24, a244, b24);

            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === "adicionarbotao2") {
                const nomebotao24 = interaction.fields.getTextInputValue("namebutton4");
                const linkbotao24 = interaction.fields.getTextInputValue("linkbutton4");
                const emoji24 = interaction.fields.getTextInputValue("emojibutton4");
        
                const emojiRegex = /^<a?:\w+:\d+>$|^(\p{Extended_Pictographic})$/u;
                const emojivalido24 = emojiRegex.test(emoji24);
                
                let emojiNoServer24 = true;
                
                if (emojivalido24 && emoji24.startsWith("<:")) {
                    const emojiId = emoji24.match(/\d+/)[0];
                    emojiNoServer24 = client.emojis.cache.has(emojiId);
                } else if (emojivalido24) {
                    emojiNoServer24 = false;
                }
        
                if (!emojivalido24) {
                    await interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O __emoji__ fornecido é inválido. Por favor, use um emoji válido.`, ephemeral: true });
                    return;
                }
        
                if (emojiNoServer24) {
                    await interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O __emoji__ fornecido não está disponível no servidor. Por favor, escolha um emoji que está no servidor.`, ephemeral: true });
                    return;
                }
        
                dbembed.set("contentbutton.botaonome", nomebotao24);
                dbembed.set("contentbutton.linkbotao", linkbotao24);
                dbembed.set("contentbutton.emojibotao", emoji24);
        
                await anunciar(interaction, client);
            }
        }
        
        if (customId === "previecontent") {
            const mensagem = dbembed.get("content.mensagem");
            const imagem = dbembed.get("content.imagem");
            const botaoNome = dbembed.get("contentbutton.botaonome");
            const linkBotao = dbembed.get("contentbutton.linkbotao");
            const emojiBotao = dbembed.get("contentbutton.emojibotao");

            if (!mensagem) {
                await interaction.reply({ content: `${Emojis.get(`negative_emoji`)} A __mensagem__ não está configurada. Por favor, configure a mensagem antes de enviá-la.`, ephemeral: true });
                return;
            }

            let content = mensagem;
            if (imagem) content += `\n${imagem}`;

            let row;
            if (botaoNome && linkBotao && emojiBotao) {
                const button = new ButtonBuilder()
                    .setLabel(botaoNome)
                    .setURL(linkBotao)
                    .setEmoji(emojiBotao)
                    .setStyle(ButtonStyle.Link);

                row = new ActionRowBuilder().addComponents(button);
            }

            if (row) {
                await interaction.reply({ content, components: [row], ephemeral: true });
            } else {
                await interaction.reply({ content, ephemeral: true });
            }

            await anunciar(interaction, client);
        }

        if (customId === "postarcontent") {
            const canalMenu = new ChannelSelectMenuBuilder()
                .setCustomId("selectcanal")
                .setPlaceholder("Selecione um canal")
                .setChannelTypes([0]);

            const row = new ActionRowBuilder().addComponents(canalMenu);

            await interaction.reply({ content: "**💬 | Selecione o canal onde deseja postar:**", components: [row], ephemeral: true });
        }

        if (interaction.isChannelSelectMenu() && interaction.customId === "selectcanal") {
            const canal = interaction.guild.channels.cache.get(interaction.values[0]);
        
            const mensagem = dbembed.get("content.mensagem");
            const imagem = dbembed.get("content.imagem");
            const botaoNome = dbembed.get("contentbutton.botaonome");
            const linkBotao = dbembed.get("contentbutton.linkbotao");
            const emojiBotao = dbembed.get("contentbutton.emojibotao");
        
            // Verifica se a mensagem está configurada
            if (!mensagem) {
                await interaction.reply({ content: `${Emojis.get(`negative_emoji`)} A __mensagem__ não está configurada. Por favor, configure a mensagem antes de enviá-la.`, ephemeral: true });
                return;
            }
        
            let content = mensagem;
            if (imagem) content += `\n${imagem}`;
        
            let row;
            if (botaoNome && linkBotao && emojiBotao) {
                const button = new ButtonBuilder()
                    .setLabel(botaoNome)
                    .setURL(linkBotao)
                    .setEmoji(emojiBotao)
                    .setStyle(ButtonStyle.Link);
        
                row = new ActionRowBuilder().addComponents(button);
            }
        
            if (row) {
                await canal.send({ content, components: [row] });
            } else {
                await canal.send({ content });
            }
        
            await interaction.update({ content: "**✔ | Mensagem enviada com sucesso!**", ephemeral: true });
        }
        // Resetar
        if (customId === "resetarcontent") {
            dbembed.delete("content.mensagem");
            dbembed.delete("content.imagem");
            dbembed.delete("contentbutton.botaonome");
            dbembed.delete("contentbutton.linkbotao");
            dbembed.delete("contentbutton.emojibotao");
            await anunciar(interaction, client);
        }
    }
};
