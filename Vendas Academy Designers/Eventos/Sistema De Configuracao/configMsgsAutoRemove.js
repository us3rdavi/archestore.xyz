const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder } = require("discord.js");
const { msgsauto } = require("../../DataBaseJson");
const { AcoesMsgsAutomatics } = require("../../Functions/ConfigMsgsAutomatics");

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        if (interaction.isButton()) {
            if (interaction.customId === 'voltar_AcoesMsgsAutomatics') {
                await AcoesMsgsAutomatics(interaction, client);
            }
            if (interaction.customId === 'removeAutomaticMessages') {
                const channelsData = msgsauto.get('channels') || [];
                const options = [];

                // Limita o número de opções a 25
                for (let i = 0; i < Math.min(channelsData.length, 25); i++) {
                    const channel = channelsData[i];
                    try {
                        const discordChannel = await client.channels.fetch(channel.id);
                        if (discordChannel) {
                            options.push({
                                label: `${channel.message.slice(0, 60)}${channel.message.length > 60 ? '...' : ''}`,
                                description: `Canal: ${discordChannel.name}`,
                                value: channel.id
                            });
                        }
                    } catch (error) {
                        console.error(`Erro ao buscar canal: ${error}`);
                        options.push({
                            label: `Mensagem não encontrada...`,
                            description: `Canal não encontrado ou sem acesso`,
                            value: channel.id
                        });
                    }
                }

                // Verifica se há opções para exibir
                if (options.length === 0) {
                    await interaction.update({
                        content: '⚠ Não há mensagens automáticas para remover.',
                        embeds: [],
                        components: [],
                        ephemeral: true
                    });
                    return;
                }

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('selectMessageToRemove')
                    .setPlaceholder('Escolha uma mensagem para remover')
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(options);

                const botoesvoltar = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("voltar_AcoesMsgsAutomatics")
                        .setEmoji(`1238413255886639104`)
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId(`voltar1`)
                        .setEmoji('1292237216915128361')
                        .setStyle(1)
                );

                const row = new ActionRowBuilder().addComponents(selectMenu);
                await interaction.update({
                    content: '⬇ Selecione a mensagem que deseja remover:',
                    embeds: [],
                    components: [row, botoesvoltar],
                    ephemeral: true
                });
            }
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'selectMessageToRemove') {
                const channelId = interaction.values[0];
                const channels = msgsauto.get('channels') || [];
                const channelIndex = channels.findIndex(c => c.id === channelId);

                if (channelIndex !== -1) {
                    channels.splice(channelIndex, 1);
                    msgsauto.set('channels', channels);
                    await AcoesMsgsAutomatics(interaction, client);
                    await interaction.followUp({
                        content: `${Emojis.get(`confirmed_emoji`)} Mensagem removida com sucesso!`,
                        components: [],
                        ephemeral: true
                    }).catch(error => console.error('Erro ao enviar update:', error));
                } else {
                    await AcoesMsgsAutomatics(interaction, client);
                    await interaction.followUp({
                        content: 'A mensagem não foi encontrada no banco de dados.',
                        components: [],
                        ephemeral: true
                    }).catch(error => console.error('Erro ao enviar update:', error));
                }
            }
        }
    }
};