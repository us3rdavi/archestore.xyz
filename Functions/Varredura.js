const { ActionRowBuilder, EmbedBuilder, ButtonBuilder } = require('discord.js');
const { configuracao, estatisticas, Emojis, refounds, Compras, } = require('../Database');
const axios = require('axios');
const { payment } = require('mercadopago');

async function Varredura(client) {
    if (configuracao.get('ConfigChannels.systemlogs') == null) return;
    if (!configuracao.get('pagamentos.MpAPI')) return;
    let channel;
    const embed3 = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${Emojis.get(`system_emoji`)} — Varredura Anti-Fraude (Mercado Pago)`)
        .setDescription(`Seu Dream Bot está realizando uma varredura nos pagamentos para verificar a existência de quaisquer reembolsos suspeitos.`)
        .setFooter({ iconURL: "https://i.ibb.co/SBRZZjW/1238185861510594560.png", text: `Anti-Fraude - Dream Apps.` })
        .setTimestamp();

    const row222 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('asSs')
                .setLabel('Notificação do Sistema')
                .setStyle(2)
                .setDisabled(true)
        );

    try {
        channel = await client.channels.fetch(configuracao.get('ConfigChannels.systemlogs'));
        await channel.send({ components: [row222], embeds: [embed3] });
    } catch (error) {

    }

    let refunds = [];
    let offset = 0;
    const limit = 100; 

    while (true) {
        let response = await axios.get('https://api.mercadopago.com/v1/payments/search', {
            params: {
                access_token: configuracao.get('pagamentos.MpAPI'),
                status: 'refunded',
                limit: limit,
                offset: offset
            }
        });

        refunds = refunds.concat(response.data.results);

        if (response.data.results.length < limit) {
            break;
        }

        offset += limit; 
    }

    const estatisticasData = estatisticas.fetchAll();
    for (const element of refunds) {
        for (const element2 of estatisticasData) {
            if (element2.data.idpagamento === element.id) {
                estatisticas.delete(element2.ID);
            }
        }

        let compras = await Compras.get(`Compras`)?.find(x => x?.id == element?.id);
        if (compras?.refund) return

        let salvo = await refounds.get(`${element.id}`);
        if (!salvo) {
            let userid = await estatisticas.fetchAll().find(x => x.data.idpagamento === element.id);
            userid = userid ? userid.data.userid : 'Não encontrado';

            await refounds.set(`${element.id}`, {
                id: element.id,
                payer: element?.payer?.id || 'Não encontrado',
                userid: userid,
                transaction_amount: element.transaction_amount,
                banco: element.point_of_interaction?.transaction_data?.bank_info?.payer?.long_name || `Mercadopago.com Representações Ltda.`,
                method: element.payment_method_id,
            });

            const embed = new EmbedBuilder()
                .setTitle(`${Emojis.get(`failuser_emoji`)} Reembolso fraudulento`)
                .setColor('#5865F2')
                .setDescription(`Identificamos que um usuário realizou um reembolso de forma inadequada em sua loja. Como medida preventiva, e para garantir a segurança, esse usuário, responsável pelo reembolso indevido, foi permanentemente banido de efetuar compras em qualquer loja que utilize o sistema Ease Bot.`)
                .setFields(
                    { name: `ID do pedido`, value: `${element.id}`, inline: true },
                    { name: `Valor reembolsado`, value: `${Number(element.transaction_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, inline: true },
                    { name: `Detalhes`, value: `${element.description}`, inline: false }
                );

            try {
                await channel.send({ content: `@everyone`, components: [row222], embeds: [embed] });
            } catch (error) {
                console.error('Erro ao enviar a mensagem:', error);
            }
        }
    }
    
}



module.exports = {
    Varredura
};
