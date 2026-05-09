const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    MessageFlags
} = require("discord.js");
const { tickets } = require("../Database");
const emojis = require("../Database/emojis.json");
const Emojis = { get: (name) => emojis[name] || "" };

function buildTicketComponents(funcoes, aparencia) {
    const container = new ContainerBuilder();

    const tituloEmoji = aparencia.emoji ? `${aparencia.emoji} ` : `${Emojis.get('_ticket_emoji')} `;
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${tituloEmoji}${aparencia.title || 'Central de Suporte'}`
        )
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            aparencia.description || 'Selecione a opção abaixo que melhor se adequa à sua necessidade.'
        )
    );

    if (aparencia.banner) {
        try {
            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems({ media: { url: aparencia.banner } })
            );
        } catch (e) {}
    }

    container.addSeparatorComponents(new SeparatorBuilder());

    const funcList = Object.entries(funcoes);
    funcList.forEach(([key, funcao]) => {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**${funcao.predescricao || funcao.nome}**\n-# Clique em **${funcao.nome}** para abrir um ticket.`
            )
        );

        const btn = new ButtonBuilder()
            .setCustomId(`AbrirTicket_${key}`)
            .setLabel(funcao.nome)
            .setStyle(1);

        if (funcao.emoji) {
            try { btn.setEmoji(funcao.emoji); } catch (e) {}
        }

        container.addActionRowComponents(new ActionRowBuilder().addComponents(btn));
        container.addSeparatorComponents(new SeparatorBuilder());
    });

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `-# ${Emojis.get('system_emoji')} Nossa equipe geralmente responde em até 30 minutos.`
        )
    );

    return container;
}

function CreateMessageTicket(interaction, channelId, client) {
    const funcoes   = tickets.get('tickets.funcoes');
    const aparencia = tickets.get('tickets.aparencia');
    const channel   = client.channels.cache.get(channelId);

    if (!funcoes || !aparencia || !channel) return;

    const container = buildTicketComponents(funcoes, aparencia);

    channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
    }).then(msg => {
        const existing = tickets.get('tickets.messageid') || [];
        existing.push({ msgid: msg.id, channelid: msg.channel.id, guildid: msg.guild.id });
        tickets.set('tickets.messageid', existing);
    }).catch(err => {
        console.error('[Ticket] Erro ao postar mensagem:', err.message);
    });
}

async function Checkarmensagensticket(client) {
    const funcoes   = tickets.get('tickets.funcoes');
    const aparencia = tickets.get('tickets.aparencia');
    const items     = tickets.get('tickets.messageid');

    if (!items || !funcoes || !aparencia) return;

    const container = buildTicketComponents(funcoes, aparencia);

    for (const element of items) {
        try {
            const channel = client.channels.cache.get(element.channelid);
            if (!channel) continue;
            const msg = await channel.messages.fetch(element.msgid);
            await msg.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (e) {}
    }
}

module.exports = { CreateMessageTicket, Checkarmensagensticket };
