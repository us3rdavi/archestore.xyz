const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, AttachmentBuilder } = require("discord.js");
const { tickets } = require("../DataBaseJson");

function CreateMessageTicket(interaction, channel, client) {
    const ggg = tickets.get(`tickets.funcoes`);
    const aparencia = tickets.get(`tickets.aparencia`);
    const atualstatus24 = tickets.get("statusmsg") || false;

    const arrayDeValores = Object.values(ggg);
    const button = new ButtonBuilder()
        .setCustomId(`AbrirTicket_${arrayDeValores[0].nome}`)
        .setLabel(arrayDeValores[0].nome)
        .setStyle(2);

    if (arrayDeValores[0].emoji !== undefined) {
        button.setEmoji(arrayDeValores[0].emoji);
    }

    const buttonrow = new ActionRowBuilder().addComponents(button);

    const selectMenuBuilder = new StringSelectMenuBuilder()
        .setCustomId('abrirticket')
        .setPlaceholder('Clique aqui para ver as opções');

    for (const element in ggg) {
        const item = ggg[element];

        const option = {
            label: `${item.nome}`,
            description: `${item.descricao == undefined ? item.predescricao : item.descricao}`,
            value: `${element}`,
            ...item.emoji == undefined ? {} : { emoji: `${item.emoji}` }
        };

        selectMenuBuilder.addOptions(option);
    }

    const style2row = new ActionRowBuilder().addComponents(selectMenuBuilder);

    const embed = new EmbedBuilder()
        .setTitle(`${aparencia.title || 'Título não configurado'}`)
        .setDescription(`${aparencia.description || 'Descrição não configurada'}`)
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp();

    if (aparencia.color !== undefined) {
        embed.setColor(`${aparencia.color}`);
    }

    if (aparencia.banner !== undefined) {
        embed.setImage(`${aparencia.banner}`);
    }

    const channel2 = client.channels.cache.get(channel);

    if (atualstatus24) {
        const fotoPath = tickets.get("tickets.aparencia.bannermsg");

        const messageContent = aparencia.message;
        const components = Object.keys(ggg).length > 1 ? [style2row] : [buttonrow];
        
        if (fotoPath) {
            const fotoAttachment = new AttachmentBuilder(fotoPath);
            
            channel2.send({
                content: messageContent,
                components: components,
                files: [fotoAttachment],
            }).then(msg => {
                tickets.push(`tickets.messageid`, { msgid: msg.id, channelid: msg.channel.id, guildid: msg.guild.id });
            });
        } else {
            channel2.send({
                content: messageContent,
                components: components,
            }).then(msg => {
                tickets.push(`tickets.messageid`, { msgid: msg.id, channelid: msg.channel.id, guildid: msg.guild.id });
            });
        }
        
    } else {
        const components = Object.keys(ggg).length == 1 ? [buttonrow] : [style2row];

        channel2.send({
            components: components,
            embeds: [embed]
        }).then(msg => {
            tickets.push(`tickets.messageid`, { msgid: msg.id, channelid: msg.channel.id, guildid: msg.guild.id });
        });
    }
}

async function Checkarmensagensticket(client) {
    const ggg = tickets.get(`tickets.funcoes`);
    const aparencia = tickets.get(`tickets.aparencia`);
    const item = tickets.get(`tickets.messageid`);
    const guild = client.guilds.cache.get(item[0].guildid);

    const arrayDeValores = Object.values(ggg);
    const button = new ButtonBuilder()
        .setCustomId(`AbrirTicket_${arrayDeValores[0].nome}`)
        .setLabel(arrayDeValores[0].nome)
        .setStyle(2);

    if (arrayDeValores[0].emoji !== undefined) {
        button.setEmoji(arrayDeValores[0].emoji);
    }

    const buttonrow = new ActionRowBuilder().addComponents(button);

    const selectMenuBuilder = new StringSelectMenuBuilder()
        .setCustomId('abrirticket')
        .setPlaceholder('Clique aqui para ver as opções');

    for (const element in ggg) {
        const item = ggg[element];

        const option = {
            label: `${item.nome}`,
            description: `${item.predescricao == undefined ? item.predescricao : item.predescricao}`,
            value: `${element}`,
            ...item.emoji == undefined ? {} : { emoji: `${item.emoji}` }
        };

        selectMenuBuilder.addOptions(option);
    }

    const style2row = new ActionRowBuilder().addComponents(selectMenuBuilder);

    const embed = new EmbedBuilder()
        .setTitle(`${aparencia.title || 'Título não configurado'}`)
        .setDescription(`${aparencia.description || 'Descrição não configurada'}`)
        .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
        .setTimestamp();

    if (aparencia.color !== undefined) {
        embed.setColor(`${aparencia.color}`);
    }

    if (aparencia.banner !== undefined) {
        embed.setImage(`${aparencia.banner}`);
    }

    for (const iterator in item) {
        const element = item[iterator];
        const fotoPath = tickets.get("tickets.aparencia.bannermsg");
        try {
            const channel = await client.channels.cache.get(element.channelid);
            const msg = await channel.messages.fetch(element.msgid);
        
            const fotoPath = tickets.get("tickets.aparencia.bannermsg");
        
            if (msg.embeds.length > 0) {
                const components = Object.keys(ggg).length == 1 ? [buttonrow] : [style2row];
        
                if (fotoPath) {
                    const fotoAttachment = new AttachmentBuilder(fotoPath);
        
                    msg.edit({ components: components, embeds: [embed], files: [fotoAttachment] });
                } else {
                    msg.edit({ components: components, embeds: [embed] });
                }
            } else {
                const messageContent = aparencia.message;
                const components = Object.keys(ggg).length > 1 ? [style2row] : [buttonrow];
        
                if (fotoPath) {
                    const fotoAttachment = new AttachmentBuilder(fotoPath);
        
                    msg.edit({ content: messageContent, components: components, files: [fotoAttachment] });
                } else {
                    msg.edit({ content: messageContent, components: components, files: [] });
                }
            }
        } catch (error) {
        }
        
    }
}

module.exports = {
    CreateMessageTicket,
    Checkarmensagensticket
};
