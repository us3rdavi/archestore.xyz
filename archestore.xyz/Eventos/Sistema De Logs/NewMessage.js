const { WebhookClient, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao, SystemMod } = require("../../DataBaseJson");

module.exports = {
    name: 'messageCreate',
    CheckarPunicoes,

    run: async (message, client) => {

        if (message.author.bot) return;
        if (configuracao.get(`AutomaticSettings.SistemadeFiltro.status`)) {
            if (configuracao.get(`AutomaticSettings.SistemadeFiltro.categoria`)?.includes(message.channel.parentId)) return;
            if (configuracao.get(`AutomaticSettings.SistemadeFiltro.cargos`)?.some(c => message.member.roles.cache.has(c))) return;

            if (configuracao.get(`AutomaticSettings.SistemadeFiltro.convites`)) {
                if (/(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/.test(message.content)) {
                    try {
                        await message.reply(`você não pode enviar convites de outros servidores!`).then(msg => {
                            setTimeout(() => {
                                msg.delete();
                            }, 5000);
                        });
                        await message.delete();
                    } catch (error) {
                    }
                }
            }
            let palavras = configuracao.get(`AutomaticSettings.SistemadeFiltro.palavras`) || [];
            if (palavras?.length > 0) {
                palavras = palavras.map(p => p.toLowerCase());
                if (palavras.some(p => message.content.toLowerCase().includes(p))) {
                    try {
                        await message.reply(`você não pode enviar mensagens com palavras proibidas!`).then(msg => {
                            setTimeout(() => {
                                msg.delete();
                            }, 5000);
                        });
                        await message.delete();
                    } catch (error) {
                    }
                }
            }
            let links = configuracao.get(`AutomaticSettings.SistemadeFiltro.links`) || [];
            if (links?.length > 0) {
                links = links.map(p => p.toLowerCase());
                if (links.some(p => message.content.toLowerCase().includes(p))) {
                    try {
                        await message.reply(`você não pode enviar mensagens com links proibidos!`).then(msg => {
                            setTimeout(() => {
                                msg.delete();
                            }, 5000);
                        });
                        await message.delete();
                    } catch (error) {
                    }
                }
            }
            try {
                let punicao = configuracao.get(`AutomaticSettings.SistemadeFiltro.punicao`);
                let tempo = configuracao.get(`AutomaticSettings.SistemadeFiltro.tempo`);

                if (tempo === 'permantente') {
                    switch (punicao) {
                        case 'ban':
                            SystemMod.set(`${message.author.id}`, { tipo: 'BAN', user: message.author.id, server: message.guild.id, motivo: 'Mensagem com conteúdo proibido', tempo: 'permantente' });
                            await message.member.ban({ reason: 'Mensagem com conteúdo proibido' });
                            break;
                        case 'kick':
                            SystemMod.set(`${message.author.id}`, { tipo: 'KICK',user: message.author.id, server: message.guild.id, motivo: 'Mensagem com conteúdo proibido', tempo: 'permantente' });
                            await message.member.kick({ reason: 'Mensagem com conteúdo proibido' });
                            break;
                        case 'mute':
                            await message.member.timeout(60 * 60 * 24 * 7 * 1000); // Mute por 1 semana
                            break;
                        default:
                    }
                } else {
                    let tempoMs = Number(tempo);
                    if (isNaN(tempoMs)) {
                        return;
                    }

                    switch (punicao) {
                        case 'ban':
                            SystemMod.set(`${message.author.id}`, { tipo: 'BAN', user: message.author.id, server: message.guild.id, motivo: 'Mensagem com conteúdo proibido', tempo: Date.now() + tempoMs });
                            await message.member.ban({ reason: 'Mensagem com conteúdo proibido' });
                            break;
                        case 'kick':
                            SystemMod.set(`${message.author.id}`, { tipo: 'KICK', user: message.author.id, server: message.guild.id, motivo: 'Mensagem com conteúdo proibido', tempo: Date.now() + tempoMs });
                            await message.member.kick({ reason: 'Mensagem com conteúdo proibido' });
                            break;
                        case 'mute':
                            await message.member.timeout(tempoMs); // Timeout temporário
                            break;
                        default:
                    }
                }
            } catch (error) {
            }
        }
    }
}

async function CheckarPunicoes(client) {
    let punicoes = await SystemMod.fetchAll(); 
    if (!punicoes) return;

    for (const key in punicoes) {
        const punicao = punicoes[key];
        if (punicao.data.tipo === 'BAN') {            
            try {
                const guild = await client.guilds.fetch(punicao.data.server);
                if (Date.now() >= punicao.data.tempo) {
                    await guild.members.unban(punicao.data.user, { reason: punicao.data.motivo });
                    await SystemMod.delete(`${punicao.data.user}`);
                }
            } catch (error) {
                // console.log(`Erro ao desbanir o usuário: ${error}`);
            }
        }
    }
}



