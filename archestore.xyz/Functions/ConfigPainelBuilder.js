const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const MAIN_OPTIONS = [
    { label: 'Loja',           value: 'loja',          description: 'Sistema de vendas e produtos',            emoji: { id: '1371593620515328114' } },
    { label: 'Atendimento',    value: 'atendimento',   description: 'Sistema de tickets e suporte',            emoji: { id: '1371593631328243713' } },
    { label: 'Proteção',       value: 'protecao',      description: 'Anti-raid e segurança avançada',          emoji: { id: '1371593625112285208' } },
    { label: 'Automações',     value: 'automacoes',    description: 'Mensagens e repost automáticos',          emoji: { id: '1371572539213611090' } },
    { label: 'Moderação',      value: 'moderacao',     description: 'Ferramentas de moderação',                emoji: { id: '1501804067616325723' } },
    { label: 'Personalização', value: 'personalizacao',description: 'Bot designer e aparência do bot',         emoji: { id: '1371577449321726002' } },
    { label: 'Permissões',     value: 'permissoes',    description: 'Autorização e controle de acesso',        emoji: { id: '1371577447031640124' } },
    { label: 'Formulários',    value: 'formularios',   description: 'Sistema de formulários personalizados',   emoji: { id: '1371593612386635887' } },
    { label: 'Definições',     value: 'definicoes',    description: 'Configurações gerais do sistema',         emoji: { id: '1371571230041178125' } },
];

const SUB_OPTIONS = {
    loja: [
        { label: '← Página Inicial',      value: 'home',         description: 'Voltar ao menu principal',                emoji: { id: '1371593637179297923' } },
        { label: 'Gerenciar Produtos',     value: 'loja_produtos',description: 'Criar, editar e remover produtos',         emoji: { id: '1371593617868591185' } },
        { label: 'Configurações da Loja',  value: 'loja_config',  description: 'Configurações gerais da loja',            emoji: { id: '1371593620515328114' } },
        { label: 'Ligar / Desligar Loja',  value: 'loja_toggle',  description: 'Ativar ou desativar o sistema de vendas',  emoji: { id: '1371605368827940875' } },
    ],
    atendimento: [
        { label: '← Página Inicial',          value: 'home',               description: 'Voltar ao menu principal',                        emoji: { id: '1371593637179297923' } },
        { label: 'Configurar Tickets',         value: 'atendimento_config', description: 'Configurações do sistema de tickets',              emoji: { id: '1371593631328243713' } },
        { label: 'Postar Painel de Tickets',   value: 'atendimento_postar', description: 'Enviar painel de abertura de tickets no canal',    emoji: { id: '1371593623514124510' } },
    ],
    protecao: [
        { label: '← Página Inicial',    value: 'home',           description: 'Voltar ao menu principal',         emoji: { id: '1371593637179297923' } },
        { label: 'Proteção do Servidor', value: 'protecao_config',description: 'Anti-raid e filtros de segurança', emoji: { id: '1371593625112285208' } },
    ],
    automacoes: [
        { label: '← Página Inicial',       value: 'home',             description: 'Voltar ao menu principal',                  emoji: { id: '1371593637179297923' } },
        { label: 'Mensagens Automáticas',   value: 'automacoes_msgs',  description: 'Configurar mensagens automáticas',           emoji: { id: '1371572539213611090' } },
        { label: 'Repostagem Automática',   value: 'automacoes_repost',description: 'Configurar repostagem automática de produtos',emoji: { id: '1371593628069396591' } },
    ],
    moderacao: [
        { label: '← Página Inicial',    value: 'home',            description: 'Voltar ao menu principal',                 emoji: { id: '1371593637179297923' } },
        { label: 'Painel de Moderação',  value: 'moderacao_config',description: 'Ferramentas e ações de moderação',          emoji: { id: '1501804067616325723' } },
    ],
    personalizacao: [
        { label: '← Página Inicial',  value: 'home',                    description: 'Voltar ao menu principal',            emoji: { id: '1371593637179297923' } },
        { label: 'Meu Bot Designer',   value: 'personalizacao_designer', description: 'Aparência e personalização do bot',   emoji: { id: '1371577449321726002' } },
        { label: 'Definições',         value: 'personalizacao_def',      description: 'Configurações gerais e integrações',  emoji: { id: '1371571230041178125' } },
    ],
    permissoes: [
        { label: '← Página Inicial',      value: 'home',             description: 'Voltar ao menu principal',         emoji: { id: '1371593637179297923' } },
        { label: 'Gerenciar Permissões',   value: 'permissoes_config',description: 'Adicionar e remover permissões',    emoji: { id: '1371577447031640124' } },
    ],
    formularios: [
        { label: '← Página Inicial',      value: 'home',        description: 'Voltar ao menu principal',                        emoji: { id: '1371593637179297923' } },
        { label: 'Gerenciar Formulários',  value: 'form_manage', description: 'Editar formulários existentes (máx. 5 slots)',    emoji: { id: '1371593617868591185' } },
        { label: 'Criar Formulário',       value: 'form_create', description: 'Criar um novo formulário personalizado',          emoji: { id: '1371593623514124510' } },
    ],
    definicoes: [
        { label: '← Página Inicial',    value: 'home',              description: 'Voltar ao menu principal',                   emoji: { id: '1371593637179297923' } },
        { label: 'Configurações Gerais', value: 'definicoes_gerais', description: 'Configurações diversas do servidor',          emoji: { id: '1371571230041178125' } },
        { label: 'Moeda',                value: 'definicoes_moeda',  description: 'Configurar moeda e formato de preços',        emoji: { id: '1371593627477737502' } },
    ],
};

const CATEGORY_LABELS = {
    loja: 'Loja', atendimento: 'Atendimento', protecao: 'Proteção',
    automacoes: 'Automações', moderacao: 'Moderação', personalizacao: 'Personalização',
    permissoes: 'Permissões', formularios: 'Formulários', definicoes: 'Definições',
};

function buildEmbed(interaction, client) {
    const guildIcon = interaction.guild.iconURL({ dynamic: true, size: 256 }) || client.user.displayAvatarURL({ dynamic: true });
    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setAuthor({
            name: 'Central de Configurações',
            iconURL: guildIcon,
        })
        .addFields({ name: 'Administrador', value: `${interaction.user}`, inline: true })
        .setThumbnail(guildIcon)
        .setFooter({
            text: `Solicitado por: ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();
}

function buildMainDropdown(userId) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`config_main_${userId}`)
            .setPlaceholder('Nada selecionado.')
            .addOptions(MAIN_OPTIONS)
    );
}

function buildSubDropdown(userId, category) {
    const options = SUB_OPTIONS[category] || [
        { label: '← Página Inicial', value: 'home', description: 'Voltar ao menu principal', emoji: { id: '1371593637179297923' } },
    ];
    const label = CATEGORY_LABELS[category] || category;
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`config_sub_${userId}`)
            .setPlaceholder(`${label} — selecione uma opção`)
            .addOptions(options)
    );
}

module.exports = { buildEmbed, buildMainDropdown, buildSubDropdown, CATEGORY_LABELS };
