const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { produtos, Emojis, configuracao } = require("../Database");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function AcoesAutomaticsConfigs(interaction, client) {
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_ban_emoji')} Painel de Moderação\n` +
            `-# Selecione um sistema abaixo para configurar`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const select = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`select_AcoesAutomaticsConfigs`)
            .setPlaceholder(`Selecione um sistema para configurar...`)
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Limpar Canal`)
                    .setValue(`LimpezaAutomatica`)
                    .setDescription(`Limpeza automática de mensagens em canais`)
                    .setEmoji({ id: '1501803926180335727' }),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Gerenciar Canais`)
                    .setValue(`GerenciarCanais`)
                    .setDescription(`Abertura e fechamento automático de canais`)
                    .setEmoji({ id: '1501803997583904810' }),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Nuke Automático`)
                    .setValue(`SistemaNukar`)
                    .setDescription(`Limpeza total de canais em horário definido`)
                    .setEmoji({ id: '1501804067616325723' }),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Anti-Raid`)
                    .setValue(`sistemaAntiRaid`)
                    .setDescription(`Proteção contra ataques de raid`)
                    .setEmoji({ id: '1501804019184828507' }),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Anti-Fake`)
                    .setValue(`SistemaAntiFake`)
                    .setDescription(`Bloqueio de contas suspeitas ou recentes`)
                    .setEmoji({ id: '1501804064596558017' }),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Sistema de Filtro`)
                    .setValue(`SistemadeFiltro`)
                    .setDescription(`Filtro de palavras, links e convites`)
                    .setEmoji({ id: '1501803928973476023' }),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Repostagem`)
                    .setValue(`automaticRepostar`)
                    .setDescription(`Repostagem automática de mensagens`)
                    .setEmoji({ id: '1501803917640732722' }),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Mensagens Automáticas`)
                    .setValue(`MsgsAutoConfig`)
                    .setDescription(`Mensagens automáticas com horário`)
                    .setEmoji({ id: '1501804039451709441' }),
            )
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar1")
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
    );

    container.addActionRowComponents(select);
    container.addActionRowComponents(botoesvoltar);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

async function SistemaAntiFake(interaction, client) {
    const AntiFake = configuracao.get(`AntiFake`);
    const container = new ContainerBuilder();

    let desc = `## ${Emojis.get('permissions_emoji')} Anti-Fake\n` +
        `-# Bloqueio de contas suspeitas ou recentes\n\n`;

    if (AntiFake) {
        desc += `${Emojis.get('clock_emoji')} **Dias Mínimos de Conta:** \`${AntiFake?.diasminimos ?? 'Não definido'}\`\n` +
            `${Emojis.get('_ban_emoji')} **Status Bloqueados:** \`${AntiFake?.status?.length > 0 ? AntiFake.status.join(', ') : 'Nenhum'}\`\n` +
            `${Emojis.get('negative_emoji')} **Nomes Bloqueados:** \`${AntiFake?.nomes?.length > 0 ? AntiFake.nomes.join(', ') : 'Nenhum'}\``;
    } else {
        desc += `${Emojis.get('information_emoji')} Nenhuma configuração salva ainda.`;
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));
    container.addSeparatorComponents(new SeparatorBuilder());

    const botao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("personalizarantifake")
            .setLabel('Configurar Anti-Fake')
            .setEmoji({ id: '1501804118292037765' })
            .setStyle(1),
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_AcoesAutomaticsConfigs")
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji({ id: '1501804003850322052' })
            .setStyle(1)
    );

    container.addActionRowComponents(botao);
    container.addActionRowComponents(botoesvoltar);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

async function sistemaAntiRaid(interaction, client) {
    let AntiRaid = configuracao.get(`AutomaticSettings.sistemaAntiRaid`);
    let metodopunicao = AntiRaid?.punicao === `RemoverCargos`
        ? `Remover Todos os Cargos`
        : AntiRaid?.punicao
            ? AntiRaid.punicao.charAt(0).toUpperCase() + AntiRaid.punicao.slice(1)
            : 'Remover Todos os Cargos';

    const container = new ContainerBuilder();
    container;

    let desc = `## ${Emojis.get('system_emoji')} Anti-Raid — ${AntiRaid?.status ? `HABILITADO` : `DESABILITADO`}\n` +
        `-# Proteção contra ataques de raid no servidor\n\n` +
        `**Canal de Logs:** ${AntiRaid?.canallogs ? `<#${AntiRaid.canallogs}>` : '`Não Definido`'}\n` +
        `**Proteção de Convite:** \`${AntiRaid?.convitepersonalizado ? `Sua URL está Protegida` : `Sua URL NÃO está Protegida`}\`\n` +
        `**Método de Punição:** \`${metodopunicao}\``;

    if (AntiRaid?.cargos?.length > 0) {
        desc += `\n\n**Cargos Imunes:**\n${AntiRaid.cargos.map(c => `<@&${c}>`).join('\n')}`;
    }

    desc += `\n\n**Proteção de Cargos Deletados [\`${AntiRaid?.ExclusaoCargos?.status ? `ON` : `OFF`}\`]:**\n` +
        `O usuário poderá excluir \`${AntiRaid?.ExclusaoCargos?.quantidadeporminuto || 0}\` por minuto e \`${AntiRaid?.ExclusaoCargos?.quantidadeporhora || 0}\` por hora.\n` +
        `**Proteção de Canais Deletados [\`${AntiRaid?.ExclusaoCanais?.status ? `ON` : `OFF`}\`]:**\n` +
        `O usuário poderá excluir \`${AntiRaid?.ExclusaoCanais?.quantidadeporminuto || 0}\` por minuto e \`${AntiRaid?.ExclusaoCanais?.quantidadeporhora || 0}\` por hora.\n` +
        `**Proteção de Banimentos [\`${AntiRaid?.Banimento?.status ? `ON` : `OFF`}\`]:**\n` +
        `O usuário poderá banir \`${AntiRaid?.Banimento?.quantidadeporminuto || 0}\` por minuto e \`${AntiRaid?.Banimento?.quantidadeporhora || 0}\` por hora.\n` +
        `**Proteção de Expulsões [\`${AntiRaid?.Expulsao?.status ? `ON` : `OFF`}\`]:**\n` +
        `O usuário poderá expulsar \`${AntiRaid?.Expulsao?.quantidadeporminuto || 0}\` por minuto e \`${AntiRaid?.Expulsao?.quantidadeporhora || 0}\` por hora.`;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));
    container.addSeparatorComponents(new SeparatorBuilder());

    const botao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`statusantiraid`)
            .setLabel(`${AntiRaid?.status ? `Desativar` : `Ativar`} Sistema`)
            .setEmoji({ id: '1501803932484108359' })
            .setStyle(AntiRaid?.status ? 4 : 3),
        new ButtonBuilder()
            .setCustomId(`statusconvitepersonalizado`)
            .setLabel(`${AntiRaid?.convitepersonalizado ? `Desativar` : `Ativar`} Proteção de Convite`)
            .setEmoji({ id: '1501803932484108359' })
            .setStyle(AntiRaid?.convitepersonalizado ? 4 : 3),
    );

    const botao2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`canallogsantiraid`)
            .setLabel(`Canal de Logs`)
            .setEmoji({ id: '1501803997583904810' })
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId(`cargosimunesantiraid`)
            .setLabel(`Cargos Imunes`)
            .setEmoji({ id: '1501804064596558017' })
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId(`metodopunicao`)
            .setLabel(`Método de Punição`)
            .setEmoji({ id: '1501804067616325723' })
            .setStyle(1),
    );

    const select = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`metodopunicaoantiraid`)
            .setPlaceholder(`Selecione um método de punição`)
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Exclusão de Cargos`)
                    .setValue(`ExclusaoCargos`)
                    .setDescription(`Puna quem ultrapassar o limite de exclusão por Minuto/Hora`)
                    .setEmoji(`1232782650385629299`),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Exclusão de Canais`)
                    .setValue(`ExclusaoCanais`)
                    .setDescription(`Puna quem ultrapassar o limite de exclusão por Minuto/Hora`)
                    .setEmoji(`1232782650385629299`),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Banimento`)
                    .setValue(`Banimento`)
                    .setDescription(`Puna quem ultrapassar o limite de banimentos por Minuto/Hora`)
                    .setEmoji(`1232782650385629299`),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Expulsão`)
                    .setValue(`Expulsao`)
                    .setDescription(`Puna quem ultrapassar o limite de expulsões por Minuto/Hora`)
                    .setEmoji(`1232782650385629299`)
            )
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_AcoesAutomaticsConfigs")
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji({ id: '1501804003850322052' })
            .setStyle(1)
    );

    container.addActionRowComponents(botao);
    container.addActionRowComponents(botao2);
    container.addActionRowComponents(select);
    container.addActionRowComponents(botoesvoltar);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

async function LimpezaAutomatica(interaction, client) {
    let canais = configuracao.get(`AutomaticSettings.LimpezaAutomatica.canais`);
    const execucoes = configuracao.get(`AutomaticSettings.LimpezaAutomatica`);

    const container = new ContainerBuilder();
    container;

    let desc = `## ${Emojis.get('_ban_emoji')} Limpeza Automática\n` +
        `-# Limpeza programada de mensagens em canais selecionados\n\n`;

    if (execucoes?.primeira && execucoes?.segunda) {
        const toTimestamp = hora => {
            let [h, m] = hora.split(':');
            let agora = new Date();
            agora.setHours(Number(h), Number(m), 0, 0);
            if (agora < new Date()) agora.setDate(agora.getDate() + 1);
            return Math.floor(agora.getTime() / 1000);
        };
        const st = execucoes.status ? Emojis.get('confirmed_emoji') : Emojis.get('negative_emoji');
        desc += `${st} **Status:** ${execucoes.status ? 'Ativo' : 'Inativo'}\n` +
            `${Emojis.get('clock_emoji')} **Execuções:** \`${execucoes.primeira}\` (próx. <t:${toTimestamp(execucoes.primeira)}:R>) · \`${execucoes.segunda}\` (próx. <t:${toTimestamp(execucoes.segunda)}:R>)\n`;
    } else {
        desc += `${Emojis.get('clock_emoji')} **Horários:** \`Não configurados\`\n`;
    }

    if (canais?.length > 0) {
        desc += `${Emojis.get('_folder_emoji')} **Canais:** ${canais.map(c => `<#${c}>`).join(', ')}`;
    } else {
        desc += `${Emojis.get('_folder_emoji')} **Canais:** \`Nenhum configurado\``;
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configurarLimpeza")
            .setLabel('Definir Horários')
            .setEmoji({ id: '1501804058699366470' })
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("adicionarcanal_LimpezaAutomatica")
            .setLabel('Adicionar Canal')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId("removercanal_LimpezaAutomatica")
            .setLabel('Remover Canal')
            .setEmoji({ id: '1501803926180335727' })
            .setStyle(4)
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_AcoesAutomaticsConfigs")
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji({ id: '1501804003850322052' })
            .setStyle(1)
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(botoesvoltar);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

async function GerenciarCanais(interaction, client) {
    let canais = configuracao.get(`AutomaticSettings.GerenciarCanais.canais`);
    const execucoes = configuracao.get(`AutomaticSettings.GerenciarCanais`);

    const container = new ContainerBuilder();
    container;

    let desc = `## ${Emojis.get('_folder_emoji')} Gerenciar Canais\n` +
        `-# Abertura e fechamento automático de canais\n\n`;

    if (execucoes?.abertura && execucoes?.fechamento) {
        const toTimestamp = hora => {
            let [h, m] = hora.split(':');
            let agora = new Date();
            agora.setHours(Number(h), Number(m), 0, 0);
            if (agora < new Date()) agora.setDate(agora.getDate() + 1);
            return Math.floor(agora.getTime() / 1000);
        };
        const st = execucoes.status ? Emojis.get('confirmed_emoji') : Emojis.get('negative_emoji');
        desc += `${st} **Status:** ${execucoes.status ? 'Ativo' : 'Inativo'}\n` +
            `${Emojis.get('clock_emoji')} **Abertura:** \`${execucoes.abertura}\` — <t:${toTimestamp(execucoes.abertura)}:R>\n` +
            `${Emojis.get('clock_emoji')} **Fechamento:** \`${execucoes.fechamento}\` — <t:${toTimestamp(execucoes.fechamento)}:R>\n`;
    } else {
        desc += `${Emojis.get('clock_emoji')} **Horários:** \`Não configurados\`\n`;
    }

    if (canais?.length > 0) {
        desc += `${Emojis.get('_folder_emoji')} **Canais:** ${canais.map(c => `<#${c}>`).join(', ')}`;
    } else {
        desc += `${Emojis.get('_folder_emoji')} **Canais:** \`Nenhum configurado\``;
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configurarCanais")
            .setLabel('Definir Horários')
            .setEmoji({ id: '1501804058699366470' })
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("adicionarcanal_GerenciarCanais")
            .setLabel('Adicionar Canal')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId("removercanal_GerenciarCanais")
            .setLabel('Remover Canal')
            .setEmoji({ id: '1501803926180335727' })
            .setDisabled(!canais?.length)
            .setStyle(4),
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_AcoesAutomaticsConfigs")
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji({ id: '1501804003850322052' })
            .setStyle(1)
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(botoesvoltar);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

async function SistemaNukar(interaction, client) {
    let canais = configuracao.get(`AutomaticSettings.SistemaNukar.canais`);
    const execucoes = configuracao.get(`AutomaticSettings.SistemaNukar`);
    const status = execucoes?.status;

    const toTimestamp = hora => {
        let [h, m] = hora.split(':');
        let agora = new Date();
        agora.setHours(Number(h), Number(m), 0, 0);
        if (agora < new Date()) agora.setDate(agora.getDate() + 1);
        return Math.floor(agora.getTime() / 1000);
    };

    const statusEmoji = status ? Emojis.get('confirmed_emoji') : Emojis.get('negative_emoji');
    const statusText  = status ? 'Ativo' : 'Inativo';

    let infoLines = `${statusEmoji} **Status:** ${statusText}\n`;

    if (execucoes?.horario) {
        infoLines += `${Emojis.get('clock_emoji')} **Horário:** \`${execucoes.horario}\` — próx. execução <t:${toTimestamp(execucoes.horario)}:R>\n`;
    } else {
        infoLines += `${Emojis.get('clock_emoji')} **Horário:** \`Não definido\`\n`;
    }

    if (canais?.length > 0) {
        infoLines += `${Emojis.get('_folder_emoji')} **Canais:** ${canais.map(c => `<#${c}>`).join(', ')}`;
    } else {
        infoLines += `${Emojis.get('_folder_emoji')} **Canais:** \`Nenhum configurado\``;
    }

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_ban_emoji')} Nuke Automático\n` +
        `-# Limpeza total de canais em horário agendado\n\n` +
        infoLines
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configurarNukar")
            .setLabel('Definir Horário')
            .setEmoji({ id: '1501804058699366470' })
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("adicionarcanal_SistemaNukar")
            .setLabel('Adicionar Canal')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId("removercanal_SistemaNukar")
            .setLabel('Remover Canal')
            .setEmoji({ id: '1501803926180335727' })
            .setDisabled(!canais?.length)
            .setStyle(4),
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_AcoesAutomaticsConfigs")
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji({ id: '1501804003850322052' })
            .setStyle(1)
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(botoesvoltar);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

async function SistemadeFiltro(interaction, client) {
    let info = configuracao.get(`AutomaticSettings.SistemadeFiltro`);

    const container = new ContainerBuilder();
    container;

    let desc = `## ${Emojis.get('_search_emoji')} Sistema de Filtro\n-# Filtragem de palavras, links e convites\n\n`;

    if (info) {
        const ms = require('ms');
        const tempo = info?.tempo === 'permanente'
            ? `Permanente`
            : info?.tempo != undefined
                ? `${ms(info.tempo)}`
                : `Não definido`;

        const st = info?.status ? Emojis.get('confirmed_emoji') : Emojis.get('negative_emoji');
        desc += `${st} **Status:** ${info?.status ? 'Ativo' : 'Inativo'}\n` +
            `${Emojis.get('_ban_emoji')} **Punição:** \`${info?.punicao ? info.punicao.charAt(0).toUpperCase() + info.punicao.slice(1) : 'Sem punição'}\`\n` +
            `${Emojis.get('clock_emoji')} **Tempo:** \`${tempo}\`\n`;
    } else {
        desc += `${Emojis.get('information_emoji')} Nenhuma configuração salva ainda.\n`;
    }

    if (info?.cargos?.length > 0) {
        desc += `\n\n**Cargos Imunes:**\n${info.cargos.map(c => `<@&${c}>`).join('\n')}`;
    }

    if (info?.categoria?.length > 0) {
        desc += `\n\n**Categorias Imunes:**\n${info.categoria.map(c => `<#${c}>`).join('\n')}`;
    }

    if (info?.links?.length > 0 || info?.palavras?.length > 0) {
        let strFiltros = `\n\n**Informações de Filtros:**\nFiltrar Convites: \`${info?.convites ? 'Ativo' : 'Inativo'}\``;
        if (info.links?.length > 0) strFiltros += `\nLinks: \`${info.links.join(', ')}\``;
        if (info.palavras?.length > 0) strFiltros += `\nPalavras: \`${info.palavras.join(', ')}\``;
        desc += strFiltros;
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configurarFiltro")
            .setLabel('Definir Regras')
            .setEmoji({ id: '1501804067616325723' })
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId("configuracaoexcecao")
            .setLabel('Definir Exceções')
            .setEmoji({ id: '1501804064596558017' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("adicionarFiltro")
            .setLabel('Gerenciar Filtro')
            .setEmoji({ id: '1501803928973476023' })
            .setStyle(1),
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_AcoesAutomaticsConfigs")
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji({ id: '1501804003850322052' })
            .setStyle(1)
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(botoesvoltar);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

async function msgbemvindo(interaction, client) {
    let msg = configuracao.get(`Entradas.msg`);

    const container = new ContainerBuilder();
    container;

    let preview = msg;
    if (msg) {
        const mapeamento = {
            "{member}": `<@${interaction.user.id}>`,
            "{guildname}": `${interaction.guild.name}`
        };
        preview = msg.replace(/{member}|{guildname}/g, m => mapeamento[m] || m);
    }

    let desc = `## ${Emojis.get('_messages_emoji')} Boas Vindas\n-# Mensagem enviada quando novos membros entram no servidor\n\n` +
        `${Emojis.get('_messages_emoji')} **Mensagem:**\n${msg ? preview : `\`Não definido\``}`;

    if (configuracao.get(`Entradas.tempo`)) {
        desc += `\n${Emojis.get('clock_emoji')} **Tempo de exibição:** \`${configuracao.get(`Entradas.tempo`)} segundos\``;
    }

    const canais = configuracao.get(`Entradas.canais`) || [];
    if (canais.length > 0) {
        desc += `\n\n**Canais:**\n${canais.map(c => `<#${c}>`).join('\n')}`;
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configurarboasvindas")
            .setLabel('Configurar Mensagem')
            .setEmoji({ id: '1501804039451709441' })
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("canaisboasvindas")
            .setLabel('Canais')
            .setEmoji({ id: '1501803997583904810' })
            .setStyle(1)
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_AcoesAutomaticsConfigs")
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji({ id: '1501804003850322052' })
            .setStyle(1)
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(botoesvoltar);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

async function msgbemvindocanais(interaction, client) {
    const canais = configuracao.get(`Entradas.canais`) || [];

    const container = new ContainerBuilder();
    container;

    let desc = `## ${Emojis.get('_messages_emoji')} Canais de Boas Vindas\n` +
        `-# Canais onde as mensagens de boas vindas serão enviadas\n\n` +
        `${Emojis.get('_folder_emoji')} **Canais configurados:** \`${canais.length}\``;

    if (canais.length > 0) {
        desc += `\n${canais.map(c => `<#${c}>`).join('\n')}`;
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("addcanalboasvindas")
            .setLabel('Adicionar Canal')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId("removercanalboasvindas")
            .setLabel('Remover Canal')
            .setEmoji({ id: '1501803926180335727' })
            .setDisabled(canais.length === 0)
            .setStyle(4)
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_msgbemvindo")
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji({ id: '1501804003850322052' })
            .setStyle(1)
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(botoesvoltar);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

module.exports = {
    AcoesAutomaticsConfigs,
    SistemaAntiFake,
    sistemaAntiRaid,
    LimpezaAutomatica,
    GerenciarCanais,
    SistemaNukar,
    SistemadeFiltro,
    msgbemvindo,
    msgbemvindocanais
};
