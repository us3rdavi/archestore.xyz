const { EmbedBuilder } = require("discord.js");
const { carrinhos, pagamentos, configuracao } = require("../Database");

function CloseThreds(client) {
    client.guilds.cache.forEach((guild) => {
        const hilos = guild.channels.cache.filter((channel) => {
            return channel.isThread() && channel.name.includes('carrinho');
        });

        hilos.forEach(async element => {
            // Usa o timestamp da última mensagem como marcador de atividade.
            // Se não houver mensagem ainda, usa a criação da thread.
            const lastActivity = element.lastMessage?.createdTimestamp
                || element.lastMessageId
                    ? Number(BigInt(element.lastMessageId) >> 22n) + 1420070400000
                    : element._createdTimestamp;
            let minutos = configuracao.get(`ConfigCarrinho.inatividade`) || 10;
            const novoTimestamp = lastActivity + minutos * 60 * 1000;

            // Não fechar carrinhos com pagamento em andamento ou já pago
            const cart = carrinhos.get(element.id);
            if (cart && (cart.status === 'aguardando_pagamento' || cart.status === 'pago')) return;

            if (Date.now() > novoTimestamp) {
                element.delete().then(() => {
                }).catch((error) => {
                });


                const texto = element.name;
                const partes = texto.split("・");
                const ultimoNumero = partes[partes.length - 1];
                pagamentos.delete(element.id)
                carrinhos.delete(element.id)

                try {

                    const member = await client.users.fetch(ultimoNumero)

                    const embed = new EmbedBuilder()
                        .setColor(`${configuracao.get(`Cores.Erro`) == null ? `#5865F2` : configuracao.get(`Cores.Erro`)}`)
                        .setTitle(`Carrinho expirado.`)
                        .setDescription(`Seu carrinho foi fechado por inatividade.`)

                    await member.send({ embeds: [embed] })
                } catch (error) {

                }


                try {
                    const channela = await client.channels.fetch(configuracao.get('ConfigChannels.logpedidos'));

                    const embed = new EmbedBuilder()
                        .setColor(`${configuracao.get(`Cores.Erro`) == null ? `#5865F2` : configuracao.get(`Cores.Erro`)}`)
                        .setTitle(`Carrinho expirado.`)
                        .setDescription(`O carrinho de <@!${ultimoNumero}> foi fechado por inatividade (\`10 Minutos\`).`)


                    await channela.send({ embeds: [embed] })
                } catch (error) {

                }
            }
        });
    });
}
module.exports = {
    CloseThreds
}