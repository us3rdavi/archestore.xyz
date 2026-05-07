const { EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { produtos, configuracao, Emojis } = require("../DataBaseJson");
const startTime = Date.now();
const maxMemory = 100;
const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
const memoryUsagePercentage = (usedMemory / maxMemory) * 100;
const roundedPercentage = Math.min(100, Math.round(memoryUsagePercentage));

async function Painel(interaction, client, config = { email: "" }) {  // Valor padrão para config
  try {
    const status = configuracao.get("vendasstatus") || false;

    // Verifica se config.email existe, senão usa string vazia
    const userEmail = config?.email || "usuário";

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("onoffvendas")
          .setLabel(status ? "Desativar Loja" : "Ativar Loja")
          .setEmoji("1371605368827940875")
          .setStyle(status ? 4 : 3),
        new ButtonBuilder()
          .setCustomId("painelconfigvendas")
          .setLabel('Loja')
          .setEmoji("1371593620515328114")
          .setStyle(1),
        new ButtonBuilder()
          .setCustomId("painelconfigticket")
          .setLabel("Central de Atendimento")
          .setEmoji("1371593631328243713")
          .setStyle(1)
          .setDisabled(false),
        new ButtonBuilder()
          .setCustomId("painelpersonalizar")
          .setLabel('Meu Bot Designer')
          .setEmoji("1371577449321726002")
          .setStyle(1),
      );

    const row3 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("gerenciarconfigs")
          .setLabel('Definiçôes')
          .setEmoji("1371571230041178125")
          .setStyle(2),
        new ButtonBuilder()
          .setCustomId("permcomprar")
          .setLabel("Autorização")
          .setEmoji("1371577447031640124")
          .setStyle(2)
          .setDisabled(false),
        new ButtonBuilder()
          .setCustomId("configavançadas24")
          .setLabel('Proteção')
          .setEmoji("1371593625112285208")
          .setStyle(2),
      );
    
    const row4 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("eaffaawwawa")
          .setLabel('Automações')
          .setEmoji("1371572539213611090")
          .setStyle(2),
        new ButtonBuilder()
          .setCustomId("actionsautomations")
          .setLabel('Moderação')
          .setEmoji("1371593631328243713")
          .setStyle(2),
      );

      await interaction.editReply({ 
        content: `https://cdn.discordapp.com/attachments/1384354103701798912/1384381565534077039/logo.gif?ex=6852394d&is=6850e7cd&hm=8b38a1ce88a9d98c9be56f67090348b73a7a3eaded106871bcf821da2c76d990&`,
        components: [row2, row3, row4] 
      });

  } catch (error) {
    console.error("Erro na função Painel:", error);
    await interaction.editReply("❌ Ocorreu um erro ao carregar o painel.");
  }
}

async function Gerenciar2(interaction, client) {

  const ggg = produtos.valueArray();

  const embed = new EmbedBuilder()
    .setColor(`${configuracao.get(`Cores.Principal`) == null ? '#660f7e' : configuracao.get('Cores.Principal')}`)
    .setImage("https://cdn.discordapp.com/attachments/1384354103701798912/1384381565534077039/logo.gif?ex=6852394d&is=6850e7cd&hm=8b38a1ce88a9d98c9be56f67090348b73a7a3eaded106871bcf821da2c76d990&")
    .setTitle(`${Emojis.get('dream')} - **Painel De Administração**`)
    .setDescription(`Senhor(a) **${interaction.user.username}**, escolha o que deseja fazer.`)
    .addFields(
      { name: `**${Emojis.get(`deliveredorder_emoji`)} Total de produtos fornecidos**`, value: `${ggg.length}` },
      { name: `**${Emojis.get(`brand_emoji`)} Moeda Padrão**`, value: `${configuracao.get("pagamentos.moeda") === "BRL" ? "\`BRL\` - \`pt_BR\`" : "\`USD\` - \`es_CO\`"}` }
    )
    .setFooter(
      { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null }
    )
    .setTimestamp()


  if (configuracao.get(`Instrucoes.mensagem`)) {
    let instruções = configuracao.get(`Instrucoes`)
    embed.addFields({ name: `Instruções ao Cliente`, value: `-# Mensagem Após a Entrega\n${instruções.mensagem}\n-# Nome do Botão:\n${instruções.nomebotao}\n-# Link do Botão:\n${instruções.linkbotao}` })
  }



  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("criarrrr")
        .setLabel('Criar')
        .setEmoji("1371593623514124510")
        .setStyle(1),
      new ButtonBuilder()
        .setCustomId("gerenciarotemae")
        .setLabel('Gerenciar')
        .setEmoji("1371593617868591185")
        .setStyle(1),
      new ButtonBuilder()
        .setCustomId("gerenciarposicao")
        .setLabel('Posições')
        .setEmoji("1371593619584192613")
        .setStyle(1)
    )

  const row3 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("marca-qrcode")
        .setLabel("Marca")
        .setEmoji("1371593616325218334")
        .setStyle(1),
      new ButtonBuilder()
        .setCustomId(`altMoeda`)
        .setLabel(`Moeda`)
        .setEmoji("1371593627477737502")
        .setStyle(1),
      new ButtonBuilder()
        .setCustomId(`${interaction.user.id}_discohookconfig`)
        .setLabel("Termos")
        .setEmoji("1371593612386635887")
        .setStyle(1),
      new ButtonBuilder()
        .setCustomId(`extensoes`)
        .setLabel(`Extensões`)
        .setEmoji("1371593612277710890")
        .setDisabled(true)
        .setStyle(1),
    )

  const row4 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("definirinstrucoes")
      .setLabel(`instruções Para o Cliente`)
      .setEmoji("1371593624852234280")
      .setStyle(2),
    new ButtonBuilder()
      .setCustomId("definirduvidas")
      .setLabel(`Botão de Dúvidas`)
      .setEmoji("1371593631328243713")
      .setStyle(2),
  )

  const row5 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId("rendimento")
        .setLabel('Registros De Vendas')
        .setEmoji("1371593628069396591")
        .setStyle(2),
  )
  
  const botoesvoltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltar00")
      .setEmoji("1371593637179297923")
      .setStyle(2),
    new ButtonBuilder()
      .setCustomId(`voltar1`)
      .setEmoji("1371580875615113307")
      .setDisabled(true)
      .setStyle(1)
  )



  await interaction.editReply({ embeds: [embed], components: [row2, row3, row4, row5, botoesvoltar], content: `` })
}

async function definirduvidas(interaction, client) {

  let infoduvidas = configuracao.get(`BotaoDuvidas`) // 

  const embed = new EmbedBuilder()
    .setColor(`${configuracao.get(`Cores.Principal`) == null ? '#660f7e' : configuracao.get('Cores.Principal')}`)
    .setTitle(`${Emojis.get('dream')} - Botão de Dúvidas`)
    .setDescription(`Senhor(a) **${interaction.user.username}**, configure o botão de dúvidas.`)
    .addFields(
      { name: `Nome do Botão`, value: `\`${infoduvidas?.nomebotao ? infoduvidas.nomebotao : `Não Defindo`}\``, inline: true },
      { name: `Emoji do Botão`, value: `${infoduvidas?.emoji ? infoduvidas.emoji : `\`Sem Emoji\``}`, inline: true },
      { name: `Link do Botão`, value: `${infoduvidas?.linkbotao ? infoduvidas.linkbotao : `\`Não Defindo\``}`, inline: true },
    )
    .setFooter(
      { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null }
    )
    .setTimestamp()

  const botao = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ativarbotaoduvidas')
      .setLabel(`${infoduvidas?.status ? `Botão Ativado` : `Botão Desativado`} `)
      .setEmoji(Emojis.get(`_transfer_emoji`))
      .setStyle(infoduvidas?.status ? 3 : 4),
    new ButtonBuilder()
      .setCustomId('botaoduvidas')
      .setLabel('Definir botão de dúvidas')
      .setEmoji(Emojis.get(`_staff_emoji`))
      .setStyle(2),
  )

  const botao2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("voltar3")
      .setEmoji(`1238413255886639104`)
      .setStyle(2),
    new ButtonBuilder()
      .setCustomId(`voltar1`)
      .setEmoji('1371580875615113307')
      .setStyle(1)
  )

  await interaction.update({ embeds: [embed], components: [botao, botao2], content: `` })
}

function getGreeting() {
  const now = new Date();
  const brtHours = (now.getUTCHours() - 3 + 24) % 24; // Ajuste de UTC para BRT

  if (brtHours >= 18 || brtHours < 4) {
    return 'Boa noite';
  } else if (brtHours >= 12) {
    return 'Boa tarde';
  } else {
    return 'Bom dia';
  }
}


module.exports = {
  Painel,
  Gerenciar2,
  definirduvidas
}
