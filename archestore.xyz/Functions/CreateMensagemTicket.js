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

function buildTicketComponents(ggg, aparencia) {
    const container = new ContainerBuilder();

    if (aparencia.color) {
        try {
            container;
        } catch (e) {
            container;
        }
    } else {
        container;
    }

    const tituloEmoji = aparencia.emoji ? `${aparencia.emoji} ` : `${Emojis.get('_support_emoji')} `;
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${tituloEmoji}${aparencia.title || 'Central de Suporte'}`
        )
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            aparencia.description || 'Selecione a opção que melhor se adequa às suas necessidades.'
        )
    );

    if (aparencia.banner) {
        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems({ media: { url: aparencia.banner } })
        );
    }

    container.addSeparatorComponents(new SeparatorBuilder());

    const funcoes = Object.entries(ggg);
    funcoes.forEach(([key, funcao]) => {
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

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(btn)
        );

        container.addSeparatorComponents(new SeparatorBuilder());
    });

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `-# ${Emojis.get('system_emoji')} Nossa equipe de suporte geralmente responde em 5 a 30 minutos.`
        )
    );

    return container;
}

function CreateMessageTicket(interaction, channel, client) {
    const ggg = tickets.get(`tickets.funcoes`);
    const aparencia = tickets.get(`tickets.aparencia`);
    const channel2 = client.channels.cache.get(channel);

    if (!ggg || !aparencia || !channel2) return;

    const container = buildTicketComponents(ggg, aparencia);

    channel2.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
    }).then(msg => {
        tickets.push(`tickets.messageid`, {
            msgid: msg.id,
            channelid: msg.channel.id,
            guildid: msg.guild.id
        });
    }).catch(err => {
        console.error('[Ticket] Erro ao postar mensagem:', err.message);
    });
}

async function Checkarmensagensticket(client) {
    const ggg = tickets.get(`tickets.funcoes`);
    const aparencia = tickets.get(`tickets.aparencia`);
    const item = tickets.get(`tickets.messageid`);

    if (!item || !ggg || !aparencia) return;

    const container = buildTicketComponents(ggg, aparencia);

    for (const element of item) {
        try {
            const channel = client.channels.cache.get(element.channelid);
            if (!channel) continue;

            const msg = await channel.messages.fetch(element.msgid);
            await msg.edit({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch (error) {}
    }
}

module.exports = {
    CreateMessageTicket,
    Checkarmensagensticket
};
