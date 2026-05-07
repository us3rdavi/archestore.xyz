const { ChannelType, Permissions, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const { configuracao } = require("../../DataBaseJson");
const automaticosPath = path.resolve(__dirname, '../../DataBaseJson/autolock.json');

function readAutomaticos() {
    if (fs.existsSync(automaticosPath)) {
        const rawData = fs.readFileSync(automaticosPath);
        return JSON.parse(rawData);
    }
    return {};
}

const convertToCronExpression = (time, timezone = 'America/Sao_Paulo') => {
    const [hour, minute] = time.split(':');

    const currentTime = moment.tz(timezone).set({
        hour: parseInt(hour, 10),
        minute: parseInt(minute, 10),
        second: 0,
        millisecond: 0,
    });

    const utcTime = currentTime.clone().utc();

    return `${utcTime.minutes()} ${utcTime.hours()} * * *`;
};

function scheduleJobs(client, automaticos) {
    const existingJobs = schedule.scheduledJobs;
    for (const job in existingJobs) {
        existingJobs[job].cancel();
    }

    for (const guildId in automaticos) {
        const { abrir: lockTime, fechar: unlockTime, channels } = automaticos[guildId];

        channels.forEach(async (channelId) => {
            const lockTimeExpression = convertToCronExpression(lockTime);
            const unlockTimeExpression = convertToCronExpression(unlockTime);

            schedule.scheduleJob(lockTimeExpression, async () => {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) return;

                const channel = guild.channels.cache.get(channelId);
                if (!channel || channel.type !== ChannelType.GuildText) return;

                try {
                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                        SendMessages: false
                    });

                    let messagesDeleted = 0;
                    let fetched;
                    do {
                        fetched = await channel.messages.fetch({ limit: 100 });
                        messagesDeleted += fetched.size;
                        await channel.bulkDelete(fetched);
                    } while (fetched.size >= 2);

                    const embed_delet = new EmbedBuilder()
                        .setColor(configuracao.get(`Cores.Principal`) || '0cd4cc')
                        .setAuthor({ name: 'Limpeza Concluida', iconURL: 'https://media.discordapp.net/attachments/1249514076116353055/1250591781985321072/eu_tambem_tenho_7.png?ex=666b7fdb&is=666a2e5b&hm=02766731d86f520e59f85ce34d174bdf4461e4bf43639ff4fd1094c0e82090c6&=&format=webp&quality=lossless' })
                        .setDescription(`Total de \`${messagesDeleted}\` mensagens removidas.`);

                    const embed = new EmbedBuilder()
                        .setColor(configuracao.get(`Cores.Principal`) || '0cd4cc')
                        .setDescription("Este canal foi trancado automaticamente pelo sistema.")
                        .setFooter({ text: `Boa noite! Volte novamente às ${unlockTime}` })
                        .setTimestamp();

                    await channel.send({
                        embeds: [embed_delet, embed],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setLabel("Mensagem Automática")
                                        .setCustomId("disabledButton")
                                        .setStyle("2")
                                        .setDisabled(true),
                                )
                        ]
                    });
                } catch (error) {
                    console.error("Erro ao bloquear canal:", error);
                }
            });

            schedule.scheduleJob(unlockTimeExpression, async () => {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) return;

                const channel = guild.channels.cache.get(channelId);
                if (!channel || channel.type !== ChannelType.GuildText) return;

                try {
                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                        SendMessages: true
                    });

                    let messagesDeleted = 0;
                    await channel.messages.fetch().then(messages => {
                        messagesDeleted = messages.size;
                        channel.bulkDelete(messages);
                    });

                    const embed = new EmbedBuilder()
                        .setColor(configuracao.get(`Cores.Principal`) || '0cd4cc')
                        .setDescription("Este canal foi liberado automaticamente pelo sistema.")
                        .setFooter({ text: `Bom dia!` })
                        .setTimestamp();

                    await channel.send({
                        embeds: [embed],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setLabel("Mensagem Automática")
                                        .setCustomId("disabledButton")
                                        .setStyle("2")
                                        .setDisabled(true),
                                )
                        ]
                    });
                } catch (error) {
                    console.error("Erro ao desbloquear canal:", error);
                }
            });
        });
    }
}

module.exports = {
    name: "ready",
    run: async (client) => {
        let automaticos = readAutomaticos();
        scheduleJobs(client, automaticos);

        fs.watch(automaticosPath, (eventType, filename) => {
            if (eventType === 'change') {
                automaticos = readAutomaticos();
                scheduleJobs(client, automaticos);
            }
        });
    }
};
