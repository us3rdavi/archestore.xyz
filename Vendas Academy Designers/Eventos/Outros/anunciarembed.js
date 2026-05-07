const { ModalBuilder, TextInputBuilder, StringSelectMenuBuilder, ButtonStyle, ButtonBuilder, TextInputStyle, ActionRowBuilder, ChannelSelectMenuBuilder, EmbedBuilder } = require("discord.js");
const { dbembed } = require("../../DataBaseJson/index.js");
const { anunciarembed24 } = require("../../Functions/anunciar.js");

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        // Definir Embed - Abre o Select Menu
        // Configurar Embed
        if (customId === "msgembed24") {
            const selectMenu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("selectEmbedOption")
                    .setPlaceholder("Escolha uma opção")
                    .addOptions([
                        { label: 'Título', value: 'embedTitle', emoji: '1270780955925155953' },
                        { label: 'Descrição', value: 'embedDescription', emoji: '1270780955925155953' },
                        { label: 'Cor', value: 'embedColor', emoji: '1270780955925155953' },
                        { label: 'Imagem', value: 'embedImage', emoji: '1270780955925155953' },
                        { label: 'Thumbnail', value: 'embedThumbnail', emoji: '1270780955925155953' },
                        { label: 'Footer', value: 'embedFooter', emoji: '1270780955925155953' },
                        { label: 'Ícone do Footer', value: 'embedFooterIcon', emoji: '1270780955925155953' },
                    ])
            );

            await interaction.reply({ content: "** ✔ | Use o select menu abaixo para configurar:**", components: [selectMenu], ephemeral: true });
        }

        if (customId === "atualizarembed2444") {

            await anunciarembed24(interaction, client)
        }

        // Modal para cada opção do Select Menu
        if (interaction.isStringSelectMenu() && interaction.customId === "selectEmbedOption") {
            const selected = interaction.values[0];
            const modal = new ModalBuilder().setCustomId(`definirEmbed_${selected}`).setTitle("Definir Embed");

            const inputField = new TextInputBuilder()
                .setCustomId(selected)
                .setLabel(`Defina o ${selected.replace('embed', '')}`)
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(inputField));
            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit()) {
            const customIdPrefix = "definirEmbed_";
            if (interaction.customId.startsWith(customIdPrefix)) {
                const fieldKey = interaction.customId.replace(customIdPrefix, '');
                let fieldValue = interaction.fields.getTextInputValue(fieldKey);

                fieldValue = fieldValue.replace(/\n/g, '\n');
        
                dbembed.set(`embed.${fieldKey.replace('embed', '').toLowerCase()}`, fieldValue);
                await interaction.reply({ content: '**✔ | Alteração feita com sucesso**', ephemeral: true });
            }
        }
        

        if (customId === "adicionarbotaoembed") {
            const modal = new ModalBuilder()
                .setCustomId("adicionarbotaoembed2")
                .setTitle("Adicionar Botão na Embed");

            const nameInput = new TextInputBuilder()
                .setCustomId("nameButtonEmbed")
                .setLabel("Título do Botão")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const urlInput = new TextInputBuilder()
                .setCustomId("linkButtonEmbed")
                .setLabel("URL do Botão")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const emojiInput = new TextInputBuilder()
                .setCustomId("emojiButtonEmbed")
                .setLabel("Emoji do Botão")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(urlInput),
                new ActionRowBuilder().addComponents(emojiInput)
            );

            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === "adicionarbotaoembed2") {
                const buttonName = interaction.fields.getTextInputValue("nameButtonEmbed");
                const buttonURL = interaction.fields.getTextInputValue("linkButtonEmbed");
                const buttonEmoji = interaction.fields.getTextInputValue("emojiButtonEmbed");

                dbembed.set("button.name", buttonName);
                dbembed.set("button.url", buttonURL);
                dbembed.set("button.emoji", buttonEmoji);

                await anunciarembed24(interaction, client);
            }
        }

        if (customId === "previewembed") {
            const title = dbembed.get("embed.title");
            const description = dbembed.get("embed.description");
            const color = dbembed.get("embed.color");
            const image = dbembed.get("embed.image");
            const thumbnail = dbembed.get("embed.thumbnail");
            const footer = dbembed.get("embed.footer");
            const footerIcon = dbembed.get("embed.footerIcon");

            const buttonName = dbembed.get("button.name");
            const buttonURL = dbembed.get("button.url");
            const buttonEmoji = dbembed.get("button.emoji");

            const embed = new EmbedBuilder()
                .setTitle(title || null)
                .setDescription(description)
                .setColor(color || null)
                .setImage(image || null)
                .setThumbnail(thumbnail || null)
                .setFooter(footer ? { text: footer, iconURL: footerIcon || null } : null);

            const row = new ActionRowBuilder();
            if (buttonName && buttonURL && buttonEmoji) {
                const button = new ButtonBuilder()
                    .setLabel(buttonName)
                    .setURL(buttonURL)
                    .setEmoji(buttonEmoji)
                    .setStyle(ButtonStyle.Link);
                row.addComponents(button);
            }

            await interaction.reply({ embeds: [embed], components: row.components.length > 0 ? [row] : [], ephemeral: true });
        }

        if (customId === "postarembed") {
            const canalMenu = new ChannelSelectMenuBuilder()
                .setCustomId("selectcanalembed")
                .setPlaceholder("Selecione um canal")
                .setChannelTypes([0]);

            const row = new ActionRowBuilder().addComponents(canalMenu);

            await interaction.reply({ content: "**💬 | Selecione o canal onde deseja postar a embed:**", components: [row], ephemeral: true });
        }

        if (interaction.isChannelSelectMenu() && interaction.customId === "selectcanalembed") {
            const canal = interaction.guild.channels.cache.get(interaction.values[0]);

            const title = dbembed.get("embed.title");
            const description = dbembed.get("embed.description");
            const color = dbembed.get("embed.color");
            const image = dbembed.get("embed.image");
            const thumbnail = dbembed.get("embed.thumbnail");
            const footer = dbembed.get("embed.footer");
            const footerIcon = dbembed.get("embed.footerIcon");

            const buttonName = dbembed.get("button.name");
            const buttonURL = dbembed.get("button.url");
            const buttonEmoji = dbembed.get("button.emoji");

            const embed = new EmbedBuilder()
                .setTitle(title || null)
                .setDescription(description)
                .setColor(color || null)
                .setImage(image || null)
                .setThumbnail(thumbnail || null)
                .setFooter(footer ? { text: footer, iconURL: footerIcon || null } : null);

            const row = new ActionRowBuilder();
            if (buttonName && buttonURL && buttonEmoji) {
                const button = new ButtonBuilder()
                    .setLabel(buttonName)
                    .setURL(buttonURL)
                    .setEmoji(buttonEmoji)
                    .setStyle(ButtonStyle.Link);
                row.addComponents(button);
            }

            await canal.send({ embeds: [embed], components: row.components.length > 0 ? [row] : [] });
            await interaction.reply({ content: `${Emojis.get(`confirmed_emoji`)} | Embed enviada com sucesso!`, ephemeral: true });
        }

        if (customId === "resetarembed") {
            dbembed.delete("embed");
            dbembed.delete("button");

            await interaction.reply({ content: "**🗑️ | Embed resetada com sucesso!**", ephemeral: true });
            await anunciarembed24(interaction, client);
        }
    }
};
