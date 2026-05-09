const {
    ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao } = require("../DataBaseJson");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function semiConfigs(interaction, client) {
    const isEnabled = configuracao.get("pagamentos.SemiAutomatico.status") !== false;
    const chavePix = configuracao.get("pagamentos.SemiAutomatico.pix") || "Não configurado";
    const msgAuxilio = configuracao.get("pagamentos.SemiAutomatico.msg") || "Não configurado";

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## Configurar Pagamento Manual — \`${isEnabled ? 'Habilitado' : 'Desabilitado'}\`\n` +
            `Defina uma chave Pix e uma mensagem que o **${client.user.username}** enviará quando o pagamento "Pix" for selecionado.\n` +
            `-# Aviso: Manter esta função habilitada sobrescreverá a função automática do Mercado Pago.\n\n` +
            `**Chave PIX:** \`${chavePix}\`\n` +
            `**Mensagem de Auxílio:** ${msgAuxilio}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('editConfigSemi')
            .setLabel('Editar Configurações')
            .setEmoji('1246953149009367173')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('onOffSemi')
            .setLabel(isEnabled ? "Desabilitar" : "Habilitar")
            .setEmoji('1246953228655132772')
            .setStyle(isEnabled ? 4 : 3)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("formasdepagamentos")
            .setEmoji('1238413255886639104')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('voltar1')
            .setEmoji('1501803928973476023')
            .setStyle(1)
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(row2);

    interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

module.exports = { semiConfigs }
