const { configuracao } = require("../../DataBaseJson");
const {
    ModalBuilder, TextInputBuilder, ButtonBuilder, TextInputStyle, ActionRowBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { autoreact24 } = require("../../Functions/Autoreactfunction");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

function buildAutoReactContainer(interaction, mudarstatus) {
    const autoReactStatus = configuracao.get('AutoReact.status') || false;
    const autoReactEmoji = configuracao.get('AutoReact.Emoji') || 'Nenhum Emoji';
    const autoReactCanais = configuracao.get('AutoReact.Canais') || ['Nenhum canal configurado'];

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## Auto Reação — Sistema\nSistema de auto reação configurável.\n\n` +
            `**Status:** \`${autoReactStatus ? 'Ligado' : 'Desligado'}\`\n` +
            `**Emoji:** ${autoReactEmoji}\n` +
            `**Canais:** \`${autoReactCanais.join(', ')}\``
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const botaostyolo = autoReactStatus ? 4 : 3;
    const botaoemoji = autoReactStatus ? "1501803932484108359" : "1501803935453679616";

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${interaction.user.id}_onoff`).setEmoji(botaoemoji).setStyle(botaostyolo),
            new ButtonBuilder().setCustomId("configautoreact").setLabel("Configurar Auto Reação").setStyle(2).setEmoji("1501804030605922346"),
            new ButtonBuilder().setCustomId("resetautoreact").setLabel("Resetar Configuração").setStyle(4).setEmoji("1501803926180335727"),
            new ButtonBuilder().setCustomId("atualizarembed24").setLabel("Aplicar alterações").setStyle(2).setEmoji("1501804030605922346"),
            new ButtonBuilder().setCustomId("eaffaawwawa").setEmoji("1501804030605922346").setLabel('Voltar').setStyle(2)
        )
    );

    return container;
}

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        if (customId === `${interaction.user.id}_onoff`) {
            const atualstatus = configuracao.get("AutoReact.status");
            configuracao.set("AutoReact.status", !atualstatus);

            await interaction.update({
                components: [buildAutoReactContainer(interaction)],
                flags: MessageFlags.IsComponentsV2,
                embeds: []
            });
        }

        if (customId === "configautoreact") {
            const modal = new ModalBuilder()
                .setCustomId("configAutoReactModal")
                .setTitle("Configurar Auto Reação");

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId("autoReactEmojiInput").setLabel("Digite o emoji para Auto Reação").setStyle(TextInputStyle.Short).setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId("autoReactChannelsInput").setLabel("IDs dos canais (separados por vírgula)").setStyle(TextInputStyle.Paragraph).setRequired(true)
                )
            );

            await interaction.showModal(modal);
        }

        if (customId === "resetautoreact") {
            configuracao.delete('AutoReact.Emoji');
            configuracao.delete('AutoReact.Canais');

            await interaction.update({
                components: [buildAutoReactContainer(interaction)],
                flags: MessageFlags.IsComponentsV2,
                embeds: []
            });
        }

        if (customId === "atualizarembed24") {
            await interaction.update({
                components: [buildAutoReactContainer(interaction)],
                flags: MessageFlags.IsComponentsV2,
                embeds: []
            });
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
                    const errContainer = new ContainerBuilder();
                    errContainer;
                    errContainer.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## Aviso de Erro\nForam encontrados os seguintes problemas:\n` +
                            (!emojivalido24 ? `- O emoji inserido não é válido.\n` : '') +
                            (!emojiNoServer24 ? `- O emoji não está disponível no servidor.\n` : '') +
                            (invalidoscanais24.length > 0 ? `- IDs de canais inválidos: ${invalidoscanais24.join(', ')}\n` : '') +
                            `\n**Por favor, corrija e tente novamente.**`
                        )
                    );

                    return await interaction.reply({
                        components: [errContainer],
                        flags: MessageFlags.IsComponentsV2,
                        embeds: [],
                        ephemeral: true
                    });
                }

                configuracao.set("AutoReact.Emoji", autoReactEmojiInput);
                configuracao.set("AutoReact.Canais", channelsArray);

                await autoreact24(interaction, client);
            }
        }
    },
};
