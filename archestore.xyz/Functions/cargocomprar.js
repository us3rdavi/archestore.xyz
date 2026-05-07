const { ApplicationCommandType, EmbedBuilder, Webhook, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");

const { JsonDatabase } = require("wio.db");

const { configuracao } = require("../DataBaseJson");



async function configrole24(interaction, client) {



    const configrole24 = configuracao.get(`ConfigRoles.statuscomprar`) || false;

    

    const embed = new EmbedBuilder()

    .setAuthor({ name: `${interaction.guild.name}`, iconURL: `https://cdn.discordapp.com/attachments/1345901017513853010/1350680766903746590/dreamapps-ezgif.com-video-to-gif-converter.gif?ex=67d79efd&is=67d64d7d&hm=18e792aedd90fd83b2afa151ce3894b6c3fab6fbd7fe981c9e0b2fce29a08b42&` })

    .setDescription(`Configurações do cargo que pode abrir carrinho:\n\n**Cargo necessario:** <@&${configuracao.get("ConfigRoles.cargocarrinho") || `\`Não definido\`` }>\n\n**Link de verificação:** \`\`\`${configuracao.get("ConfigLinks.link") || `Não definido` }\`\`\``)

    .addFields(

        { name: `Status:`, value: `\`\`\`${configrole24 ? 'On' : 'Off'}\`\`\`` }

    )

    .setTimestamp();



    const row2 = new ActionRowBuilder().addComponents(

        new ButtonBuilder()

        .setCustomId("onoffcargo24")

        .setLabel(configrole24 ? "On" : "Off")

        .setEmoji(configrole24 ? "1371568433321214092" : "1371569230901936258")

        .setStyle(configrole24 ? 3 : 4),

        new ButtonBuilder()

        .setCustomId("configurarcargocomprar")

        .setLabel("Configurar Cargo")

        .setEmoji("1371605431868457032")

        .setStyle(1),

        new ButtonBuilder()

        .setCustomId("configurarlink")

        .setLabel("Configurar Link")

        .setEmoji("1371605431868457032")

        .setStyle(2),

        new ButtonBuilder()

        .setCustomId("voltar1")

        .setLabel('Voltar')

        .setEmoji("1371605354605051996")

        .setStyle(2)

        .setDisabled(false),

    );



    await interaction.update({ embeds: [embed], content: '', components: [row2] });

}





module.exports = {

    configrole24

}