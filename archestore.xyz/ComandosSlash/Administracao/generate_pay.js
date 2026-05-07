const { PermissionFlagsBits, EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { pedidos, pagamentos, carrinhos, configuracao, produtos } = require("../../DataBaseJson/index.js");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const Discord = require("discord.js");
const mercadopago = require('mercadopago');
const { AttachmentBuilder } = require("discord.js");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
    name: "payments",
    description:"Gere um pagamento",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "price",
            description:`-`,
            type: Discord.ApplicationCommandOptionType.Number,
            required: true,
        },
        {
            name: "description",
            description:`-`,
            type: Discord.ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: `user`,
            description:`-`,
            type: Discord.ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: `method`,
            description:`-`,
            type: Discord.ApplicationCommandOptionType.String,
            required: true,
            choices: [
                {
                    name: `Pix (Mercado Pago)`,
                    value: `pix`
                },
                {
                    name: `Semi-automático (Mercado Pago)`,
                    value: `semi`
                }
            ]
        }
    ],

    run: async (client, interaction, message) => {

        const perm = await getPermissions(client.user.id)
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
        }

        const price = interaction.options.getNumber('price');
        const description = interaction.options.getString('description');
        const user = interaction.options.getUser('user');
        const method = interaction.options.getString('method');

        if (isNaN(price)) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O preço deve ser um número.`, ephemeral: true });
        if (price < 1) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O preço deve ser maior que 0.`, ephemeral: true });
        await interaction.reply({ content: `${Emojis.get(`loading_emoji`)} Gerando pagamento...`, ephemeral: true });

        if (method === `pix`) {
            var agora = new Date();
            agora.setMinutes(agora.getMinutes() + 10);
            agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset() + 240);
            agora.setHours(agora.getHours() - 5)
            var novaDataFormatada = agora.toISOString().replace('Z', '-04:00');

            var payment_data = {
                transaction_amount: Number(price),
                description:`Pagamento - ${interaction.user.username}`,
                date_of_expiration: `${novaDataFormatada}`,
                payment_method_id: 'pix',
                payer: {
                    email: `${interaction.user.id}@gmail.com`,
                    first_name: `${interaction.user.username}`,
                    last_name: `${interaction.user.id}`,
                    identification: {
                        type: 'CPF',
                        number: `12345678909`
                    },

                    address: {
                        zip_code: '86063190',
                        street_name: 'Rua Jácomo Piccinin',
                        street_number: '168',
                        neighborhood: 'Pinheiros',
                        city: 'Londrina',
                        federal_unit: 'PR'
                    }
                }
            }
            mercadopago.configurations.setAccessToken(configuracao.get('pagamentos.MpAPI'));
            await mercadopago.payment.create(payment_data)
                .then(async function (data) {

                    const { qrGenerator } = require('../../Lib/QRCodeLib.js')
                    const path = require('path')
                    const qr = new qrGenerator({ imagePath: path.resolve(__dirname, '../../Lib/aaaaa.png') })
                    const qrcode = await qr.generate(data.body.point_of_interaction.transaction_data.qr_code)

                    const buffer = Buffer.from(qrcode.response, "base64");
                    const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

                    const embed = new EmbedBuilder()
                        .setColor(`${configuracao.get(`Cores.Principal`) == null ? '2b2d31' : configuracao.get('Cores.Principal')}`)
                        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) ? interaction.user.displayAvatarURL({ dynamic: true }) : null })
                        .setTitle(`Pagamento via PIX criado`)
                        .addFields(
                            { name: `Código copia e cola`, value: `\`\`\`${data.body.point_of_interaction.transaction_data.qr_code}\`\`\`` }
                        )
                        .setFooter({ text: `${interaction.guild.name} - Pagamento expira em 10 minutos.`, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null })
                        .setTimestamp()
                        .setImage(`https://cdn.discordapp.com/attachments/1179498681481830542/1179499043777429615/qr_code.png?ex=657a0116&is=65678c16&hm=83a7242c9f6a72f9128da76b14ede8ee1df01f5ba0ed0799f8c753b92fa8ede0&`)

                    const row3 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("codigocopiaecola")
                                .setLabel('Código copia e cola')
                                .setEmoji(`1237902888592867358`)
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId("deletchannel")
                                .setLabel('Cancelar')
                                .setStyle(4)

                        )



                    if (configuracao.get(`pagamentos.QRCode`) == `miniatura`) {
                        embed.setDescription(`Se preferir pagar via **QR code**, basta clicar na imagem ao lado.`)
                        embed.setThumbnail(`attachment://payment.png`)
                    } else {
                        embed.setImage('attachment://payment.png')
                    }

                    pagamentos.set(`${interaction.channel.id}`, {
                        user: user.id,
                        price: price,
                        description: description,
                        staff: interaction.user.id,
                    })

                    pagamentos.set(`${interaction.channel.id}`, {  method: 'site', tipo: `gerado`})
                    pagamentos.set(`${interaction.channel.id}.pagamentos2`, { id: data.body.id, cp: data.body.point_of_interaction.transaction_data.qr_code, pix: data.body.point_of_interaction.transaction_data.qr_code, method: 'pix', data: Date.now(), generated: `Command-Generate` })

                    await interaction.channel.send({ embeds: [embed], files: [attachment], content: ``, components: [row3] }).then(async (msg) => {
                        pagamentos.set(`${interaction.channel.id}.message`, { messageid: msg.id, channelid: msg.channel.id })
                    })
                    interaction.editReply({ content: `${Emojis.get(`confirmed_emoji`)} Pagamento gerado com sucesso!`, ephemeral: true });
                })
                .catch(async function (error) {
                    interaction.editReply({ content: `${Emojis.get(`negative_emoji`)} Ocorreu um erro ao criar o pagamento, tente novamente.\nError: ${error}`, ephemeral: true })
                })
        } else if (method === `semi`) {
            let chavepix = configuracao.get(`pagamentos.SemiAutomatico.chavepix`) || `Nenhuma chave Pix configurada.`;
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Pagamento semi-automático`, iconURL: `https://cdn.discordapp.com/emojis/1230562913790595133.webp` })
                .setColor(`Yellow`)
                .setDescription(`- Um pagamento foi gerado com sucesso!`)
                .setFields(
                    { name: `Preço:`, value: `\`${Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\``, inline: true },
                    { name: `Método:`, value: `\`Semi-automático (Mercado Pago)\``, inline: true },
                    { name: `Chave Pix:`, value: `\`\`\`${chavepix}\`\`\``, inline: false }
                )
                .setFooter({ text: `Após realizar o pagamento, envie o comprovante abaixo.` })

            await interaction.channel.send({ embeds: [embed] });
            interaction.editReply({ content: `${Emojis.get(`confirmed_emoji`)} Pagamento gerado com sucesso!`, ephemeral: true });
        }
    }
}
