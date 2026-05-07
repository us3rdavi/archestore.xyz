const { EmbedBuilder } = require("discord.js");
const { configuracao, Temporario } = require("../../DataBaseJson");

module.exports = {
    name: 'channelDelete',
    run: async (channel, client) => {
        const settings = configuracao.get(`AutomaticSettings.sistemaAntiRaid.ExclusaoCanais`);
        if (!settings?.status) return;

        try {
            const auditLogs = await channel.guild.fetchAuditLogs({ type: 12, limit: 1 });
            const logEntry = auditLogs.entries.first();
            if (!logEntry || logEntry.bot) return;

            const cargosPermitidos = configuracao.get(`AutomaticSettings.sistemaAntiRaid.cargos`);
            const logChannel = await client.channels.fetch(configuracao.get(`AutomaticSettings.sistemaAntiRaid.canallogs`));
            const guild = await client.guilds.fetch(logChannel.guild.id);
            const member = await guild.members.fetch(logEntry.executor.id);

            if (member.roles.cache.some(role => cargosPermitidos.includes(role.id))) return;

            const executor = logEntry.executor.tag || 'Desconhecido';
            const executorData = Temporario.get(`CanalExcluido.${logEntry.executor.id}`) || {
                executor: logEntry.executor.id,
                quantidade: 0,
                inicio: Date.now(),
            };

            executorData.quantidade++;
            Temporario.set(`CanalExcluido.${logEntry.executor.id}`, executorData);

            const horarioAtual = Date.now();
            const horarioInicio = executorData.inicio;
            const quantidadePorMinuto = settings.quantidadeporminuto;
            const quantidadePorHora = settings.quantidadeporhora;
            const acaoPunicao = configuracao.get(`AutomaticSettings.sistemaAntiRaid.punicao`).toLowerCase();
            const acao = acaoPunicao === 'banir' ? 'ban' : acaoPunicao === 'expulsar' ? 'kick' : 'removercargos';

            const aplicarPunicao = (acao, member) => {

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Dream Bot`, iconURL: "https://i.ibb.co/J3rR09C/Gif-Bot-Cyans.gif" })
                    .setColor(configuracao.get('Cores.Principal') || '0cd4cc')
                    .setTitle(`Canal Excluído`)
                    .addFields(
                        { name: `Canal:`, value: `\`${channel.name}\``, inline: true },
                        { name: `Excluido por:`, value: `\`${executor}\``, inline: true }
                    );

                try {
                    logChannel?.send({ embeds: [embed] });
                } catch (error) {
                
                }

                deletarDaBaseDeDados(logEntry.executor.id);

                try {
                    if (acao === 'ban') {
                        member.ban({ reason: 'Sistema de Anti-Raid' });
                    } else if (acao === 'kick') {
                        member.kick({ reason: 'Sistema de Anti-Raid' });
                    } else if (acao === 'removercargos') {
                        member.roles.set([]);
                    }
                } catch (error) {
                    
                }
            };

            const deletarDaBaseDeDados = (executorId) => {
                Temporario.delete(`CanalExcluido.${executorId}`);
            };

            if (executorData.quantidade >= quantidadePorMinuto && horarioAtual <= horarioInicio + 60000) {
                aplicarPunicao(acao, member);
            } else if (executorData.quantidade >= quantidadePorHora && horarioAtual <= horarioInicio + 3600000) {
                aplicarPunicao(acao, member);
            }

            if (executorData.quantidade > quantidadePorMinuto && executorData.quantidade > quantidadePorHora) {
                deletarDaBaseDeDados(logEntry.executor.id);
            }

        } catch (error) {
            console.error(`Erro ao processar a exclusão de um canal: ${error.message}`);
        }
    }
};
