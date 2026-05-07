const { ActionRowBuilder, TextInputBuilder, TextInputStyle, InteractionType, ModalBuilder } = require("discord.js");
const { configuracao } = require("../../DataBaseJson");
const { AcoesAutomaticsConfigs } = require("../../Functions/AcoesAutomatics");

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.isButton()) {
            if (interaction.customId === 'personalizarantifake') {
                const modalaAA = new ModalBuilder()
                    .setCustomId('joaozinhoAntiFake')
                    .setTitle(`Configurar anti fake`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`QUANTIDADE DE DIAS MÍNIMA PARA ENTRAR`)
                    .setPlaceholder(`Digite "remover" para desativar, serve para todos os campos.`)
                    .setValue(`${configuracao.get(`AntiFake.diasminimos`)}` || '')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                    let statussalvos = configuracao.get(`AntiFake.status`) || []
                    let nomessalvos = configuracao.get(`AntiFake.nomes`) || []
                    let stringstatus = ''
                    let stringnomes = ''
                    statussalvos.forEach(status => {
                        stringstatus += status + ', '
                    })
                    nomessalvos.forEach(nome => {
                        stringnomes += nome + ', '
                    })
                    
                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`LISTA DE STATUS QUE DESEJA BLOQUEAR`)
                    .setPlaceholder(`Digite separado por vírgual os status das contas que deseja punir se detectadas.`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(stringstatus.slice(0, -2) || '')
                    .setRequired(false)
                    .setMaxLength(4000)

                const newnameboteN3 = new TextInputBuilder()
                    .setCustomId('tokenMP3')
                    .setLabel(`LISTA DE NOMES QUE DESEJA BLOQUEAR`)
                    .setPlaceholder(`Digite separado por vírgual os nomes das contas que deseja punir se detectadas.`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(stringnomes.slice(0, -2) || '')
                    .setRequired(false)
                    .setMaxLength(4000)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN3);


                modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5);
                await interaction.showModal(modalaAA);
            }
        }

        if (interaction.type == InteractionType.ModalSubmit) {

            if (interaction.customId === 'joaozinhoAntiFake') {
                let diasminimos = interaction.fields.getTextInputValue('tokenMP');
                let status = interaction.fields.getTextInputValue('tokenMP2');
                let nomes = interaction.fields.getTextInputValue('tokenMP3');

                if (diasminimos != 'remover') {
                    if (isNaN(diasminimos)) return interaction.followUp({ content: `${Emojis.get(`negative_emoji`)}  O valor de dias mínimos deve ser um número!`, ephemeral: true })
                        if (diasminimos < 0) return interaction.followUp({ content: `${Emojis.get(`negative_emoji`)}  O valor de dias mínimos deve ser maior que 0!`, ephemeral: true })
                        diasminimos = parseInt(diasminimos)
                    configuracao.set(`AntiFake.diasminimos`, diasminimos)
                } else {
                    diasminimos = null
                }

                let statussalvos = configuracao.get(`AntiFake.Status`) || []
                let nomessalvos = configuracao.get(`AntiFake.Nomes`) || []

                if (status != 'remover' && status != '') {
                    statussalvos = status.split(',')
                } else {
                    statussalvos = []
                }

                if (nomes != 'remover' && nomes != '') {
                    nomessalvos = nomes.split(',')
                } else {
                    nomessalvos = []
                }
                
                configuracao.set(`AntiFake.status`, statussalvos)
                configuracao.set(`AntiFake.nomes`, nomessalvos)

                await AcoesAutomaticsConfigs(interaction, client)
                interaction.followUp({ content: `${Emojis.get(`confirmed_emoji`)} Todas configurações de Anti-Fake foram configuradas com sucesso!`, ephemeral: true })

            }
        }
    }
}