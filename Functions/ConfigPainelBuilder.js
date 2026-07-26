const {
    EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder
} = require('discord.js');
const { configuracao, Emojis } = require('../Database');

const MAIN_OPTIONS = [
    { label: 'Atendimento',    value: 'atendimento',    description: 'Sistema de tickets e suporte',          emoji: { id: '1501804043121725490' } },
    { label: 'Support (EN)',   value: 'support_en',     description: 'English ticket system',                 emoji: { id: '1501803899085131867' } },
    { label: 'Automações',     value: 'automacoes',     description: 'Mensagens e repost automáticos',        emoji: { id: '1502541664579879072' } },
    { label: 'Moderação',      value: 'moderacao',      description: 'Ferramentas de moderação',              emoji: { id: '1501804067616325723' } },
    { label: 'Personalização', value: 'personalizacao', description: 'Bot designer e aparência do bot',       emoji: { id: '1501804122943389716' } },
    { label: 'Formulários',    value: 'formularios',    description: 'Sistema de formulários personalizados', emoji: { id: '1501804039451709441' } },
    { label: 'Forms (EN)',     value: 'formularios_en', description: 'English forms system (5 slots)',         emoji: { id: '1501803899085131867' } },
    { label: 'Vendas',         value: 'vendas',         description: 'Dropdown de vendas com PIX automático', emoji: { id: '1501803982849445998' } },
    { label: 'Definições',     value: 'definicoes',     description: 'Configurações gerais do sistema',       emoji: { id: '1501804030605922346' } },
];

const SUB_OPTIONS = {
    atendimento: [
        { label: 'Página Inicial',          value: 'home',               description: 'Voltar ao menu principal',                    emoji: { id: '1501803908589162537' } },
        { label: 'Configurar Tickets',       value: 'atendimento_config', description: 'Configurações do sistema de tickets',         emoji: { id: '1501804043121725490' } },
        { label: 'Postar Painel de Tickets', value: 'atendimento_postar', description: 'Enviar o painel de abertura de tickets',      emoji: { id: '1501803923126747178' } },
    ],
    support_en: [
        { label: 'Home',                    value: 'home',               description: 'Back to main menu',                           emoji: { id: '1501803908589162537' } },
        { label: 'Configure Tickets (EN)',   value: 'en_support_config',  description: 'Settings for the English ticket system',      emoji: { id: '1501804043121725490' } },
        { label: 'Post Panel (EN)',          value: 'en_support_postar',  description: 'Post the English ticket opening panel',        emoji: { id: '1501803923126747178' } },
    ],
    automacoes: [
        { label: 'Página Inicial',        value: 'home',             description: 'Voltar ao menu principal',        emoji: { id: '1501803908589162537' } },
        { label: 'Mensagens Automáticas', value: 'automacoes_msgs',  description: 'Configurar mensagens automáticas', emoji: { id: '1502541664579879072' } },
        { label: 'Repostagem Automática', value: 'automacoes_repost', description: 'Configurar repostagem automática', emoji: { id: '1501803917640732722' } },
    ],
    moderacao: [
        { label: 'Página Inicial',      value: 'home',            description: 'Voltar ao menu principal',          emoji: { id: '1501803908589162537' } },
        { label: 'Painel de Moderação', value: 'moderacao_config', description: 'Ferramentas e ações de moderação', emoji: { id: '1501804067616325723' } },
    ],
    personalizacao: [
        { label: 'Página Inicial',   value: 'home',                   description: 'Voltar ao menu principal',            emoji: { id: '1501803908589162537' } },
        { label: 'Meu Bot Designer', value: 'personalizacao_designer', description: 'Aparência e personalização do bot',   emoji: { id: '1501804122943389716' } },
        { label: 'Definições',       value: 'personalizacao_def',      description: 'Configurações gerais e integrações',  emoji: { id: '1501804030605922346' } },
    ],
    formularios: [
        { label: 'Página Inicial',        value: 'home',        description: 'Voltar ao menu principal',                     emoji: { id: '1501803908589162537' } },
        { label: 'Gerenciar Formulários', value: 'form_manage', description: 'Editar formulários existentes (máx. 5 slots)',  emoji: { id: '1501804003850322052' } },
        { label: 'Criar Formulário',      value: 'form_create', description: 'Criar um novo formulário personalizado',        emoji: { id: '1501803923126747178' } },
    ],
    formularios_en: [
        { label: 'Página Inicial',         value: 'home',           description: 'Voltar ao menu principal',                       emoji: { id: '1501803908589162537' } },
        { label: 'Manage Forms (EN)',       value: 'enform_manage',  description: 'Edit existing English forms (max. 5 slots)',     emoji: { id: '1501804003850322052' } },
        { label: 'Create Form (EN)',        value: 'enform_create',  description: 'Create a new English form',                      emoji: { id: '1501803923126747178' } },
    ],
    vendas: [
        { label: 'Página Inicial',          value: 'home',              description: 'Voltar ao menu principal',                      emoji: { id: '1501803908589162537' } },
        { label: 'Dropdown de Produtos',    value: 'vendas_dropdown',   description: 'Gerenciar seções do dropdown de vendas',        emoji: { id: '1501803947898306724' } },
        { label: 'Canais de Log',           value: 'vendas_logs',       description: 'Log de compras e pagamentos pendentes',         emoji: { id: '1501804019184828507' } },
        { label: 'Postar Painel de Vendas', value: 'vendas_postar',     description: 'Enviar o painel de vendas para um canal',       emoji: { id: '1501803923126747178' } },
    ],
    definicoes: [
        { label: 'Página Inicial',       value: 'home',               description: 'Voltar ao menu principal',              emoji: { id: '1501803908589162537' } },
        { label: 'Configurações Gerais', value: 'definicoes_gerais',   description: 'Configurações diversas do servidor',    emoji: { id: '1501804030605922346' } },
        { label: 'Moeda',                value: 'definicoes_moeda',    description: 'Configurar moeda e formato de preços',  emoji: { id: '1501803982849445998' } },
        { label: 'Log de Auditoria',     value: 'definicoes_auditlog', description: 'Canal de log para ações de configuração', emoji: { id: '1501804019184828507' } },
    ],
};

const CATEGORY_LABELS = {
    atendimento: 'Atendimento',
    automacoes: 'Automações', moderacao: 'Moderação',
    personalizacao: 'Personalização',
    formularios: 'Formulários', formularios_en: 'Forms (EN)',
    vendas: 'Vendas',
    definicoes: 'Definições',
};

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

function getCategoryHeader(category) {
    const map = {
        atendimento:    () => `${Emojis.get('_ticket_emoji')} Atendimento`,
        automacoes:     () => `${Emojis.get('_settings_emoji')} Automações`,
        moderacao:      () => `${Emojis.get('_ban_emoji')} Moderação`,
        personalizacao: () => `${Emojis.get('_pincel_emoji')} Personalização`,
        formularios:    () => `${Emojis.get('_messages_emoji')} Formulários`,
        formularios_en: () => `${Emojis.get('_messages_emoji')} Forms (EN)`,
        vendas:         () => `${Emojis.get('store_emoji')} Vendas`,
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
        { label: 'Página Inicial', value: 'home', description: 'Voltar ao menu principal', emoji: { id: '1501803908589162537' } },
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
            `**${userName}** · Owner\n\n` +
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
        { label: 'Página Inicial', value: 'home', description: 'Voltar ao menu principal', emoji: { id: '1501803908589162537' } },
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
