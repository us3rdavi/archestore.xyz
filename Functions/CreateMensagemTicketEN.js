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

function buildTicketComponentsEN(funcoes, aparencia) {
    const container = new ContainerBuilder();

    const tituloEmoji = aparencia.emoji ? `${aparencia.emoji} ` : '';
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${tituloEmoji}${aparencia.title || 'Support Center'}`
        )
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            aparencia.description || 'Select the option below that best fits your needs.'
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
                description: (funcao.predescricao || `Click to open a ticket for ${funcao.nome}`).slice(0, 100),
            };
            if (funcao.emoji) {
                try {
                    const emojiStr = String(funcao.emoji).trim();
                    const match = emojiStr.match(/^<(a?):(\w+):(\d+)>$/);
                    if (match) {
                        option.emoji = { name: match[2], id: match[3], animated: match[1] === 'a' };
                    } else if (/^\d{17,20}$/.test(emojiStr)) {
                        option.emoji = { id: emojiStr };
                    }
                } catch (e) {}
            }
            return option;
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('en_abrirticket')
            .setPlaceholder('Select a support category...')
            .addOptions(options.slice(0, 25));

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(selectMenu)
        );
    }

    return container;
}

function CreateMessageTicketEN(interaction, channelId, client) {
    const funcoes   = tickets.get('en.funcoes');
    const aparencia = tickets.get('en.aparencia');
    const channel   = client.channels.cache.get(channelId);

    if (!funcoes || !aparencia || !channel) return;

    const container = buildTicketComponentsEN(funcoes, aparencia);

    channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
    }).then(msg => {
        const existing = tickets.get('en.messageid') || [];
        existing.push({ msgid: msg.id, channelid: msg.channel.id, guildid: msg.guild.id });
        tickets.set('en.messageid', existing);
    }).catch(err => {
        console.error('[TicketEN] Error posting message:', err.message);
    });
}

async function CheckarmensagensticketEN(client) {
    const funcoes   = tickets.get('en.funcoes');
    const aparencia = tickets.get('en.aparencia');
    const items     = tickets.get('en.messageid');

    if (!items || !funcoes || !aparencia) return;

    const container = buildTicketComponentsEN(funcoes, aparencia);

    for (const element of items) {
        try {
            const channel = client.channels.cache.get(element.channelid);
            if (!channel) continue;
            const msg = await channel.messages.fetch(element.msgid);
            await msg.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (e) {}
    }
}

module.exports = { CreateMessageTicketEN, CheckarmensagensticketEN, buildTicketComponentsEN };
