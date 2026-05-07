const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { pagamentos, carrinhos, pedidos, produtos, configuracao, Emojis, Compras } = require("../DataBaseJson")
const axios = require("axios");
const { CheckPosition } = require("./PosicoesFunction");

function calculatePrice(car) {
    const productDetails = produtos.get(`${car.infos.produto}.Campos`);
    const product = productDetails.find(campo => campo.Nome === car.infos.campo);
    let valor = product.valor * car.quantidadeselecionada;

    if (car.cupomadicionado) {
        const coupons = produtos.get(`${car.infos.produto}.Cupom`);
        const coupon = coupons.find(campo => campo.Nome === car.cupomadicionado);
        valor *= (1 - coupon.desconto / 100);
    }

    return valor.toFixed(2);
}

async function VerificarPagamento(client) {
    const allPayments = pagamentos.fetchAll();

    for (const payment of allPayments) {
        if (payment.data.pagamentos) {
            const method = payment.data?.pagamentos?.method;
            const paymentDate = payment.data.pagamentos.data;

            let threadChannel
            try {
                threadChannel = await client.channels.fetch(payment.ID);

                const tenMinutesLater = paymentDate + 10 * 60 * 1000;

                if (Date.now() > tenMinutesLater) {

                    await threadChannel.delete()
                    const texto = threadChannel.name;
                    const partes = texto.split("・");
                    const ultimoNumero = partes[partes.length - 1];
                    const car = carrinhos.get(payment.ID);
                    pagamentos.delete(payment.ID)
                    carrinhos.delete(payment.ID)

                    try {
                        const channela = await client.channels.fetch(configuracao.get(`ConfigChannels.logpedidos`));

                        const mandanopvdocara = new EmbedBuilder()
                            .setColor(`${configuracao.get(`Cores.Erro`) == null ? `#ff0000` : configuracao.get(`Cores.Erro`)}`) //ff0000
                            .setAuthor({ name: ` Pagamento expirado`, iconURL: "https://i.ibb.co/cgc5HYq/1238523554337787976.png" })
                            .setFooter(
                                { text: car.guild.name, iconURL: car.guild.iconURL }
                            )
                            .setTimestamp()
                            .setDescription(`Usuário <@!${ultimoNumero}> deixou o pagamento expirar.`)
                            .addFields(
                                { name: `ID do Pedido`, value: `\`${car.pagamentos.id}\`` }
                            );

                        await channela.send({ embeds: [mandanopvdocara] });
                    } catch (error) {

                    }
                    return
                }

            } catch (error) {
                //console.error(`Error processing PIX payment for ID ${payment.ID}: ${error}`);
                pagamentos.delete(payment.ID);
                carrinhos.delete(payment.ID)
            }

            let res
            if (payment.data.pagamentos.id !== `Aprovado Manualmente`) {

                let url = method == 'pix' ? `https://api.mercadopago.com/v1/payments/${payment.data.pagamentos.id}` : `https://api.mercadopago.com/v1/payments/search?external_reference=${payment.data.pagamentos.PaymentId}`

                res = await axios.get(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${configuracao.get('pagamentos.MpAPI')}`
                    }
                }).catch((error) => {
                    if (error.response.data.message == `Payment not found`) {
                        pagamentos.delete(payment.ID)
                        carrinhos.delete(payment.ID)
                        return
                    }
                })


            }

            let status = method === 'pix' ? res?.data?.status : res?.data?.results[0]?.status;
            if (status == 'approved' || payment.data.pagamentos.id == `Aprovado Manualmente`) { //pending // approved
                pagamentos.delete(payment.ID)
                const yy = await carrinhos.get(payment.ID);
                let guild = await client.guilds.fetch(yy.guild);
                const messages = await threadChannel.messages.fetch({ limit: 100 });
                await threadChannel.bulkDelete(messages);
                const msg = await threadChannel.send({ embeds: [], content: `${Emojis.get(`loading_emoji`)} Aguarde...` })

                let valor = 0
                const hhhh = produtos.get(`${yy.infos.produto}.Campos`)
                const gggaaa = hhhh.find(campo22 => campo22.Nome === yy.infos.campo)


                if (yy.cupomadicionado !== undefined) {
                    const valor2 = gggaaa.valor * yy.quantidadeselecionada

                    const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`)
                    const gggaaaawdwadwa = hhhh2.find(campo22 => campo22.Nome === yy.cupomadicionado)
                    valor = valor2 * (1 - gggaaaawdwadwa.desconto / 100);
                } else {
                    valor = gggaaa.valor * yy.quantidadeselecionada
                }

                const lk = carrinhos.get(`${payment.ID}.replys`)
                let bank = method === 'pix' ? res?.data?.point_of_interaction?.transaction_data?.bank_info?.payer?.long_name : res?.data?.results[0]?.point_of_interaction?.transaction_data?.bank_info?.payer?.long_name || `Mercadopago.com Representações Ltda.`;

                let blockaccount = await BloquearConta(client, res, payment, threadChannel, msg, lk)
                if (blockaccount?.status == 400) return
                let blockbank = await BloquearBanco(client, bank, payment.data.pagamentos.id)
                if (blockbank?.status == 400) {

                    const embed = new EmbedBuilder()
                        .setTitle(`${Emojis.get(`failpayment_emoji`)} Pagamento não aprovado`)
                        .setColor(`Red`)
                        .setDescription(`Esse servidor não está aceitando pagamentos desta instituição \`${bank}\`, seu dinheiro foi reembolsado, tente novamente usando outro banco.`)
                        .setFields(
                            { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                            { name: `ID do Pedido`, value: `\`${payment.data.pagamentos.id}\`` },
                        )
                        .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null })
                        .setTimestamp()

                        setInterval(async () => {
                            try {
                                await threadChannel.delete()
                            } catch (error) {

                            }

                        }, 120000);

                    const embedlog = new EmbedBuilder()
                        .setTitle(`${Emojis.get(`failpayment_emoji`)} Pagamento não aprovado`)
                        .setColor(`Red`)
                        .setDescription(`Usuário <@!${yy.user}> teve o dinheiro reembolsado e o produto não entregue, pelo motivo do banco \`${bank}\` estar na lista de bancos bloqueados.`)
                        .setFields(
                            { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                            { name: `ID do Pedido`, value: `\`${payment.data.pagamentos.id}\`` },
                        )
                        .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null })
                        .setTimestamp()

                    let canallogs = await client.channels.fetch(configuracao.get(`ConfigChannels.logpedidos`));
                    try {
                        canallogs.send({ embeds: [embedlog] })
                    } catch (error) {

                    }

                    msg.edit({ embeds: [embed], content: `` })
                    return
                }

                Compras.push(`Compras`, { id: payment.data.pagamentos.id, method: method, user: yy.user, valor: valor, banco: bank, data: Date.now() })

                const status2 = (payment.data.pagamentos.id === 'Aprovado Manualmente') ? 'Aprovado Manualmente' : (res.data.status === 'pending' ? 'AutoApproved' : Number(payment.data.pagamentos.id));
                pedidos.set(payment.ID, { id: status2, method: method })

                await msg.edit({ content: `${Emojis.get(`loading_emoji`)} Aguarde...`, embeds: [] })
                const car = carrinhos.get(payment.ID);
                const valorr = calculatePrice(car);
                let user = await client.users.fetch(yy.user);

                const mandanopvdocara2 = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#40fc04` : configuracao.get(`Cores.Sucesso`)}`) //40fc04
                    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) ? user.displayAvatarURL({ dynamic: true }) : null })
                    .setTitle(`${Emojis.get(`confirmedpayment_emoji`)} Pagamento aprovado`)
                    .setDescription(`Seu pagamento foi aprovado, e o processo de entrega já foi iniciado.`)
                    .addFields(
                        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                        { name: `ID do Pedido`, value: `\`${payment.data.pagamentos.id}\`` }
                    )
                    .setFooter(
                        { text: guild.name, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null }
                    )
                    .setTimestamp()

                await msg.edit({ embeds: [mandanopvdocara2], content: `` })


                const dsfjmsdfjnsdfj2 = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#40fc04` : configuracao.get(`Cores.Sucesso`)}`) //40fc04
                    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) ? user.displayAvatarURL({ dynamic: true }) : null })
                    .setTitle(`${Emojis.get(`confirmedpayment_emoji`)} Pagamento aprovado`)
                    .setDescription(`Seu pagamento foi aprovado, e o processo de entrega já foi iniciado.`)
                    .addFields(
                        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                        { name: `ID do Pedido`, value: `\`${payment.data.pagamentos.id}\`` }
                    )
                    .setFooter(
                        { text: guild.name, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null }
                    )
                    .setTimestamp()

                try {
                    const member = await client.users.fetch(guild.name.id)
                    await member.send({ embeds: [dsfjmsdfjnsdfj2] })
                } catch (error) {

                }

                const dsfjmsdfjnsdfj222 = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#40fc04` : configuracao.get(`Cores.Sucesso`)}`) //40fc0
                    .setTitle(`${Emojis.get(`confirmedpayment_emoji`)} Pedido aprovado`)
                    .setDescription(`Usuário <@!${yy.user}> efetuou o pagamento.`)
                    .addFields(
                        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                        { name: `ID do Pedido`, value: `\`${payment.data.pagamentos.id}\`` },
                        { name: `Banco`, value: `\`${bank}\`` }
                    )
                    .setFooter(
                        { text: guild.name, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null }
                    )
                    .setTimestamp()


                const row222 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`refoundd_${payment.data.pagamentos.id}`)
                            .setLabel('Reembolsar')
                            .setStyle(2)
                            .setEmoji(`1187468970891169853`)
                            .setDisabled(status == `approved` ? false : true)
                    );

                try {
                    const channela = await client.channels.fetch(lk.channelid);

                    const yuyu = await channela.messages.fetch(lk.idmsg)
                    yuyu.reply({ embeds: [dsfjmsdfjnsdfj222], components: [row222] }).then(aaaaa => {
                        carrinhos.set(`${payment.ID}.replys`, { channelid: aaaaa.channel.id, idmsg: aaaaa.id })
                    })
                } catch (error) {

                }

                CheckPosition(client)
                try {
                    if (configuracao.get('ConfigRoles.cargoCliente') !== null) {
                        let member = await guild.members.fetch(yy.user);
                        await member.roles.add(configuracao.get('ConfigRoles.cargoCliente'));
                    }
                } catch (error) {

                }
                CheckPosition(client)
            }
        } else {
            let url = payment.data.pagamentos2.method === 'pix' ? `https://api.mercadopago.com/v1/payments/${payment.data.pagamentos2.id}` : `https://api.mercadopago.com/v1/payments/search?external_reference=${payment.data.pagamentos2.PaymentId}`
            let res = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${configuracao.get('pagamentos.MpAPI')}`
                }
            })

            let status = payment.data.pagamentos2.method === 'pix' ? res?.data?.status : res?.data?.results[0]?.status;
            if (status == 'approved') {
                pagamentos.delete(payment.ID)
                const canal = await client.channels.fetch(payment.ID);
                let yy = pagamentos.get(payment.ID);
                let user = await client.users.fetch(yy.user);
                let method = payment.data.pagamentos2.method;
                const mensagem = await canal.messages.fetch(payment.data.message.messageid);
                const lk = pagamentos.get(`${payment.ID}.replys`)
                let bank = method === 'pix' ? res?.data?.point_of_interaction?.transaction_data?.bank_info?.payer?.long_name : res?.data?.results[0]?.point_of_interaction?.transaction_data?.bank_info?.payer?.long_name || `Mercadopago.com Representações Ltda.`;

                let blockaccount = await BloquearConta(client, res, payment, threadChannel, mensagem, lk)
                if (blockaccount?.status == 400) return
                let blockbank = await BloquearBanco(client, bank, payment.data.pagamentos2.id)
                if (blockbank.status == 400) {
                    const embed = new EmbedBuilder()
                        .setTitle(`${Emojis.get(`failpayment_emoji`)} Pagamento não aprovado`)
                        .setColor(`Red`)
                        .setDescription(`Esse servidor não está aceitando pagamentos desta instituição \`${bank}\`, seu dinheiro foi reembolsado, tente novamente usando outro banco.`)
                        .setFields(
                            { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                            { name: `ID do Pedido`, value: `\`${payment.data.pagamentos.id}\`` },
                        )
                        .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null })
                        .setTimestamp()

                        setInterval(async () => {
                            try {
                                await threadChannel.delete()
                            } catch (error) {

                            }

                        }, 120000);

                    const embedlog = new EmbedBuilder()
                        .setTitle(`${Emojis.get(`failpayment_emoji`)} Pagamento não aprovado`)
                        .setColor(`Red`)
                        .setDescription(`Usuário <@!${yy.user}> teve o dinheiro reembolsado e o produto não entregue, pelo motivo do banco \`${bank}\` estar na lista de bancos bloqueados.`)
                        .setFields(
                            { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                            { name: `ID do Pedido`, value: `\`${payment.data.pagamentos.id}\`` },
                        )
                        .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null })
                        .setTimestamp()

                    let canallogs = await client.channels.fetch(configuracao.get(`ConfigChannels.logpedidos`));
                    try {
                        canallogs.send({ embeds: [embedlog] })
                    } catch (error) {

                    }

                    msg.edit({ embeds: [embed], content: `` }).then(() => {
                        let minutos = configuracao.get(`ConfigCarrinho.pospagamento`) || 1;
                        setTimeout(async () => {
                            await canal.delete();
                        }, minutos * 60 * 1000);
                    })
                    return
                }

                Compras.push(`Compras`, { id: payment.data.pagamentos2.id, method: payment.data.pagamentos2.method, user: yy.user, valor: payment.data.pagamentos2.valor, banco: bank, data: Date.now(), command: 'Generate' })

                const embedgeral = new EmbedBuilder()
                    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) ? user.displayAvatarURL({ dynamic: true }) : null })
                    .setTitle(`${Emojis.get(`confirmedpayment_emoji`)}Pagamento aprovado`)
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#40fc04` : configuracao.get(`Cores.Sucesso`)}`) //40fc04
                    .setDescription(`\`${user.username} - ${payment.data.description}\``)
                    .setFields(
                        { name: `Valor Pago`, value: `\`${Number(payment.data.pagamentos2.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                        { name: `Banco`, value: `${bank == `Mercado Pago` ? `${Emojis.get(`pix_stamp_emoji`)} \`Pix - Mercado Pago\`` : `\`${bank}\``}` }
                    )
                    .setFooter({ text: `${canal.guild.name}`, iconURL: canal.guild.iconURL() ? canal.guild.iconURL() : null })
                    .setTimestamp()



                const embed = new EmbedBuilder()
                    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) ? user.displayAvatarURL({ dynamic: true }) : null })
                    .setTitle(`${Emojis.get(`confirmedpayment_emoji`)} Pagamento aprovado`)
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#40fc04` : configuracao.get(`Cores.Sucesso`)}`) //40fc04
                    .setDescription(`\`${user.username} - ${payment.data.description}\``)
                    .addFields(
                        { name: `ID do Pedido`, value: `\`${payment.data.pagamentos2.id}\`` },
                        { name: `Valor Pago`, value: `\`${Number(payment.data.pagamentos2.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                        { name: `Banco`, value: `\`${bank}\`` }
                    )
                    .setFooter({ text: `${canal.guild.name}`, iconURL: canal.guild.iconURL() ? canal.guild.iconURL() : null })
                    .setTimestamp()


                const row222 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`refoundd_${payment.data.pagamentos2.id}`)
                            .setLabel('Reembolsar')
                            .setStyle(2)
                            .setEmoji(`1187468970891169853`)
                            .setDisabled(status == 'approved' ? false : true)
                    );

                mensagem.edit({ embeds: [embedgeral], components: [], attachments: [] })
                canal.send({ content: `<@!${payment.data.staff}>` }).then(async (msg) => {
                    setTimeout(async () => {
                        await msg.delete();
                    }, 2000);
                })

                try {
                    let canal2 = await client.channels.fetch(configuracao.get(`ConfigChannels.eventbuy`));
                    canal2.send({ embeds: [embed] })
                } catch (error) {

                }

                try {
                    const canallogs = await client.channels.fetch(configuracao.get(`ConfigChannels.logpedidos`));
                    embed.addFields({ name: `Realizado por`, value: `<@!${payment.data.staff}> - \`Command-Generate\`` })
                    canallogs.send({ embeds: [embed], components: [row222] })
                } catch (error) {

                }
            }
        }
    }
}
async function BloquearBanco(client, bank, id) {
    let BancosBloqueados = configuracao.get('pagamentos.BancosBloqueados') || [];
    if (BancosBloqueados?.includes(bank)) {
        let codealeateorio = Math.random().toString(36).substring(7);
        await axios.post(`https://api.mercadopago.com/v1/payments/${id}/refunds`, {}, {
            headers: {
                'Authorization': `Bearer ${configuracao.get('pagamentos.MpAPI')}`,
                'X-Idempotency-Key': `${codealeateorio}`,
            }
        });
        return { status: 400, message: `Banco Bloqueado` }
    } else {
        return { status: 200, message: `Banco não bloqueado` }
    }
}
async function BloquearConta(client, res, payment, threadChannel, msg, lk) {
    let ContasBloqueadas = configuracao.get('pagamentos.ContasBloqueadas') || [];
    if (ContasBloqueadas?.length > 0) {
        let id = payment.data.pagamentos2.method == `pix` ? res?.data?.payer?.id : res?.data?.results[0]?.payer?.id;
        let paymentid = method == `pix` ? res?.data?.id : res?.data?.results[0]?.id;
        let contaBloqueada = await ContasBloqueadas.find(conta => conta.startsWith(id));
        if (contaBloqueada) {
            let codealeateorio = Math.random().toString(36).substring(7);
            let response = await axios.post(`https://api.mercadopago.com/v1/payments/${paymentid}/refunds`, {}, {
                headers: {
                    'Authorization': `Bearer ${configuracao.get('pagamentos.MpAPI')}`,
                    'X-Idempotency-Key': `${codealeateorio}`,
                }
            });

            response = response.data;

            if (response.status == `approved`) {
                let motivo = contaBloqueada.split(':')[1] || 'Motivo não especificado';

                const embed = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Erro`) || `#ff0000`}`)
                    .setTitle(`${Emojis.get(`failpayment_emoji`)} Pedido não aprovado`)
                    .setDescription(`Esse servidor não está aceitando pagamentos desta conta \`${id}\`, seu dinheiro foi reembolsado, tente novamente usando outra conta.`)
                    .addFields(
                        { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                        { name: `ID do Pedido`, value: `\`${payment.data.pagamentos.id}\`` },
                        { name: `Motivo`, value: motivo }
                    );

                const embed2 = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Erro`) || `#ff0000`}`)
                    .setTitle(`${Emojis.get(`failpayment_emoji`)} Pedido não aprovado`)
                    .setDescription(`Esse servidor não está aceitando pagamentos desta conta \`${id}\`, o dinheiro do Comprador foi reembolsado. Obrigado por confiar em meu trabalho.`)
                    .addFields(
                        { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                        { name: `ID do Pedido`, value: `\`${payment.data.pagamentos.id}\`` },
                        { name: `Motivo`, value: motivo }
                    );

                try {
                    const channela = await client.channels.fetch(lk.channelid);
                    const yuyu = await channela.messages.fetch(lk.idmsg);

                    yuyu.reply({ embeds: [embed2] });
                } catch (error) {
                    console.error('Erro ao enviar a mensagem:', error);
                }
                msg.edit({ embeds: [embed], content: `` });

                let minutos = configuracao.get(`ConfigCarrinho.pospagamento`) || 1;
                setTimeout(async () => {
                    try { await threadChannel.delete(); } catch (error) { console.error('Erro ao deletar o canal:', error); }
                }, minutos * 60 * 1000);

                return { status: 400, motivo: motivo };
            }
        } else {
            return { status: 200, motivo: 'Conta não bloqueada' };
        }
    }
}



module.exports = {
    VerificarPagamento
}