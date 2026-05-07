const { ActionRowBuilder, TextInputBuilder, TextInputStyle, InteractionType, ModalBuilder, EmbedBuilder, ButtonBuilder, Embed, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require("discord.js");
const { configuracao } = require("../../DataBaseJson");
const { Gerenciar } = require("../../Functions/Gerenciar");
const { FormasDePagamentos } = require("../../Functions/FormasDePagamentosConfig");
const { mpConfigs, BloquearBancos, BloquearConta } = require("../../Functions/mpConfigs");
const axios = require('axios');
const mercadopago = require('mercadopago');
const { msgbemvindo } = require("../../Functions/AcoesAutomatics");
const { Emojis } = require("../../DataBaseJson");

const bankNames = {
    nu: 'Nu Pagamentos S.A.',
    mp: 'Mercadopago.com Representações Ltda.',
    bdb: 'Banco do Brasil S.A.',
    caixa: 'Caixa Econômica Federal',
    itau: 'Banco Itaú Unibanco S.A.',
    bradesco: 'Banco Bradesco S.A.',
    inter: 'Banco Inter',
    neon: 'Neon Pagamentos S.A.',
    original: 'Original S.A.',
    next: 'Next',
    agibank: 'Agibank',
    santander: 'Santander (Brasil) S.A.',
    c6: 'C6 Bank S.A.',
    banrisul: 'Banrisul',
    pagseguro: 'PagSeguro Internet S.A.',
    bs2: 'BS2',
    modalmais: 'Modalmais'
};

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        if (interaction.type == InteractionType.ModalSubmit) {
            if (interaction.customId === `bloquearConta`) {
                const idconta = interaction.fields.getTextInputValue('idconta');
                const motivo = interaction.fields.getTextInputValue('motivo') || 'Sem motivo';
                const contasBloqueadas = await configuracao.get(`pagamentos.ContasBloqueadas`) || [];

                if (isNaN(idconta)) {
                    await BloquearConta(client, interaction);
                    await interaction.followUp({ content: `${Emojis.get(`negative_emoji`)} O ID da conta deve ser um número!`, ephemeral: true });
                    return
                }

                if (contasBloqueadas.some(conta => conta.startsWith(`${idconta}`))) {
                    await BloquearConta(client, interaction);
                    await interaction.followUp({ content: `${Emojis.get(`negative_emoji`)} Esta conta já está bloqueada!`, ephemeral: true });
                    return;
                }

                contasBloqueadas.push(`${idconta}:${motivo}`);
                configuracao.set(`pagamentos.ContasBloqueadas`, contasBloqueadas);
                await BloquearConta(client, interaction);
                await interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Conta bloqueada com sucesso!`, ephemeral: true });
            } 
            if (interaction.customId === `desbloquearConta`) {
                const idconta = interaction.fields.getTextInputValue('idconta');
                const contasBloqueadas = await configuracao.get(`pagamentos.ContasBloqueadas`) || [];

                if (isNaN(idconta)) {
                    await BloquearConta(client, interaction);
                    await interaction.followUp({ content: `${Emojis.get(`negative_emoji`)} O ID da conta deve ser um número!`, ephemeral: true });
                    return
                }

                if (!contasBloqueadas.some(conta => conta.startsWith(`${idconta}`))) {
                    await BloquearConta(client, interaction);
                    await interaction.followUp({ content: `${Emojis.get(`negative_emoji`)} Esta conta não está bloqueada!`, ephemeral: true });
                    return;
                }

                const contas = contasBloqueadas.filter(conta => conta.split(':')[0] !== idconta);
                configuracao.set(`pagamentos.ContasBloqueadas`, contas);
                await BloquearConta(client, interaction);
                await interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Conta desbloqueada com sucesso!`, ephemeral: true });
            }
        }
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId == `bloquearcontaselect`) {
                let option = interaction.values[0];
                if (option === `bloquearConta`) {
                    const modal = new ModalBuilder()
                        .setCustomId('bloquearConta')
                        .setTitle(`Bloquear Conta`);

                    const idconta = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('idconta')
                            .setLabel(`Numero da Conta Bancária`)
                            .setPlaceholder(`Insira o número da conta bancária aqui..`)
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )

                    const motivo = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('motivo')
                            .setLabel(`Motivo do bloqueio (opcional)`)
                            .setPlaceholder(`Insira o motivo do bloqueio aqui..`)
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(false)
                    )

                    modal.addComponents(idconta, motivo);
                    await interaction.showModal(modal);
                } else if (option === `desbloquearConta`) {
                    const modal = new ModalBuilder()
                        .setCustomId('desbloquearConta')
                        .setTitle(`Desbloquear Conta`);

                    const idconta = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('idconta')
                            .setLabel(`Numero da Conta Bancária`)
                            .setPlaceholder(`Insira o número da conta bancária aqui..`)
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )

                    modal.addComponents(idconta);
                    await interaction.showModal(modal);
                } else if (option === `verContas`) {
                    const contasBloqueadas = await configuracao.get(`pagamentos.ContasBloqueadas`) || [];
                    if (contasBloqueadas.length === 0) {
                        interaction.reply({ content: `${Emojis.get(`_multi_silueta_emoji`)} Nenhuma conta bloqueada!`, ephemeral: true });
                        return;
                    }
                    let contas = '';

                    for (const conta of contasBloqueadas) {
                        contas += `\`Conta: ${conta.split(`:`)[0]} | Motivo: ${conta.split(`:`)[1]}\`\n`;
                    }
                    
                    interaction.reply({ content: `${Emojis.get(`_multi_silueta_emoji`)} Contas bloqueadas:\n${contas}`, ephemeral: true });
                }
            }
            if (interaction.customId == `desbloquearbancosselect`) {
                let bancos = interaction.values;
                let bancosBloqueados = await configuracao.get(`pagamentos.BancosBloqueados`);
                bancos = bancosBloqueados.filter(banco => bancos.includes(banco));
                bancosBloqueados = bancosBloqueados.filter(banco => !bancos.includes(banco));
                configuracao.set(`pagamentos.BancosBloqueados`, bancosBloqueados);
                await mpConfigs(interaction);
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Banco(s) desbloqueado(s) com sucesso!`, ephemeral: true });
            }
            if (interaction.customId == `bloquearbancosselect`) {
                let bancos = interaction.values;
                let bancosBloqueados = await configuracao.get(`pagamentos.BancosBloqueados`);
                bancos = bancos.filter(banco => !bancosBloqueados.includes(banco));
                bancosBloqueados = bancosBloqueados.concat(bancos);
                configuracao.set(`pagamentos.BancosBloqueados`, bancosBloqueados);
                await mpConfigs(interaction);
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Banco(s) bloqueado(s) com sucesso!`, ephemeral: true });
            }
            if (interaction.customId == `configurarmpselect`) {
                let option = interaction.values[0];
                if (option == 'alterarAccessToken') {
                    const modal = new ModalBuilder()
                        .setCustomId('tokenMP')
                        .setTitle(`Configurar Mercado Pago`);

                    const token = new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('tokenMP')
                            .setLabel(`Chave SKD da API (Mercado Pago)`)
                            .setPlaceholder(`APP_USR-000000000000000-XX...`)
                            .setValue(configuracao.get('pagamentos.MpAPI') ? `${configuracao.get('pagamentos.MpAPI')}` : '')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )

                    modal.addComponents(token);
                    await interaction.showModal(modal);
                } else if (option == `bloquearBanco`) {
                    BloquearBancos(client, interaction)
                } else if (option == `bloquearUsuario`) {
                    BloquearConta(client, interaction)
                }
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'desbloqueartodos') {
                configuracao.set(`pagamentos.BancosBloqueados`, []);
                await mpConfigs(interaction);
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Todos os bancos desbloqueados com sucesso!`, ephemeral: true });
            }
            if (interaction.customId === 'liberarbanco') {
                let bancosBloqueados = await configuracao.get(`pagamentos.BancosBloqueados`);
                let opcoes = []

                for (const banco of bancosBloqueados) {
                    opcoes.push({
                        label: bankNames[banco],
                        value: banco
                    });
                }

                const selectMenu = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`desbloquearbancosselect`)
                        .setPlaceholder(`Desbloquear bancos`)
                        .setMaxValues(opcoes.length)
                        .addOptions(opcoes.map(({ label, value }) => {
                            return new StringSelectMenuOptionBuilder()
                                .setLabel(`${value}`)
                                .setValue(`${value}`)
                        })
                        )
                )

                const botao2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`desbloqueartodos`)
                        .setLabel(`Desbloquear todos`)
                        .setEmoji(Emojis.get(`_trash_emoji`))
                        .setStyle(2)
                )

                const botaovoltar = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("configurarmercadopago")
                        .setEmoji(`1238413255886639104`)
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId(`voltar1`)
                        .setEmoji('1292237216915128361')
                        .setStyle(1)
                )

                await interaction.update({ components: [selectMenu, botao2, botaovoltar] })
            }
            if (interaction.customId === 'editarmensagemboasvindas') {
                const modalaAA = new ModalBuilder()
                    .setCustomId('sdaju111idsjjsdua')
                    .setTitle(`Editar Boas Vindas`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`Mensagem`)
                    .setPlaceholder(`Insira aqui sua mensagem, use {member} para mencionar o membro e {guildname} para o servidor.`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(configuracao.get('Entradas.msg'))
                    .setRequired(true)
                    .setMaxLength(1000)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`TEMPO PARA APAGAR A MENSAGEM`)
                    .setPlaceholder(`Insira aqui a quantidade em segundos.`)
                    .setValue(configuracao.get('Entradas.tempo'))
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(6)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);


                modalaAA.addComponents(firstActionRow3, firstActionRow4);
                await interaction.showModal(modalaAA);

            }



            if (interaction.customId == '+18porra') {

                const modalaAA = new ModalBuilder()
                    .setCustomId('tokenMP')
                    .setTitle(`Alterar Token`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel("TOKEN: APP_USR-000000000000000-XX...")
                    .setPlaceholder("APP_USR-000000000000000-XX...")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(256)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                modalaAA.addComponents(firstActionRow3);
                await interaction.showModal(modalaAA);

            }

            if (interaction.customId == '-18porra') {


                const fernandinhaa = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setURL(`https://Kingappsauth.squareweb.app/auth2/${interaction.guild.id}/VendasPrivadaV2`)
                            .setStyle(5)
                            .setLabel('Autorizar Mercado Pago'),
                        new ButtonBuilder()
                            .setCustomId('configurarmercadopago')
                            .setStyle(1)
                            .setEmoji('1238413255886639104')

                    )

                const forFormat = Date.now() + 10 * 60 * 1000

                const timestamp = Math.floor(forFormat / 1000)

                interaction.update({ embeds: [], content: `Autorizar seu **Mercado Pago** á **King Applications**\n\n**Status:** Aguardando você autorizar.\nEssa mensagem vai expirar em <t:${timestamp}:R>\n (Para autorizar, clique no botão abaixo, selecione 'Brasil' e clique em Continuar/Confirmar/Autorizar)`, components: [fernandinhaa] }).then(async msgg => {

                    const response2 = await axios.get(`https://stormappsauth.squareweb.app/token2/${interaction.guild.id}/VendasPrivadaV2`);
                    const geral = response2.data;

                    var existia = null

                    if (geral.message !== 'Usuario nao encontado!') {
                        existia = geral.access_token
                    } else {
                        existia = 'Não definido'
                    }

                    var status = false;
                    var intervalId = null;
                    var tempoLimite = 5 * 60 * 1000;


                    if (status === false) {
                        intervalId = setInterval(async () => {
                            const response = await axios.get(`https://Kingappsauth.squareweb.app/token2/${interaction.guild.id}/VendasPrivadaV2`);
                            const geral = response.data;

                            if (geral.message == 'Usuario nao encontado!') {
                                status = false;
                            } else {
                                if (existia === 'Não definido' || existia !== geral.access_token) {
                                    status = true;
                                    clearInterval(intervalId);
                                    configuracao.set(`pagamentos.MpAPI`, geral.access_token)

                                    const fernandinhaa = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('configurarmercadopago')
                                                .setStyle(1)
                                                .setEmoji('1238413255886639104')

                                        )

                                    interaction.editReply({
                                        content: `**Status:** ${Emojis.get(`confirmed_emoji`)} Autorização bem sucedida!.`,
                                        components: [fernandinhaa]
                                    })
                                }
                            }
                        }, 5000);
                        setTimeout(async () => {
                            clearInterval(intervalId);

                            const fernandinhaa = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('voltar1234sda')
                                        .setStyle(1)
                                        .setEmoji('1238413255886639104')

                                )

                            const errTimeoutContainer = new ContainerBuilder();
                            errTimeoutContainer.setAccentColor(0x5865F2);
                            errTimeoutContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${Emojis.get('negative_emoji')} Você não se cadastrou durante 5 minutos, cadastre-se novamente!`));
                            errTimeoutContainer.addActionRowComponents(fernandinhaa);
                            interaction.editReply({
                                components: [errTimeoutContainer],
                                flags: MessageFlags.IsComponentsV2,
                                embeds: []
                            })

                        }, tempoLimite);
                    }
                })
            }


            if (interaction.customId === 'voltaradawdwa') {
                Gerenciar(interaction, client)
            }
            if (interaction.customId === 'formasdepagamentos') {
                FormasDePagamentos(interaction)

            }

            if (interaction.customId == 'configurarmercadopago') {

                mpConfigs(interaction);

            }

            if (interaction.customId == 'exemplesbancks') {

                {
                    const cor = configuracao.get('Cores.Principal') || '5865F2';
                    const accentColor = (() => { try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; } })();
                    const banksContainer = new ContainerBuilder();
                    banksContainer.setAccentColor(accentColor);
                    banksContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## Exemplos de Bancos\nAbaixo estão os identificadores para usar no campo **Bloquear Banco**. Separe múltiplos com vírgula. Ex: \`inter, nu\`\n\n` +
                        `\`nu\` — Nu Pagamentos S.A.\n\`mp\` — Mercadopago.com Representações Ltda.\n\`bdb\` — Banco do Brasil S.A.\n` +
                        `\`caixa\` — Caixa Econômica Federal\n\`itau\` — Banco Itaú Unibanco S.A.\n\`bradesco\` — Banco Bradesco S.A.\n` +
                        `\`inter\` — Banco Inter\n\`neon\` — Neon Pagamentos S.A.\n\`original\` — Original S.A.\n\`next\` — Next\n` +
                        `\`agibank\` — Agibank\n\`santander\` — Santander (Brasil) S.A.\n\`c6\` — C6 Bank S.A.\n` +
                        `\`banrisul\` — Banrisul\n\`pagseguro\` — PagSeguro Internet S.A.\n\`bs2\` — BS2\n\`modalmais\` — Modalmais`
                    ));
                    interaction.reply({
                        components: [banksContainer],
                        flags: MessageFlags.IsComponentsV2,
                        embeds: [],
                        ephemeral: true
                    });
                }

            }

            if (interaction.customId == 'onOffMp') {

                if (configuracao.get(`pagamentos.MpOnOff`) == true) {
                    configuracao.set(`pagamentos.MpOnOff`, false)
                } else {
                    configuracao.set(`pagamentos.MpOnOff`, true)
                }

                mpConfigs(interaction)
            }
            if (interaction.customId == 'alterarSiteMp') {

                if (configuracao.get(`pagamentos.MpSite`) == true) {
                    configuracao.set(`pagamentos.MpSite`, false)
                } else {
                    configuracao.set(`pagamentos.MpSite`, true)
                }

                mpConfigs(interaction)
            }

            if (interaction.customId == 'bloquearbancos') {

                const validBanks = ['nu', 'mp', 'bdb', 'caixa', 'itau', 'bradesco', 'inter', 'neon', 'original', 'next', 'agibank', 'santander', 'c6', 'banrisul', 'pagseguro', 'bs2', 'modalmais'];

                const blockedBanks = configuracao.get(`pagamentos.BancosBloqueados`);
                let bankList = '';
                blockedBanks.forEach((bank) => {
                    bankList += `${bank}, `;
                });
                bankList = bankList.trim().replace(/, $/, '');

                const modal = new ModalBuilder()
                    .setCustomId('gostmpbancos')
                    .setTitle(`Bloquear Bancos`);

                const bankInput = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel("BANCOS BLOQUEADOS")
                    .setPlaceholder(`Insira os bancos que deseja recusar separado por vírgula, ex: inter, nu`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(bankList)
                    .setRequired(false);

                const actionRow = new ActionRowBuilder().addComponents(bankInput);
                modal.addComponents(actionRow);
                await interaction.showModal(modal);
            }
        }
        if (interaction.type == InteractionType.ModalSubmit) {

            if (interaction.customId === 'sdaju111idsjjsdua') {
                const title = interaction.fields.getTextInputValue('tokenMP');
                let title2 = interaction.fields.getTextInputValue('tokenMP2');

                if (title2 !== '') {
                    if (isNaN(title2) == true) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Você colocou um tempo incorreto para a mensagem ser apagada!`, ephemeral: true })
                } else {
                    title2 = 0
                }


                configuracao.set('Entradas', {
                    msg: title,
                    tempo: title2
                })

                await msgbemvindo(interaction, client)
            }


            if (interaction.customId === 'gostmpbancos') {

                const validBanks = ['nu', 'mp', 'bdb', 'caixa', 'itau', 'bradesco', 'inter', 'neon', 'original', 'next', 'agibank', 'santander', 'c6', 'banrisul', 'pagseguro', 'bs2', 'modalmais'];

                const inputBanks = interaction.fields.getTextInputValue('tokenMP2');
                if (inputBanks !== '') {
                    const inputBanksArray = inputBanks.replace(/\s/g, '').split(',');
                    const invalidBanks = inputBanksArray.filter((bank) => !validBanks.includes(bank));
                    if (invalidBanks.length > 0) {
                        const cor2 = configuracao.get('Cores.Principal') || '5865F2';
                        const accentColor2 = (() => { try { return parseInt(cor2.replace('#', ''), 16); } catch (e) { return 0x5865F2; } })();
                        const invalidBankContainer = new ContainerBuilder();
                        invalidBankContainer.setAccentColor(accentColor2);
                        invalidBankContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`Ops... parece que o banco que você setou é inválido. Olhe os exemplos clicando no botão abaixo.`));
                        invalidBankContainer.addSeparatorComponents(new SeparatorBuilder());
                        invalidBankContainer.addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("exemplesbancks").setLabel('Exemplos Bancos').setEmoji('1238417688129310782').setStyle(2).setDisabled(false)));
                        await interaction.reply({
                            components: [invalidBankContainer],
                            flags: MessageFlags.IsComponentsV2,
                            embeds: [],
                            ephemeral: true
                        });
                    } else {
                        configuracao.set(`pagamentos.BancosBloqueados`, inputBanksArray);
                        mpConfigs(interaction);
                    }
                } else {
                    configuracao.set(`pagamentos.BancosBloqueados`, []);
                    mpConfigs(interaction);
                }
            }



            if (interaction.customId === 'tokenMP') {
                const token = interaction.fields.getTextInputValue('tokenMP');
                let response = await fetch('https://api.mercadopago.com/v1/customers/search?email=jhon@doe.com', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                response = await response.json()

                if (response?.code == 'unauthorized') {
                    await mpConfigs(interaction)
                    interaction.followUp({ content: `${Emojis.get(`negative_emoji`)} Token MP inválido!`, ephemeral: true })
                    return
                }

                configuracao.set(`pagamentos.MpAPI`, token);
                await mpConfigs(interaction)
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Token MP alterado com sucesso!`, ephemeral: true })
            }
        }
    }
}