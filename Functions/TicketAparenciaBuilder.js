const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ButtonStyle, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { tickets, Emojis } = require('../Database');

const NAV_OPTIONS = [
    { label: 'Menu Principal',  description: 'Voltar ao menu principal',          value: 'main',     emoji: { id: '1501804019184828507' } },
    { label: 'Título',          description: 'Editar título do painel',            value: 'titulo',   emoji: { id: '1501804003850322052' } },
    { label: 'Descrição',       description: 'Editar descrição do painel',         value: 'descricao',emoji: { id: '1501804039451709441' } },
    { label: 'Cor',             description: 'Editar cor do embed (hex)',           value: 'cor',      emoji: { id: '1501804122943389716' } },
    { label: 'Banner',          description: 'Editar imagem/banner do painel',     value: 'banner',   emoji: { id: '1501803928973476023' } },
    { label: 'Emoji do Título', description: 'Emoji exibido antes do título',      value: 'emoji',    emoji: { id: '1501804043121725490' } },
];

const SECTION_LABELS = {
    titulo: 'Título', descricao: 'Descrição', cor: 'Cor', banner: 'Banner', emoji: 'Emoji do Título',
};

const BOT_EMOJI_OPTIONS = [
    { label: 'Sem emoji',     value: 'sem_emoji',          description: 'Remove o emoji do título' },
    { label: 'Ticket',        value: '1501804043121725490', description: 'Ícone de ticket',       emoji: { id: '1501804043121725490' } },
    { label: 'Suporte',       value: '1501803899085131867', description: 'Ícone de suporte',      emoji: { id: '1501803899085131867' } },
    { label: 'Staff',         value: '1501803902046048297', description: 'Ícone de staff',        emoji: { id: '1501803902046048297' } },
    { label: 'Informação',    value: '1501803944375222392', description: 'Ícone de informação',   emoji: { id: '1501803944375222392' } },
    { label: 'Confirmado',    value: '1501803932484108359', description: 'Ícone de confirmação',  emoji: { id: '1501803932484108359' } },
    { label: 'Aviso',         value: '1501803941112053861', description: 'Ícone de aviso',        emoji: { id: '1501803941112053861' } },
    { label: 'Estrela',       value: '1501804049563910285', description: 'Destaque/estrela',      emoji: { id: '1501804049563910285' } },
    { label: 'Diamante',      value: '1501804052827209768', description: 'Premium/diamante',      emoji: { id: '1501804052827209768' } },
    { label: 'Configurações', value: '1501804030605922346', description: 'Ícone de config',       emoji: { id: '1501804030605922346' } },
    { label: 'Ferramenta',    value: '1501804000994132080', description: 'Ícone de ferramenta',   emoji: { id: '1501804000994132080' } },
    { label: 'Pasta',         value: '1501804010049634426', description: 'Ícone de pasta',        emoji: { id: '1501804010049634426' } },
    { label: 'Mensagens',     value: '1501804039451709441', description: 'Ícone de mensagens',    emoji: { id: '1501804039451709441' } },
    { label: 'Pincel',        value: '1501804122943389716', description: 'Design/aparência',      emoji: { id: '1501804122943389716' } },
    { label: 'Adicionar',     value: '1501803905363869769', description: 'Ícone de adicionar',    emoji: { id: '1501803905363869769' } },
    { label: 'Enviar',        value: '1501803923126747178', description: 'Ícone de envio',        emoji: { id: '1501803923126747178' } },
    { label: 'Notificar',     value: '1501804036540862464', description: 'Ícone de notificação',  emoji: { id: '1501804036540862464' } },
    { label: 'Fantasma',      value: '1501804033608777859', description: 'Ícone fantasma',        emoji: { id: '1501804033608777859' } },
    { label: 'Pessoas',       value: '1501803896073621706', description: 'Grupo/comunidade',      emoji: { id: '1501803896073621706' } },
    { label: 'Loja',          value: '1501803947898306724', description: 'Ícone de loja',         emoji: { id: '1501803947898306724' } },
    { label: 'Marca',         value: '1501804076189351949', description: 'Ícone de marca',        emoji: { id: '1501804076189351949' } },
    { label: 'Lápis',         value: '1501804003850322052', description: 'Ícone de edição',       emoji: { id: '1501804003850322052' } },
    { label: 'Relógio',       value: '1501804058699366470', description: 'Horário/tempo',         emoji: { id: '1501804058699366470' } },
    { label: 'Pergunta',      value: '1502520447340777482', description: 'Ícone de dúvida',       emoji: { id: '1502520447340777482' } },
    { label: 'Sistema',       value: '1501804019184828507', description: 'Ícone de sistema',      emoji: { id: '1501804019184828507' } },
];

const CV2 = { flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };

function buildPreviewText() {
    const data = tickets.get('tickets.aparencia') || {};
    const ok = Emojis.get('confirmed_emoji') || '✅';
    if (!data || Object.keys(data).length === 0) {
        return `-# Nenhuma aparência configurada. Defina as propriedades abaixo.`;
    }
    const lines = [];
    if (data.emoji)       lines.push(`**Emoji:** ${data.emoji}`);
    if (data.title)       lines.push(`**Título:** \`${data.title.slice(0, 60)}\``);
    if (data.description) lines.push(`**Descrição:** \`${data.description.slice(0, 80)}${data.description.length > 80 ? '...' : ''}\``);
    if (data.color)       lines.push(`**Cor:** \`${data.color}\``);
    if (data.banner)      lines.push(`**Banner:** ${ok} Definido`);
    return lines.length ? lines.join('\n') : `-# Nenhuma aparência configurada.`;
}

function buildNavSelect(userId, currentSection) {
    const options = NAV_OPTIONS.map(opt => ({ ...opt, default: opt.value === currentSection }));
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`taparel_nav_${userId}`)
            .setPlaceholder('Selecionar propriedade para editar...')
            .addOptions(options)
    );
}

function buildAparenciaMain(userId) {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_pincel_emoji')} Aparência do Painel de Tickets\n` +
        `-# Pré-visualização das propriedades configuradas`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(buildPreviewText()));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(buildNavSelect(userId, 'main'));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('painelconfigticket')
            .setLabel('Voltar ao Painel')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(ButtonStyle.Secondary),
    ));
    return { components: [container], ...CV2 };
}

function buildAparenciaSection(userId, section) {
    const sectionLabel = SECTION_LABELS[section] || section;
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_lapis_emoji')} Editando — ${sectionLabel}\n` +
        `-# Pré-visualização atual da aparência`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(buildPreviewText()));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(buildNavSelect(userId, section));

    if (section === 'emoji') {
        container.addActionRowComponents(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`taparel_emoji_pick_${userId}`)
                .setPlaceholder('Escolha um emoji para o título do painel...')
                .addOptions(BOT_EMOJI_OPTIONS)
        ));
    } else {
        container.addActionRowComponents(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`taparel_set_${section}_${userId}`)
                .setLabel(`Definir ${sectionLabel}`)
                .setEmoji({ id: '1501804003850322052' })
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`taparel_remove_${section}_${userId}`)
                .setLabel('Remover')
                .setEmoji({ id: '1501803935453679616' })
                .setStyle(ButtonStyle.Secondary),
        ));
    }

    return { components: [container], ...CV2 };
}

function buildFuncaoNavScreen(userId) {
    const funcoes = tickets.get('tickets.funcoes') || {};
    const nomes = Object.keys(funcoes);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_ticket_emoji')} Emojis das Funções\n` +
        `-# Selecione uma função para editar o emoji exibido no select menu do painel`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    if (nomes.length === 0) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `-# Nenhuma função cadastrada. Adicione funções primeiro no painel.`
        ));
    } else {
        const options = nomes.slice(0, 25).map(nome => {
            const f = funcoes[nome];
            const emojiId = f.emoji ? f.emoji.match(/\d{17,20}/)?.[0] : null;
            return {
                label: nome.slice(0, 100),
                value: nome,
                description: (f.predescricao || 'Sem pré-descrição').slice(0, 100),
                ...(emojiId ? { emoji: { id: emojiId } } : {}),
            };
        });
        container.addActionRowComponents(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`taparel_funcnav_${userId}`)
                .setPlaceholder('Selecione a função para editar o emoji...')
                .addOptions(options)
        ));
    }

    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('painelconfigticket')
            .setLabel('Voltar ao Painel')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(ButtonStyle.Secondary),
    ));

    return { components: [container], ...CV2 };
}

function buildFuncaoEmojiScreen(userId, nomeFuncao) {
    const funcao = tickets.get(`tickets.funcoes.${nomeFuncao}`) || {};
    const emojiLine = funcao.emoji
        ? `**Emoji atual:** ${funcao.emoji}`
        : `-# Nenhum emoji definido para esta função.`;

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('_ticket_emoji')} Emoji da Função — \`${nomeFuncao}\`\n` +
        `${emojiLine}`
    ));
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`taparel_feoji_${userId}_${nomeFuncao}`)
            .setPlaceholder('Escolha um emoji para esta função...')
            .addOptions(BOT_EMOJI_OPTIONS)
    ));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`taparel_funcback_${userId}`)
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(ButtonStyle.Secondary),
    ));

    return { components: [container], ...CV2 };
}

module.exports = {
    buildAparenciaMain,
    buildAparenciaSection,
    buildFuncaoNavScreen,
    buildFuncaoEmojiScreen,
    BOT_EMOJI_OPTIONS,
    SECTION_LABELS,
};
