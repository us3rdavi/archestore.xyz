const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao } = require("../DataBaseJson");

async function autoreact24(interaction, client) {
    const autoReactStatus = configuracao.get(`AutoReact.status`) || false;
    const autoReactEmoji = configuracao.get(`AutoReact.Emoji`) || "Não Definido";
    const autoReactCanais = configuracao.get(`AutoReact.Canais`) || ["Não Definido"];

    const atualstatus = configuracao.get("AutoReact.status");
    const mudarstatus = !atualstatus;

    const botaostyolo = mudarstatus ? 4 : 3;
    const botaoemoji = mudarstatus ? "1248300875978641419" : "1248300851282579552";

    const embed = new EmbedBuilder()
    .setColor(`${configuracao.get('Cores.Principal') || '0cd4cc'}`)
    .setTitle("Auto Reação - Sistema")
    .setAuthor({ name: "Auto Reação - Sistema", iconURL: 'https://cdn.discordapp.com/emojis/1269773226960093184.png?size=2048' })
    .setDescription("`**Sistema de auto reação configurável.**")
    .addFields(
        { name: `**Status**`, value: `\`\`${autoReactStatus ? "Desligado" : "Ligado"}\`\``, inline: true },
                    { name: `**Emoji**`, value: `${autoReactEmoji}`, inline: true },
        { name: `**Canais**`, value: `\`\`${autoReactCanais.join(", ")}\`\``, inline: true },
    )
    .setFooter({ text: "Auto Reação", iconURL: 'https://cdn.discordapp.com/emojis/1242617727911460933.gif?size=2048' })
    .setTimestamp();

const row24 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId(`${interaction.user.id}_onoff`)
        .setEmoji(botaoemoji)
        .setStyle(botaostyolo),
        new ButtonBuilder()
        .setCustomId("configautoreact")
        .setLabel("Configurar Auto Reação")
        .setStyle(2)
        .setEmoji("<:_fixe_emoji:1371605411777482803>"),
    new ButtonBuilder()
        .setCustomId("resetautoreact")
        .setLabel("Resetar Configuração")
        .setStyle(4)
        .setEmoji("<:_trash_emoji:1371605645597478953>"),
    new ButtonBuilder()
        .setCustomId("atualizarembed24")
        .setLabel("Aplicar alterações")
        .setStyle(2)
        .setEmoji("<:_fixe_emoji:1371605411777482803>"),
    new ButtonBuilder()
        .setCustomId("eaffaawwawa")
        .setEmoji("1178068047202893869")
        .setLabel('Voltar')
        .setStyle(2)
);

await interaction.update({ embeds: [embed], content: ``, ephemeral: true, components: [row24] });
}

module.exports = {
    autoreact24
};
