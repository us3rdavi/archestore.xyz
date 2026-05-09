const {
    ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        if (customId === `${interaction.user.id}_discohookconfig`) {
            const container = new ContainerBuilder();
            container;

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## DiscoHook Import — Mensagem de Resgate\nImporte a mensagem do termo usando DiscoHook.\n\n` +
                    `**Como usar:** Acesse o site DiscoHook, crie a mensagem desejada, clique em *JSON Data Editor*, copie o código, volte ao Discord e clique em **Importar**.\n\n` +
                    `-# Use o botão "Tutorial" para mais detalhes.`
                )
            );

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setLabel('DiscoHook').setURL('https://discohook.org/').setStyle(5),
                    new ButtonBuilder().setLabel('Tutorial').setURL('https://discohook.org/faq').setStyle(5),
                    new ButtonBuilder().setLabel('Importar').setCustomId('importacaocodigo24').setStyle(3).setEmoji('1251585341895213118'),
                    new ButtonBuilder().setCustomId("painelconfigvendas").setLabel('Voltar').setEmoji('1178068047202893869').setStyle(2)
                )
            );

            await interaction.update({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                ephemeral: true
            });
        }

        if (customId === 'importacaocodigo24') {
            const modal = new ModalBuilder()
                .setCustomId('discohookModal')
                .setTitle('Importar JSON do DiscoHook');

            const jsoninput24 = new TextInputBuilder()
                .setCustomId('discohookJson24')
                .setLabel('Código JSON')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Cole aqui o código JSON gerado pelo DiscoHook')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(jsoninput24));
            await interaction.showModal(modal);
        }

        if (customId === 'discohookModal') {
            const Jsonsalvar24 = interaction.fields.getTextInputValue('discohookJson24');

            try {
                const discohook24data24 = JSON.parse(Jsonsalvar24);

                if (!discohook24data24 || (!discohook24data24.content && !discohook24data24.embeds)) {
                    throw new Error('O Código JSON não possui "content" ou "embeds"');
                }

                const selecionarcanal24 = new ChannelSelectMenuBuilder()
                    .setCustomId('selecioanrcanal24')
                    .setPlaceholder('Selecione o canal para enviar a mensagem')
                    .setChannelTypes([ChannelType.GuildText]);

                await interaction.reply({
                    content: '**Escolha um canal para enviar a mensagem:**',
                    components: [new ActionRowBuilder().addComponents(selecionarcanal24)],
                    ephemeral: true
                });

                interaction.client.tempJsonData = discohook24data24;
            } catch (error) {
                console.error('Erro ao processar JSON:', error);
                await interaction.reply({ content: `Ocorreu um erro ao processar o código JSON: ${error.message}`, ephemeral: true });
            }
        }

        if (customId === 'selecioanrcanal24') {
            const selectedChannelId = interaction.values[0];
            const channel = interaction.guild.channels.cache.get(selectedChannelId);
            const discohook24data24 = interaction.client.tempJsonData;
            const content = discohook24data24.content || null;
            const embeds = discohook24data24.embeds ? discohook24data24.embeds.map(embed => new EmbedBuilder(embed)) : null;

            if (content && embeds) {
                await channel.send({ content, embeds });
            } else if (content) {
                await channel.send({ content });
            } else if (embeds) {
                await channel.send({ embeds });
            } else {
                await interaction.reply({ content: `Não foi encontrada nenhuma configuração válida.`, ephemeral: true });
                return;
            }

            await interaction.update({ content: `Mensagem enviada com sucesso em ${channel}!`, components: [], ephemeral: true });
        }
    }
};
