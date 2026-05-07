const { PermissionFlagsBits, EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const startTime = Date.now();
const maxMemory = 100;
const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
const memoryUsagePercentage = (usedMemory / maxMemory) * 100;
const roundedPercentage = Math.min(100, Math.round(memoryUsagePercentage));
const { Painel } = require("../../Functions/Painel");
const { pedidos, pagamentos, carrinhos, configuracao, produtos } = require("../../DataBaseJson");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
  name: "aprovar",
  description:"Use para aprovar um pagamento",
  type: ApplicationCommandType.ChatInput,
  default_member_permissions: PermissionFlagsBits.Administrator,

  run: async (client, interaction, message) => {

    const perm = await getPermissions(client.user.id)
    if (perm === null || !perm.includes(interaction.user.id)) {
      return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Faltam permissões.`, ephemeral: true });
    }

    if (carrinhos.has(interaction.channel.id) == false) return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Não há um carrinho aberto neste canal.`, ephemeral: true })


    const yy = await carrinhos.get(interaction.channel.id)

    const hhhh = produtos.get(`${yy.infos.produto}.Campos`)
    const gggaaa = hhhh.find(campo22 => campo22.Nome === yy.infos.campo)


    let valor = 0

    if (yy.cupomadicionado !== undefined) {
      const valor2 = gggaaa.valor * yy.quantidadeselecionada

      const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`)
      const gggaaaawdwadwa = hhhh2.find(campo22 => campo22.Nome === yy.cupomadicionado)
      valor = valor2 * (1 - gggaaaawdwadwa.desconto / 100);
    } else {
      valor = gggaaa.valor * yy.quantidadeselecionada
    }




    const mandanopvdocara = new EmbedBuilder()
      .setColor(`${configuracao.get(`Cores.Processamento`) == null ? `#fcba03` : configuracao.get(`Cores.Processamento`)}`)
      .setTitle(`${Emojis.get(`neworder_emoji`)} Pedido solicitado`)
      .setFooter(
        { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null }
      )
      .setTimestamp()
      .setDescription(`Seu pedido foi criado e agora está aguardando a confirmação do pagamento`)
      .addFields(
        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
        { name: `Forma de Pagamento`, value: `\`Pix - Aprovando Manualmente\`` }
      )

    try {
      await interaction.user.send({ embeds: [mandanopvdocara] })
    } catch (error) {

    }



    const dsfjmsdfjnsdfj = new EmbedBuilder()
      .setColor(`${configuracao.get(`Cores.Processamento`) == null ? `#fcba03` : configuracao.get(`Cores.Processamento`)}`)
      .setTitle(`${Emojis.get(`neworder_emoji`)} Pedido solicitado`)
      .setDescription(`Usuário ${interaction.user} solicitou um pedido.`)
      .addFields(
        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
        { name: `**Forma de pagamento**`, value: `\`Pix - Aprovando Manualmente\`` }
      )
      .setFooter(
        { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null }
      )
      .setTimestamp()





    try {
      const channela = await client.channels.fetch(configuracao.get(`ConfigChannels.logpedidos`));
      await channela.send({ embeds: [dsfjmsdfjnsdfj] }).then(yyyyy => {
        carrinhos.set(`${interaction.channel.id}.replys`, { channelid: yyyyy.channel.id, idmsg: yyyyy.id })
      })
    } catch (error) {

    }

    pagamentos.set(`${interaction.channel.id}`, { pagamentos: { id: `Aprovado Manualmente`, method: `pix`, data: Date.now() } })
    interaction.reply({ content: `${Emojis.get(`confirmed_emoji`)} Pagamento aprovado manualmente. Aguarde..`, ephemeral: true })

  }
}
