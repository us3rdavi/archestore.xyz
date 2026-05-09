
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelSelectMenuBuilder, ChannelType, InteractionType } = require("discord.js")
const { configuracao } = require("../../Database")
const { sistemaAntiRaid } = require("../../Functions/AcoesAutomatics")
const { CriarSelectChannel } = require("./painel")


module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        let AntiRaid = configuracao.get(`AutomaticSettings.sistemaAntiRaid`)
        if (interaction.isButton()) {
            if (interaction.customId.startsWith('metodopunicao_')) {
                configuracao.set(`AutomaticSettings.sistemaAntiRaid.punicao`, interaction.customId.split('_')[1])
                await sistemaAntiRaid(interaction, client)
                interaction.followUp({ content: `Método de punição alterado com sucesso!`, ephemeral: true })
            }
            if (interaction.customId === 'cargosimunesantiraid') {
                const botao = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("adicionarcargos_sistemaAntiRaid")
                        .setLabel('Adicionar Cargos')
                        .setEmoji(`1233110125330563104`)
                        .setStyle(3),
                    new ButtonBuilder()
                        .setCustomId("removercargos_sistemaAntiRaid")
                        .setLabel('Remover Cargos')
                        .setEmoji(`1242907028079247410`)
                        .setDisabled(!AntiRaid?.cargos?.length)
                        .setStyle(4),
                    new ButtonBuilder()
                        .setCustomId("voltar_sistemaAntiRaid")
                        .setLabel('Voltar')
                        .setEmoji(`1238413255886639104`)
                        .setStyle(2)
                )

                interaction.update({ components: [botao] })
            }
            if (interaction.customId === 'metodopunicao') {
                const botao = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`metodopunicao_Banir`)
                        .setLabel('Banir')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId(`metodopunicao_Expulsar`)
                        .setLabel('Expulsar')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId(`metodopunicao_RemoverCargos`)
                        .setLabel('Remover Cargos')
                        .setStyle(2),

                )

                const botao2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`voltar_sistemaAntiRaid`)
                        .setEmoji('1178068047202893869')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId(`voltar1`)
                        .setEmoji('1292237216915128361')
                        .setStyle(1)
                )

                interaction.update({ components: [botao, botao2] })
            }
            if (interaction.customId === 'voltar_sistemaAntiRaid') {
                sistemaAntiRaid(interaction, client)
            }
            if (interaction.customId === 'statusantiraid') {
                if (AntiRaid?.status) {
                    configuracao.set(`AutomaticSettings.sistemaAntiRaid.status`, false)
                } else {
                    configuracao.set(`AutomaticSettings.sistemaAntiRaid.status`, true)
                }
                sistemaAntiRaid(interaction, client)
            }
            if (interaction.customId === `statusconvitepersonalizado`) {
                if (AntiRaid?.convitepersonalizado) {
                    configuracao.set(`AutomaticSettings.sistemaAntiRaid.convitepersonalizado`, false)
                } else {
                    configuracao.set(`AutomaticSettings.sistemaAntiRaid.convitepersonalizado`, true)
                }
                sistemaAntiRaid(interaction, client)
            }
            if (interaction.customId === `canallogsantiraid`) {
                const botao = new ActionRowBuilder().addComponents(
                    new ChannelSelectMenuBuilder()
                        .setCustomId(`canallogsantiraid`)
                        .setMaxValues(1)
                        .setPlaceholder(`Selecione um canal de logs`)
                        .setChannelTypes(ChannelType.GuildText)
                )

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`voltarfunctioncanais_sistemaAntiRaid`)
                        .setLabel('Voltar')
                        .setEmoji('1178068047202893869')
                        .setStyle(2)
                )

                interaction.update({ components: [botao, row], embeds: [] })
            }
        }
        if (interaction.isChannelSelectMenu()) {
            if (interaction.customId === `canallogsantiraid`) {
                configuracao.set(`AutomaticSettings.sistemaAntiRaid.canallogs`, interaction.values[0])
                sistemaAntiRaid(interaction, client)
            }
        }
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'metodopunicaoantiraid') {
                let opcao = interaction.values[0]

                const modal = new ModalBuilder()
                    .setCustomId(`metodopunicaoantiraid_${opcao}`)
                    .setTitle(`Configuração Anti-Raid`)

                const status = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`status`)
                        .setLabel(`DESEJA ATIVAR A FUNÇÃO?`)
                        .setPlaceholder(`Digite: sim ou não`)
                        .setValue(AntiRaid?.[opcao]?.status ? `sim` : `não`)
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short)
                )

                const quantidadeporminuto = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`quantidadeporminuto`)
                        .setLabel(`QUANTIDADE POR MINUTO`)
                        .setPlaceholder(`Digite a quantidade de ação por minuto`)
                        .setValue(AntiRaid?.[opcao]?.quantidadeporminuto ? `${AntiRaid[opcao].quantidadeporminuto}` : `0`)
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short)
                )

                const quantidadeporhora = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`quantidadeporhora`)
                        .setLabel(`QUANTIDADE POR HORA`)
                        .setPlaceholder(`Digite a quantidade de ação por hora`)
                        .setValue(AntiRaid?.[opcao]?.quantidadeporhora ? `${AntiRaid[opcao].quantidadeporhora}` : `0`)
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short)
                )

                modal.addComponents(status, quantidadeporminuto, quantidadeporhora)
                await interaction.showModal(modal)
            }
        }
        if (interaction.type == InteractionType.ModalSubmit) {
            if (interaction.customId.startsWith(`metodopunicaoantiraid_`)) {
                let opcao = interaction.customId.split('_')[1]
                let status = interaction.fields.getTextInputValue(`status`)
                let quantidadeporminuto = interaction.fields.getTextInputValue(`quantidadeporminuto`)
                let quantidadeporhora = interaction.fields.getTextInputValue(`quantidadeporhora`)

                if (status.toLowerCase() == `sim`) {
                    status = true
                } else {
                    status = false
                }

                configuracao.set(`AutomaticSettings.sistemaAntiRaid.${opcao}.status`, status)

                if (isNaN(quantidadeporminuto)) {
                    await sistemaAntiRaid(interaction, client)
                    interaction.followUp({ content: `A quantidade por minuto deve ser um número!`, ephemeral: true })
                    return
                }

                if (isNaN(quantidadeporhora)) {
                    await sistemaAntiRaid(interaction, client)
                    interaction.followUp({ content: `A quantidade por hora deve ser um número!`, ephemeral: true })
                    return
                }

                if (parseInt(quantidadeporminuto) < 0) {
                    await sistemaAntiRaid(interaction, client)
                    interaction.followUp({ content: `A quantidade por minuto deve ser maior que 0!`, ephemeral: true })
                    return
                }

                if (parseInt(quantidadeporhora) < 0) {
                    await sistemaAntiRaid(interaction, client)
                    interaction.followUp({ content: `A quantidade por hora deve ser maior que 0!`, ephemeral: true })
                    return
                }


                configuracao.set(`AutomaticSettings.sistemaAntiRaid.${opcao}.quantidadeporminuto`, parseInt(quantidadeporminuto))
                configuracao.set(`AutomaticSettings.sistemaAntiRaid.${opcao}.quantidadeporhora`, parseInt(quantidadeporhora))

                await sistemaAntiRaid(interaction, client)
            }
        }
    }
}