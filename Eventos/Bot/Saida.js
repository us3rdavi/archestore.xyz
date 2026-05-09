const { WebhookClient, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao, Convites } = require("../../Database");
const { Emojis } = require("../../Database");

module.exports = {
    name: 'guildMemberRemove',
    run: async (member, client) => {

        let allInvites = Convites.fetchAll();
        if (!allInvites) return;

        let invite = allInvites.find(invite => invite?.data?.convidados?.includes(member.id));

        if (invite) {
            let info = invite.data;
            let index = info.convidados.indexOf(member.id);
            info.convidados.splice(index, 1);
            info.saidas++;
            Convites.set(invite.ID, info)
        }

        try {
            const testando = configuracao.get(`ConfigChannels.saídas`);
            const canal_logs = member.guild.channels.cache.get(testando);
            if (!canal_logs) return 
            
            const nomeUsuario = member.user.username;

            let embed = new EmbedBuilder()
                .setColor(`#5865F2`)
                .setTitle(`${Emojis.get(`member_remove_emoji`)} | Saída`)
                .setDescription(`${member} **${nomeUsuario}** saiu do servidor.`)

            canal_logs.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erro:', error);
        }
    
    }
}