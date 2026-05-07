const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const fs = require('fs');
const path = require('path');
const { configuracao } = require("../../DataBaseJson");
const automaticosPath = path.resolve(__dirname, '../../DataBaseJson/autolock.json');

// Função para ler o arquivo automaticos.json
function readAutomaticos() {
    if (fs.existsSync(automaticosPath)) {
        const rawData = fs.readFileSync(automaticosPath);
        return JSON.parse(rawData);
    }
    return {};
}

// Função para escrever no arquivo automaticos.json
function writeAutomaticos(data) {
    fs.writeFileSync(automaticosPath, JSON.stringify(data, null, 2));
}

// Função para validar o formato de hora (HH:mm)
function isValidTime(time) {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(time);
}

// Função para verificar se um ID de canal é válido
async function isValidChannelId(client, guildId, channelId) {
    try {
        const guild = await client.guilds.fetch(guildId);
        const channel = await guild.channels.fetch(channelId);
        return !!channel;
    } catch (error) {
        return false;
    }
}

// Função para validar uma lista de IDs de canais
async function validateChannelIds(client, guildId, channelIds) {
    const invalidIds = [];
    for (const channelId of channelIds) {
        if (!await isValidChannelId(client, guildId, channelId.trim())) {
            invalidIds.push(channelId);
        }
    }
    return invalidIds;
}

module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {
        try {
            if (interaction.isButton()) {
                if (interaction.customId === 'configlock') {
                    const guildId = interaction.guild.id;
                    const automaticos = readAutomaticos();
                    const config = automaticos[guildId] || {};

                    let channelNames = config.channels ? config.channels.map(id => `<#${id}>`).join(', ') : 'Não configurado';

                    const embed = new EmbedBuilder()
                        .setColor(configuracao.get('Cores.Principal') || '0cd4cc')
                        .setTitle('Configuração Atual de Bloqueio Automático')
                        .addFields(
                            { name: 'Horário de Bloqueio', value: config.abrir || 'Não configurado', inline: true },
                            { name: 'Horário de Desbloqueio', value: config.fechar || 'Não configurado', inline: true },
                            { name: 'Canais', value: channelNames, inline: false }
                        )
                        .setFooter({ text: `Clique em "Modificar" para alterar as configurações.` })

                    const actionRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('modifyConfig')
                                .setLabel('Modificar')
                                .setEmoji('1236318155056349224')
                                .setStyle(1),
                            new ButtonBuilder()
                                .setCustomId('disableConfig')
                                .setLabel('Desativar')
                                .setEmoji('1178076767567757312')
                                .setStyle(4)
                        );

                    const actionRow2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('voltarautomaticos')
                                .setLabel('Voltar')
                                .setEmoji('1178068047202893869')
                                .setStyle(2)
                        );

                    await interaction.update({ content: '', embeds: [embed], components: [actionRow, actionRow2], ephemeral: true });
                }
            }

            if (interaction.isButton()) {
                if (interaction.customId === 'modifyConfig') {
                    const modal = new ModalBuilder()
                        .setCustomId('configurarBloqueio')
                        .setTitle('Configurar Bloqueio Automático');

                    const lockTimeInput = new TextInputBuilder()
                        .setCustomId('lockTime')
                        .setLabel('Horário de Bloqueio (HH:mm)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const unlockTimeInput = new TextInputBuilder()
                        .setCustomId('unlockTime')
                        .setLabel('Horário de Desbloqueio (HH:mm)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const channelIdsInput = new TextInputBuilder()
                        .setCustomId('channelIds')
                        .setLabel('IDs dos Canais (separados por vírgula)')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true);

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(lockTimeInput),
                        new ActionRowBuilder().addComponents(unlockTimeInput),
                        new ActionRowBuilder().addComponents(channelIdsInput)
                    );

                    await interaction.showModal(modal);
                }

                if (interaction.customId === 'disableConfig') {
                    const guildId = interaction.guild.id;
                    const automaticos = readAutomaticos();

                    if (automaticos[guildId]) {
                        delete automaticos[guildId];
                        writeAutomaticos(automaticos);
                        await interaction.reply({ content: 'Configuração de bloqueio automático desativada.', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'Nenhuma configuração de bloqueio automático encontrada para desativar.', ephemeral: true });
                    }
                }
            }

            if (interaction.isModalSubmit()) {
                if (interaction.customId === 'configurarBloqueio') {
                    const lockTime = interaction.fields.getTextInputValue('lockTime');
                    const unlockTime = interaction.fields.getTextInputValue('unlockTime');
                    const channelIds = interaction.fields.getTextInputValue('channelIds').split(',');
                    const guildId = interaction.guild.id;

                    // Validate time format
                    if (!isValidTime(lockTime) || !isValidTime(unlockTime)) {
                        await interaction.reply({ content: 'Horário inválido. Use o formato HH:mm.', ephemeral: true });
                        return;
                    }

                    // Validate channel IDs
                    const invalidIds = await validateChannelIds(client, guildId, channelIds);
                    if (invalidIds.length > 0) {
                        await interaction.reply({ content: `ID(s) de canal inválido(s): ${invalidIds.join(', ')}`, ephemeral: true });
                        return;
                    }

                    // Read the current data from automaticos.json
                    const automaticos = readAutomaticos();

                    // Update the data for the guild
                    automaticos[guildId] = {
                        abrir: lockTime,
                        fechar: unlockTime,
                        channels: channelIds.map(id => id.trim()),
                        serverid: guildId
                    };

                    // Save the updated data back to automaticos.json
                    writeAutomaticos(automaticos);

                    // Format channel IDs for display
                    let channelNames = channelIds.map(id => `<#${id}>`).join(', ');

                    // Update the embed with new configuration details
                    const embed = new EmbedBuilder()
                        .setColor(configuracao.get('Cores.Principal') || '0cd4cc')
                        .setTitle('Configuração Atualizada de Bloqueio Automático')
                        .addFields(
                            { name: 'Horário de Bloqueio', value: lockTime, inline: true },
                            { name: 'Horário de Desbloqueio', value: unlockTime, inline: true },
                            { name: 'Canais', value: channelNames, inline: false }
                        )
                        .setFooter({ text: `Clique em "Modificar" para alterar as configurações.` })

                    const actionRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('modifyConfig')
                                .setLabel('Modificar')
                                .setEmoji('1236318155056349224')
                                .setStyle(1),
                            new ButtonBuilder()
                                .setCustomId('disableConfig')
                                .setLabel('Desativar')
                                .setEmoji('1178076767567757312')
                                .setStyle(4)
                        );

                    const actionRow2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('voltarautomaticos')
                                .setLabel('Voltar')
                                .setEmoji('1178068047202893869')
                                .setStyle(2)
                        );

                    await interaction.update({ content: '', embeds: [embed], components: [actionRow, actionRow2], ephemeral: true });
                }
            }
        } catch (error) {
            await interaction.reply({ content: 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.', ephemeral: true });
        }
    }
};
