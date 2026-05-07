const {
    ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao } = require("../DataBaseJson");
const { EstatisticasKing } = require("../index.js");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

function formatPosicao(pos, nome) {
    if (pos == undefined) return `**${nome}:** \`Não configurado\``;
    return `**${nome}:** <@&${pos.role}> após gastar \`R$ ${Number(pos.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``;
}

function Posicao1(interaction, client) {
    const aa = configuracao.get('posicoes');
    const pos1 = aa?.pos1;
    const pos2 = aa?.pos2;
    const pos3 = aa?.pos3;

    const container = new ContainerBuilder();
    container.setAccentColor(getAccentColor());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## Configurar Posições\n` +
            `As "posições" são cargos personalizáveis que os clientes recebem quando gastam uma certa quantia no servidor.\n\n` +
            `${formatPosicao(pos1, 'Primeira Colocação')}\n` +
            `${formatPosicao(pos2, 'Segunda Colocação')}\n` +
            `${formatPosicao(pos3, 'Terceira Colocação')}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const row4 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("Editarprimeiraposição")
            .setLabel('Editar primeira posição')
            .setEmoji('1192563018547081369')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("Editarsegundaposição")
            .setLabel('Editar segunda posição')
            .setEmoji('1192563056522309672')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("Editarterceiraposição")
            .setLabel('Editar terceira posição')
            .setEmoji('1192563090726846464')
            .setStyle(1)
    );

    const botoesvoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar3")
            .setEmoji('1238413255886639104')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('voltar1')
            .setEmoji('1371580875615113307')
            .setStyle(1)
    );

    container.addActionRowComponents(row4);
    container.addActionRowComponents(botoesvoltar);

    interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

async function CheckPosition(client) {
    const aa = configuracao.get('posicoes');
    if (aa === null) return;
    const { pos1, pos2, pos3 } = aa ?? {};
    await Promise.all(client.guilds.cache.map(async (guild) => {
        await processPosition(pos1, guild);
        await processPosition(pos2, guild);
        await processPosition(pos3, guild);
    }));
    async function processPosition(pos, guild) {
        if (!pos) return;
        const role = guild.roles.cache.get(pos.role);
        const aa = await EstatisticasKing.GastouMais(null, Number(pos.valor));
        try {
            const members = await guild.members.fetch({ user: aa.map(user => user.userid) });
            for (const user of aa) {
                const member = members.get(user.userid);
                if (member && !member.roles.cache.has(role.id)) {
                    await member.roles.add(role.id).catch(() => { });
                }
            }
        } catch (error) { }
    }
}

module.exports = { Posicao1, CheckPosition }
