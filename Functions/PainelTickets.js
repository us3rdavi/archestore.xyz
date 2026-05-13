const {
    ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { tickets, Emojis } = require("../Database");

async function painelTicket(interaction, useEditReply = false, useReply = false) {
    const canalTickets  = tickets.get('tickets.canalTickets');
    const canalLogs     = tickets.get('tickets.canalLogs');
    const staffRoles    = tickets.get('tickets.staffRoles') || [];
    const contador      = tickets.get('tickets.contador') || 0;
    const botoesAdic    = tickets.get('tickets.botoesAdicionais') || [];
    const funcoes       = tickets.get('tickets.funcoes') || {};
    const nFuncoes      = Object.keys(funcoes).length;
    const horarioOn     = tickets.get('statushorario') || false;
    const abertura      = tickets.get('horarioAbertura');
    const fechamento    = tickets.get('horarioFechamento');

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_ticket_emoji')} Central de Atendimento\n` +
            `-# Gerencie toda a configuração do sistema de tickets.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    let status = '';
    status += `${Emojis.get('_ticket_emoji')} **Canal de Tickets:** ${canalTickets ? `<#${canalTickets}>` : `\`Não configurado\``}\n`;
    status += `${Emojis.get('_messages_emoji')} **Canal de Logs:** ${canalLogs ? `<#${canalLogs}>` : `\`Não configurado\``}\n`;
    status += `${Emojis.get('_staff_emoji')} **Cargos Staff:** ${staffRoles.length > 0 ? staffRoles.map(r => `<@&${r}>`).join(', ') : `\`Nenhum configurado\``}\n`;
    status += `${Emojis.get('_folder_emoji')} **Funções:** \`${nFuncoes}\`${nFuncoes > 0 ? ` — ${Object.keys(funcoes).slice(0, 3).join(', ')}${nFuncoes > 3 ? ` +${nFuncoes - 3}` : ''}` : ''}\n`;
    status += `${Emojis.get('information_emoji')} **Total de Tickets:** \`${contador}\` · **Botões extras:** \`${botoesAdic.length}\`\n`;
    status += `${Emojis.get('clock_emoji')} **Horário de Atendimento:** ${horarioOn && abertura && fechamento ? `\`${abertura} – ${fechamento}\`` : `\`Desativado\``}`;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(status));

    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('definiraparencia')
            .setLabel('Aparência')
            .setEmoji({ id: '1501804122943389716' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('configuracaoticket')
            .setLabel('Configurações')
            .setEmoji({ id: '1501804064596558017' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('definirhorarioatendimento24')
            .setLabel('Horário')
            .setEmoji({ id: '1501804058699366470' })
            .setStyle(2)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('addfuncaoticket')
            .setLabel('Adicionar Função')
            .setEmoji({ id: '1501803905363869769' })
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('remfuncaoticket')
            .setLabel('Remover Função')
            .setEmoji({ id: '1501803926180335727' })
            .setStyle(4),
        new ButtonBuilder()
            .setCustomId('editaremojiticket')
            .setLabel('Emojis das Funções')
            .setEmoji({ id: '1501804043121725490' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('postarticket')
            .setLabel('Postar Painel')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('voltar1')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2)
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(row2);

    const payload = { content: '', embeds: [], components: [container], flags: MessageFlags.IsComponentsV2 };
    if (useReply)     await interaction.reply(payload);
    else if (useEditReply) await interaction.editReply(payload);
    else               await interaction.update(payload);
}

async function painelConfiguracaoTicket(interaction) {
    const canalTickets  = tickets.get('tickets.canalTickets');
    const canalLogs     = tickets.get('tickets.canalLogs');
    const staffRoles    = tickets.get('tickets.staffRoles') || [];
    const botoesAdic    = tickets.get('tickets.botoesAdicionais') || [];
    const msgInicial    = tickets.get('tickets.mensagemInicial') || {};
    const msgFinal      = tickets.get('tickets.mensagemFinalizacao') || {};

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_settings_emoji')} Configurações de Atendimento\n` +
            `-# Gerencie canais, cargos e mensagens do sistema de tickets.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const tick = Emojis.get('confirmed_emoji');
    const warn = Emojis.get('_flag_emoji');

    let info = '';
    info += `${Emojis.get('_ticket_emoji')} **Canal de Tickets:** ${canalTickets ? `<#${canalTickets}>` : `${warn} \`Não configurado\``}\n`;
    info += `${Emojis.get('_messages_emoji')} **Canal de Logs:** ${canalLogs ? `<#${canalLogs}>` : `${warn} \`Não configurado\``}\n`;
    info += `${Emojis.get('_staff_emoji')} **Cargos Staff:** ${staffRoles.length > 0 ? `${tick} ${staffRoles.map(r => `<@&${r}>`).join(', ')}` : `${warn} \`Nenhum configurado\``}\n`;
    info += `${Emojis.get('_pincel_emoji')} **Msg. Inicial:** ${msgInicial.msgTitulo ? `${tick} \`${msgInicial.msgTitulo}\`` : `${warn} \`Padrão\``}\n`;
    info += `${Emojis.get('_confirm_emoji')} **Msg. Finalização:** ${msgFinal.titulo ? `${tick} \`${msgFinal.titulo}\`` : `${warn} \`Padrão\``}\n`;
    info += `${Emojis.get('_add_emoji')} **Botões de Link:** \`${botoesAdic.length}/5\``;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(info));

    container.addSeparatorComponents(new SeparatorBuilder());

    const select = new StringSelectMenuBuilder()
        .setCustomId('config_ticket_settings')
        .setPlaceholder('Selecione o que deseja configurar...')
        .addOptions([
            {
                label: 'Canal de Tickets',
                value: 'canalticketconfigsystem',
                description: 'Canal onde os tópicos dos tickets são criados',
                emoji: { id: '1501804058699366470' }
            },
            {
                label: 'Canal de Logs',
                value: 'canallogsticket2',
                description: 'Canal de logs e transcripts dos tickets',
                emoji: { id: '1501804039451709441' }
            },
            {
                label: 'Cargos Staff',
                value: 'cargosstaff',
                description: 'Cargos que podem gerenciar tickets',
                emoji: { id: '1501803902046048297' }
            },
            {
                label: 'Mensagem Inicial',
                value: 'configmensageminicial',
                description: 'Título, descrição, cor e banner do ticket',
                emoji: { id: '1501804122943389716' }
            },
            {
                label: 'Mensagem de Finalização',
                value: 'configmensagemfinal',
                description: 'Mensagem exibida ao encerrar um ticket',
                emoji: { id: '1501804067616325723' }
            },
            {
                label: 'Adicionar Botão de Link',
                value: 'adicionarbotaoticket',
                description: 'Adiciona um botão de link ao ticket (máx. 5)',
                emoji: { id: '1501803905363869769' }
            },
            {
                label: 'Remover Botão de Link',
                value: 'removerbotoesticket',
                description: 'Remove botões de link configurados',
                emoji: { id: '1501803926180335727' }
            },
        ]);

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(select)
    );

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('painelconfigticket')
                .setLabel('Voltar')
                .setEmoji({ id: '1501803908589162537' })
                .setStyle(2)
        )
    );

    await interaction.update({
        content: '', embeds: [],
        components: [container],
        flags: MessageFlags.IsComponentsV2
    });
}

module.exports = { painelTicket, painelConfiguracaoTicket };
