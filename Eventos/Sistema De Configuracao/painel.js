const Discord = require("discord.js")
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, InteractionType, StringSelectMenuBuilder, ChannelType, PermissionsBitField, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const { Painel, definirduvidas } = require("../../Functions/Painel");
const { AcoesAutomaticsConfigs, LimpezaAutomatica, msgbemvindo, msgbemvindocanais, GerenciarCanais, SistemaNukar, sistemaAntiRaid, SistemadeFiltro, SistemaAntiFake } = require("../../Functions/AcoesAutomatics.js");
const { Gerenciar } = require("../../Functions/Gerenciar");
const { automatico } = require("../../Functions/automaticos");
const { ConfigRoles } = require("../../Functions/ConfigRoles");
const { gerenciarPerms } = require("../../Functions/modUsersPerms");
const { produtos, configuracao, tickets, estatisticas } = require("../../Database");
const { Avançados, Configcomandos24, Emojis24, Perms24 } = require("../../Functions/Avancados.js");
const { painelTicket } = require("../../Functions/PainelTickets.js");
const { CreateMessageTicket, Checkarmensagensticket } = require("../../Functions/CreateMensagemTicket.js");
const { PermsAvançados24 } = require("../../Functions/PermsAvancados.js")
const { autoreact24 } = require("../../Functions/Autoreactfunction.js")
const { CreateTicket } = require("../../Functions/CreateTicket.js");
const { GerenciarCampos2 } = require("../../Functions/GerenciarCampos.js");
const { AcoesMsgsAutomatics } = require("../../Functions/ConfigMsgsAutomatics.js");
const { AcoesRepostAutomatics } = require("../../Functions/ConfigRepostAuto.js");
const { moedaConfig } = require("../../Functions/moedaConfig.js");
const { Atendimentohorario } = require("../../Functions/atendimentohorario.js")
const { AutoClear } = require("../../Functions/AutoClear");
const { owner } = require("../../config.json");
const discordTranscripts = require('discord-html-transcripts');
const { StringSelectMenuOptionBuilder } = require("discord.js");
const { Emojis } = require("../../Database");
const { buildAparenciaMain } = require("../../Functions/TicketAparenciaBuilder");
const { buildFuncaoNavScreen } = require("../../Functions/TicketAparenciaBuilder");
const { logAction } = require('../../Functions/AuditLog.js');
const { FormasDePagamentos } = require('../../Functions/FormasDePagamentosConfig');


module.exports = {
    name: 'interactionCreate',
    CriarSelectChannel,
    CriarSelectRole,

    run: async (interaction, client) => {

        if (interaction.type == Discord.InteractionType.ModalSubmit) {

            if (interaction.customId == 'botaoduvidas') {
                const emoji = interaction.fields.getTextInputValue('emoji');
                const nomebotao = interaction.fields.getTextInputValue('nomebotao');
                const linkbotao = interaction.fields.getTextInputValue('linkbotao');

                if (emoji !== '') {
                    const emojiRegex = /^<:.+:\d+>$|^<a:.+:\d+>$|^\p{Emoji}$/u;
                    if (!emojiRegex.test(emoji)) {
                        return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Você escolheu incorretamente o emoji!`, ephemeral: true });
                    }
                    configuracao.set('BotaoDuvidas.emoji', emoji);
                } else {
                    configuracao.delete('BotaoDuvidas.emoji');
                }

                if (nomebotao !== '') {
                    configuracao.set('BotaoDuvidas.nomebotao', nomebotao);
                } else {
                    configuracao.delete('BotaoDuvidas.nomebotao');
                }

                if (linkbotao !== '') {
                    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
                    if (!urlRegex.test(linkbotao)) {
                        return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Você escolheu incorretamente a URL do botão!`, ephemeral: true });
                    }
                    configuracao.set('BotaoDuvidas.linkbotao', linkbotao);
                } else {
                    configuracao.delete('BotaoDuvidas.linkbotao');
                }

                await definirduvidas(interaction, client)
                await interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Botão de dúvidas definido com sucesso!`, ephemeral: true });
                logAction(client, { action: 'Botão de Dúvidas configurado', details: `Emoji: \`${emoji || 'nenhum'}\`, Nome: \`${nomebotao || 'nenhum'}\`, Link: \`${linkbotao || 'nenhum'}\``, userId: interaction.user.id, guildId: interaction.guildId });
            }
            if (interaction.customId == 'definirinstrucoes') {
                const mensagem = interaction.fields.getTextInputValue('mensagem');
                const nomebotao = interaction.fields.getTextInputValue('nomebotao');
                const linkbotao = interaction.fields.getTextInputValue('linkbotao');

                if (linkbotao !== '') {
                    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
                    if (!urlRegex.test(linkbotao)) {
                        return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Você escolheu incorretamente a URL do botão!`, ephemeral: true });
                    }
                    configuracao.set('Instrucoes.linkbotao', linkbotao);
                } else {
                    configuracao.delete('Instrucoes.linkbotao');
                }
                if (mensagem.length > 1024) {
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} A mensagem não pode ter mais de 1024 caracteres!`, ephemeral: true });
                }

                if (nomebotao !== '') {
                    configuracao.set('Instrucoes.nomebotao', nomebotao);
                } else {
                    configuracao.delete('Instrucoes.nomebotao');
                }

                if (mensagem !== '') {
                    configuracao.set('Instrucoes.mensagem', mensagem);
                } else {
                    configuracao.delete('Instrucoes.mensagem');
                }

                await interaction.reply({ content: `${Emojis.get(`confirmed_emoji`)} Instruções definidas com sucesso!`, ephemeral: true });
                logAction(client, { action: 'Instruções configuradas', details: `Mensagem: \`${mensagem || 'nenhuma'}\`, Nome botão: \`${nomebotao || 'nenhum'}\``, userId: interaction.user.id, guildId: interaction.guildId });
            }
            if (interaction.customId == 'automaticTempo') {
                const inatividade = interaction.fields.getTextInputValue('inatividade');
                const pospagamento = interaction.fields.getTextInputValue('pospagamento');

                if (isNaN(inatividade) || isNaN(pospagamento)) {
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O valor deve ser um número!`, ephemeral: true });
                }

                configuracao.set('ConfigCarrinho.inatividade', Number(inatividade));
                configuracao.set('ConfigCarrinho.pospagamento', Number(pospagamento));

                await Gerenciar(interaction, client)
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Tempo do carrinho definido com sucesso!`, ephemeral: true });
                logAction(client, { action: 'Tempo do Carrinho configurado', details: `Inatividade: \`${inatividade}min\`, Pós-pagamento: \`${pospagamento}min\``, userId: interaction.user.id, guildId: interaction.guildId });
            }
            if (interaction.customId == 'sdaju11111231idsj1233js123dua123') {
                let NOME = interaction.fields.getTextInputValue('tokenMP');
                let PREDESC = interaction.fields.getTextInputValue('tokenMP2');
                let DESC = interaction.fields.getTextInputValue('tokenMP3');
                let BANNER = interaction.fields.getTextInputValue('tokenMP5');

                NOME = NOME.replace('.', '');
                PREDESC = PREDESC.replace('.', '');

                if (tickets.get(`tickets.funcoes.${NOME}`) !== null) {
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Já existe uma função com esse nome!`, ephemeral: true });
                }

                if (NOME.length > 32) {
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O nome não pode ter mais de 32 caracteres!`, ephemeral: true });
                } else {
                    tickets.set(`tickets.funcoes.${NOME}.nome`, NOME)
                }

                if (PREDESC.length > 64) {
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} A pré descrição não pode ter mais de 64 caracteres!`, ephemeral: true });
                } else {
                    tickets.set(`tickets.funcoes.${NOME}.predescricao`, PREDESC)
                }

                if (DESC !== '') {
                    if (DESC.length > 1024) {
                        return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} A descrição não pode ter mais de 1024 caracteres!`, ephemeral: true });
                    } else {
                        tickets.set(`tickets.funcoes.${NOME}.descricao`, DESC)
                    }
                }

                if (BANNER !== '') {
                    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
                    if (!urlRegex.test(BANNER)) {
                        tickets.set(`tickets.funcoes.${NOME}.banner`, BANNER)
                        return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Você escolheu incorretamente a URL do banner!`, ephemeral: true });
                    } else {
                        tickets.set(`tickets.funcoes.${NOME}.banner`, BANNER)
                    }
                }

                await interaction.reply({ content: `${Emojis.get('confirmed_emoji')} Função **${NOME}** adicionada com sucesso! Use o botão **Emojis das Funções** no painel para definir o emoji.`, ephemeral: true });
                logAction(client, { action: 'Função de Ticket criada', details: `Nome: \`${NOME}\``, userId: interaction.user.id, guildId: interaction.guildId });
            }






        }

        if (interaction.isAutocomplete()) {
        }

        let valorticket
        if (interaction.isButton() && interaction.customId.startsWith('AbrirTicket_')) {
            valorticket = interaction.customId.replace('AbrirTicket_', '');
            CreateTicket(interaction, valorticket)
        } else if (interaction.isStringSelectMenu() && interaction.customId === 'abrirticket') {
            valorticket = interaction.values[0]
            CreateTicket(interaction, valorticket)
        }

        if (interaction.isStringSelectMenu()) {

            if (interaction.customId == 'asdihadbhawhdwhdaw') {


                const campo = interaction.values[0].split('_')[0]
                const produto = interaction.values[0].split('_')[1]


                GerenciarCampos2(interaction, campo, produto, true)

            }


            if (interaction.customId == 'deletarticketsfunction') {
                const valordelete = interaction.values
                for (const iterator of valordelete) {
                    tickets.delete(`tickets.funcoes.${iterator}`)
                }
                await interaction.update({
                    content: `${Emojis.get('confirmed_emoji')} \`${valordelete.length}\` função(ões) removida(s) com sucesso!`,
                    components: [],
                    embeds: []
                });
                logAction(client, { action: 'Funções de Ticket removidas', details: `Funções: \`${valordelete.join(', ')}\``, userId: interaction.user.id, guildId: interaction.guildId });
            }

            if (interaction.customId == 'cancelarremoverfuncao') {
                await interaction.update({ content: `${Emojis.get('confirmed_emoji')} Cancelado.`, components: [], embeds: [] });
            }

        }

        if (interaction.isStringSelectMenu() && interaction.customId == "selectMoedaC") {
            const option = interaction.values[0];
            if (option === "realBRL") {
                await interaction.deferUpdate();
                await moedaConfig(interaction, client);
            }
        }

        if (interaction.isStringSelectMenu() && interaction.customId == "selectProtectBot") {

            const option = interaction.values[0];

            if (option == "permsConfig") {

                await interaction.update({ content: '', embeds: [], components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Carregando...`))], flags: MessageFlags.IsComponentsV2 })

                gerenciarPerms(interaction, client);

            }

        }


        if (interaction.isChannelSelectMenu()) {

            if (interaction.customId == 'canalpostarticket') {
                await interaction.reply({ content: `${Emojis.get(`loading_emoji`)} Aguarde estamos criando sua mensagem!`, ephemeral: true });
                await CreateMessageTicket(interaction, interaction.values[0], client)
                interaction.editReply({ content: `${Emojis.get(`confirmed_emoji`)} Mensagem criada com sucesso!`, ephemeral: true });
            }

        }
        
        if (interaction.isChannelSelectMenu()) {
            if (interaction.customId == 'selectautoclearcanal') {

                configuracao.set("autoclear.channel", interaction.values);
                await AutoClear(interaction, client);
                logAction(client, { action: 'Canal AutoClear configurado', details: `Canais: ${interaction.values.map(c => `<#${c}>`).join(', ')}`, userId: interaction.user.id, guildId: interaction.guildId });
            }

        }

        if (interaction.isButton()) {

            if (interaction.customId == 'definirduvidas') {
                definirduvidas(interaction, client)
            }
            if (interaction.customId == 'ativarbotaoduvidas') {
                const agora = Date.now();
                const ultimaTroca = configuracao.get('BotaoDuvidas.ultimaTroca') || 0;
                const cooldown = 3600000;

                if (agora - ultimaTroca < cooldown) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} Você só poderá alterar o status novamente em ${Math.ceil((cooldown - (agora - ultimaTroca)) / 60000)} minutos.`,
                        ephemeral: true
                    });
                }

                configuracao.set('BotaoDuvidas.ultimaTroca', agora);
                const status = configuracao.get('BotaoDuvidas.status') || false;

                if (status && (!configuracao.get('BotaoDuvidas.nomebotao') || !configuracao.get('BotaoDuvidas.linkbotao'))) {
                    return interaction.reply({
                        content: `${Emojis.get('negative_emoji')} É necessário definir o nome e link do botão.`,
                        ephemeral: true
                    });
                }

                configuracao.set('BotaoDuvidas.status', !status);
                await definirduvidas(interaction, client);
                await interaction.followUp({
                    content: `${Emojis.get('confirmed_emoji')} Status atualizado.\n${Emojis.get(`loading_emoji`)} Mensagens sendo atualizadas...`,
                    ephemeral: true
                });
                logAction(client, { action: `Botão de Dúvidas ${!status ? 'ativado' : 'desativado'}`, details: `Status alterado para \`${!status ? 'ativo' : 'inativo'}\``, userId: interaction.user.id, guildId: interaction.guildId });
            }

            if (interaction.customId == 'automaticTempo') {

                const modal = new ModalBuilder()
                    .setCustomId('automaticTempo')
                    .setTitle(`Configurar Tempo do Carrinho`)

                const inatividade = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('inatividade')
                        .setLabel('TEMPO DE INATIVIDADE (MINUTOS)')
                        .setValue(`${configuracao.get('ConfigCarrinho.inatividade') || 5}`)
                        .setStyle(TextInputStyle.Short)
                )

                const pospagamento = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('pospagamento')
                        .setLabel('TEMPO PÓS PAGAMENTO (MINUTOS)')
                        .setValue(`${configuracao.get('ConfigCarrinho.pospagamento') || 5}`)
                        .setStyle(TextInputStyle.Short)
                )

                modal.addComponents(inatividade, pospagamento)
                await interaction.showModal(modal)
            }
            if (interaction.customId == 'sincronizarticket') {
                await interaction.reply({ content: `${Emojis.get(`loading_emoji`)} Aguarde estamos atualizando suas mensagem!`, ephemeral: true });
                await Checkarmensagensticket(client)
                interaction.editReply({ content: `${Emojis.get(`confirmed_emoji`)} Mensagens atualizada com sucesso!`, ephemeral: true });
            }



            if (interaction.customId == `postarticket`) {
                const ggg = tickets.get(`tickets.funcoes`)

                if (ggg == null || Object.keys(ggg).length == 0) {
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Adicione ao menos uma **Função** antes de postar o painel de tickets.`, ephemeral: true });
                } else {
                    const selectaaa = new Discord.ChannelSelectMenuBuilder()
                        .setCustomId('canalpostarticket')
                        .setPlaceholder('Clique aqui para selecionar')
                        .setChannelTypes(Discord.ChannelType.GuildText)

                    const row1 = new ActionRowBuilder()
                        .addComponents(selectaaa);

                    interaction.reply({ components: [row1], content: `Selecione o canal onde quer postar a mensagem.`, ephemeral: true, })

                }
            }

            if (interaction.customId == 'deletar') {
                if (!interaction.member.roles.cache.has(configuracao.get('ConfigRoles.cargoadm')) && !interaction.member.roles.cache.has(configuracao.get('ConfigRoles.cargosup'))) {
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Você não tem permissão para fazer isso!`, ephemeral: true });
                }

                try {
                    const transcript = await discordTranscripts.createTranscript(interaction.channel, {
                        limit: -1,
                        fileName: `transcript-${interaction.channel.name}.html`,
                        saveImages: true,
                        poweredBy: false
                    });

                    const transcriptEmbed = new EmbedBuilder()
                        .setTitle(`${Emojis.get('_messages_emoji')} Transcript do Ticket: ${interaction.channel.name}`)
                        .setDescription(`O ticket foi encerrado e aqui está o registro completo da conversa.`)
                        .setColor('#5865F2')
                        .addFields(
                            { name: 'Ticket Criado Por', value: `<@${interaction.channel.name.split('・')[2]}>`, inline: true },
                            { name: 'Ticket Fechado Por', value: `${interaction.user}`, inline: true },
                            { name: 'Categoria', value: interaction.channel.name.split('・')[0], inline: true }
                        )
                        .setFooter({ text: `${interaction.guild.name} - Sistema de Tickets` })
                        .setTimestamp();

                    const trafficChannel = interaction.guild.channels.cache.get(configuracao.get(`ConfigChannels.systemlogs`));
                    if (trafficChannel) {
                        await trafficChannel.send({
                            //content: `🎭 Um capítulo se encerra, mas a história permanece preservada...`,
                            embeds: [transcriptEmbed],
                            files: [transcript]
                        });
                    }

                    await interaction.reply({ content: `${Emojis.get(`confirmed_emoji`)} O ticket será fechado e um transcript foi salvo.`, ephemeral: true });

                    setTimeout(async () => {
                        await interaction.channel.delete();
                    }, 5000);

                } catch (error) {
                    console.error('Erro ao deletar ticket e enviar transcript:', error);
                    await interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Ocorreu um erro ao processar sua solicitação.`, ephemeral: true });
                }
            }

            if (interaction.customId == 'notifyuser') {
                if (!interaction.member.roles.cache.has(configuracao.get('ConfigRoles.cargoadm')) && !interaction.member.roles.cache.has(configuracao.get('ConfigRoles.cargosup'))) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Você não tem permissão para fazer isso!`, ephemeral: true });
                if (!interaction.channel.isThread()) {
                    return interaction.reply({ content: "Este comando só pode ser usado em um tópico de ticket.", ephemeral: true });
                }

                const threadNameParts = interaction.channel.name.split('・');
                const userId = threadNameParts[threadNameParts.length - 1];

                try {
                    const user = await interaction.client.users.fetch(userId);

                    const embed = new Discord.EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle(`${Emojis.get('_ticket_emoji')} Atualização do seu Ticket`)
                        .setDescription('Olá! Temos novidades sobre o seu ticket. Estamos aguardando sua resposta!')
                        .addFields(
                            { name: 'Status', value: `${Emojis.get('_notify_emoji')} Aguardando sua resposta`, inline: true },
                            { name: 'Ticket', value: `#${interaction.channel.name.split('・')[0]}`, inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) });

                    const images = [
                        'https://cdn.discordapp.com/attachments/1267638482843734149/1267638719473647689/Barrinha_ghostsystem.jpg?ex=66a9840e&is=66a8328e&hm=8daa49276fdee98184ad1a2e24b3eb14910caa447438dbbbed55053673ffbeb2&',
                        'https://cdn.discordapp.com/attachments/1267638482843734149/1267638719473647689/Barrinha_ghostsystem.jpg?ex=66a9840e&is=66a8328e&hm=8daa49276fdee98184ad1a2e24b3eb14910caa447438dbbbed55053673ffbeb2&',
                        'https://cdn.discordapp.com/attachments/1267638482843734149/1267638719473647689/Barrinha_ghostsystem.jpg?ex=66a9840e&is=66a8328e&hm=8daa49276fdee98184ad1a2e24b3eb14910caa447438dbbbed55053673ffbeb2&'
                    ];
                    embed.setImage(images[Math.floor(Math.random() * images.length)]);

                    const row = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setURL(`https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}`)
                                .setLabel('Ir para o Ticket')
                                .setStyle(Discord.ButtonStyle.Link)
                        );

                    await user.send({ embeds: [embed], components: [row] });

                    await interaction.reply({ content: `${Emojis.get(`confirmed_emoji`)} Notificação enviada com sucesso para ${user.tag}!`, ephemeral: true });

                } catch (error) {
                    console.error("Erro ao notificar o usuário:", error);
                    await interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Ocorreu um erro ao tentar notificar o usuário. Verifique se o usuário ainda está no servidor ou se permite mensagens diretas.`, ephemeral: true });
                }
            }

            if (interaction.customId == 'assumir') {
                let ticketId = interaction.message.id;
                if (tickets[ticketId] && tickets[ticketId].hasStaffInteracted) {
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Este ticket já foi atendido.`, ephemeral: true });
                }
            
                if (!interaction.member.roles.cache.has(configuracao.get('ConfigRoles.cargoadm')) && !interaction.member.roles.cache.has(configuracao.get('ConfigRoles.cargosup'))) {
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Você não tem permissão para assumir este ticket!`, ephemeral: true });
                }
            
                try {
                    const staffMember = interaction.member;
                    const ultimoIndice = interaction.channel.name.lastIndexOf('・');
                    const ultimosNumeros = interaction.channel.name.slice(ultimoIndice + 1);
            
                    const owner = await interaction.guild.members.fetch(ultimosNumeros);
            
                    const confirmationEmbed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setDescription(`${Emojis.get('_staff_emoji')} Olá <@!${ultimosNumeros}>, Seu Ticket foi Assumido Pelo Staff ${staffMember}.`);
            
                    const buttonRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel('Ir para o Ticket')
                            .setStyle('5')
                            .setURL(`https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}`)
                    );
            
                    let dmInfo = '';
                    try {
                        await owner.send({ embeds: [confirmationEmbed], components: [buttonRow] });
                        dmInfo = `\n${Emojis.get('confirmed_emoji')} Mensagem enviada ao criador do ticket via DM.`;
                    } catch (error) {
                        dmInfo = `\n${Emojis.get('negative_emoji')} O usuário tem as DMs fechadas.`;
                    }
            
                    tickets[ticketId] = { hasStaffInteracted: true, hasPokeStaffBeenClicked: false, staffMemberId: staffMember.id };
            
                    {
                        const assumirContainer = new ContainerBuilder();
                        assumirContainer;
                        assumirContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `${Emojis.get('_staff_emoji')} Olá <@!${ultimosNumeros}>, Seu Ticket foi Assumido Pelo Staff ${staffMember}.${dmInfo}`
                        ));
                        await interaction.reply({ components: [assumirContainer], flags: MessageFlags.IsComponentsV2, embeds: [], ephemeral: true });
                    }
                } catch (error) {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: `${Emojis.get(`negative_emoji`)} | Ocorreu um erro ao tentar assumir o ticket.`, ephemeral: true });
                    } else {
                        await interaction.reply({ content: `${Emojis.get(`negative_emoji`)} | Ocorreu um erro ao tentar assumir o ticket.`, ephemeral: true });
                    }
                }
            }
                                            

            if (interaction.customId === 'deletar') {
                if (!interaction.member.roles.cache.has(configuracao.get('ConfigRoles.cargoadm')) &&
                    !interaction.member.roles.cache.has(configuracao.get('ConfigRoles.cargosup'))) {
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Você não tem permissão para fazer isso!`, ephemeral: true });
                }
            
                function gerarticketcodigoaleatorio24(length) {
                    const caracteres24 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                    let result = '';
                    for (let i = 0; i < length; i++) {
                        const gerarindex24 = Math.floor(Math.random() * caracteres24.length);
                        result += caracteres24[gerarindex24];
                    }
                    return result;
                }
            
                const ticketcodigo24 = gerarticketcodigoaleatorio24(12);
            
                try {
                    const ultimoIndice = interaction.channel.name.lastIndexOf('・');
                    const ultimosNumeros = interaction.channel.name.slice(ultimoIndice + 1);
            
                    let user;
                    try {
                        user = await interaction.guild.members.fetch(ultimosNumeros);
                    } catch (error) {
                        user = null;
                    }
            
                    const deletedChannelName = interaction.channel?.name || 'Desconhecido';
            
                    const fetchedMessages = await interaction.channel.messages.fetch({ limit: 100 });
                    const messagesContent = fetchedMessages.map(msg => `${msg.author.tag}: ${msg.content}`).join('\n');
            
                    const fs = require('fs');
                    fs.writeFileSync('mensagens_antigas.txt', messagesContent);
            
                    const Tempoatual24 = Math.ceil(Date.now() / 1000);
            
                    const now24 = new Date();
                    const dataatual24 = new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                    }).format(now24);
            
                    let assumidoPor = 'Ninguém';
                    if (tickets[interaction.message.id] && tickets[interaction.message.id].hasStaffInteracted) {
                        const staffMemberId = tickets[interaction.message.id].staffMemberId;
                        const staffMember = await interaction.guild.members.fetch(staffMemberId);
                        assumidoPor = staffMember ? staffMember.user.tag : 'Desconhecido';
                    }
            
                    const embed24 = new Discord.EmbedBuilder()
                        .setColor('#5865F2')
                        .setAuthor({ name: `${interaction.user.username} - Ticket`, iconURL: interaction.user.displayAvatarURL() })
                        .setTitle(`${Emojis.get('_silueta_emoji')} Ticket Finalizado`)
                        .setDescription("> **Olá! O seu ticket foi finalizado, obrigado por usar nossos serviços**")
                        .setThumbnail(tickets.get("tickets.aparencia.banner"))
                        .setFooter({ text: `${interaction.guild.name}・${dataatual24}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .addFields(
                            { name: `**${Emojis.get('information_emoji')} Código de atendimento:**`, value: `\`${ticketcodigo24}\`` },
                            { name: `**${Emojis.get('_silueta_emoji')} Quem abriu:**`, value: `${user ? user : 'Usuário não encontrado'}` },
                            { name: `**${Emojis.get('confirmed_emoji')} Quem Fechou:**`, value: `${interaction.user.globalName}` },
                            { name: `**${Emojis.get('_people_emoji')} Assumido por:**`, value: assumidoPor },
                            { name: `**${Emojis.get('clock_emoji')} Horário Fechado:**`, value: `<t:${Tempoatual24}:R>` }
                        );
            
                    const row = new Discord.ActionRowBuilder().addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId("1avaliacao24")
                            .setLabel("1/5")
                            .setEmoji({ id: '1501803947898306724' })
                            .setStyle(2),
                        new Discord.ButtonBuilder()
                            .setCustomId("2avaliacao24")
                            .setLabel("2/5")
                            .setEmoji({ id: '1501803947898306724' })
                            .setStyle(2),
                        new Discord.ButtonBuilder()
                            .setCustomId("3avaliacao24")
                            .setLabel("3/5")
                            .setEmoji({ id: '1501803947898306724' })
                            .setStyle(2),
                        new Discord.ButtonBuilder()
                            .setCustomId("4avaliacao24")
                            .setLabel("4/5")
                            .setEmoji({ id: '1501803947898306724' })
                            .setStyle(2),
                        new Discord.ButtonBuilder()
                            .setCustomId("5avaliacao24")
                            .setLabel("5/5")
                            .setEmoji({ id: '1501803947898306724' })
                            .setStyle(2),
                    );
            
                    if (user) {
                        try {
                            await user.send({ embeds: [embed24], components: [row], files: [{ attachment: 'mensagens_antigas.txt', name: 'mensagens_antigas.txt' }] });
                        } catch (error) {
                        }
                    }
            
                    const embed244 = new Discord.EmbedBuilder()
                        .setColor('#5865F2')
                        .setAuthor({ name: `Ticket - System`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setTitle(`${Emojis.get('_messages_emoji')} Novo Ticket Finalizado`)
                        .setDescription("> ** Logs de ticket **")
                        .setThumbnail(tickets.get("tickets.aparencia.banner"))
                        .setFooter({ text: `${interaction.guild.name}・${dataatual24}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .addFields(
                            { name: `**${Emojis.get('information_emoji')} Código de atendimento:**`, value: `\`${ticketcodigo24}\`` },
                            { name: `**${Emojis.get('_silueta_emoji')} Quem abriu:**`, value: `${user ? user : 'Usuário não encontrado'}` },
                            { name: `**${Emojis.get('confirmed_emoji')} Quem Fechou:**`, value: `${interaction.user.globalName}` },
                            { name: `**${Emojis.get('_people_emoji')} Assumido por:**`, value: assumidoPor },
                            { name: `**${Emojis.get('clock_emoji')} Horário Fechado:**`, value: `<t:${Tempoatual24}:R>` }
                        );
            
                    const umMinutoEmMilissegundos = 5 * 1000;
                    const timeStamp = Date.now() + umMinutoEmMilissegundos;
            
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: `${Emojis.get(`loading`)} > **Esse ticket será fechado em <t:${Math.ceil(timeStamp / 1000)}:R>**` });
                    } else {
                        await interaction.reply({ content: `${Emojis.get(`loading`)} > **Esse ticket será fechado em <t:${Math.ceil(timeStamp / 1000)}:R>**` });
                    }
                                
                    const logsChannelId = configuracao.get(`ConfigChannels.logsticket`);
                    const logsChannel = interaction.guild.channels.cache.get(logsChannelId);
                    if (logsChannel) {
                        await logsChannel.send({ embeds: [embed244], files: [{ attachment: 'mensagens_antigas.txt', name: 'mensagens_antigas.txt' }] });
                    }
            
                    setTimeout(async () => {
                        await interaction.channel.delete();
                    }, 5000);
            
                } catch (error) {
                    console.error('Erro ao deletar o canal:', error);
                }
            }

            if (interaction.customId === 'lembrar123') {
                if (!interaction.member.roles.cache.has(configuracao.get('ConfigRoles.cargoadm')) && !interaction.member.roles.cache.has(configuracao.get('ConfigRoles.cargosup'))) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} | Você não tem permissão para fazer isso!`, ephemeral: true });
                }
            
                try {
                    const threadNameParts = interaction.channel.name.split('・');
                    const threadOwnerId = threadNameParts[2];
                    const user = await interaction.client.users.fetch(threadOwnerId);
            
                    // Determinando a saudação com base no horário de São Paulo
                    const brazilTime = new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"});
                    const hour = new Date(brazilTime).getHours();
                    let saudacao;
            
                    if (hour >= 0 && hour < 12) {
                        saudacao = 'Bom dia';
                    } else if (hour >= 12 && hour < 18) {
                        saudacao = 'Boa tarde';
                    } else {
                        saudacao = 'Boa noite';
                    }
            
                    // Mensagem personalizada para o usuário com saudação dinâmica
                    const mensagem = `${saudacao} <@${threadOwnerId}>, você possui um ticket pendente de resposta; se não for respondido, poderá ser fechado.`;
            
                    const row = new ActionRowBuilder() .addComponents(
                        new ButtonBuilder()
                            .setURL(`https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}`)
                            .setLabel('Ir para o Ticket')
                            .setStyle('5')
                    );
        
                    await user.send({
                        content: mensagem,
                        components: [row]
                    });
            
                    await interaction.reply({ content: `${Emojis.get('checker')} | Mensagem enviada ao criador do ticket.`, ephemeral: true });
            
                } catch (error) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} | Não foi possível enviar a mensagem, pois o usuário provavelmente bloqueou mensagens privadas.`, ephemeral: true });
                }
            }            

            if (interaction.customId === 'postarticket') {
                const ggg = tickets.get('tickets.funcoes');
                const ggg2 = tickets.get('tickets.aparencia');
            
                // Verifica se as configurações necessárias foram definidas
                if (!ggg || Object.keys(ggg).length === 0 || !ggg2 || Object.keys(ggg2).length === 0) {
                    return interaction.reply({ 
                        content: `${Emojis.get('negative_emoji')} Adicione uma função antes de postar a mensagem.`, 
                        ephemeral: true 
                    });
                }
            
                // Cria o menu de seleção de canal
                const selectaaa = new Discord.ChannelSelectMenuBuilder()
                    .setCustomId('canalpostarticket')
                    .setPlaceholder('Clique aqui para selecionar')
                    .setChannelTypes(Discord.ChannelType.GuildText);
            
                const row1 = new ActionRowBuilder().addComponents(selectaaa);
            
                // Responde à interação com o menu de seleção
                interaction.reply({ 
                    components: [row1], 
                    content: 'Selecione o canal onde quer postar a mensagem.', 
                    ephemeral: true, // Define como ephemeral para que só o usuário veja a resposta
                }).catch(error => {
                    console.error('Erro ao responder à interação:', error);
                });
            }




            if (interaction.customId == 'remfuncaoticket') {


                const ggg = tickets.get(`tickets.funcoes`)



                if (ggg == null || Object.keys(ggg).length == 0) {
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Não existe nenhuma função criada para remover.`, ephemeral: true });
                }

                else {

                    const selectMenuBuilder = new Discord.StringSelectMenuBuilder()
                        .setCustomId('deletarticketsfunction')
                        .setPlaceholder('Selecione a(s) função(ões) que deseja remover')
                        .setMinValues(1)

                    for (const chave in ggg) {
                        const item = ggg[chave];

                        const option = {
                            label: `${item.nome}`,
                            description: `${item.predescricao}`.slice(0, 100),
                            value: item.nome
                        };

                        selectMenuBuilder.addOptions(option);
                    }

                    selectMenuBuilder.setMaxValues(Object.keys(ggg).length)

                    const style2row = new ActionRowBuilder().addComponents(selectMenuBuilder);
                    const cancelRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('cancelarremoverfuncao')
                            .setLabel('Cancelar')
                            .setStyle(2)
                    );
                    await interaction.reply({
                        content: `Selecione as funções que deseja remover:`,
                        components: [style2row, cancelRow],
                        ephemeral: true
                    });
                }

            }
            if (interaction.customId.endsWith("autoclearcanal")) {
                interaction.update({
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new Discord.ChannelSelectMenuBuilder()
                                    .setCustomId(`selectautoclearcanal`)
                                    .setMaxValues(7)
                                    .setPlaceholder("Selecione abaixo qual será o CANAL que sera usado o AUTOCLEAR")
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`voltarautomaticos`)
                                    .setStyle(2)
                                    .setEmoji("1237422652050899084")
                            )
                    ]
                })
            }

            if (interaction.customId.endsWith("autocleartempo")) {
                const canalautoclear = configuracao.get("autoclear.channel");
                const tempoclear = configuracao.get("autoclear.time");
                await interaction.update({ embeds: [], content: 'Por favor, insira o tempo em segundos:', components: [], ephemeral: true });

                const filter = m => m.author.id === interaction.user.id;
                const timeCollector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

                timeCollector.on('collect', async (message) => {
                    const time = parseInt(message.content);
                    if (isNaN(time) || time < 10) {
                        return interaction.followUp({ content: 'Tempo inválido, deve ser um número maior que 10 segundos.', ephemeral: true });
                    }

                    configuracao.set("autoclear.time", time);
                    logAction(client, { action: 'Tempo do AutoClear configurado', details: `Tempo: \`${time}s\``, userId: interaction.user.id, guildId: interaction.guildId });

                    timeout = time * 1000;

                    message.delete();
                    interaction.editReply({
                        content: ``, embeds: [
                            new Discord.EmbedBuilder()
                                .setTitle(`Configurando \`AutoClear\``)
                                .setDescription(` você acessou a aba de **AutoClear**, suas **informações** mais os **botões de configurações** estão aqui em baixo. **Configure tudo!**`)
                                .addFields(
                                    {
                                        name: `Canal AutoClear:`,
                                        value: canalautoclear ? `<#${canalautoclear}>` : 'Nenhum canal selecionado',
                                        inline: true
                                    },
                                    {
                                        name: `Tempo AutoClear:`,
                                        value: `${time} segundos`,
                                        inline: true
                                    },
                                )
                        ],
                        components: [
                            new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setCustomId(`autoclearcanal`)
                                        .setLabel("Configurar Canal")
                                        .setEmoji("1243060434630869035")
                                        .setStyle(2),
                                    new Discord.ButtonBuilder()
                                        .setCustomId(`autocleartempo`)
                                        .setLabel("Configurar Tempo")
                                        .setEmoji("1207761646152458351")
                                        .setStyle(2),
                                ),
                            new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setCustomId('iniciarautoclear')
                                        .setLabel('Ligar AutoClear')
                                        .setEmoji(`1248749835109011468`)
                                        .setStyle(1),
                                    new Discord.ButtonBuilder()
                                        .setCustomId('pararautoclear')
                                        .setLabel('Desligar AutoClear')
                                        .setEmoji(`1248749849466376333`)
                                        .setStyle(2),
                                    new Discord.ButtonBuilder()
                                        .setCustomId('voltarautomaticos')
                                        .setEmoji('1237422652050899084')
                                        .setStyle(2)
                                )
                        ], ephemeral: true
                    });
                });
            }


            if (interaction.customId.endsWith("iniciarautoclear")) {
                const canalAutoClear = configuracao.get("autoclear.channel");
                const tempoAutoClear = configuracao.get("autoclear.time");

                if (!canalAutoClear) {
                    await interaction.reply({ content: 'Canal AutoClear não configurado.', ephemeral: true });
                    return;
                }
                setInterval(async () => {
                    const channel = await interaction.guild.channels.fetch(canalAutoClear);
                    if (channel) {
                        await channel.bulkDelete(100);
                    }
                }, tempoAutoClear * 1000);

                {
                    const acClearContainer = new ContainerBuilder();
                    { const _c = configuracao.get('Cores.Principal') || '5865F2'; acClearContainer; }
                    acClearContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('confirmed_emoji')} Seu AutoClear foi iniciado corretamente no canal <#${canalAutoClear}>`));
                    await interaction.reply({ content: `${interaction.user}`, components: [acClearContainer], flags: MessageFlags.IsComponentsV2, embeds: [], ephemeral: true });
                }
            }

            if (interaction.customId.endsWith("pararautoclear")) {

                const canalautoclear = configuracao.get("autoclear.channel");
                const tempoclear = configuracao.get("autoclear.time");

                try {
                    configuracao.delete("autoclear.channel");
                    configuracao.set("autoclear.time", 10);
                    logAction(client, { action: 'AutoClear desativado', details: 'Configurações resetadas', userId: interaction.user.id, guildId: interaction.guildId });
                    {
                        const acStopContainer = new ContainerBuilder();
                        { const _c = configuracao.get('Cores.Principal') || '5865F2'; acStopContainer; }
                        acStopContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('confirmed_emoji')} Seu AutoClear foi parado e as configurações foram resetadas.`));
                        await interaction.reply({ content: `${interaction.user}`, components: [acStopContainer], flags: MessageFlags.IsComponentsV2, embeds: [], ephemeral: true });
                    }
                } catch (error) {
                    {
                        const acErrContainer = new ContainerBuilder();
                        acErrContainer;
                        acErrContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Ocorreu um erro ao parar o AutoClear.`));
                        await interaction.reply({ content: `${interaction.user}`, components: [acErrContainer], flags: MessageFlags.IsComponentsV2, embeds: [], ephemeral: true });
                    }
                }
            }




            if (interaction.customId.startsWith('voltar1')) {
                const { buildMainPanel } = require('../../Functions/ConfigPainelBuilder');
                await interaction.update({
                    components: [buildMainPanel(interaction.user.id, interaction)],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    content: ''
                });
            }

            if (interaction.customId === 'formasdepagamentos') {
                await FormasDePagamentos(interaction);
            }
            

            if (interaction.customId.startsWith('voltarMsgsConfig')) { //exemplo

                AcoesAutomaticsConfigs(interaction, client)

            }


            if (interaction.customId.startsWith('addfuncaoticket')) {

                const dd = tickets.get('tickets.funcoes')


                if (dd && Object.keys(dd).length > 24) {
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Você não pode criar mais de 24 funções em seu TICKET!` });
                }

                const modalaAA = new ModalBuilder()
                    .setCustomId('sdaju11111231idsj1233js123dua123')
                    .setTitle(`Adicionar função`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`NOME DA FUNÇÃO`)
                    .setPlaceholder(`Insira aqui um nome, como: Suporte`)
                    .setStyle(TextInputStyle.Short)

                    .setRequired(true)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`PRÉ DESCRIÇÃO`)
                    .setPlaceholder(`Insira aqui uma pré descrição, ex: "Preciso de suporte."`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(99)

                const newnameboteN4 = new TextInputBuilder()
                    .setCustomId('tokenMP3')
                    .setLabel(`DESCRIÇÃO`)
                    .setPlaceholder(`Insira aqui a descrição da função.`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false)
                    .setMaxLength(99)

                const newnameboteN5 = new TextInputBuilder()
                    .setCustomId('tokenMP5')
                    .setLabel(`BANNER (OPCIONAL)`)
                    .setPlaceholder(`Insira aqui uma URL de uma imagem ou GIF`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);
                const firstActionRow6 = new ActionRowBuilder().addComponents(newnameboteN5);

                modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5, firstActionRow6);
                await interaction.showModal(modalaAA);

            }
            if (interaction.customId.startsWith('definiraparencia')) {
                await interaction.update(buildAparenciaMain(interaction.user.id));
            }

            if (interaction.customId.startsWith('editaremojiticket')) {
                await interaction.update(buildFuncaoNavScreen(interaction.user.id));
            }
            

            if (interaction.customId.startsWith('definirhorarioatendimento24')) {
                Atendimentohorario(interaction, client)
            }

            if (interaction.customId.startsWith('trocarpostagemticket')) {
                const atualstatus24 = tickets.get("statusmsg") || false;
                tickets.set("statusmsg", !atualstatus24);
                painelTicket(interaction);
                logAction(client, { action: 'Tipo de postagem de Ticket alterado', details: `Modo: \`${!atualstatus24 ? 'mensagem única' : 'múltiplas mensagens'}\``, userId: interaction.user.id, guildId: interaction.guildId });
            }

            if (interaction.customId.startsWith('painelconfigticket')) {


                painelTicket(interaction)


            }




            if (interaction.customId.startsWith('personalizarbot')) {

                const modalaAA = new ModalBuilder()
                    .setCustomId('sdaju11111231idsjjs123dua123')
                    .setTitle(`Editar perfil do bot`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`NOME DE USUÁRIO`)
                    .setValue(`${client.user.username}`)
                    .setPlaceholder(`Insira um nome de usuário (só pode mudar 3x por hora)`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`AVATAR`)
                    .setPlaceholder(`Insira uma URL de um ícone`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN4 = new TextInputBuilder()
                    .setCustomId('tokenMP3')
                    .setLabel(`STATUS 1`)
                    .setPlaceholder(`Insira aqui um status personalizado`)
                    .setValue(`COLOCA AQUI O STATUS 1`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN5 = new TextInputBuilder()
                    .setCustomId('tokenMP5')
                    .setLabel(`STATUS 2`)
                    .setValue(`COLOCA AQUI O STATUS 2`)
                    .setPlaceholder(`Insira aqui um status personalizado`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);
                const firstActionRow6 = new ActionRowBuilder().addComponents(newnameboteN5);

                modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5, firstActionRow6);
                await interaction.showModal(modalaAA);

            }


            if (interaction.customId.startsWith('coresembeds')) {

                const modalaAA = new ModalBuilder()
                    .setCustomId('sdaju11111idsjjs123dua123')
                    .setTitle(`Editar cores dos embeds`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`COR PRINCIPAL`)
                    .setPlaceholder(`Insira aqui um código Hex Color, ex: #Obd4cd`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`COR DE PROCESSAMENTO`)
                    .setPlaceholder(`Insira aqui um código Hex Color, ex: #fcba03`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN4 = new TextInputBuilder()
                    .setCustomId('tokenMP3')
                    .setLabel(`COR DE SUCESSO`)
                    .setPlaceholder(`Insira aqui um código Hex Color, ex: #39fc03`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN5 = new TextInputBuilder()
                    .setCustomId('tokenMP5')
                    .setLabel(`COR DE FALHA`)
                    .setPlaceholder(`Insira aqui um código Hex Color, ex: #5865F2`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN6 = new TextInputBuilder()
                    .setCustomId('tokenMP6')
                    .setLabel(`COR DE FINALIZADO`)
                    .setPlaceholder(`Insira aqui um código Hex Color, ex: #7363ff`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);
                const firstActionRow6 = new ActionRowBuilder().addComponents(newnameboteN5);
                const firstActionRow7 = new ActionRowBuilder().addComponents(newnameboteN6);



                modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5, firstActionRow6, firstActionRow7);
                await interaction.showModal(modalaAA);

            }



            if (interaction.customId.startsWith('voltar2')) {

                Gerenciar(interaction, client)

            }

            if (interaction.customId.startsWith('eaffaawwawa')) {
                automatico(interaction, client)
            }

            if (interaction.customId.startsWith('voltarautomaticos')) {
                automatico(interaction, client)
            }

            if (interaction.customId.startsWith('configavançadas24')) {
                Avançados(interaction, client)
            }

            if (interaction.customId.startsWith('comandosperm')) {
                Configcomandos24(interaction, client)
            }

            if (interaction.customId.startsWith('configemojis24')) {
                Emojis24(interaction, client)
            }

            if (interaction.customId.startsWith('permissaoadm')) {
                Perms24(interaction, client)
            }

            if (interaction.customId == "altMoeda") {

                await interaction.update({ content: '', embeds: [], components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Carregando...`))], flags: MessageFlags.IsComponentsV2 });

                moedaConfig(interaction, client);

            }

            if (interaction.customId == "protecaoBot") {

                await interaction.update({ content: '', embeds: [], components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('loading_emoji')} Carregando...`))], flags: MessageFlags.IsComponentsV2 });

                const owners = owner.map(rs => `<@${rs}>`).join(', ')

                if (!owner.includes(interaction.user.id)) {
                    interaction.editReply({
                        content: `${Emojis.get(`negative_emoji`)} Faltam permissões.\n❓ Apenas os titulares da compra (${owners}) pode alterar as configurações de proteção do servidor.`
                    });
                    return;
                }

                protectConfig(interaction, client);

            }

            if (interaction.customId.startsWith('gerenciarconfigs')) {
                Gerenciar(interaction, client)
            }

            if (interaction.customId.startsWith('configcargos')) {
                ConfigRoles(interaction, client)
            }

            if (interaction.customId.startsWith('autoreact24')) {
                autoreact24(interaction, client)
            }
            
            if (interaction.customId.startsWith('contentanunciar24') || interaction.customId.startsWith('embedanunciar24')) {
                return interaction.reply({ content: `${Emojis.get('negative_emoji')} Use o comando \`/anunciar\` para criar anúncios.`, ephemeral: true });
            }
            
            
            if (interaction.customId.startsWith('perm_avançadas')) {
                PermsAvançados24(interaction, client)
            }

            if (interaction.customId.startsWith('autoclear24')) {
                AutoClear(interaction, client);
            }
            if (interaction.customId.startsWith('painelpersonalizar')) {
                const _cor = configuracao.get('Cores.Principal') || '5865F2';
                let _ac = 0x5865F2;
                try { _ac = parseInt(_cor.replace('#', ''), 16); } catch (e) {}

                const _cont = new ContainerBuilder();
                _cont;

                _cont.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${Emojis.get('dream')} Meu Bot Designer\nEscolha uma opção e use sua criatividade e profissionalismo.`
                    )
                );

                _cont.addSeparatorComponents(new SeparatorBuilder());

                const row2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("coresembeds")
                        .setLabel('Editar cores dos embeds')
                        .setEmoji('1178080366871973958')
                        .setStyle(1),
                    new ButtonBuilder()
                        .setCustomId("personalizarbot")
                        .setLabel('Personalizar Bot')
                        .setEmoji('1178080828933283960')
                        .setStyle(1),
                    new ButtonBuilder()
                        .setCustomId("definirtema")
                        .setLabel('Definir tema')
                        .setEmoji('1178066208835252266')
                        .setDisabled(true)
                        .setStyle(1)
                );

                const row3 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("voltar00")
                        .setEmoji('1238413255886639104')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId('voltar1')
                        .setEmoji('1501803928973476023')
                        .setDisabled(true)
                        .setStyle(1)
                );

                _cont.addActionRowComponents(row2);
                _cont.addActionRowComponents(row3);

                await interaction.update({
                    components: [_cont],
                    flags: MessageFlags.IsComponentsV2,
                    content: '',
                    embeds: []
                });
            }
            if (interaction.customId.startsWith('painelconfigbv')) {
                msgbemvindo(interaction, client)
            }
            if (interaction.customId === 'voltar_msgbemvindo') {
                msgbemvindo(interaction, client)
            }
            if (interaction.customId === 'canaisboasvindas') {
                msgbemvindocanais(interaction, client)
            }
            if (interaction.customId === 'voltar_msgbemvindocanais') {
                msgbemvindocanais(interaction, client)
            }
            if (interaction.customId === 'voltar_AcoesAutomaticsConfigs') {
                AcoesAutomaticsConfigs(interaction, client)
            }
            if (interaction.customId.startsWith('actionsautomations')) { //exemplo
                AcoesAutomaticsConfigs(interaction, client)
            }
            if (interaction.customId.startsWith('MsgsAutoConfig')) { //exemplo
                AcoesMsgsAutomatics(interaction, client)
            }

            if (interaction.customId.startsWith('automaticRepostar')) { //exemplo
                AcoesRepostAutomatics(interaction, client)
            }

            if (interaction.customId.startsWith('voltar3')) {
                await painelTicket(interaction, false);
            }

            if (interaction.customId.startsWith('voltar00')) {
                const { buildMainPanel } = require('../../Functions/ConfigPainelBuilder');
                await interaction.update({
                    components: [buildMainPanel(interaction.user.id, interaction)],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    content: ''
                });
            }
            if (interaction.customId == "botaoduvidas") {

                const modal = new ModalBuilder()
                    .setCustomId('botaoduvidas')
                    .setTitle('Botão de Dúvidas')


                const nomebotao = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('nomebotao')
                        .setLabel('Nome Para o Botão (Opcional)')
                        .setPlaceholder('Insira aqui um nome, ex: Abrir Ticket')
                        .setRequired(true)
                        .setValue(configuracao.get('BotaoDuvidas.nomebotao') || '')
                        .setStyle(TextInputStyle.Paragraph)
                )

                const linkbotao = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('linkbotao')
                        .setLabel('Link Para o Botão')
                        .setPlaceholder('Insira aqui um link, ex: https://discord.gg/invite')
                        .setRequired(true)
                        .setValue(configuracao.get('BotaoDuvidas.linkbotao') || '')
                        .setStyle(TextInputStyle.Paragraph)
                )

                const emoji = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('emoji')
                        .setLabel('Emoji Para o Botão (Opcional)')
                        .setPlaceholder('Insira aqui um emoji, ex: 🎫')
                        .setRequired(false)
                        .setValue(configuracao.get('BotaoDuvidas.emoji') || '')
                        .setStyle(TextInputStyle.Paragraph)
                )


                modal.addComponents(nomebotao, linkbotao, emoji)
                await interaction.showModal(modal)
            }
            if (interaction.customId == "definirinstrucoes") {

                const modal = new ModalBuilder()
                    .setCustomId('definirinstrucoes')
                    .setTitle('Definindo instruções')

                const mensagem = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('mensagem')
                        .setLabel('Mensagem Após a Entrega')
                        .setPlaceholder('Insira aqui um conteúdo, ex: Se teve algum problema com o item entregue, por favor, abra um ticket.')
                        .setRequired(false)
                        .setValue(configuracao.get('Instrucoes.mensagem') || '')
                        .setStyle(TextInputStyle.Paragraph)
                )

                const nomebotao = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('nomebotao')
                        .setLabel('Nome Para o Botão (Opcional)')
                        .setPlaceholder('Insira aqui um nome, ex: Abrir Ticket')
                        .setRequired(false)
                        .setValue(configuracao.get('Instrucoes.nomebotao') || '')
                        .setStyle(TextInputStyle.Paragraph)
                )

                const linkbotao = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('linkbotao')
                        .setLabel('Link Para o Botão (Opcional)')
                        .setPlaceholder('Insira aqui um link, ex: https://discord.gg/invite')
                        .setRequired(false)
                        .setValue(configuracao.get('Instrucoes.linkbotao') || '')
                        .setStyle(TextInputStyle.Paragraph)
                )

                modal.addComponents(mensagem, nomebotao, linkbotao)
                await interaction.showModal(modal)
            }
            if (interaction.customId == "voltarProtect") {
                const { buildMainPanel } = require('../../Functions/ConfigPainelBuilder');
                await interaction.update({
                    components: [buildMainPanel(interaction.user.id, interaction)],
                    flags: MessageFlags.IsComponentsV2,
                    embeds: [],
                    content: ''
                });
            }
            if (interaction.customId == "addcanalboasvindas") {
                const maxChannels = interaction.guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText).size;

                const botao = CriarSelectChannel(client, interaction, 'addcanalboasvindas', 'Selecione um canal para adicionar', interaction?.guild?.channels?.cache?.filter(channel => channel.type === ChannelType.GuildText).size || 1);

                await interaction.update({ content: `Selecione um canal para adicionar`, embeds: [], components: botao })
            }
            if (interaction.customId == "removercanalboasvindas") {

                const canais = configuracao.get(`Entradas.canais`) || [];

                if (canais.length == 0) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Não há canais adicionados.`, ephemeral: true });

                let select = new StringSelectMenuBuilder()
                    .setCustomId('removercanalboasvindas')
                    .setPlaceholder('Selecione um canal para remover')
                    .setMinValues(0)
                    .setMaxValues(canais.length)

                for (const canal of canais) {
                    let canalObj;
                    try {
                        const fetchedChannel = await interaction.guild.channels.fetch(canal);
                        canalObj = { label: fetchedChannel.name, value: fetchedChannel.id };
                    } catch (error) {
                        canalObj = { label: `${canal} (Canal deletado)`, value: canal };
                    }

                    if (canalObj) {
                        select.addOptions(canalObj);
                    }
                }

                select = new ActionRowBuilder().addComponents(select);

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('voltar_msgbemvindocanais')
                        .setLabel('Voltar')
                        .setEmoji('1178068047202893869')
                        .setStyle(2)
                )

                await interaction.update({ content: `Selecione um canal para remover`, embeds: [], components: [select, row] });
            }
            if (interaction.customId.startsWith('voltarfunctioncanais_')) {
                let nomeFunction = interaction.customId.split('_')[1];
                const funcoes = require('../../Functions/AcoesAutomatics.js');

                try {
                    if (typeof funcoes[nomeFunction] === 'function') {
                        await funcoes[nomeFunction](interaction, client);
                    } else {
                        console.log(`Função ${nomeFunction} não encontrada.`);
                    }
                } catch (error) {
                    console.error(`Erro ao chamar a função ${nomeFunction}:`, error);
                }
            }
            if (interaction.customId.startsWith('adicionarcanal_')) {
                const customId = interaction.customId.split('_')[1];
                let opcoes = await CriarSelectChannel(client, interaction, customId, 'Selecione um canal para adicionar', interaction?.guild?.channels?.cache?.filter(channel => channel.type === ChannelType.GuildText).size >= 25 ? 25 : interaction?.guild?.channels?.cache?.filter(channel => channel.type === ChannelType.GuildText).size);
                interaction.update({ content: `Selecione canais para adicionar`, embeds: [], components: opcoes });
            }
            if (interaction.customId.startsWith('adicionarcargos_')) {
                const customId = interaction.customId.split('_')[1];
                let opcoes = await CriarSelectRole(client, interaction, customId, 'Selecione um canal para adicionar', 1);
                interaction.update({ content: `Selecione cargos para adicionar`, embeds: [], components: opcoes });
            }
            if (interaction.customId.startsWith('removercargos_')) {
                const customId = interaction.customId.split('_')[1];
                let cargos = configuracao.get(`AutomaticSettings.${customId}.cargos`) || [];

                if (cargos.length == 0) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Não há cargos adicionados.`, ephemeral: true });

                let select = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`removercargos_${customId}`)
                        .setPlaceholder('Selecione um cargo para remover')
                        .setMinValues(0)
                        .setMaxValues(cargos.length)
                )

                cargos.forEach(cargo => {
                    const cargoObj = interaction.guild.roles.cache.get(cargo);
                    if (!cargoObj) {
                        select.components[0].addOptions({
                            label: `${cargo} (Cargo deletado)`,
                            value: cargo
                        });
                        return;
                    }

                    select.components[0].addOptions({
                        label: cargoObj.name,
                        value: cargoObj.id
                    });
                })

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`voltarfunctioncargos_${customId}`)
                        .setLabel('Voltar')
                        .setEmoji('1178068047202893869')
                        .setStyle(2)
                )


                interaction.update({ content: `Selecione um cargo para remover`, embeds: [], components: [select, row] });
            }
            if (interaction.customId.startsWith('removercanal_')) {
                const customId = interaction.customId.split('_')[1];
                let canais = configuracao.get(`AutomaticSettings.${customId}.canais`) || [];

                if (canais.length == 0) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Não há canais adicionados.`, ephemeral: true });

                let select = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`removercanal_${customId}`)
                        .setPlaceholder('Selecione um canal para remover')
                        .setMinValues(0)
                        .setMaxValues(canais.length)
                )

                canais.forEach(canal => {
                    const canalObj = interaction.guild.channels.cache.get(canal);
                    if (!canalObj) {
                        select.components[0].addOptions({
                            label: `${canal} (Canal deletado)`,
                            value: canal
                        });
                        return;
                    }

                    select.components[0].addOptions({
                        label: canalObj.name,
                        value: canalObj.id
                    });
                });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`voltarfunctioncanais_${customId}`)
                        .setLabel('Voltar')
                        .setEmoji('1178068047202893869')
                        .setStyle(2)
                )

                interaction.update({ content: `Selecione um canal para remover`, embeds: [], components: [select, row] });
            }
            if (interaction.customId === 'automaticLimpeza') {
                LimpezaAutomatica(interaction, client)
            }
            if (interaction.customId === 'automaticOpenClose') {
                GerenciarCanais(interaction, client)
            }
            if (interaction.customId === 'automaticNukar') {
                SistemaNukar(interaction, client)
            }
            if (interaction.customId === 'painelantifake') {
                SistemaAntiFake(interaction, client)
            }
            if (interaction.customId === 'automaticAntiraid') {
                sistemaAntiRaid(interaction, client)
            }
            if (interaction.customId === 'sistemadefiltro') {
                SistemadeFiltro(interaction, client)
            }
            if (interaction.customId === 'configuracaoexcecao') {
                const modal = new ModalBuilder()
                    .setCustomId('configuracaoexcecao')
                    .setTitle(`Definir Exceções`)

                let cargos = configuracao.get(`AutomaticSettings.SistemadeFiltro.cargos`) || []
                let categoria = configuracao.get(`AutomaticSettings.SistemadeFiltro.categoria`) || []
                let stringcargos = ''
                let stringcategoria = ''

                try {
                    for (const cargo of cargos) {
                        const fetchedRole = await interaction.guild.roles.fetch(cargo);
                        stringcargos += `${fetchedRole.id}, `

                    }
                } catch (error) {

                }
                stringcargos = stringcargos.slice(0, -2);

                try {

                    for (const cat of categoria) {
                        const fetchedCat = await interaction.guild.channels.fetch(cat);
                        stringcategoria += `${fetchedCat.id}, `
                    }
                } catch (error) {
                }

                stringcategoria = stringcategoria.slice(0, -2);
                const cargosImunes = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`cargos`)
                        .setLabel(`CARGOS IMUNES`)
                        .setPlaceholder(`cargo1, cargo2, cargo3`)
                        .setValue(stringcargos)
                        .setStyle(1)
                        .setRequired(false)
                )

                const categoriaImunes = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`categoria`)
                        .setLabel(`CATEGORIA IMUNE`)
                        .setPlaceholder(`categoria1, categoria2, categoria3`)
                        .setValue(stringcategoria)
                        .setStyle(1)
                        .setRequired(false)
                )

                modal.addComponents(cargosImunes, categoriaImunes)
                await interaction.showModal(modal)
            }
            if (interaction.customId === 'configurarFiltro') {
                const modal = new ModalBuilder()
                    .setCustomId('configurarFiltro')
                    .setTitle(`Definir Filtro`)

                const status = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`status`)
                        .setLabel(`DEFINA O STATUS DO SISTEMA`)
                        .setValue(configuracao.get(`AutomaticSettings.SistemadeFiltro.status`) ? 'on' : 'off')
                        .setMaxLength(3)
                        .setRequired(true)
                        .setStyle(1)
                )

                const punicao = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`punicao`)
                        .setLabel(`DEFINA A PUNIÇÃO`)
                        .setPlaceholder('BAN, KICK, MUTE, REMOVER PUNICAO')
                        .setValue(configuracao.get(`AutomaticSettings.SistemadeFiltro.punicao`) || 'Sem Punição')
                        .setRequired(true)
                        .setStyle(1)
                )

                const ms = require('ms');
                let valuetempo = configuracao.get(`AutomaticSettings.SistemadeFiltro.tempo`) != 'permanente' && configuracao.get(`AutomaticSettings.SistemadeFiltro.tempo`) != undefined ? `${ms(configuracao.get(`AutomaticSettings.SistemadeFiltro.tempo`))}` : configuracao.get(`AutomaticSettings.SistemadeFiltro.tempo`) == `permanente` ? 'permanente' : ''
                const tempo = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`tempo`)
                        .setLabel(`DEFINA O TEMPO`)
                        .setPlaceholder('PERMANENTE, 1d, 1h, 1m, 1s')
                        .setValue(valuetempo)
                        .setRequired(true)
                        .setStyle(1)
                )

                modal.addComponents(status, punicao, tempo)
                await interaction.showModal(modal)
            }
            if (interaction.customId === 'adicionarFiltro') {

                const modal = new ModalBuilder()
                    .setCustomId('adicionarFiltro')
                    .setTitle(`Adicionar Filtro`)

                const convites = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`convites`)
                        .setLabel(`DESEJA FILTRAR CONVITES?`)
                        .setPlaceholder(`Sim ou Não`)
                        .setValue(configuracao.get(`AutomaticSettings.SistemadeFiltro.convites`) ? 'sim' : 'não')
                        .setRequired(false)
                        .setStyle(1)
                )
                let stringlinks = ''
                let links2 = configuracao.get(`AutomaticSettings.SistemadeFiltro.links`) || []
                let palavrastring = ''
                let palavras2 = configuracao.get(`AutomaticSettings.SistemadeFiltro.palavras`) || []

                for (const link of links2) {
                    stringlinks += `${link}\n`
                }

                for (const palavra of palavras2) {
                    palavrastring += `${palavra}\n`
                }

                const links = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`links`)
                        .setLabel(`INSIRA OS LINKS QUE DESEJA FILTRAR`)
                        .setPlaceholder(`https://discord.com\nhttps://youtube.com`)
                        .setRequired(false)
                        .setValue(stringlinks)
                        .setStyle(2)
                )

                const palavras = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`palavras`)
                        .setLabel(`INSIRA AS PALAVRAS QUE DESEJA FILTRAR`)
                        .setPlaceholder(`palavra1\npalavra2\npalavra3`)
                        .setValue(palavrastring)
                        .setRequired(false)
                        .setStyle(2)
                )

                modal.addComponents(convites, links, palavras)
                await interaction.showModal(modal)
            }
            if (interaction.customId === 'configurarLimpeza') {
                const modal = new ModalBuilder()
                    .setCustomId('configurarLimpeza')
                    .setTitle(`Limpeza Automática`)

                const status = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`status`)
                        .setLabel(`DEFINA O STATUS DO SISTEMA`)
                        .setValue(configuracao.get(`AutomaticSettings.LimpezaAutomatica.status`) ? 'on' : 'off')
                        .setMaxLength(3)
                        .setRequired(true)
                        .setStyle(1)
                )
                const primeira = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`primeira`)
                        .setLabel(`DEFINA O PRIMEIRO HORÁRIO`)
                        .setValue(configuracao.get(`AutomaticSettings.LimpezaAutomatica.primeira`) || '')
                        .setRequired(true)
                        .setStyle(1)
                )
                const segunda = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`segunda`)
                        .setLabel(`DEFINA O SEGUNDO HORÁRIO`)
                        .setValue(configuracao.get(`AutomaticSettings.LimpezaAutomatica.segunda`) || '')
                        .setRequired(true)
                        .setStyle(1)
                )

                modal.addComponents(status, primeira, segunda)
                await interaction.showModal(modal)
            }
            if (interaction.customId === 'configurarCanais') {
                const modal = new ModalBuilder()
                    .setCustomId('configurarCanais')
                    .setTitle(`Gerenciar Canais`)

                const status = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`status`)
                        .setLabel(`DEFINA O STATUS DO SISTEMA`)
                        .setValue(configuracao.get(`AutomaticSettings.GerenciarCanais.status`) ? 'on' : 'off')
                        .setMaxLength(3)
                        .setRequired(true)
                        .setStyle(1)
                )
                const primeira = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`abertura`)
                        .setLabel(`DEFINA O HORÁRIO DE ABERTURA`)
                        .setValue(configuracao.get(`AutomaticSettings.GerenciarCanais.abertura`) || '')
                        .setRequired(true)
                        .setStyle(1)
                )
                const segunda = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`fechamento`)
                        .setLabel(`DEFINA O HORÁRIO DE FECHAMENTO`)
                        .setValue(configuracao.get(`AutomaticSettings.GerenciarCanais.fechamento`) || '')
                        .setRequired(true)
                        .setStyle(1)
                )

                modal.addComponents(status, primeira, segunda)
                await interaction.showModal(modal)
            }
            if (interaction.customId === 'configurarNukar') {
                const modal = new ModalBuilder()
                    .setCustomId('configurarNukar')
                    .setTitle(`Sistema Nukar`)

                const status = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`status`)
                        .setLabel(`DEFINA O STATUS DO SISTEMA`)
                        .setValue(configuracao.get(`AutomaticSettings.SistemaNukar.status`) ? 'on' : 'off')
                        .setMaxLength(3)
                        .setRequired(true)
                        .setStyle(1)
                )

                const horario = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`horario`)
                        .setLabel(`DEFINA O HORÁRIO`)
                        .setValue(configuracao.get(`AutomaticSettings.SistemaNukar.horario`) || '')
                        .setRequired(true)
                        .setStyle(1)
                )

                modal.addComponents(status, horario)
                await interaction.showModal(modal)
            }
        }
        if (InteractionType.ModalSubmit === interaction.type) {
            if (interaction.customId === 'adicionarFiltro') {
                let links = interaction.fields.getTextInputValue('links').split('\n').map(link => link.trim()).filter(link => link !== '');
                let palavras = interaction.fields.getTextInputValue('palavras').split('\n').map(palavra => palavra.trim()).filter(palavra => palavra !== '');
                let convites = interaction.fields.getTextInputValue('convites').toLowerCase();

                if (convites !== 'sim' && convites !== 'não' && convites !== 'nao') return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O valor de convites deve ser "sim" ou "não"`, ephemeral: true });
                convites = convites === 'sim';
                configuracao.set('AutomaticSettings.SistemadeFiltro.convites', convites);

                if (links.length > 0) {
                    configuracao.set('AutomaticSettings.SistemadeFiltro.links', links);
                } else {
                    configuracao.set('AutomaticSettings.SistemadeFiltro.links', []);
                }
                if (palavras.length > 0) {
                    configuracao.set('AutomaticSettings.SistemadeFiltro.palavras', palavras);
                } else {
                    configuracao.set('AutomaticSettings.SistemadeFiltro.palavras', []);
                }

                await SistemadeFiltro(interaction, client);
                await interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Configurações salvas com sucesso!`, ephemeral: true });
                logAction(client, { action: 'Filtro configurado', details: `Convites: \`${convites}\`, Links: \`${links.length}\`, Palavras: \`${palavras.length}\``, userId: interaction.user.id, guildId: interaction.guildId });
            }

            if (interaction.customId === 'configuracaoexcecao') {
                const cargos = interaction.fields.getTextInputValue('cargos').split(',').map(cargo => cargo.trim());
                const categoria = interaction.fields.getTextInputValue('categoria').split(',').map(cat => cat.trim());

                const cargosID = [];
                const categoriaID = [];

                for (const cargo of cargos) {
                    const fetchedRole = interaction.guild.roles.cache.get(cargo);

                    if (fetchedRole && fetchedRole.id) {
                        cargosID.push(fetchedRole.id);
                    } else {
                    }
                }

                for (const cat of categoria) {
                    const fetchedCat = interaction.guild.channels.cache.get(cat);

                    if (fetchedCat && fetchedCat.type === ChannelType.GuildCategory) {
                        categoriaID.push(fetchedCat.id);
                    } else {
                    }
                }

                configuracao.set(`AutomaticSettings.SistemadeFiltro.cargos`, cargosID);
                configuracao.set(`AutomaticSettings.SistemadeFiltro.categoria`, categoriaID);

                await SistemadeFiltro(interaction, client);
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Configurações salvas com sucesso!`, ephemeral: true });
                logAction(client, { action: 'Exceções do Filtro configuradas', details: `Cargos: \`${cargosID.length}\`, Categorias: \`${categoriaID.length}\``, userId: interaction.user.id, guildId: interaction.guildId });
            }


            if (interaction.customId === 'configurarFiltro') {
                const status = interaction.fields.getTextInputValue('status').toLowerCase()
                let punicao = interaction.fields.getTextInputValue('punicao').toLowerCase()
                const tempo = interaction.fields.getTextInputValue('tempo').toLowerCase()

                if (status != 'on' && status != 'off') return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O status deve ser "on" ou "off"`, ephemeral: true });
                if (punicao != 'ban' && punicao != 'kick' && punicao != 'mute') {
                    punicao = undefined;
                }
                if (!tempo.match(/^(permanente|([0-9]+[smhd]))$/)) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O tempo deve ser "permanente" ou um valor seguido de "s", "m", "h" ou "d"`, ephemeral: true });
                const ms = require('ms');
                configuracao.set(`AutomaticSettings.SistemadeFiltro.status`, status == 'on' ? true : false);
                if (punicao) {
                    configuracao.set(`AutomaticSettings.SistemadeFiltro.punicao`, punicao);
                } else {
                    configuracao.delete(`AutomaticSettings.SistemadeFiltro.punicao`);
                }
                configuracao.set(`AutomaticSettings.SistemadeFiltro.tempo`, tempo == 'permanente' ? 'permanente' : ms(tempo));

                await SistemadeFiltro(interaction, client)
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Configurações salvas com sucesso!`, ephemeral: true });
                logAction(client, { action: 'Sistema de Filtro configurado', details: `Status: \`${status}\`, Punição: \`${punicao || 'nenhuma'}\`, Tempo: \`${tempo}\``, userId: interaction.user.id, guildId: interaction.guildId });
            }
            if (interaction.customId === 'configurarNukar') {
                let status = interaction.fields.getTextInputValue('status').toLowerCase()
                let horario = interaction.fields.getTextInputValue('horario')

                if (status != 'on' && status != 'off') return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O status deve ser "on" ou "off"`, ephemeral: true });
                status = status == 'on' ? true : false;

                if (!horario.match(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O horário deve ser no formato HH:MM`, ephemeral: true });

                configuracao.set(`AutomaticSettings.SistemaNukar.status`, status);
                configuracao.set(`AutomaticSettings.SistemaNukar.horario`, horario);

                await SistemaNukar(interaction, client)
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Configurações salvas com sucesso!`, ephemeral: true });
                logAction(client, { action: 'Sistema Nukar configurado', details: `Status: \`${status ? 'on' : 'off'}\`, Horário: \`${horario}\``, userId: interaction.user.id, guildId: interaction.guildId });
            }
            if (interaction.customId === 'configurarLimpeza') {
                let status = interaction.fields.getTextInputValue('status').toLowerCase()
                let primeira = interaction.fields.getTextInputValue('primeira')
                let segunda = interaction.fields.getTextInputValue('segunda')

                if (status != 'on' && status != 'off') return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O status deve ser "on" ou "off"`, ephemeral: true });
                status = status == 'on' ? true : false;

                if (!primeira.match(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O horário deve ser no formato HH:MM`, ephemeral: true });
                if (!segunda.match(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O horário deve ser no formato HH:MM`, ephemeral: true });
                if (primeira === segunda) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Os horários não podem ser iguais`, ephemeral: true });
                configuracao.set(`AutomaticSettings.LimpezaAutomatica.status`, status);
                configuracao.set(`AutomaticSettings.LimpezaAutomatica.primeira`, primeira);
                configuracao.set(`AutomaticSettings.LimpezaAutomatica.segunda`, segunda);

                await LimpezaAutomatica(interaction, client)
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Configurações salvas com sucesso!`, ephemeral: true });
                logAction(client, { action: 'Limpeza Automática configurada', details: `Status: \`${status ? 'on' : 'off'}\`, 1ª: \`${primeira}\`, 2ª: \`${segunda}\``, userId: interaction.user.id, guildId: interaction.guildId });
            }
            if (interaction.customId === 'configurarCanais') {
                let status = interaction.fields.getTextInputValue('status').toLowerCase()
                let abertura = interaction.fields.getTextInputValue('abertura')
                let fechamento = interaction.fields.getTextInputValue('fechamento')

                if (status != 'on' && status != 'off') return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O status deve ser "on" ou "off"`, ephemeral: true });
                status = status == 'on' ? true : false;

                if (!abertura.match(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O horário deve ser no formato HH:MM`, ephemeral: true });
                if (!fechamento.match(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O horário deve ser no formato HH:MM`, ephemeral: true });
                if (abertura === fechamento) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Os horários não podem ser iguais`, ephemeral: true });
                configuracao.set(`AutomaticSettings.GerenciarCanais.status`, status);
                configuracao.set(`AutomaticSettings.GerenciarCanais.abertura`, abertura);
                configuracao.set(`AutomaticSettings.GerenciarCanais.fechamento`, fechamento);

                await GerenciarCanais(interaction, client)
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Configurações salvas com sucesso!`, ephemeral: true });
                logAction(client, { action: 'Gerenciamento de Canais configurado', details: `Status: \`${status ? 'on' : 'off'}\`, Abertura: \`${abertura}\`, Fechamento: \`${fechamento}\``, userId: interaction.user.id, guildId: interaction.guildId });
            }
        }
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'select_AcoesAutomaticsConfigs') {
                const customId = interaction.values[0];
                if (customId === 'automaticRepostar') {
                    AcoesRepostAutomatics(interaction, client)
                    return
                }
                if (customId === 'MsgsAutoConfig') {
                    AcoesMsgsAutomatics(interaction, client)
                    return
                }

                const funcoes = require('../../Functions/AcoesAutomatics.js');
                if (typeof funcoes[customId] === 'function') {
                    await funcoes[customId](interaction, client);
                } else {
                    console.log(`Função ${customId} não encontrada.`);
                }
            }
            if (interaction.customId.startsWith('removercanal_')) {
                const customId = interaction.customId.split('_')[1];
                let canais = configuracao.get(`AutomaticSettings.${customId}.canais`) || [];
                let novosCanais = canais.filter(canal => !interaction.values.includes(canal));

                configuracao.set(`AutomaticSettings.${customId}.canais`, novosCanais);

                const funcoes = require('../../Functions/AcoesAutomatics.js');
                if (typeof funcoes[customId] === 'function') {
                    await funcoes[customId](interaction, client);
                }
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} \`${interaction.values.length}\` canais removidos com sucesso!`, ephemeral: true });
                logAction(client, { action: `Canais removidos de \`${customId}\``, details: `${interaction.values.length} canal(ais) removido(s)`, userId: interaction.user.id, guildId: interaction.guildId });
            }
            if (interaction.customId.startsWith('removercargos_')) {
                const customId = interaction.customId.split('_')[1];
                let canais = configuracao.get(`AutomaticSettings.${customId}.cargos`) || [];
                let novosCanais = canais.filter(canal => !interaction.values.includes(canal));

                configuracao.set(`AutomaticSettings.${customId}.cargos`, novosCanais);

                const funcoes = require('../../Functions/AcoesAutomatics.js');
                if (typeof funcoes[customId] === 'function') {
                    await funcoes[customId](interaction, client);
                }
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} \`${interaction.values.length}\` cargos removidos com sucesso!`, ephemeral: true });
                logAction(client, { action: `Cargos removidos de \`${customId}\``, details: `${interaction.values.length} cargo(s) removido(s)`, userId: interaction.user.id, guildId: interaction.guildId });
            }
            if (interaction.customId.startsWith('removercanal_')) {
                const customId = interaction.customId.split('_')[1];
                let canais = configuracao.get(`AutomaticSettings.${customId}.canais`) || [];
                let novosCanais = canais.filter(canal => !interaction.values.includes(canal));

                configuracao.set(`AutomaticSettings.${customId}.canais`, novosCanais);

                const funcoes = require('../../Functions/AcoesAutomatics.js');
                if (typeof funcoes[customId] === 'function') {
                    await funcoes[customId](interaction, client);
                }
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} \`${interaction.values.length}\` canais removidos com sucesso!`, ephemeral: true });
            }
            if (interaction.customId === 'removercanalboasvindas') {
                let canais = configuracao.get(`Entradas.canais`) || [];
                let novosCanais = canais.filter(canal => !interaction.values.includes(canal));

                configuracao.set(`Entradas.canais`, novosCanais);

                await msgbemvindo(interaction, client);
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Canal removido com sucesso!`, ephemeral: true });
                logAction(client, { action: 'Canal de boas-vindas removido', details: `${interaction.values.length} canal(ais) removido(s)`, userId: interaction.user.id, guildId: interaction.guildId });
            }
        }
        if (interaction.isChannelSelectMenu()) {
            if (interaction.customId.startsWith('selectchannel_')) {
                let nomeFunction = interaction.customId.split('_')[1]

                if (nomeFunction === 'msgbemvindocanais') {
                    let canais = configuracao.get(`Entradas.canais`) || [];
                    let selecionados = interaction.values

                    if (canais.length > 0) {
                        selecionados = selecionados.filter(canal => !canais.includes(canal));
                    }
                    if (selecionados.length == 0) {
                        await msgbemvindo(interaction, client);
                        return interaction.followUp({ content: `${Emojis.get(`negative_emoji`)} Nenhum canal novo foi adicionado.`, ephemeral: true });
                    }

                    canais.push(...selecionados);

                    configuracao.set(`Entradas.canais`, canais);

                    await msgbemvindo(interaction, client);
                    interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} \`${selecionados.length}\` novo canais adicionado com sucesso!`, ephemeral: true });
                    logAction(client, { action: 'Canal de boas-vindas adicionado', details: `${selecionados.length} canal(ais): ${selecionados.map(c => `<#${c}>`).join(', ')}`, userId: interaction.user.id, guildId: interaction.guildId });
                } else {
                    let canais = configuracao.get(`AutomaticSettings.${nomeFunction}.canais`) || [];
                    let funcoes = require('../../Functions/AcoesAutomatics.js');
                    let selecionados = interaction.values

                    if (canais.length > 0) {
                        selecionados = selecionados.filter(canal => !canais.includes(canal));
                    }

                    if (selecionados.length == 0) {
                        if (typeof funcoes[nomeFunction] === 'function') {
                            await funcoes[nomeFunction](interaction, client);
                        } else {
                            console.log(`Função ${nomeFunction} não encontrada.`);
                        }
                        return interaction.followUp({ content: `${Emojis.get(`negative_emoji`)} Nenhum canal novo foi adicionado.`, ephemeral: true });
                    }
                    canais.push(...selecionados);
                    configuracao.set(`AutomaticSettings.${nomeFunction}.canais`, canais);
                    if (typeof funcoes[nomeFunction] === 'function') {
                        await funcoes[nomeFunction](interaction, client);
                    }
                    interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} \`${selecionados.length}\` novo canais adicionado com sucesso!`, ephemeral: true });
                    logAction(client, { action: `Canais adicionados a \`${nomeFunction}\``, details: `${selecionados.length} canal(ais): ${selecionados.map(c => `<#${c}>`).join(', ')}`, userId: interaction.user.id, guildId: interaction.guildId });
                }
            }

        }
        if (interaction.isRoleSelectMenu()) {
            if (interaction.customId.startsWith('selectrole_')) {
                let nomeFunction = interaction.customId.split('_')[1]
                let cargos = configuracao.get(`AutomaticSettings.${nomeFunction}.canais`) || [];
                let funcoes = require('../../Functions/AcoesAutomatics.js');
                let selecionados = interaction.values

                if (cargos.length > 0) {
                    selecionados = selecionados.filter(canal => !cargos.includes(canal));
                }

                if (selecionados.length == 0) {
                    if (typeof funcoes[nomeFunction] === 'function') {
                        await funcoes[nomeFunction](interaction, client);
                    } else {
                        console.log(`Função ${nomeFunction} não encontrada.`);
                    }
                    return interaction.followUp({ content: `${Emojis.get(`negative_emoji`)} Nenhum canal novo foi adicionado.`, ephemeral: true });
                }
                cargos.push(...selecionados);
                configuracao.set(`AutomaticSettings.${nomeFunction}.cargos`, cargos);
                if (typeof funcoes[nomeFunction] === 'function') {
                    await funcoes[nomeFunction](interaction, client);
                }
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} \`${selecionados.length}\` novo cargos adicionado com sucesso!`, ephemeral: true });
                logAction(client, { action: `Cargos adicionados a \`${nomeFunction}\``, details: `${selecionados.length} cargo(s): ${selecionados.map(r => `<@&${r}>`).join(', ')}`, userId: interaction.user.id, guildId: interaction.guildId });
            }
        }
    }
}

async function CriarSelectChannel(client, interaction, customId, Placeholder, maxChannels) {

    const botao = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId(`selectchannel_${customId}`)
            .setMaxValues(maxChannels)
            .setPlaceholder(Placeholder)
            .setChannelTypes(ChannelType.GuildText)
    )

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`voltarfunctioncanais_${customId}`)
            .setLabel('Voltar')
            .setEmoji('1178068047202893869')
            .setStyle(2)
    )

    return [botao, row]
}
async function CriarSelectRole(client, interaction, customId, Placeholder, maxChannels) {

    const botao = new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
            .setCustomId(`selectrole_${customId}`)
            .setMaxValues(maxChannels)
            .setPlaceholder(Placeholder)
    )

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`voltarfunctioncanais_${customId}`)
            .setLabel('Voltar')
            .setEmoji('1178068047202893869')
            .setStyle(2)
    )

    return [botao, row]
}