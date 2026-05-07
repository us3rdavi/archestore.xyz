const { configuracao } = require("../../DataBaseJson");
const { ModalBuilder, TextInputBuilder, EmbedBuilder, ButtonBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { autoreact24 } = require("../../Functions/Autoreactfunction");

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        if (customId === `${interaction.user.id}_onoff`) {
            const atualstatus = configuracao.get("AutoReact.status");
            const mudarstatus = !atualstatus;

            configuracao.set("AutoReact.status", mudarstatus);
        
            const autoReactStatus = configuracao.get(`AutoReact.status`) || false;
            const autoReactEmoji = configuracao.get(`AutoReact.Emoji`) || "Nenhum Emoji";
            const autoReactCanais = configuracao.get(`AutoReact.Canais`) || ["Nenhum canal configurado"];
        
            const embed24 = new EmbedBuilder()
                .setColor(`${configuracao.get('Cores.Principal') || '0cd4cc'}`)
                .setTitle("Auto Reação - Sistema")
                .setAuthor({ name: "Auto Reação - Sistema", iconURL: 'https://cdn.discordapp.com/emojis/1269773226960093184.png?size=2048' })
                .setDescription("> ** Sistema de auto reação configurável.**")
                .addFields(
                    { name: `**Status**`, value: `\`\`${autoReactStatus ? "Desligado" : "Ligado"}\`\``, inline: true },
                    { name: `**Emoji**`, value: `${autoReactEmoji}`, inline: true },
                    { name: `**Canais**`, value: `\`\`${autoReactCanais.join(", ")}\`\``, inline: true },
                )
                .setFooter({ text: "Auto Reação", iconURL: 'https://cdn.discordapp.com/emojis/1242617727911460933.gif?size=2048' })
                .setTimestamp();

            const botaostyolo = mudarstatus ? 4 : 3;
            const botaoemoji = mudarstatus ? "1371569230901936258" : "1371568433321214092";

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`${interaction.user.id}_onoff`)
                    .setEmoji(botaoemoji)
                    .setStyle(botaostyolo),
                new ButtonBuilder()
                    .setCustomId("configautoreact")
                    .setLabel("Configurar Auto Reação")
                    .setStyle(2)
                    .setEmoji("<:_lapis_emoji:1371605431868457032>"),
                new ButtonBuilder()
                    .setCustomId("resetautoreact")
                    .setLabel("Resetar Configuração")
                    .setStyle(4)
                    .setEmoji("<:_trash_emoji:1371605645597478953>"),
                new ButtonBuilder()
                    .setCustomId("atualizarembed24")
                    .setLabel("Aplicar alterações")
                    .setStyle(2)
                    .setEmoji("<:_fixe_emoji:1371605411777482803>"),
                new ButtonBuilder()
                    .setCustomId("eaffaawwawa")
                    .setEmoji("1371605354605051996")
                    .setLabel('Voltar')
                    .setStyle(2)
            );

            await interaction.update({ embeds: [embed24], components: [row] });
        }
        
        if (customId === "configautoreact") {
            const modal = new ModalBuilder()
                .setCustomId("configAutoReactModal")
                .setTitle("Configurar Auto Reação");

            const emojiInput = new TextInputBuilder()
                .setCustomId("autoReactEmojiInput")
                .setLabel("Digite o emoji para Auto Reação")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const channelsInput = new TextInputBuilder()
                .setCustomId("autoReactChannelsInput")
                .setLabel("IDs dos canais (separados por vírgula)")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(emojiInput);
            const secondActionRow = new ActionRowBuilder().addComponents(channelsInput);

            modal.addComponents(firstActionRow, secondActionRow);

            await interaction.showModal(modal);
        }

        if (customId === "resetautoreact") {
            configuracao.delete(`AutoReact.Emoji`);
            configuracao.delete(`AutoReact.Canais`);

            const atualstatus = configuracao.get("AutoReact.status");
            const mudarstatus = !atualstatus;
        
            const autoReactStatus = configuracao.get(`AutoReact.status`) || false;
            const autoReactEmoji = configuracao.get(`AutoReact.Emoji`) || "Nenhum Emoji";
            const autoReactCanais = configuracao.get(`AutoReact.Canais`) || ["Nenhum canal configurado"];
        
            const embed24 = new EmbedBuilder()
                .setColor(`${configuracao.get('Cores.Principal') || '0cd4cc'}`)
                .setTitle("Auto Reação - Sistema")
                .setAuthor({ name: "Auto Reação - Sistema", iconURL: 'https://cdn.discordapp.com/emojis/1269773226960093184.png?size=2048' })
                .setDescription("> ** Sistema de auto reação configurável.**")
                .addFields(
                    { name: `**Status**`, value: `\`\`${autoReactStatus ? "Desligado" : "Ligado"}\`\``, inline: true },
                    { name: `**Emoji**`, value: `${autoReactEmoji}`, inline: true },
                    { name: `**Canais**`, value: `\`\`${autoReactCanais.join(", ")}\`\``, inline: true },
                )
                .setFooter({ text: "Auto Reação", iconURL: 'https://cdn.discordapp.com/emojis/1242617727911460933.gif?size=2048' })
                .setTimestamp();

            const botaostyolo = mudarstatus ? 4 : 3;
            const botaoemoji = mudarstatus ? "1371569230901936258" : "1371568433321214092";

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`${interaction.user.id}_onoff`)
                    .setEmoji(botaoemoji)
                    .setStyle(botaostyolo),
                new ButtonBuilder()
                    .setCustomId("configautoreact")
                    .setLabel("Configurar Auto Reação")
                    .setStyle(2)
                    .setEmoji("<:_lapis_emoji:1371605431868457032>"),
                new ButtonBuilder()
                    .setCustomId("resetautoreact")
                    .setLabel("Resetar Configuração")
                    .setStyle(4)
                    .setEmoji("<:_trash_emoji:1371605645597478953>"),
                new ButtonBuilder()
                    .setCustomId("atualizarembed24")
                    .setLabel("Aplicar alterações")
                    .setStyle(2)
                    .setEmoji("<:_fixe_emoji:1371605411777482803>"),
                new ButtonBuilder()
                    .setCustomId("eaffaawwawa")
                    .setEmoji("1371605354605051996")
                    .setLabel('Voltar')
                    .setStyle(2)
            );

            await interaction.update({ embeds: [embed24], components: [row] });
        }

        if (customId === "atualizarembed24") {
            const atualstatus = configuracao.get("AutoReact.status");
            const mudarstatus = !atualstatus;
        
            const autoReactStatus = configuracao.get(`AutoReact.status`) || false;
            const autoReactEmoji = configuracao.get(`AutoReact.Emoji`) || "Nenhum Emoji";
            const autoReactCanais = configuracao.get(`AutoReact.Canais`) || ["Nenhum canal configurado"];
        
            const embed24 = new EmbedBuilder()
                .setColor(`${configuracao.get('Cores.Principal') || '0cd4cc'}`)
                .setTitle("Auto Reação - Sistema")
                .setAuthor({ name: "Auto Reação - Sistema", iconURL: 'https://cdn.discordapp.com/emojis/1269773226960093184.png?size=2048' })
                .setDescription("> ** Sistema de auto reação configurável.**")
                .addFields(
                    { name: `**Status**`, value: `\`\`${autoReactStatus ? "Desligado" : "Ligado"}\`\``, inline: true },
                    { name: `**Emoji**`, value: `${autoReactEmoji}`, inline: true },
                    { name: `**Canais**`, value: `\`\`${autoReactCanais.join(", ")}\`\``, inline: true },
                )
                .setFooter({ text: "Auto Reação", iconURL: 'https://cdn.discordapp.com/emojis/1242617727911460933.gif?size=2048' })
                .setTimestamp();

            const botaostyolo = mudarstatus ? 4 : 3;
            const botaoemoji = mudarstatus ? "1371569230901936258" : "1371568433321214092";

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`${interaction.user.id}_onoff`)
                    .setEmoji(botaoemoji)
                    .setStyle(botaostyolo),
                new ButtonBuilder()
                    .setCustomId("configautoreact")
                    .setLabel("Configurar Auto Reação")
                    .setStyle(2)
                    .setEmoji("<:_lapis_emoji:1371605431868457032>"),
                new ButtonBuilder()
                    .setCustomId("resetautoreact")
                    .setLabel("Resetar Configuração")
                    .setStyle(4)
                    .setEmoji("<:_trash_emoji:1371605645597478953>"),
                new ButtonBuilder()
                    .setCustomId("atualizarembed24")
                    .setLabel("Aplicar alterações")
                    .setStyle(2)
                    .setEmoji("<:_fixe_emoji:1371605411777482803>"),
                new ButtonBuilder()
                    .setCustomId("eaffaawwawa")
                    .setEmoji("1371605354605051996")
                    .setLabel('Voltar')
                    .setStyle(2)
            );

            await interaction.update({ embeds: [embed24], components: [row] });
        }
        if (interaction.isModalSubmit()) {
            if (interaction.customId === "configAutoReactModal") {
                const autoReactEmojiInput = interaction.fields.getTextInputValue("autoReactEmojiInput");
                const autoReactChannelsInput = interaction.fields.getTextInputValue("autoReactChannelsInput");
        
                const emojiRegex = /^<a?:\w+:\d+>$|^(\p{Extended_Pictographic})$/u;
                const emojivalido24 = emojiRegex.test(autoReactEmojiInput);
        
                let emojiNoServer24 = true;
        
                if (emojivalido24 && autoReactEmojiInput.startsWith("<:")) {
                    const emojiId = autoReactEmojiInput.match(/\d+/)[0];
                    emojiNoServer24 = client.emojis.cache.has(emojiId);
                }
        
                const channelsArray = autoReactChannelsInput.split(",").map(id => id.trim());
                const invalidoscanais24 = channelsArray.filter(id => !client.channels.cache.has(id));
        
                if (!emojivalido24 || !emojiNoServer24 || invalidoscanais24.length > 0) {
                    const Embedawrn24 = new EmbedBuilder()
                        .setColor("Blue")
                        .setAuthor({ name: 'Aviso de erro', iconURL: 'https://cdn.discordapp.com/emojis/1254504392132919399.png?size=2048' })
                        .setDescription(`> **Foram encontrados os seguintes problemas: **\n${!emojivalido24 ? "- O emoji inserido não é válido.\n" : ""}${!emojiNoServer24 ? "- O emoji não está disponível no servidor.\n" : ""}${invalidoscanais24.length > 0 ? `- Os IDs de canais a seguir são inválidos: ${invalidoscanais24.join(", ")}\n` : ""}**Por favor, corrija e tente novamente.**`);
        
                    return await interaction.reply({ embeds: [Embedawrn24], ephemeral: true });
                }
        
                configuracao.set("AutoReact.Emoji", autoReactEmojiInput);
                configuracao.set("AutoReact.Canais", channelsArray);
        
                await autoreact24(interaction, client);
            }
        }        
    },
};
