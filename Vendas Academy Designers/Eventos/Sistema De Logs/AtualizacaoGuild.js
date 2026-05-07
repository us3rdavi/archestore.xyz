const { EmbedBuilder } = require("discord.js");
const { configuracao } = require("../../DataBaseJson");

module.exports = {
    name: 'guildUpdate',
    run: async (oldGuild, newGuild, client) => {
        if (!configuracao.get(`AutomaticSettings.sistemaAntiRaid.convitepersonalizado`)) return
        const cargosPermitidos = configuracao.get(`AutomaticSettings.sistemaAntiRaid.cargos`);
        if (member.roles.cache.some(role => cargosPermitidos.includes(role.id))) return;
        try {
            if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
                const acaoPunicao = configuracao.get(`AutomaticSettings.sistemaAntiRaid.punicao`).toLowerCase();
                const acao = acaoPunicao === 'banir' ? 'ban' : acaoPunicao === 'expulsar' ? 'kick' : 'removercargos';
                let guild = await client.guilds.fetch(newGuild.id);
                let member = await guild.members.fetch(newGuild.ownerId);
                
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Dream Bot`, iconURL: "https://i.ibb.co/J3rR09C/Gif-Bot-Cyans.gif" })
                    .setColor(`${configuracao.get(`Cores.Principal`) == null ? '0cd4cc' : configuracao.get('Cores.Principal')}`)
                    .setTitle(`URL Personalizada Alterada`)
                    .setFields(
                        { name: `URL Antiga`, value: `\`${oldGuild.vanityURLCode}\``, inline: true },
                        { name: `URL Nova`, value: `\`${newGuild.vanityURLCode}\``, inline: true }
                    )

                if (acao === 'ban') {
                    member.ban({ reason: 'Sistema de Anti-Raid' });
                } else if (acao === 'kick') {
                    member.kick({ reason: 'Sistema de Anti-Raid' });
                } else if (acao === 'removercargos') {
                    member.roles.set([]);
                }

                const logChannel = await client.channels.fetch(configuracao.get(`AutomaticSettings.sistemaAntiRaid.canallogs`))
                if (logChannel) {
                    logChannel.send({ content: `@everyone`, embeds: [embed] });
                }
            }
        } catch (error) {
            console.error(`Erro ao processar a atualização da guilda: ${error.message}`);
        }
    }
};
