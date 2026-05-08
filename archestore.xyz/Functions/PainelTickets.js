const {
    ButtonBuilder, ActionRowBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MediaGalleryBuilder,
    MessageFlags
} = require("discord.js");
const { tickets, configuracao } = require("../DataBaseJson");
const emojis = require("../DataBaseJson/Emojis.json");
const Emojis = { get: (name) => emojis[name] || "" };

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function painelTicket(interaction, useEditReply = false) {
    const atualstatus24 = tickets.get("statusmsg") || false;

    if (atualstatus24) {
        const mensagemConfigurada = tickets.get(`tickets.aparencia.message`) || 'Nenhuma mensagem configurada.';
        const bannerMensagem = tickets.get(`tickets.aparencia.bannermsg`) || null;

        const container = new ContainerBuilder();
        container;

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(mensagemConfigurada)
        );

        if (bannerMensagem) {
            try {
                container.addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems({ media: { url: bannerMensagem } })
                );
            } catch (e) {}
        }

        container.addSeparatorComponents(new SeparatorBuilder());

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("definiraparencia")
                .setLabel('Definir aparência')
                .setEmoji({ id: '1501804122943389716' })
                .setStyle(2)
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("addfuncaoticket")
                .setLabel('Adicionar função')
                .setEmoji({ id: '1501803905363869769' })
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId("remfuncaoticket")
                .setLabel('Remover função')
                .setEmoji({ id: '1501803926180335727' })
                .setStyle(4),
            new ButtonBuilder()
                .setCustomId("definirhorarioatendimento24")
                .setLabel('Horário de atendimento')
                .setEmoji({ id: '1501804058699366470' })
                .setStyle(2)
        );
        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("postarticket")
                .setLabel('Postar')
                .setEmoji({ id: '1501803923126747178' })
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId("voltar1")
                .setLabel('Voltar')
                .setEmoji({ id: '1501803908589162537' })
                .setStyle(2)
        );

        container.addActionRowComponents(row1);
        container.addActionRowComponents(row2);
        container.addActionRowComponents(row3);

        const payload = {
            content: '',
            embeds: [],
            components: [container],
            flags: MessageFlags.IsComponentsV2
        };

        if (useEditReply) await interaction.editReply(payload);
        else await interaction.update(payload);
        return;
    }

    const canalTickets = tickets.get('tickets.canalTickets');
    const canalLogs = tickets.get('tickets.canalLogs');
    const staffRoles = tickets.get('tickets.staffRoles') || [];
    const contador = tickets.get('tickets.contador') || 0;
    const botoesAdicionais = tickets.get('tickets.botoesAdicionais') || [];
    const aparenciaTitle = tickets.get('tickets.aparencia.title');
    const aparenciaColor = tickets.get('tickets.aparencia.color');

    let accentColor = getAccentColor();
    if (aparenciaColor) {
        try { accentColor = parseInt(aparenciaColor.replace('#', ''), 16); } catch (e) {}
    }

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${Emojis.get('_settings_emoji')} Central de Atendimento`)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    let info = '';
    if (aparenciaTitle) info += `${Emojis.get('_messages_emoji')} **Título:** ${aparenciaTitle}\n`;
    info += `${Emojis.get('_ticket_emoji')} **Canal de Tickets:** ${canalTickets ? `<#${canalTickets}>` : '`Não configurado`'}\n`;
    info += `${Emojis.get('_messages_emoji')} **Canal de Logs:** ${canalLogs ? `<#${canalLogs}>` : '`Não configurado`'}\n`;
    info += `${Emojis.get('_staff_emoji')} **Cargos Staff:** ${staffRoles.length > 0 ? staffRoles.map(r => `<@&${r}>`).join(', ') : '`Nenhum configurado`'}\n`;
    info += `${Emojis.get('information_emoji')} **Total de Tickets:** \`${contador}\`\n`;
    info += `${Emojis.get('_add_emoji')} **Botões Adicionais:** \`${botoesAdicionais.length}\` botão(ões)`;

    const funcoes = tickets.get('tickets.funcoes');
    if (funcoes && Object.keys(funcoes).length > 0) {
        const funcList = Object.keys(funcoes).slice(0, 5).join(', ');
        info += `\n${Emojis.get('_folder_emoji')} **Funções:** ${funcList}${Object.keys(funcoes).length > 5 ? ` +${Object.keys(funcoes).length - 5}` : ''}`;
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(info));

    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("definiraparencia")
            .setLabel('Aparência do Painel')
            .setEmoji({ id: '1501804122943389716' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("configuracaoticket")
            .setLabel('Configuração')
            .setEmoji({ id: '1501804064596558017' })
            .setStyle(2)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("addfuncaoticket")
            .setLabel('Adicionar Função')
            .setEmoji({ id: '1501803905363869769' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("remfuncaoticket")
            .setLabel('Remover Função')
            .setEmoji({ id: '1501803926180335727' })
            .setStyle(4),
        new ButtonBuilder()
            .setCustomId("definirhorarioatendimento24")
            .setLabel('Horário de Atendimento')
            .setEmoji({ id: '1501804058699366470' })
            .setStyle(2)
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("postarticket")
            .setLabel('Postar Painel')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("voltar1")
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2)
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(row2);
    container.addActionRowComponents(row3);

    const payload = {
        content: '',
        embeds: [],
        components: [container],
        flags: MessageFlags.IsComponentsV2
    };

    if (useEditReply) await interaction.editReply(payload);
    else await interaction.update(payload);
}

async function painelConfiguracaoTicket(interaction) {
    const canalTickets = tickets.get('tickets.canalTickets');
    const canalLogs = tickets.get('tickets.canalLogs');
    const staffRoles = tickets.get('tickets.staffRoles') || [];
    const botoesAdicionais = tickets.get('tickets.botoesAdicionais') || [];
    const mensagemInicial = tickets.get('tickets.mensagemInicial') || {};
    const mensagemFinal = tickets.get('tickets.mensagemFinalizacao') || {};

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${Emojis.get('_settings_emoji')} Configuração\nGerencie canais, cargos e mensagens do sistema de tickets.`)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    let info = '';
    info += `${Emojis.get('_ticket_emoji')} **Canal de Tickets:** ${canalTickets ? `<#${canalTickets}>` : '`Não configurado`'}\n`;
    info += `${Emojis.get('_messages_emoji')} **Canal de Logs:** ${canalLogs ? `<#${canalLogs}>` : '`Não configurado`'}\n`;
    info += `${Emojis.get('_staff_emoji')} **Cargos Staff:** ${staffRoles.length > 0 ? staffRoles.map(r => `<@&${r}>`).join(', ') : '`Nenhum configurado`'}\n`;
    info += `${Emojis.get('_add_emoji')} **Botões Adicionais:** \`${botoesAdicionais.length}\` botão(ões)\n`;
    info += `${Emojis.get('_messages_emoji')} **Msg. Inicial:** ${mensagemInicial.msgTitulo ? `\`${mensagemInicial.msgTitulo}\`` : '`Não configurada`'}\n`;
    info += `${Emojis.get('_messages_emoji')} **Msg. Finalização:** ${mensagemFinal.titulo ? `\`${mensagemFinal.titulo}\`` : '`Não configurada`'}`;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(info));

    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("canalticketconfigsystem")
            .setLabel('Canal de Tickets')
            .setEmoji({ id: '1501804058699366470' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("canallogsticket2")
            .setLabel('Canal de Logs')
            .setEmoji({ id: '1501804039451709441' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("cargosstaff")
            .setLabel('Cargos Staff')
            .setEmoji({ id: '1501803902046048297' })
            .setStyle(2)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configmensageminicial")
            .setLabel('Mensagem Inicial')
            .setEmoji({ id: '1501804122943389716' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("configmensagemfinal")
            .setLabel('Mensagem de Finalização')
            .setEmoji({ id: '1501804067616325723' })
            .setStyle(2)
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("adicionarbotaoticket")
            .setLabel('Adicionar Botão')
            .setEmoji({ id: '1501803905363869769' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("removerbotoesticket")
            .setLabel('Remover Botão')
            .setEmoji({ id: '1501803926180335727' })
            .setStyle(4)
    );

    const row4 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("painelconfigticket")
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2)
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(row2);
    container.addActionRowComponents(row3);
    container.addActionRowComponents(row4);

    const payload = {
        content: '',
        embeds: [],
        components: [container],
        flags: MessageFlags.IsComponentsV2
    };

    await interaction.update(payload);
}

module.exports = { painelTicket, painelConfiguracaoTicket };
