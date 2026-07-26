const {
    ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../Database");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function FormasDePagamentos(interaction) {
    const mpOn = configuracao.get("pagamentos.MpOnOff") === true;
    const mpConfig = configuracao.get("pagamentos.MpAPI") !== "";
    const efiOn = configuracao.get("pagamentos.EfiOnOff") === true;
    const efiConfig = configuracao.get("pagamentos.EfiAPI") !== "";
    const semiOn = configuracao.get("pagamentos.SemiAutomatico.status") === true;
    const semiConfig = configuracao.get("pagamentos.SemiAutomatico.pix") !== null;

    const ok = Emojis.get('confirmed_emoji');
    const no = Emojis.get('negative_emoji');

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('dream')} Formas de Pagamento\nConfigure, habilite e desabilite as formas de pagamento disponíveis.\n\n` +
            `**Mercado Pago:** ${mpOn ? `${ok} \`Habilitado\`` : `${no} \`Desabilitado\``} | ${mpConfig ? `${ok} \`Configurado\`` : `${no} \`Não configurado\``}\n` +
            `**Efi Bank:** ${efiOn ? `${ok} \`Habilitado\`` : `${no} \`Desabilitado\``} | ${efiConfig ? `${ok} \`Configurado\`` : `${no} \`Não configurado\``}\n` +
            `**Litecoin Wallet:** ${no} \`Desabilitado\` | ${no} \`Não configurado\`\n` +
            `**Stripe:** ${no} \`Desabilitado\` | ${no} \`Não configurado\`\n` +
            `**Pix Manual:** ${semiOn ? `${ok} \`Habilitado\`` : `${no} \`Desabilitado\``} | ${semiConfig ? `${ok} \`Configurado\`` : `${no} \`Não configurado\``}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configurarmercadopago")
            .setLabel('Configurar Mercado Pago')
            .setEmoji('<:_mp_emoji:1501803979456122884>')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("configurarefibank")
            .setLabel('Configurar Efi Bank')
            .setEmoji('<:_efi_emoji:1501803976465584179>')
            .setStyle(1),
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("formasdepagamentos")
            .setLabel('Configurar Litecoin Wallet')
            .setEmoji('1501804030605922346')
            .setDisabled(true)
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("ConfigStripe")
            .setLabel('Configurar Stripe')
            .setEmoji('1501804030605922346')
            .setDisabled(true)
            .setStyle(1),
    );

    const row4 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("ConfigurarPagamentoManual")
            .setLabel('Configurar Pagamento Manual')
            .setEmoji('1501804000994132080')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("voltaradawdwa")
            .setLabel('Voltar')
            .setEmoji('1501804013262475275')
            .setStyle(2),
    );

    container.addActionRowComponents(row2);
    container.addActionRowComponents(row3);
    container.addActionRowComponents(row4);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

async function EfiBankConfiguracao(client, interaction, a) {
    const isLinked = !!configuracao.get("pagamentos.EfiAPI.client_id");
    const isOn = configuracao.get("pagamentos.EfiOnOff");
    const chavepix = configuracao.get('pagamentos.EfiAPI.chavepix');

    const container = new ContainerBuilder();
    container;

    let desc =
        `## ${Emojis.get('_efi_emoji')} Configurar Efi Bank\n` +
        `**Status:** \`${isOn ? 'HABILITADO' : 'DESABILITADO'}\`\n\n` +
        `Aqui você pode configurar tudo referente ao Efi Bank.`;

    if (isLinked) {
        desc += `\n\n${Emojis.get('confirmed_emoji')} **Vinculado** — Sua aplicação da Efi Bank está vinculada ao bot.\n**Chave PIX:** \`${chavepix}\``;
    }

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(desc)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('alterarcredenciais')
            .setLabel('Alterar Credenciais')
            .setEmoji({ id: '1501803920576745522' }) // _change_emoji
            .setStyle(2),
        new ButtonBuilder()
            .setURL('https://www.youtube.com/watch?v=DKyFF65McYQ')
            .setLabel('Ver Tutorial')
            .setEmoji({ id: '1501803944375222392' }) // information_emoji
            .setStyle(5),
        new ButtonBuilder()
            .setCustomId('efionoff')
            .setLabel(isOn ? 'Desabilitar' : 'Habilitar')
            .setEmoji({ id: '1501804000994132080' }) // _tool_emoji
            .setDisabled(!configuracao.get("pagamentos.EfiAPI"))
            .setStyle(isOn ? 4 : 3),
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('formasdepagamentos')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' }) // _back_emoji
            .setStyle(2),
    );

    container.addActionRowComponents(row);
    container.addActionRowComponents(row2);

    const payload = {
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    };

    if (a != 1) {
        await interaction.update(payload);
    } else {
        await interaction.editReply(payload);
    }
}

module.exports = { FormasDePagamentos, EfiBankConfiguracao }
