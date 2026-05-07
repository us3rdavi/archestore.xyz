const { ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        if (customId === `${interaction.user.id}_discohookconfig`) {
            const botaosite24 = new ButtonBuilder()
                .setLabel('DiscoHook ')
                .setURL('https://discohook.org/')
                .setStyle(5);

            const botaotutorial24 = new ButtonBuilder()
                .setLabel('Tutorial')
                .setURL('https://discohook.org/faq')
                .setStyle(5);

            const botaoimportar24 = new ButtonBuilder()
                .setLabel('Importar')
                .setCustomId('importacaocodigo24')
                .setStyle(3)
                .setEmoji('1251585341895213118');

            const botaoVoltar = new ButtonBuilder()
                .setCustomId("painelconfigvendas")
                .setLabel('Voltar')
                .setEmoji('1178068047202893869')
                .setStyle(2);

            const row = new ActionRowBuilder()
                .addComponents(botaosite24, botaotutorial24, botaoimportar24, botaoVoltar);

            const embed = new EmbedBuilder()
                .setAuthor({ name: 'DiscoHook Import - Mensagem de resgate', iconURL: 'https://cdn.discordapp.com/emojis/990284971384111204.png?size=2048' })
                .setDescription('> Importe a mensagem do termo usando DiscoHook.')
                .setColor("DarkBlue")
                .setThumbnail('https://cdn.discordapp.com/emojis/1200049577877835787.png?size=2048')
                .addFields([
                    { name: 'Help', value: '**Use o botão "DiscoHook" Para acessar o site e quando criar a mensagem que quer clique em Json Data Editor e volte pro discord e clique em Importar E cole o codigo la e clique em enviar.**' },
                    { name: 'Ajuda', value: '**Use o botão "tutorial" para mais detalhes.**' }
                ])
                .setFooter({ text: 'Sistema DiscoHook', iconURL: 'https://cdn.discordapp.com/emojis/1248300571522371686.png?size=2048' });

            await interaction.update({
                embeds: [embed],
                components: [row],
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

            const actionRow = new ActionRowBuilder().addComponents(jsoninput24);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);
        }

        if (customId === 'discohookModal') {
            const Jsonsalvar24 = interaction.fields.getTextInputValue('discohookJson24');

            try {
                const discohook24data24 = JSON.parse(Jsonsalvar24);

                if (!discohook24data24 || (!discohook24data24.content && !discohook24data24.embeds)) {
                    throw new Error(`${Emojis.get(`negative_emoji`)} O Codigo "Json" Que Você Pois não possui o "Content" ou "embed"`);
                }

                const selecionarcanal24 = new ChannelSelectMenuBuilder()
                    .setCustomId('selecioanrcanal24')
                    .setPlaceholder('Selecione o canal para enviar a mensagem')
                    .setChannelTypes([ChannelType.GuildText]);

                const row = new ActionRowBuilder().addComponents(selecionarcanal24);

                await interaction.reply({
                    content: '**Escolha Um Canal que será enviado a mensagem:**',
                    components: [row],
                    ephemeral: true
                });

                interaction.client.tempJsonData = discohook24data24;

            } catch (error) {
                console.error(`${Emojis.get(`negative_emoji`)} Ocorreu um erro ao processar o codigo Json:`, error);
                await interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Ocorreu um erro ao processar o codigo Json: ${error.message}**`, ephemeral: true });
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
                await interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Não Foi Encontrada Nenhuma configuração válida encontrada.`, ephemeral: true });
                return;
            }

            await interaction.update({ content: `${Emojis.get(`confirmed_emoji`)} Mensagem enviada com sucesso: ${channel}!`, components: [], ephemeral: true });
        }
    }
};
