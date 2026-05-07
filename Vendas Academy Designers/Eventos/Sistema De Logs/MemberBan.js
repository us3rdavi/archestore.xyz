const { EmbedBuilder } = require("discord.js");
const { configuracao, Temporario } = require("../../DataBaseJson");

module.exports = {
    name: 'guildBanAdd',
    run: async (ban, client) => {
        const settings = configuracao.get(`AutomaticSettings.sistemaAntiRaid.Banimento`);
        if (!settings) return;

        try {
            const auditLogs = await ban.guild.fetchAuditLogs({ type: 22, limit: 1 });
            const logEntry = auditLogs.entries.first();
            if (!logEntry || logEntry.bot) return;

            const cargosPermitidos = configuracao.get(`AutomaticSettings.sistemaAntiRaid.cargos`);
            const logChannel = await client.channels.fetch(configuracao.get(`AutomaticSettings.sistemaAntiRaid.canallogs`));
            const guild = await client.guilds.fetch(logChannel.guild.id);
            const member = await guild.members.fetch(logEntry.executor.id);

            if (member.roles.cache.some(role => cargosPermitidos.includes(role.id))) return;

            const executor = logEntry.executor.tag || 'Desconhecido';
            const executorData = Temporario.get(`Banimento.${logEntry.executor.id}`) || {
                executor: logEntry.executor.id,
                quantidade: 0,
                inicio: Date.now(),
            };

            executorData.quantidade++;
            Temporario.set(`Banimento.${logEntry.executor.id}`, executorData);

            const horarioAtual = Date.now();
            const horarioInicio = executorData.inicio;
            const quantidadePorMinuto = settings.quantidadeporminuto;
            const quantidadePorHora = settings.quantidadeporhora;
            const acaoPunicao = configuracao.get(`AutomaticSettings.sistemaAntiRaid.punicao`).toLowerCase();
            const acao = acaoPunicao === 'banir' ? 'ban' : acaoPunicao === 'expulsar' ? 'kick' : 'removercargos';

            const aplicarPunicao = async (acao, member) => {
                let memberexecutor = await guild.members.fetch(logEntry.executor.id);

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Membro Banido`, iconURL: "https://cdn.discordapp.com/emojis/1292306233897914570.webp?size=44&quality=lossless" })
                    .setColor(configuracao.get('Cores.Principal') || '0cd4cc')
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: `Moderador:`, value: `\`${executor}\`\n<@!${logEntry.executor.id}>`, inline: true },
                        { name: `Usuário:`, value: `\`${member.user.tag}\`\n<@!${member.user.id}>`, inline: true },
                        { name: `Motivo:`, value: `\`Sistema AntiRaid\``, inline: false },
                    )
                    .setFooter({ text: `ID do Usuário: ${member.user.id}` })
                    .setTimestamp();

                try {
                    logChannel.send({ embeds: [embed] });
                    console.log(`Punição aplicada com sucesso.`);
                } catch (error) {
                    console.error(`Erro ao enviar a punição: ${error.message}`);
                }
                
                deletarDaBaseDeDados(logEntry.executor.id)

                try {
                    if (acao === 'ban') {
                        memberexecutor.ban({ reason: 'Sistema de Anti-Raid' });
                    } else if (acao === 'kick') {
                        memberexecutor.kick({ reason: 'Sistema de Anti-Raid' });
                    } else if (acao === 'removercargos') {
                        memberexecutor.roles.set([]);
                    }
                } catch (error) {
                    console.error(`Erro ao aplicar a punição: ${error.message}`);
                }
            };

            const deletarDaBaseDeDados = (executorId) => {
                Temporario.delete(`Banimento.${executorId}`);
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
            console.error(`Erro ao processar o banimento: ${error.message}`);
        }
    }
};