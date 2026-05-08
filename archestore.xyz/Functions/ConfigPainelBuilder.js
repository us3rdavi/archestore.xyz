const {
    EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder
} = require('discord.js');
const { configuracao, Emojis } = require('../DataBaseJson');

const MAIN_OPTIONS = [
    { label: 'Atendimento',    value: 'atendimento',    description: 'Sistema de tickets e suporte',          emoji: { id: '1371593631328243713' } },
    { label: 'Proteção',       value: 'protecao',       description: 'Anti-raid e segurança avançada',        emoji: { id: '1371593625112285208' } },
    { label: 'Automações',     value: 'automacoes',     description: 'Mensagens e repost automáticos',        emoji: { id: '1371572539213611090' } },
    { label: 'Moderação',      value: 'moderacao',      description: 'Ferramentas de moderação',              emoji: { id: '1501804067616325723' } },
    { label: 'Personalização', value: 'personalizacao', description: 'Bot designer e aparência do bot',       emoji: { id: '1501804122943389716' } },
    { label: 'Permissões',     value: 'permissoes',     description: 'Autorização e controle de acesso',      emoji: { id: '1371577447031640124' } },
    { label: 'Formulários',    value: 'formularios',    description: 'Sistema de formulários personalizados', emoji: { id: '1371593612386635887' } },
    { label: 'Definições',     value: 'definicoes',     description: 'Configurações gerais do sistema',       emoji: { id: '1371571230041178125' } },
];

const SUB_OPTIONS = {
    atendimento: [
        { label: 'Página Inicial',          value: 'home',               description: 'Voltar ao menu principal',                    emoji: { id: '1371593637179297923' } },
        { label: 'Configurar Tickets',       value: 'atendimento_config', description: 'Configurações do sistema de tickets',         emoji: { id: '1371593631328243713' } },
        { label: 'Postar Painel de Tickets', value: 'atendimento_postar', description: 'Enviar o painel de abertura de tickets',      emoji: { id: '1371593623514124510' } },
    ],
    protecao: [
        { label: 'Página Inicial',      value: 'home',            description: 'Voltar ao menu principal',         emoji: { id: '1371593637179297923' } },
        { label: 'Proteção do Servidor', value: 'protecao_config', description: 'Anti-raid e filtros de segurança', emoji: { id: '1371593625112285208' } },
    ],
    automacoes: [
        { label: 'Página Inicial',        value: 'home',             description: 'Voltar ao menu principal',        emoji: { id: '1371593637179297923' } },
        { label: 'Mensagens Automáticas', value: 'automacoes_msgs',  description: 'Configurar mensagens automáticas', emoji: { id: '1371572539213611090' } },
        { label: 'Repostagem Automática', value: 'automacoes_repost', description: 'Configurar repostagem automática', emoji: { id: '1371593628069396591' } },
    ],
    moderacao: [
        { label: 'Página Inicial',      value: 'home',            description: 'Voltar ao menu principal',          emoji: { id: '1371593637179297923' } },
        { label: 'Painel de Moderação', value: 'moderacao_config', description: 'Ferramentas e ações de moderação', emoji: { id: '1501804067616325723' } },
    ],
    personalizacao: [
        { label: 'Página Inicial',   value: 'home',                   description: 'Voltar ao menu principal',            emoji: { id: '1371593637179297923' } },
        { label: 'Meu Bot Designer', value: 'personalizacao_designer', description: 'Aparência e personalização do bot',   emoji: { id: '1501804122943389716' } },
        { label: 'Definições',       value: 'personalizacao_def',      description: 'Configurações gerais e integrações',  emoji: { id: '1371571230041178125' } },
    ],
    permissoes: [
        { label: 'Página Inicial',       value: 'home',             description: 'Voltar ao menu principal',       emoji: { id: '1371593637179297923' } },
        { label: 'Gerenciar Permissões', value: 'permissoes_config', description: 'Adicionar e remover permissões', emoji: { id: '1371577447031640124' } },
    ],
    formularios: [
        { label: 'Página Inicial',        value: 'home',        description: 'Voltar ao menu principal',                     emoji: { id: '1371593637179297923' } },
        { label: 'Gerenciar Formulários', value: 'form_manage', description: 'Editar formulários existentes (máx. 5 slots)',  emoji: { id: '1371593617868591185' } },
        { label: 'Criar Formulário',      value: 'form_create', description: 'Criar um novo formulário personalizado',        emoji: { id: '1371593623514124510' } },
    ],
    definicoes: [
        { label: 'Página Inicial',       value: 'home',               description: 'Voltar ao menu principal',              emoji: { id: '1371593637179297923' } },
        { label: 'Configurações Gerais', value: 'definicoes_gerais',   description: 'Configurações diversas do servidor',    emoji: { id: '1371571230041178125' } },
        { label: 'Moeda',                value: 'definicoes_moeda',    description: 'Configurar moeda e formato de preços',  emoji: { id: '1371593627477737502' } },
        { label: 'Log de Auditoria',     value: 'definicoes_auditlog', description: 'Canal de log para ações de configuração', emoji: { id: '1501804019184828507' } },
    ],
};

const CATEGORY_LABELS = {
    atendimento: 'Atendimento', protecao: 'Proteção',
    automacoes: 'Automações', moderacao: 'Moderação',
    personalizacao: 'Personalização', permissoes: 'Permissões',
    formularios: 'Formulários', definicoes: 'Definições',
};

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

function getCategoryHeader(category) {
    const map = {
        atendimento:    () => `${Emojis.get('_ticket_emoji')} Atendimento`,
        protecao:       () => `${Emojis.get('defense_emoji')} Proteção`,
        automacoes:     () => `${Emojis.get('system_emoji')} Automações`,
        moderacao:      () => `${Emojis.get('_ban_emoji')} Moderação`,
        personalizacao: () => `${Emojis.get('_pincel_emoji')} Personalização`,
        permissoes:     () => `${Emojis.get('permissions_emoji')} Permissões`,
        formularios:    () => `${Emojis.get('_messages_emoji')} Formulários`,
        definicoes:     () => `${Emojis.get('_settings_emoji')} Definições`,
    };
    return (map[category] ? map[category]() : `${Emojis.get('_settings_emoji')} ${CATEGORY_LABELS[category] || category}`);
}

function buildEmbed(interaction, client) {
    const guildIcon = interaction.guild.iconURL({ dynamic: true, size: 256 }) || client.user.displayAvatarURL({ dynamic: true });
    const cor = getAccentColor();
    return new EmbedBuilder()
        .setColor(cor)
        .setAuthor({ name: 'Central de Configurações', iconURL: guildIcon })
        .addFields({ name: 'Administrador', value: `${interaction.user}`, inline: true })
        .setThumbnail(guildIcon)
        .setFooter({ text: `Solicitado por: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();
}

function buildMainDropdown(userId) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`config_main_${userId}`)
            .setPlaceholder('Selecione uma categoria...')
            .addOptions(MAIN_OPTIONS)
    );
}

function buildSubDropdown(userId, category) {
    const options = SUB_OPTIONS[category] || [
        { label: 'Página Inicial', value: 'home', description: 'Voltar ao menu principal', emoji: { id: '1371593637179297923' } },
    ];
    const label = CATEGORY_LABELS[category] || category;
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`config_sub_${userId}`)
            .setPlaceholder(`${label} — selecione uma opção`)
            .addOptions(options)
    );
}

function buildMainPanel(userId, interaction) {
    const userName = interaction?.user?.displayName || interaction?.user?.username || 'Administrador';
    const guildName = interaction?.guild?.name || '';

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_settings_emoji')} Central de Configurações\n` +
            `${Emojis.get('_silueta_emoji')} **${userName}** — ${guildName}\n\n` +
            `${Emojis.get('information_emoji')} Use o menu abaixo para navegar entre as **${MAIN_OPTIONS.length} categorias** disponíveis.\n` +
            `-# Apenas usuários autorizados podem realizar alterações.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`config_main_${userId}`)
                .setPlaceholder('Selecione uma categoria...')
                .addOptions(MAIN_OPTIONS)
        )
    );

    return container;
}

function buildSubPanel(userId, category) {
    const options = SUB_OPTIONS[category] || [
        { label: 'Página Inicial', value: 'home', description: 'Voltar ao menu principal', emoji: { id: '1371593637179297923' } },
    ];
    const label = CATEGORY_LABELS[category] || category;
    const header = getCategoryHeader(category);

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${header}\n` +
            `-# Selecione uma opção abaixo para continuar.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`config_sub_${userId}`)
                .setPlaceholder(`${label} — selecione uma opção`)
                .addOptions(options)
        )
    );

    return container;
}

module.exports = { buildEmbed, buildMainDropdown, buildSubDropdown, buildMainPanel, buildSubPanel, CATEGORY_LABELS, getAccentColor };
