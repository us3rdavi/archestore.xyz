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
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_support_emoji')} Painel De Moderação\n` +
            `Olá **${interaction.user.displayName || interaction.user.username}**, você está no painel de configuração de moderação.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const select = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`select_AcoesAutomaticsConfigs`)
            .setPlaceholder(`Gerencie o sistema de moderação.`)
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Limpar Canal`)
                    .setValue(`LimpezaAutomatica`)
                    .setDescription(`Limpeza Automática de Mensagens`)
                    .setEmoji(`1238300628225228961`),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Gerenciar Canais`)
                    .setValue(`GerenciarCanais`)
                    .setDescription(`Abertura e Fechamento de Canais`)
                    .setEmoji(`1244438113368150061`),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Nukar Canal`)
                    .setValue(`SistemaNukar`)
                    .setDescription(`Nukar Canal`)
                    .setEmoji(`1229787813046915092`),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Anti-Raid`)
                    .setValue(`sistemaAntiRaid`)
                    .setDescription(`Sistema Anti-Raid`)
                    .setEmoji(`1286081797297279091`),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Anti-Fake`)
                    .setValue(`SistemaAntiFake`)
                    .setDescription(`Sistema Anti-Fake`)
                    .setEmoji(`1286081797297279091`),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Sistema de Filtro`)
                    .setValue(`SistemadeFiltro`)
                    .setDescription(`Sistema de Filtro`)
                    .setEmoji(`1286078168855478446`),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Repostagem`)
                    .setValue(`automaticRepostar`)
                    .setDescription(`Repostagem de Mensagens`)
                    .setEmoji(`1238303687248576544`),
                new StringSelectMenuOptionBuilder()
                    .setLabel(`Mensagens Automáticas`)
                    .setValue(`MsgsAutoConfig`)
                    .setDescription(`Mensagens Automáticas`)
                    .setEmoji(`1238709839685746758`),
            )
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar1")
            .setEmoji(`1238413255886639104`)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar12`)
            .setEmoji('1292237216915128361')
            .setDisabled(true)
            .setStyle(1)
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
    container;

    let desc = `## ${Emojis.get('_support_emoji')} Painel De Anti-Fake\nGerencie o sistema de Anti-Fake do seu servidor.`;

    if (AntiFake) {
        desc += `\n\n**Sistema AntiFake:**\n` +
            `Dias Mínimos: \`${AntiFake?.diasminimos ?? 'Não Definido'}\`\n` +
            `Status Bloqueados: \`${AntiFake?.status?.length > 0 ? AntiFake.status.join(', ') : 'Nenhum Salvo'}\`\n` +
            `Nomes Bloqueados: \`${AntiFake?.nomes?.length > 0 ? AntiFake.nomes.join(', ') : 'Nenhum Salvo'}\``;
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));
    container.addSeparatorComponents(new SeparatorBuilder());

    const botao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("personalizarantifake")
            .setLabel('Anti-Fake')
            .setEmoji("1501804118292037765")
            .setStyle(1),
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_AcoesAutomaticsConfigs")
            .setEmoji("1501803908589162537")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji("1501804003850322052")
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

    let desc = `## Anti-Raid — ${AntiRaid?.status ? `HABILITADO` : `DESABILITADO`}\n` +
        `Gerencie o sistema de Anti-Raid do seu servidor.\n\n` +
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
            .setEmoji("1501803932484108359")
            .setStyle(AntiRaid?.status ? 4 : 3),
        new ButtonBuilder()
            .setCustomId(`statusconvitepersonalizado`)
            .setLabel(`${AntiRaid?.convitepersonalizado ? `Desativar` : `Ativar`} Proteção de Convite`)
            .setEmoji("1501803932484108359")
            .setStyle(AntiRaid?.convitepersonalizado ? 4 : 3),
    );

    const botao2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`canallogsantiraid`)
            .setLabel(`Canal de Logs`)
            .setEmoji(`1233127513178247269`)
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId(`cargosimunesantiraid`)
            .setLabel(`Cargos Imunes`)
            .setEmoji(`1233127515141308416`)
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId(`metodopunicao`)
            .setLabel(`Método de Punição`)
            .setEmoji(`1233103066975309984`)
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
            .setEmoji("1501803908589162537")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji("1501804003850322052")
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

    let desc = `## ${Emojis.get('_support_emoji')} Painel De Limpeza Automática\n` +
        `Seu Bot realizará a limpeza automática das mensagens nos canais selecionados conforme o horário estabelecido.`;

    if (execucoes?.primeira && execucoes?.segunda) {
        const toTimestamp = hora => {
            let [h, m] = hora.split(':');
            let agora = new Date();
            agora.setHours(h, m, 0, 0);
            if (agora < new Date()) agora.setDate(agora.getDate() + 1);
            return Math.floor(agora.getTime() / 1000);
        };
        desc += `\n\n**Horários de execução (${execucoes.status ? 'Ativo' : 'Inativo'}):**\n` +
            `\`${execucoes.primeira}\` (próx. em <t:${toTimestamp(execucoes.primeira)}:R>)\n` +
            `\`${execucoes.segunda}\` (próx. em <t:${toTimestamp(execucoes.segunda)}:R>)`;
    }

    if (canais?.length > 0) {
        desc += `\n\n**Canais:**\n${canais.map(c => `<#${c}>`).join('\n')}`;
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configurarLimpeza")
            .setLabel('Definir Regras')
            .setEmoji(`1233103066975309984`)
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("adicionarcanal_LimpezaAutomatica")
            .setLabel('Adicionar Canal')
            .setEmoji(`1233110125330563104`)
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId("removercanal_LimpezaAutomatica")
            .setLabel('Remover Canal')
            .setEmoji(`1242907028079247410`)
            .setStyle(4)
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_AcoesAutomaticsConfigs")
            .setEmoji(`1238413255886639104`)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji('1292237216915128361')
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

    let desc = `## ${Emojis.get('_support_emoji')} Painel De Canais\nAqui você pode gerenciar os canais que o bot irá atuar.`;

    if (execucoes?.abertura && execucoes?.fechamento) {
        const toTimestamp = hora => {
            let [h, m] = hora.split(':');
            let agora = new Date();
            agora.setHours(h, m, 0, 0);
            if (agora < new Date()) agora.setDate(agora.getDate() + 1);
            return Math.floor(agora.getTime() / 1000);
        };
        desc += `\n\n**Horários de execução (${execucoes.status ? 'Ativo' : 'Inativo'}):**\n` +
            `\`${execucoes.abertura}\` (Abertura em <t:${toTimestamp(execucoes.abertura)}:R>)\n` +
            `\`${execucoes.fechamento}\` (Fechamento em <t:${toTimestamp(execucoes.fechamento)}:R>)`;
    }

    if (canais?.length > 0) {
        desc += `\n\n**Canais:**\n${canais.map(c => `<#${c}>`).join('\n')}`;
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configurarCanais")
            .setLabel('Definir Regras')
            .setEmoji(`1233103066975309984`)
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("adicionarcanal_GerenciarCanais")
            .setLabel('Adicionar Canal')
            .setEmoji(`1233110125330563104`)
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId("removercanal_GerenciarCanais")
            .setLabel('Remover Canal')
            .setEmoji(`1242907028079247410`)
            .setDisabled(!canais?.length)
            .setStyle(4),
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_AcoesAutomaticsConfigs")
            .setEmoji(`1238413255886639104`)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji('1292237216915128361')
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

    const container = new ContainerBuilder();
    container;

    let desc = `## ${Emojis.get('_support_emoji')} Painel De Nuke Automático\nAqui você pode configurar o sistema de nukar.`;

    if (execucoes?.horario) {
        const toTimestamp = hora => {
            let [h, m] = hora.split(':');
            let agora = new Date();
            agora.setHours(h, m, 0, 0);
            if (agora < new Date()) agora.setDate(agora.getDate() + 1);
            return Math.floor(agora.getTime() / 1000);
        };
        desc += `\n\n**Horário de execução (${execucoes.status ? 'Ativo' : 'Inativo'}):**\n` +
            `\`${execucoes.horario}\` (próx. em <t:${toTimestamp(execucoes.horario)}:R>)`;
    }

    if (canais?.length > 0) {
        desc += `\n\n**Canais:**\n${canais.map(c => `<#${c}>`).join('\n')}`;
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("configurarNukar")
            .setLabel('Definir Regras')
            .setEmoji(`1233103066975309984`)
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("adicionarcanal_SistemaNukar")
            .setLabel('Adicionar Canal')
            .setEmoji(`1233110125330563104`)
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId("removercanal_SistemaNukar")
            .setLabel('Remover Canal')
            .setEmoji(`1242907028079247410`)
            .setDisabled(!canais?.length)
            .setStyle(4),
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_AcoesAutomaticsConfigs")
            .setEmoji(`1238413255886639104`)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji('1292237216915128361')
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

    let desc = `## ${Emojis.get('_support_emoji')} Painel De Sistema De Filtros\nAqui você pode configurar o sistema de filtro.`;

    if (info) {
        const ms = require('ms');
        const tempo = info?.tempo === 'permanente'
            ? `Punição permanente.`
            : info?.tempo != undefined
                ? `${ms(info.tempo)}`
                : `Não Definido`;

        desc += `\n\n**Regras de Execução (${info?.status ? 'Ativo' : 'Inativo'}):**\n` +
            `Punição: \`${info?.punicao ? info.punicao.charAt(0).toUpperCase() + info.punicao.slice(1) : 'Sem Punição'}\`\n` +
            `Tempo: \`${tempo}\``;
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
            .setEmoji(`1233103066975309984`)
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId("configuracaoexcecao")
            .setLabel('Definir Exceções')
            .setEmoji(`1234606184711979178`)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("adicionarFiltro")
            .setLabel('Gerenciar Filtro')
            .setEmoji(`1286078168855478446`)
            .setStyle(1),
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_AcoesAutomaticsConfigs")
            .setEmoji(`1238413255886639104`)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji('1292237216915128361')
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

    let desc = `## ${Emojis.get('_support_emoji')} Painel De Boas Vindas\nAqui você pode configurar a mensagem de boas vindas.\n\n` +
        `**Mensagem:**\n${msg ? preview : 'Não definido'}`;

    if (configuracao.get(`Entradas.tempo`)) {
        desc += `\n\n**Tempo:** \`${configuracao.get(`Entradas.tempo`)} segundos\``;
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
            .setLabel('Configurar mensagem')
            .setEmoji(`1233103066975309984`)
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("canaisboasvindas")
            .setLabel('Canais')
            .setEmoji(`1233127513178247269`)
            .setStyle(1)
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_AcoesAutomaticsConfigs")
            .setEmoji(`1238413255886639104`)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji('1292237216915128361')
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

    let desc = `## ${Emojis.get('_support_emoji')} Canais de Boas Vindas\nGerencie os canais onde as mensagens de boas vindas serão enviadas.\n\n` +
        `**Canais configurados:** \`${canais.length}\``;

    if (canais.length > 0) {
        desc += `\n${canais.map(c => `<#${c}>`).join('\n')}`;
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("addcanalboasvindas")
            .setLabel('Adicionar Canal')
            .setEmoji(`1233110125330563104`)
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId("removercanalboasvindas")
            .setLabel('Remover Canal')
            .setEmoji(`1242907028079247410`)
            .setDisabled(canais.length === 0)
            .setStyle(4)
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_msgbemvindo")
            .setEmoji(`1238413255886639104`)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji('1292237216915128361')
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
