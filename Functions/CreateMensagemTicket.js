const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    MessageFlags
} = require("discord.js");
const { tickets } = require("../Database");
const emojis = require("../Database/emojis.json");
const Emojis = { get: (name) => emojis[name] || "" };

function buildTicketComponents(funcoes, aparencia) {
    const container = new ContainerBuilder();

    const tituloEmoji = aparencia.emoji ? `${aparencia.emoji} ` : '';
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

    if (funcList.length > 0) {
        const options = funcList.map(([key, funcao]) => {
            const option = {
                label: funcao.nome.slice(0, 100),
                value: key,
                description: (funcao.predescricao || `Clique para abrir um ticket de ${funcao.nome}`).slice(0, 100),
            };
            if (funcao.emoji) {
                try {
                    const emojiStr = String(funcao.emoji).trim();
                    // Apenas emojis customizados: <:nome:id> ou <a:nome:id>
                    const match = emojiStr.match(/^<(a?):(\w+):(\d+)>$/);
                    if (match) {
                        option.emoji = { name: match[2], id: match[3], animated: match[1] === 'a' };
                    } else if (/^\d{17,20}$/.test(emojiStr)) {
                        // Só o ID numérico
                        option.emoji = { id: emojiStr };
                    }
                    // Unicode emojis são ignorados — o bot usa apenas emojis de upload
                } catch (e) {}
            }
            return option;
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('abrirticket')
            .setPlaceholder('Selecione uma categoria de suporte...')
            .addOptions(options.slice(0, 25));

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(selectMenu)
        );
    }

    container.addSeparatorComponents(new SeparatorBuilder());

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

module.exports = { CreateMessageTicket, Checkarmensagensticket, buildTicketComponents };
