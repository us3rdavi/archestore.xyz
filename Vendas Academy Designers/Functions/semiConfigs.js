const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao } = require("../DataBaseJson")

async function semiConfigs(interaction, client) {

    const embed = new EmbedBuilder()
        .setColor(`${configuracao.get(`Cores.Principal`) == null ? '0cd4cc' : configuracao.get('Cores.Principal')}`)
        .setTitle(`Configurar Pagamento Manual - ${configuracao.get("pagamentos.SemiAutomatico.status") == false ? "Desabilitado" : "Habilitado"}`)
        .setDescription(`Aqui, você pode definir uma chave Pix e uma mensagem para o seu ${client.user.username} enviar quando a forma de pagamento "Pix" for selecionada. Ele irá gerar um QR Code com o valor exato do carrinho para essa chave. Lembre-se de que ele não consegue verificar se o pagamento foi aprovado, então você precisará clicar em "Confirmar pagamento" para iniciar o processo de entrega.`)
        .addFields(
            {
                name: `Chave PIX`, value: `${configuracao.get("pagamentos.SemiAutomatico.pix") == null ? "Não configurado" : configuracao.get("pagamentos.SemiAutomatico.pix")}`
            },
            {
                name: `Mensagem De Auxílio`, value: `${configuracao.get("pagamentos.SemiAutomatico.msg") == null ? "Não configurado" : configuracao.get("pagamentos.SemiAutomatico.msg")}`
            }
        )
        .setFooter({ text: `Aviso: Manter esta função habilitada sobrescreverá a função automática do Mercado Pago.`, iconURL: interaction.guild.iconURL() })
        .setTimestamp()

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`editConfigSemi`).setLabel(`Editar Configurações`).setEmoji(`1246953149009367173`).setStyle(1),
            new ButtonBuilder().setCustomId(`onOffSemi`).setLabel(configuracao.get("pagamentos.SemiAutomatico.status") != false ? "Desabilitar" : "Habilitar").setEmoji(`1246953228655132772`).setStyle(configuracao.get("pagamentos.SemiAutomatico.status") != false ? 4 : 3)
        )

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("formasdepagamentos")
                .setEmoji(`1238413255886639104`)
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId(`voltar1`)
                .setEmoji('1292237216915128361')
                .setStyle(1)
        )

    interaction.editReply({ content: ``, embeds: [embed], components: [row1, row2] })

}

module.exports = {
    semiConfigs
}