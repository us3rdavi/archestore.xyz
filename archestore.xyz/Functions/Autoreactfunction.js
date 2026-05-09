const {
    ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao } = require("../Database");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function autoreact24(interaction, client) {
    const autoReactStatus = configuracao.get('AutoReact.status') || false;
    const autoReactEmoji = configuracao.get('AutoReact.Emoji') || "Não Definido";
    const autoReactCanais = configuracao.get('AutoReact.Canais') || ["Não Definido"];

    const atualstatus = configuracao.get("AutoReact.status");
    const mudarstatus = !atualstatus;

    const botaostyolo = mudarstatus ? 4 : 3;
    const botaoemoji = mudarstatus ? "1248300875978641419" : "1248300851282579552";

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## Auto Reação — Sistema\n` +
            `**Status:** \`${autoReactStatus ? "Ligado" : "Desligado"}\`\n` +
            `**Emoji:** ${autoReactEmoji}\n` +
            `**Canais:** \`${autoReactCanais.join(", ")}\``
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const row24 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`${interaction.user.id}_onoff`)
            .setEmoji(botaoemoji)
            .setStyle(botaostyolo),
        new ButtonBuilder()
            .setCustomId("configautoreact")
            .setLabel("Configurar Auto Reação")
            .setEmoji("<:_fixe_emoji:1501804030605922346>")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("resetautoreact")
            .setLabel("Resetar Configuração")
            .setEmoji("<:_trash_emoji:1501803926180335727>")
            .setStyle(4),
        new ButtonBuilder()
            .setCustomId("atualizarembed24")
            .setLabel("Aplicar alterações")
            .setEmoji("<:_fixe_emoji:1501804030605922346>")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("eaffaawwawa")
            .setEmoji("1178068047202893869")
            .setLabel('Voltar')
            .setStyle(2)
    );

    container.addActionRowComponents(row24);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

module.exports = { autoreact24 };
