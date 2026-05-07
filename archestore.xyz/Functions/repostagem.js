const cron = require('node-cron');
const { MessageCreate, UpdateMessageProduto } = require("./SenderMessagesOrUpdates");
const Discord = require("discord.js");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js')
const { produtos, configuracao } = require("../DataBaseJson");

let cronJob = null;

async function repostarProdutos(client) {
    const embed = new EmbedBuilder()
        .setAuthor({ name: '— Repostagem Automática', iconURL: 'https://cdn.discordapp.com/emojis/1230562921822683176.webp?size=44&quality=lossless' })
        .setColor('#5865F2')
        .setDescription('Seu ReturNBot iniciou um processo para repostar todas as mensagens de venda no servidor.')
        .setFooter({ text: 'Ações Automáticas - Astral Bot.', iconURL: 'https://cdn.discordapp.com/emojis/1285706921910734898.webp?size=44&quality=lossless' })
        .setTimestamp();

    const botao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`aaaaaaaaa`)
            .setLabel('Notificação do Sistema')
            .setDisabled(true)
            .setStyle(2)
    )

    try {
        let canallogs = await client.channels.fetch(configuracao.get(`ConfigChannels.systemlogs`));
        canallogs.send({ embeds: [embed], components: [botao] });	
    } catch (error) {

    }

    try {
        const todosProdutos = await produtos.all();
        console.log('Número de produtos:', todosProdutos.length);

        for (const produtoData of todosProdutos) {
            const produtoId = produtoData.ID;
            const produtoInfo = produtoData.data;

            if (!produtoInfo || !produtoInfo.mensagens || !Array.isArray(produtoInfo.mensagens)) {
                console.log(`Produto ${produtoId} não tem dados válidos. Pulando...`);
                continue;
            }

            for (const mensagem of produtoInfo.mensagens) {
                try {
                    if (!mensagem.channelid || !mensagem.mesageid) {
                        console.log(`Dados de mensagem incompletos para o produto ${produtoId}. Pulando...`);
                        continue;
                    }

                    const channel = await client.channels.fetch(mensagem.channelid);
                    const oldMessage = await channel.messages.fetch(mensagem.mesageid);
                    await oldMessage.delete();

                    const newMessage = await criarNovaMensagem(client, channel, produtoId, produtoInfo, oldMessage);

                    await atualizarMensagemNoBD(produtoId, mensagem, newMessage);

                } catch (error) {
                    //console.error(`Erro ao repostar produto ${produtoId}:`, error);

                    const systemLogsChannelId = configuracao.get(`ConfigChannels.systemlogs`);

                    if (systemLogsChannelId) {
                        const systemLogsChannel = client.channels.cache.get(systemLogsChannelId);

                        if (systemLogsChannel) {
                            const errorEmbed = new EmbedBuilder()
                                .setColor('#5865F2')
                                .setTitle('Erro ao Repostar Produto')
                                .setDescription(`Ocorreu um erro ao tentar repostar o produto.`)
                                .addFields(
                                    { name: 'ID do Produto', value: produtoId.toString(), inline: true },
                                    { name: 'Tipo de Erro', value: error.name, inline: true },
                                    { name: 'Mensagem de Erro', value: error.message }
                                )
                                .setFooter({ text: 'Sistema de Logs' })
                                .setTimestamp();

                            systemLogsChannel.send({ embeds: [errorEmbed] });
                        } else {
                            console.error(`Canal de logs do sistema não encontrado, adicione no /panel (ID: ${systemLogsChannelId})`);
                        }
                    } else {
                        console.error('ID do canal de logs do sistema não configurado');
                    }
                }
            }
        }
    } catch (error) {
        console.error('Erro ao obter produtos do banco de dados:', error);
    }
}

async function criarNovaMensagem(client, channel, produtoId, produtoInfo, oldMessage) {
    const embedColor = oldMessage.embeds[0]?.color || configuracao.get('Cores.Principal') || '#0099ff';
    const embedFooter = oldMessage.embeds[0]?.footer?.text || null;
    const embed = criarEmbed(produtoInfo, embedColor, embedFooter);
    const components = criarComponents(produtoId, produtoInfo, oldMessage);

    const newMessage = await channel.send({ embeds: [embed], components: components });
    return newMessage;
}

function criarEmbed(produtoInfo, embedColor, embedFooter) {
    let msg = ``;
    if (produtoInfo.Config.entrega === 'Sim' && produtoInfo.Config.Entrega2 !== null) {
        const Entrega2 = configuracao.get(`Emojis_EntregAuto`);
        Entrega2.sort((a, b) => {
            const numA = parseInt(a.name.replace('ea', ''), 10);
            const numB = parseInt(b.name.replace('ea', ''), 10);
            return numA - numB;
        });

        Entrega2.forEach(element => {
            msg += `<:${element.name}:${element.id}>`;
        });
    }

    const embed = new Discord.EmbedBuilder()
        .setColor(embedColor)
        .setTitle(produtoInfo.Config.name.slice(0, 256))
        .setDescription((msg ? msg + '\n' : '') + produtoInfo.Config.desc)
        .setTimestamp();

    if (produtoInfo.Config.icon) {
        embed.setAuthor({ name: produtoInfo.Config.name, iconURL: produtoInfo.Config.icon });
    }

    if (produtoInfo.Config.banner) {
        embed.setImage(produtoInfo.Config.banner);
    }

    if (embedFooter) {
        embed.setFooter({ text: embedFooter });
    }

    if (produtoInfo.Campos && produtoInfo.Campos.length === 1) {
        const campo = produtoInfo.Campos[0];
        if (campo.desc) {
            embed.addFields({ name: campo.Nome, value: campo.desc.slice(0, 1024), inline: true });
        }
        embed.addFields(
            { name: 'Valor à vista', value: `\`R$ ${Number(campo.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``, inline: true },
            { name: 'Restam', value: `\`${campo.estoque.length}\``, inline: true },
        );
    }

    return embed;
}

function criarComponents(produtoId, produtoInfo, oldMessage) {
    if (produtoInfo.Campos.length > 1) {
        const selectMenuBuilder = new Discord.StringSelectMenuBuilder()
            .setCustomId('comprarid')
            .setPlaceholder('Clique aqui para ver as opções');

        for (const campo of produtoInfo.Campos) {
            selectMenuBuilder.addOptions({
                label: campo.Nome,
                description: `Preço: R$ ${Number(campo.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Estoque: ${campo.estoque.length}`,
                value: `${campo.Nome}_${produtoId}`
            });
        }

        const style2row = new Discord.ActionRowBuilder().addComponents(selectMenuBuilder);
        return [style2row];
    } else {
        const oldComponent = oldMessage.components[0].components[0];
        const estilo = oldComponent.style;
        const label = oldComponent.label;
        const emoji = oldComponent.emoji.id === undefined ? oldComponent.emoji.name : oldComponent.emoji.id;

        const row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`comprarid_${produtoInfo.Campos[0].Nome}_${produtoId}`)
                    .setLabel(label)
                    .setEmoji(emoji)
                    .setStyle(estilo)
            );

        return [row];
    }
}

async function atualizarMensagemNoBD(produtoId, mensagemAntiga, novaMensagem) {
    try {
        const produtoInfo = await produtos.get(produtoId);

        if (!produtoInfo || !produtoInfo.mensagens) {
            console.log(`Não foi possível atualizar a mensagem para o produto ${produtoId}. Dados inválidos.`);
            return;
        }

        produtoInfo.mensagens = produtoInfo.mensagens.filter(m => m.mesageid !== mensagemAntiga.mesageid);

        produtoInfo.mensagens.push({
            guildid: novaMensagem.guild.id,
            channelid: novaMensagem.channel.id,
            mesageid: novaMensagem.id
        });

        await produtos.set(produtoId, produtoInfo);
    } catch (error) {
        console.error(`Erro ao atualizar mensagem no banco de dados para o produto ${produtoId}:`, error);
    }
}

function agendarRepostagem(client) {
    const horaConfig = configuracao.get("Repostagem.Hora");
    const statusConfig = configuracao.get("Repostagem.Status");

    // Verifique se `horaConfig` está definido e é uma string válida
    if (!horaConfig || typeof horaConfig !== 'string' || !horaConfig.includes(':')) {
        console.error('Erro: A configuração de hora para repostagem é inválida ou não está definida.');
        return;
    }

    // Verifique se o status da repostagem está ativo
    if (statusConfig === true) {
        const [hour, minute] = horaConfig.split(":");
        const cronTime = `${minute} ${hour} * * *`;
        const timeZone = 'America/Sao_Paulo';

        // Pare o cron job anterior, se existir
        if (cronJob) {
            cronJob.stop();
            console.log('Cron job anterior parado.');
        }

        // Agende o novo cron job
        cronJob = cron.schedule(cronTime, () => {
            console.log(`Repostagem iniciada às ${hour}:${minute} conforme configuração.`);
            repostarProdutos(client);
        }, {
            scheduled: true,
            timezone: timeZone
        });

        console.log(`Repostagem agendada para ${hour}:${minute} com status ativo.`);
    } else {
        // Se o status estiver inativo, pare o cron job, se existir
        if (cronJob) {
            cronJob.stop();
            cronJob = null;
            console.log('Cron job parado, status inativo.');
        }
        console.log('Repostagem não agendada, status está inativo.');
    }
}

function pararRepostagem() {
    if (cronJob) {
        cronJob.stop();
        cronJob = null;
        console.log('Cron job interrompido.');
    }
}

async function iniciarRepostagem(client) {
    console.log('Iniciando teste de repostagem imediatamente.');
    await repostarProdutos(client);
}

module.exports = { agendarRepostagem, pararRepostagem, iniciarRepostagem };
