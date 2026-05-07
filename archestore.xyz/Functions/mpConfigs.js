const {
    ActionRowBuilder, TextInputBuilder, TextInputStyle, InteractionType, ModalBuilder,
    ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis, refounds } = require("../DataBaseJson");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function mpConfigs(interaction) {
    const blockedBanksArray = configuracao.get('pagamentos.BancosBloqueados') || [];
    const BancosBloqueados = blockedBanksArray.map(bank => `${bank}`).join(', ');

    const mpAPIValue = configuracao.get('pagamentos.MpAPI');
    const maskedMpAPI = mpAPIValue && mpAPIValue !== ''
        ? `\`${mpAPIValue.slice(0, 30) + '*****************'}\``
        : `\`APP_USR-000000000000000-XXXXXXX\``;

    const pixStatus = configuracao.get('pagamentos.MpOnOff');
    const siteStatus = configuracao.get('pagamentos.MpSite');

    const container = new ContainerBuilder();
    container.setAccentColor(getAccentColor());

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## Configurar Mercado Pago\n` +
        `Aqui você pode configurar tudo referente ao Mercado Pago: token, autorização, bancos bloqueados e formas de pagamento.\n\n` +
        `${Emojis.get('pix_stamp_emoji')} **PIX:** ${pixStatus ? `${Emojis.get('confirmed_emoji')} Ativo` : `${Emojis.get('negative_emoji')} Desabilitado`}\n` +
        `${Emojis.get('card_stamp_emoji')} **Site:** ${siteStatus ? `${Emojis.get('confirmed_emoji')} Ativo` : `${Emojis.get('negative_emoji')} Desabilitado`}\n` +
        `${Emojis.get('brand_emoji')} **Tempo para pagar:** ${Emojis.get('clock_emoji')} ${configuracao.get('ConfigCarrinho.inatividade')} minutos\n` +
        `${Emojis.get('_mp_emoji')} **Access Token:** *Não compartilhe com ninguém*\n${maskedMpAPI}\n` +
        `${Emojis.get('_fixe_emoji')} **Bancos Bloqueados:** ${blockedBanksArray.length <= 0 ? 'Nenhum' : `\`${BancosBloqueados}\``}`
    ));

    container.addSeparatorComponents(new SeparatorBuilder());

    const fernandona1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("onOffMp")
            .setLabel(pixStatus ? 'Pix ativado' : 'Pix desativado')
            .setEmoji(Emojis.get('_transfer_emoji'))
            .setStyle(pixStatus ? 3 : 4),
        new ButtonBuilder()
            .setCustomId("alterarSiteMp")
            .setLabel(siteStatus ? 'Site ativado' : 'Site desativado')
            .setEmoji(Emojis.get('_transfer_emoji'))
            .setStyle(siteStatus ? 3 : 4),
        new ButtonBuilder()
            .setCustomId("automaticTempo")
            .setLabel('Alterar Tempo para Pagar')
            .setEmoji('1229787808936230975')
            .setStyle(2),
    );

    const selectmenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('configurarmpselect')
            .setPlaceholder('Configure o recebimento pelo Mercado Pago')
            .setMaxValues(1)
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Alterar Access Token').setValue('alterarAccessToken').setDescription('Configure o token de acesso do Mercado Pago').setEmoji(Emojis.get('_mp_emoji')),
                new StringSelectMenuOptionBuilder().setLabel('Bloquear Banco').setValue('bloquearBanco').setDescription('Bloqueie bancos específicos de depositarem').setEmoji('1244438113368150061'),
                new StringSelectMenuOptionBuilder().setLabel('Bloquear Usuário').setValue('bloquearUsuario').setDescription('Bloqueie usuários específicos de depositarem').setEmoji(Emojis.get('_silueta_emoji')),
            )
    );

    const fernandona3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("formasdepagamentos").setEmoji('1238413255886639104').setStyle(2),
        new ButtonBuilder().setCustomId('voltar1').setEmoji('1292237216915128361').setStyle(1)
    );

    container.addActionRowComponents(fernandona1);
    container.addActionRowComponents(selectmenu);
    container.addActionRowComponents(fernandona3);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        embeds: [],
        content: ''
    });
}

async function BloquearConta(client, interaction) {
    let contas = configuracao.get('pagamentos.ContasBloqueados') || [];

    const container = new ContainerBuilder();
    container.setAccentColor(getAccentColor());

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## Contas Bloqueadas\nConfigure as contas que serão bloqueadas no sistema de pagamento Mercado Pago.\n\n` +
        `**Contas bloqueadas:** ${contas.length === 0 ? 'Nenhuma' : contas.map(c => `\`${c}\``).join(', ')}`
    ));

    container.addSeparatorComponents(new SeparatorBuilder());

    const selectmenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('bloquearcontaselect')
            .setPlaceholder('Selecione uma opção')
            .setMaxValues(1)
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Bloquear Conta').setValue('bloquearConta').setDescription('Bloqueie contas específicas de depositarem').setEmoji(Emojis.get('_silueta_emoji')),
                new StringSelectMenuOptionBuilder().setLabel('Desbloquear Conta').setValue('desbloquearConta').setDescription('Desbloqueie contas específicas de depositarem').setEmoji(Emojis.get('_multi_silueta_emoji')),
                new StringSelectMenuOptionBuilder().setLabel('Ver Contas Bloqueadas').setValue('verContas').setDescription('Veja as contas que estão bloqueadas').setEmoji(Emojis.get('_folder_emoji')),
            )
    );

    const botaovoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("configurarmercadopago").setEmoji('1238413255886639104').setStyle(2),
        new ButtonBuilder().setCustomId('voltar1').setEmoji('1292237216915128361').setStyle(1)
    );

    container.addActionRowComponents(selectmenu);
    container.addActionRowComponents(botaovoltar);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        embeds: [],
        content: ''
    });
}

async function BloquearBancos(client, interaction) {
    let refunded = await refounds.fetchAll();
    let opcoes = {};

    if (refunded.size === 0) {
        const selectmenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('bloquearbancosselect')
                .setPlaceholder('Nenhum banco encontrado')
                .setDisabled(true)
                .addOptions(new StringSelectMenuOptionBuilder().setLabel('Nenhum banco disponível').setValue('no_banks').setDescription('Não há bancos para bloquear no momento.'))
        );

        const blockedBanksArray = configuracao.get('pagamentos.BancosBloqueados') || [];

        const botao = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('liberarbanco').setLabel('Liberar Banco').setEmoji(Emojis.get('_trash_emoji')).setDisabled(blockedBanksArray.length <= 0).setStyle(2),
        );

        const botaovoltar = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("configurarmercadopago").setEmoji('1238413255886639104').setStyle(2),
            new ButtonBuilder().setCustomId('voltar1').setEmoji('1292237216915128361').setStyle(1)
        );

        return interaction.update({ components: [selectmenu, botao, botaovoltar] });
    }

    for (const element of refunded) {
        let banco = element.data.banco;
        let valor = element.data.transaction_amount;
        let quantidade = element.data.quantidade || 1;

        if (!banco) continue;

        if (opcoes[banco]) {
            opcoes[banco].value += valor;
            opcoes[banco].quantidade += quantidade;
        } else {
            opcoes[banco] = { label: banco, value: valor, quantidade: quantidade };
        }
    }

    let opcoesArray = Object.values(opcoes).map(({ label, value, quantidade }) => ({
        label: label.substring(0, 25),
        value: label.substring(0, 25),
        description: `${quantidade} fraudes, total de ${Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`.substring(0, 100)
    }));

    opcoesArray = opcoesArray.slice(0, 25);

    if (opcoesArray.length === 0) {
        opcoesArray.push({ label: "Nenhum banco encontrado", value: "no_banks", description: "Não há bancos disponíveis para bloquear." });
    }

    const selectmenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('bloquearbancosselect')
            .setPlaceholder('Selecione um banco para bloquear')
            .setMaxValues(1)
            .addOptions(...opcoesArray)
    );

    const blockedBanksArray = configuracao.get('pagamentos.BancosBloqueados') || [];

    const botao = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('liberarbanco').setLabel('Liberar Banco').setEmoji(Emojis.get('_trash_emoji')).setDisabled(blockedBanksArray.length <= 0).setStyle(2),
    );

    const botaovoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("configurarmercadopago").setEmoji('1238413255886639104').setStyle(2),
        new ButtonBuilder().setCustomId('voltar1').setEmoji('1292237216915128361').setStyle(1)
    );

    await interaction.update({ components: [selectmenu, botao, botaovoltar] });
}

module.exports = { mpConfigs, BloquearBancos, BloquearConta };
