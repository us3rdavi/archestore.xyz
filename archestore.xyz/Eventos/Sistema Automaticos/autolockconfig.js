const {
    ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const fs = require('fs');
const path = require('path');
const { configuracao } = require("../../DataBaseJson");
const automaticosPath = path.resolve(__dirname, '../../DataBaseJson/autolock.json');

function readAutomaticos() {
    if (fs.existsSync(automaticosPath)) {
        const rawData = fs.readFileSync(automaticosPath);
        return JSON.parse(rawData);
    }
    return {};
}

function writeAutomaticos(data) {
    fs.writeFileSync(automaticosPath, JSON.stringify(data, null, 2));
}

function isValidTime(time) {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(time);
}

async function isValidChannelId(client, guildId, channelId) {
    try {
        const guild = await client.guilds.fetch(guildId);
        const channel = await guild.channels.fetch(channelId);
        return !!channel;
    } catch (error) {
        return false;
    }
}

async function validateChannelIds(client, guildId, channelIds) {
    const invalidIds = [];
    for (const channelId of channelIds) {
        if (!await isValidChannelId(client, guildId, channelId.trim())) {
            invalidIds.push(channelId);
        }
    }
    return invalidIds;
}

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

function buildConfigContainer(title, fields) {
    const container = new ContainerBuilder();
    container.setAccentColor(getAccentColor());

    let content = `## ${title}`;
    for (const [label, value] of fields) {
        content += `\n**${label}:** ${value}`;
    }
    content += `\n-# Clique em "Modificar" para alterar as configurações.`;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('modifyConfig').setLabel('Modificar').setEmoji('1236318155056349224').setStyle(1),
            new ButtonBuilder().setCustomId('disableConfig').setLabel('Desativar').setEmoji('1178076767567757312').setStyle(4)
        )
    );

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('voltarautomaticos').setLabel('Voltar').setEmoji('1178068047202893869').setStyle(2)
        )
    );

    return container;
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
                    const channelNames = config.channels ? config.channels.map(id => `<#${id}>`).join(', ') : 'Não configurado';

                    const container = buildConfigContainer('Configuração de Bloqueio Automático', [
                        ['Horário de Bloqueio', config.abrir || 'Não configurado'],
                        ['Horário de Desbloqueio', config.fechar || 'Não configurado'],
                        ['Canais', channelNames]
                    ]);

                    await interaction.update({
                        content: '',
                        components: [container],
                        flags: MessageFlags.IsComponentsV2,
                        embeds: [],
                        ephemeral: true
                    });
                }
            }

            if (interaction.isButton()) {
                if (interaction.customId === 'modifyConfig') {
                    const modal = new ModalBuilder()
                        .setCustomId('configurarBloqueio')
                        .setTitle('Configurar Bloqueio Automático');

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder().setCustomId('lockTime').setLabel('Horário de Bloqueio (HH:mm)').setStyle(TextInputStyle.Short).setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder().setCustomId('unlockTime').setLabel('Horário de Desbloqueio (HH:mm)').setStyle(TextInputStyle.Short).setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder().setCustomId('channelIds').setLabel('IDs dos Canais (separados por vírgula)').setStyle(TextInputStyle.Paragraph).setRequired(true)
                        )
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

                    if (!isValidTime(lockTime) || !isValidTime(unlockTime)) {
                        await interaction.reply({ content: 'Horário inválido. Use o formato HH:mm.', ephemeral: true });
                        return;
                    }

                    const invalidIds = await validateChannelIds(client, guildId, channelIds);
                    if (invalidIds.length > 0) {
                        await interaction.reply({ content: `ID(s) de canal inválido(s): ${invalidIds.join(', ')}`, ephemeral: true });
                        return;
                    }

                    const automaticos = readAutomaticos();
                    automaticos[guildId] = {
                        abrir: lockTime,
                        fechar: unlockTime,
                        channels: channelIds.map(id => id.trim()),
                        serverid: guildId
                    };
                    writeAutomaticos(automaticos);

                    const channelNames = channelIds.map(id => `<#${id}>`).join(', ');
                    const container = buildConfigContainer('Configuração Atualizada de Bloqueio Automático', [
                        ['Horário de Bloqueio', lockTime],
                        ['Horário de Desbloqueio', unlockTime],
                        ['Canais', channelNames]
                    ]);

                    await interaction.update({
                        content: '',
                        components: [container],
                        flags: MessageFlags.IsComponentsV2,
                        embeds: [],
                        ephemeral: true
                    });
                }
            }
        } catch (error) {
            await interaction.reply({ content: 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.', ephemeral: true });
        }
    }
};
