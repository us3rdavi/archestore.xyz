const { ActionRowBuilder, TextInputBuilder, TextInputStyle, InteractionType, ModalBuilder, EmbedBuilder, ButtonBuilder } = require("discord.js");
const { configuracao, Emojis } = require("../DataBaseJson");



async function FormasDePagamentos(interaction) {

    const embed = new EmbedBuilder()
        .setTitle(`${Emojis.get('dream')} Configurar Formas de Pagamento`)
        .setDescription(`Configure, habilite e desabilite as formas de pagamento disponíveis por aqui.`)
        .setFields(
            { name: `Mercado Pago`, value: `${configuracao.get("pagamentos.MpOnOff") != true ? `${Emojis.get(`negative_emoji`)} \`Desabilitado\`` : `${Emojis.get(`confirmed_emoji`)} \`Habilitado\``}\n${configuracao.get("pagamentos.MpAPI") != "" ? `${Emojis.get(`confirmed_emoji`)} \`Configurado\`` : `${Emojis.get(`negative_emoji`)} \`Não configurado\``}`, inline: true },
            { name: `Efi Bank`, value: `${configuracao.get("pagamentos.EfiOnOff") != true ? `${Emojis.get(`negative_emoji`)} \`Desabilitado\`` : `${Emojis.get(`confirmed_emoji`)} \`Habilitado\``}\n${configuracao.get("pagamentos.EfiAPI") != "" ? `${Emojis.get(`confirmed_emoji`)} \`Configurado\`` : `${Emojis.get(`negative_emoji`)} \`Não configurado\``}`, inline: true },
            { name: `Litecoin Wallet`, value: `${Emojis.get(`negative_emoji`)} \`Desabilitado\`\n${Emojis.get(`negative_emoji`)} \`Não configurado\``, inline: true },
            { name: `Stripe`, value: `${Emojis.get(`negative_emoji`)} \`Desabilitado\`\n${Emojis.get(`negative_emoji`)} \`Não configurado\``, inline: true },
            { name: `Pix Manual`, value: `${configuracao.get("pagamentos.SemiAutomatico.status") != true ? `${Emojis.get(`negative_emoji`)} \`Desabilitado\`` : `${Emojis.get(`confirmed_emoji`)} \`Habilitado\``}\n${configuracao.get("pagamentos.SemiAutomatico.pix") != null ? `${Emojis.get(`confirmed_emoji`)} \`Configurado\`` : `${Emojis.get(`negative_emoji`)} \`Não configurado\``}`, inline: true }
        )
        .setColor(`${configuracao.get(`Cores.Principal`) == null ? '#5865F2' : configuracao.get('Cores.Principal')}`)
        .setFooter(
            { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) }
        )
        .setTimestamp()


    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configurarmercadopago")
            .setLabel('Configurar Mercado Pago')
            .setEmoji(`<:_mp_emoji:1371605520514814033>`)
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("configurarefibank")
            .setLabel('Configurar Efi Bank')
            .setEmoji(`<:_efi_emoji:1371605407944016006>`)
            .setStyle(1),
    )

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("formasdepagamentos")
            .setLabel('Configurar Litecoin Wallet')
            .setEmoji(`1371607408643805314`)
            .setDisabled(true)
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("ConfigStripe")
            .setLabel('Configurar Stripe')
            .setEmoji(`1371607561228517467`)
            .setDisabled(true)
            .setStyle(1),

    )

    const row4 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("ConfigurarPagamentoManual")
            .setLabel('Configurar Pagamento Manual')
            .setEmoji(`1371570928537829398`)
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("voltaradawdwa")
            .setLabel('Voltar')
            .setEmoji(`1371580877598887996`)
            .setStyle(2),
    )

    await interaction.update({ content: ``, embeds: [embed], ephemeral: true, components: [row2, row3, row4] })
}
async function EfiBankConfiguracao(client, interaction, a) {

    const embed = new EmbedBuilder()
        .setTitle(`Configurar Efi Bank - ${configuracao.get("pagamentos.EfiOnOff") ? `HABILITADO` : `DESABILITADO`}`)
        .setDescription(`Aqui, você pode configurar tudo referente ao Efi Bank.`)
        .setColor(`${configuracao.get(`Cores.Principal`) == null ? '#5865F2' : configuracao.get('Cores.Principal')}`)


    if (configuracao.get("pagamentos.EfiAPI.client_id")) {
        embed.addFields(
            { name: `${Emojis.get(`confirmed_emoji`)} Vinculado`, value: `Sua aplicação da Efi Bank está vinculada a seu Epro Bot.`, inline: true },
            { name: `Chave PIX`, value: `\`${configuracao.get(`pagamentos.EfiAPI.chavepix`)}\``, inline: false },
        )
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`alterarcredenciais`)
            .setLabel(`Alterar Credenciais`)
            .setEmoji(`<:Sync:1347378353124147232>`)
            .setStyle(2),
        new ButtonBuilder()
            .setURL(`https://www.youtube.com/watch?v=DKyFF65McYQ`)
            .setLabel(`Ver Tutorial`)
            .setEmoji(`<:1345588774423367825:1350658400580800624>`)
            .setStyle(5),
        new ButtonBuilder()
            .setCustomId(`efionoff`)
            .setLabel(`${configuracao.get("pagamentos.EfiOnOff") ? `Desabilitar` : `Habilitar`}`)
            .setEmoji(`<:1317972026564153509:1350658971605667921>`)
            .setDisabled(configuracao.get("pagamentos.EfiAPI") ? false : true)
            .setStyle(configuracao.get("pagamentos.EfiOnOff") ? 4 : 3),
    )

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`formasdepagamentos`)
            .setLabel(`Voltar`)
            .setEmoji(`1238413255886639104`)
            .setStyle(2),
    )

    if (a != 1) {
        await interaction.update({ content: ``, embeds: [embed], components: [row, row2], ephemeral: true })
    } else {
        await interaction.editReply({ content: ``, embeds: [embed], components: [row, row2], ephemeral: true })
    }
}

module.exports = {
    FormasDePagamentos,
    EfiBankConfiguracao
}