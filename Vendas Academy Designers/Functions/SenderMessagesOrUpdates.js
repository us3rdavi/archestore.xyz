const { produtos, configuracao, Emojis } = require("../DataBaseJson")

const { QuickDB } = require("quick.db");
const db = new QuickDB();

const Discord = require("discord.js")
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")

const Entrega2 = configuracao.get(`Emojis_EntregAuto`)

let msg = ``
if (Entrega2 !== null) {
    Entrega2.sort((a, b) => {
        const numA = parseInt(a.name.replace('ea', ''), 10);
        const numB = parseInt(b.name.replace('ea', ''), 10);
        return numA - numB;
    });

    Entrega2.forEach(element => {
        msg += `<:${element.name}:${element.id}>`
    });
}

async function MessageCreate(interaction, client) {
    const fdfd = await db.get(`${interaction.user.id}_colocarvenda`)
    const yyy = produtos.get(fdfd.produto)
    const channel = await client.channels.fetch(interaction.values[0])


    if (fdfd.textobutton == undefined) {
        const embed = new EmbedBuilder()
            .setColor(`${fdfd.colorembed}`)
            .setFooter(
                { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) }
            )
            .setTimestamp()

        if (yyy.Config.desc !== "Não definido") {
            embed.setDescription(`${yyy.Config.desc}`)
        }

        if (yyy.Config.entrega == 'Sim') {
            embed.setTitle(`${Emojis.get('a0_emoji')}${Emojis.get('a1_emoji')}${Emojis.get('a2_emoji')}${Emojis.get('a3_emoji')}${Emojis.get('a4_emoji')}${Emojis.get('a5_emoji')}${Emojis.get('a6_emoji')}${Emojis.get('a7_emoji')}`);
        }

        if (yyy.Config.icon !== '') {
            embed.setAuthor({ name: `${yyy.Config.name}`, iconURL: yyy.Config.icon })
        } else {
            embed.setAuthor({ name: `${yyy.Config.name}` })
        }

        if (yyy.Config.banner !== '') {
            embed.setImage(yyy.Config.banner)
        }

        const selectMenuBuilder = new Discord.StringSelectMenuBuilder()
            .setCustomId('comprarid')
            .setPlaceholder('Clique aqui para ver as opções');

        if (yyy && yyy.Campos && yyy.Campos.length <= 1) {
            return interaction.update({ content: `Faça o processo de envio novamente!`, ephemeral: true, components: [] });
        }

        for (let iii = 0; iii < yyy.Campos.length; iii++) {
            const element = yyy.Campos[iii];
            const option = {
                label: `${element.Nome}`,
                description: `Preço: R$ ${Number(element.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Estoque: ${element.estoque.length}`,
                value: `${element.Nome}_${fdfd.produto}`
            }

            selectMenuBuilder.addOptions(option);
        }

        const style2row = new ActionRowBuilder().addComponents(selectMenuBuilder);
        let botao = new ActionRowBuilder()
        if (configuracao.get(`BotaoDuvidas.status`)) {
            botao.addComponents(
                new ButtonBuilder()
                    .setURL(`${configuracao.get(`BotaoDuvidas.linkbotao`)}`)
                    .setLabel(`${configuracao.get(`BotaoDuvidas.nomebotao`)}`)
                    .setStyle(5)
            )

            if (configuracao.get(`BotaoDuvidas.emoji`)) {
                botao.components[0].setEmoji(`${configuracao.get(`BotaoDuvidas.emoji`)}`)
            }
        }
        console.log(botao.components.length)
        try {
            await interaction.update({ embeds: [], components: [], content: `${Emojis.get(`loading_emoji`)} Aguarde...` }).then(async msgg => {
                await channel.send({ embeds: [embed], components: botao.components.length > 0 ? [style2row, botao] : [style2row] }).then(async msggg => {
                    // Obter o array de mensagens atual
                    let mensagens = produtos.get(`${fdfd.produto}.mensagens`) || [];

                    // Verificar se já existe uma mensagem para este canal
                    const existingMessageIndex = mensagens.findIndex(m => m.channelid === msggg.channel.id);

                    if (existingMessageIndex !== -1) {
                        // Se existir, atualizar a mensagem existente
                        mensagens[existingMessageIndex] = {
                            guildid: msggg.guild.id,
                            channelid: msggg.channel.id,
                            mesageid: msggg.id
                        };
                    } else {
                        // Se não existir, adicionar uma nova mensagem
                        mensagens.push({
                            guildid: msggg.guild.id,
                            channelid: msggg.channel.id,
                            mesageid: msggg.id
                        });
                    }

                    // Atualizar o array de mensagens no produto
                    await produtos.set(`${fdfd.produto}.mensagens`, mensagens);

                    const row4 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setURL(msggg.url)
                                .setLabel('Ir para mensagem')
                                .setStyle(5)
                        )

                    await msgg.edit({ content: `${Emojis.get(`confirmed_emoji`)} Mensagem postada!`, ephemeral: true, components: [row4] })
                })
            })
        } catch (error) {
            let mensagem = error.message
            if (error.message === "Invalid Form Body\ncomponents[0].components[0].emoji.name[BUTTON_COMPONENT_INVALID_EMOJI]: Invalid emoji") {
                mensagem = "Emoji inválido. Por favor, insira um emoji válido."
            }

            if (error.message === "ColorConvert") {
                mensagem = "Cor inválida. Por favor, insira uma cor válida."
            }

            await interaction.followUp({ content: `${Emojis.get(`negative_emoji`)}  Ocorreu um erro ao enviar a mensagem.\n\`${mensagem}\``, ephemeral: true })
        }
    } else {
        const embed = new EmbedBuilder()
            .setColor(`${fdfd.colorembed}`)
            .setFooter(
                { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) }
            )
            .setTimestamp()

        if (yyy.Config.desc !== "Não definido") {
            embed.setDescription(`${yyy.Config.desc}`)
        }

        if (yyy.Config.entrega == `Sim`) {
            embed.setTitle(`${Emojis.get('a0_emoji')}${Emojis.get('a1_emoji')}${Emojis.get('a2_emoji')}${Emojis.get('a3_emoji')}${Emojis.get('a4_emoji')}${Emojis.get('a5_emoji')}${Emojis.get('a6_emoji')}${Emojis.get('a7_emoji')}`);

        }

        if (yyy.Config.icon !== '') {
            embed.setAuthor({ name: `${yyy.Config.name}`, iconURL: yyy.Config.icon })
        } else {
            embed.setAuthor({ name: `${yyy.Config.name}` })
        }

        if (yyy.Config.banner !== '') {
            embed.setImage(yyy.Config.banner)
        }

        if (yyy.Campos[0].desc !== '') {
            embed.addFields({ name: `${yyy.Campos[0].Nome}`, value: `${yyy.Campos[0].desc.slice(0, 1024)}`, inline: true });
        }

        embed.addFields(
            { name: `Valor à vista`, value: `\`R$ ${Number(yyy.Campos[0].valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``, inline: true },
            { name: `Restam`, value: `\`${yyy.Campos[0].estoque.length}\``, inline: true },
        );

        var estilo = 2

        if (fdfd.estilobutton == 'verde') estilo = 3
        if (fdfd.estilobutton == 'cinza') estilo = 2
        if (fdfd.estilobutton == 'azul') estilo = 1
        if (fdfd.estilobutton == 'vermelho') estilo = 4

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`comprarid_${yyy.Campos[0].Nome}_${fdfd.produto}`)
                    .setLabel(`${fdfd.textobutton}`)
                    .setEmoji(`${fdfd.emoji}`)
                    .setStyle(estilo),)


        if (configuracao.get(`BotaoDuvidas.status`)) {
            row2.components.push(
                new ButtonBuilder()
                    .setURL(`${configuracao.get(`BotaoDuvidas.linkbotao`)}`)
                    .setLabel(`${configuracao.get(`BotaoDuvidas.nomebotao`)}`)
                    .setStyle(5)
            )

            if (configuracao.get(`BotaoDuvidas.emoji`)) {
                row2.components[1].setEmoji(`${configuracao.get(`BotaoDuvidas.emoji`)}`)
            }
        }

        try {
            await interaction.update({ embeds: [], components: [], content: `${Emojis.get(`loading_emoji`)} Aguarde...` }).then(async msgg => {
                await channel.send({ embeds: [embed], components: [row2] }).then(async msggg => {
                    // Obter o array de mensagens atual
                    let mensagens = produtos.get(`${fdfd.produto}.mensagens`) || [];

                    // Verificar se já existe uma mensagem para este canal
                    const existingMessageIndex = mensagens.findIndex(m => m.channelid === msggg.channel.id);

                    if (existingMessageIndex !== -1) {
                        // Se existir, atualizar a mensagem existente
                        mensagens[existingMessageIndex] = {
                            guildid: msggg.guild.id,
                            channelid: msggg.channel.id,
                            mesageid: msggg.id
                        };
                    } else {
                        // Se não existir, adicionar uma nova mensagem
                        mensagens.push({
                            guildid: msggg.guild.id,
                            channelid: msggg.channel.id,
                            mesageid: msggg.id
                        });
                    }

                    // Atualizar o array de mensagens no produto
                    await produtos.set(`${fdfd.produto}.mensagens`, mensagens);

                    const row4 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setURL(msggg.url)
                                .setLabel('Ir para mensagem')
                                .setStyle(5)
                        )

                    msgg.edit({ content: `${Emojis.get(`confirmed_emoji`)} Mensagem postada!`, ephemeral: true, components: [row4] })
                })
            })
        } catch (error) {
            const mensagemTraduzida = (error.message === "Invalid Form Body\ncomponents[0].components[0].emoji.name[BUTTON_COMPONENT_INVALID_EMOJI]: Invalid emoji")
                ? "Emoji inválido. Por favor, insira um emoji válido."
                : error.message;

            interaction.followUp({ content: `${Emojis.get(`negative_emoji`)}  Ocorreu um erro ao enviar a mensagem.\n\`${mensagemTraduzida}\``, ephemeral: true })
        }
    }
}

async function UpdateMessageProduto(client, produto) {
    const ghgh = await produtos.get(produto)



    const embed = new EmbedBuilder()
        .setTimestamp()

    if (ghgh.Config.desc !== "Não definido") {
        embed.setDescription(`${ghgh.Config.desc}`)
    }

    if (ghgh.Config.entrega == 'Sim') {
        embed.setTitle(`${Emojis.get('a0_emoji')}${Emojis.get('a1_emoji')}${Emojis.get('a2_emoji')}${Emojis.get('a3_emoji')}${Emojis.get('a4_emoji')}${Emojis.get('a5_emoji')}${Emojis.get('a6_emoji')}${Emojis.get('a7_emoji')}`);

    }

    if (ghgh.Config.icon !== '') {
        embed.setAuthor({ name: `${ghgh.Config.name}`, iconURL: ghgh.Config.icon })
    } else {
        embed.setAuthor({ name: `${ghgh.Config.name}` })
    }

    if (ghgh.Config.banner !== '') {
        embed.setImage(ghgh.Config.banner)
    }

    if (ghgh && ghgh.Campos && ghgh.Campos.length > 1) {
        const selectMenuBuilder = new Discord.StringSelectMenuBuilder()
            .setCustomId('comprarid')
            .setPlaceholder('Clique aqui para ver as opções');

        for (let iii = 0; iii < ghgh.Campos.length; iii++) {
            const element = ghgh.Campos[iii];

            const option = {
                label: `${element.Nome}`,
                description: `Preço: R$ ${Number(element.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Estoque: ${element.estoque.length}`,
                value: `${element.Nome}_${produto}`
            };

            selectMenuBuilder.addOptions(option);
        }

        const style2row = new ActionRowBuilder().addComponents(selectMenuBuilder);

        let botao = new ActionRowBuilder()

        if (configuracao.get(`BotaoDuvidas.status`)) {
            botao.addComponents(
                new ButtonBuilder()
                    .setURL(`${configuracao.get(`BotaoDuvidas.linkbotao`)}`)
                    .setLabel(`${configuracao.get(`BotaoDuvidas.nomebotao`)}`)
                    .setStyle(5)
            )

            if (configuracao.get(`BotaoDuvidas.emoji`)) {
                botao.components[0].setEmoji(`${configuracao.get(`BotaoDuvidas.emoji`)}`)
            }
        }

        for (let iiiiii = 0; iiiiii < ghgh.mensagens?.length; iiiiii++) {
            const element = ghgh.mensagens[iiiiii];

            try {
                const channel = await client.channels.fetch(element.channelid)
                const fetchedMessage = await channel.messages.fetch(element.mesageid);
                const guilddd = await client.guilds.fetch(element.guildid)

                embed.setColor(fetchedMessage.embeds[0].data.color)
                embed.setFooter(
                    { text: guilddd.name }
                )

                await fetchedMessage.edit({ embeds: [embed], components: botao.components.length > 0 ? [style2row, botao] : [style2row] })
            } catch (error) {
                const hhhh = produtos.get(`${produto}.mensagens`)
                const indexToRemove = hhhh.findIndex(campo22 => campo22.mesageid === element.mesageid);
                hhhh.splice(indexToRemove, 1);
                produtos.set(`${produto}.mensagens`, hhhh)
            }
        }
    } else {
        if (ghgh.Campos[0] == undefined) {
            if (ghgh.mensagens == undefined) return produtos.set(`${produto}.mensagens`, [])
            for (let iiiiii = 0; iiiiii < ghgh.mensagens.length; iiiiii++) {
                const element = ghgh.mensagens[iiiiii];
                const channel = await client.channels.fetch(element.channelid)
                const fetchedMessage = await channel.messages.fetch(element.mesageid);
                fetchedMessage.delete()
            }
            produtos.set(`${produto}.mensagens`, [])
        }

        if (ghgh.Campos[0] && ghgh.Campos[0].desc !== '') {
            embed.addFields({ name: `${ghgh.Campos[0].Nome}`, value: `${ghgh.Campos[0].desc}` });
        }
        const embed22 = new EmbedBuilder()
            .setTimestamp()

        if (ghgh.Config.desc !== "Não definido") {
            embed22.setDescription(ghgh.Config.desc)
        }

        if (ghgh.Config.entrega == 'Sim') {
            embed22.setTitle(`${Emojis.get('a0_emoji')}${Emojis.get('a1_emoji')}${Emojis.get('a2_emoji')}${Emojis.get('a3_emoji')}${Emojis.get('a4_emoji')}${Emojis.get('a5_emoji')}${Emojis.get('a6_emoji')}${Emojis.get('a7_emoji')}`);
        }

        if (ghgh.Config.icon !== '') {
            embed22.setAuthor({ name: `${ghgh.Config.name}`, iconURL: ghgh.Config.icon })
        } else {
            embed22.setAuthor({ name: `${ghgh.Config.name}` })
        }

        if (ghgh.Config.banner !== '') {
            embed22.setImage(ghgh.Config.banner)
        }

        if (ghgh.Campos[0] && ghgh.Campos[0].desc !== '') {
            embed22.addFields({ name: `${ghgh.Campos[0].Nome}`, value: `${ghgh.Campos[0].desc}`, inline: true });
        }

        if (ghgh.Campos[0] && typeof ghgh.Campos[0].valor === 'number') {
            embed22.addFields(
                { name: `Valor à vista`, value: `\`R$ ${ghgh.Campos[0].valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``, inline: true },
                { name: `Restam`, value: `\`${ghgh.Campos[0].estoque.length}\``, inline: true }
            );
        }

        if (!ghgh || !ghgh.mensagens || ghgh.mensagens.length === undefined) return;
        if (ghgh.mensagens.length === 0) return;
        for (let iiiiii = 0; iiiiii < ghgh.mensagens.length; iiiiii++) {
            const element = ghgh.mensagens[iiiiii];


            try {
                const channel = await client.channels.fetch(element.channelid)
                const fetchedMessage = await channel.messages.fetch(element.mesageid);
                const guilddd = await client.guilds.fetch(element.guildid)

                embed22.setColor(fetchedMessage.embeds[0].data.color)
                embed22.setFooter(
                    { text: guilddd.name }
                )

                let row2
                if (fetchedMessage.components[0].components[0].style == undefined) {

                    row2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`comprarid_${ghgh.Campos[0].Nome}_${produto}`)
                                .setLabel(`Comprar`)
                                .setEmoji(`1191792807451562004`)
                                .setStyle(2),)
                } else {
                    row2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`comprarid_${ghgh.Campos[0].Nome}_${produto}`)
                                .setLabel(`${fetchedMessage.components[0].components[0].label}`)
                                .setEmoji(`${fetchedMessage.components[0].components[0].emoji.id == undefined ? fetchedMessage.components[0].components[0].emoji.name : fetchedMessage.components[0].components[0].emoji.id}`)
                                .setStyle(fetchedMessage.components[0].components[0].style),)
                }

                if (configuracao.get(`BotaoDuvidas.status`)) {
                    row2.addComponents(
                        new ButtonBuilder()
                            .setURL(`${configuracao.get(`BotaoDuvidas.linkbotao`)}`)
                            .setLabel(`${configuracao.get(`BotaoDuvidas.nomebotao`)}`)
                            .setStyle(5)
                    )

                    if (configuracao.get(`BotaoDuvidas.emoji`)) {
                        row2.components[1].setEmoji(`${configuracao.get(`BotaoDuvidas.emoji`)}`)
                    }
                }


                await fetchedMessage.edit({ embeds: [embed22], components: [row2] })
            } catch (error) {
                const hhhh = produtos.get(`${produto}.mensagens`)
                const indexToRemove = hhhh.findIndex(campo22 => campo22.mesageid === element.mesageid);
                hhhh.splice(indexToRemove, 1);
                produtos.set(`${produto}.mensagens`, hhhh)
            }
        }

    }
}

async function UpdateAllMessagesProduct(client) {
    const produtosArray = produtos.all();
    for (let i = 0; i < produtosArray.length; i++) {
        const element = produtosArray[i];
        await UpdateMessageProduto(client, element.ID)
    }
}

module.exports = {
    MessageCreate,
    UpdateMessageProduto,
    UpdateAllMessagesProduct
}