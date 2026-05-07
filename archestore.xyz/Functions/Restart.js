const { ActivityType, ActionRowBuilder, EmbedBuilder, ButtonBuilder } = require('discord.js');
const { configuracao, Emojis } = require('../DataBaseJson');

async function restart(client, status) {

    if (configuracao.get('ConfigChannels.systemlogs') == null) return;

    const embed = new EmbedBuilder()
        .setColor('#660f7e')
        .setTitle(`${Emojis.get('dream')} — Epro Reiniciado`)
        .addFields(
            { name: `${Emojis.get(`_tool_emoji`)} **Versão do eOS**`, value: `\`1.0\``, inline: true },
            { name: `${Emojis.get(`clock_emoji`)} **Data**`, value: `<t:${Math.ceil(Date.now() / 1000)}:R>`, inline: true },
            { name: `${Emojis.get(`_lapis_emoji`)} **Motivo**`, value: `Reiniciado pelo Sistema`, inline: false }
        )
        .setFooter({ text: `Dream` })
        .setTimestamp()

    const row222 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setURL('https://discord.com/channels/1312428786591076463/1350918231011098654')
                .setLabel('Updates')
                .setEmoji("1347064616563380316")
                .setStyle(5)
                .setDisabled(false),
            new ButtonBuilder()
                .setURL('https://discord.gg/aplicativoa')
                .setLabel('Servidor Suporte')
                .setEmoji("<:Estrelas_Ghost:1347065379167539251>")
                .setStyle(5)
                .setDisabled(false)
        );
        
        try {
            const channel = await client.channels.fetch(configuracao.get('ConfigChannels.systemlogs'));
            await channel.send({ content: ``, components: [row222], embeds: [embed] });   
        } catch (error) {
            
        }
}


module.exports = {
    restart
}
