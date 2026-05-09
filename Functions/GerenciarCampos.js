const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { produtos, configuracao } = require("../Database");
const db = require("../Database").quickStore;


function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function GerenciarCampos2(interaction, campo, produtoname, update, reply) {
    let ggg;
    if (produtoname == undefined) {
        await db.set(`${interaction.message.id}.camposelect`, campo);
        ggg = await db.get(interaction.message.id);
    } else {
        ggg = { name: produtoname, camposelect: campo };
    }

    const hhhh = produtos.get(`${ggg.name}.Campos`);
    const gggaaa = hhhh.find(campo22 => campo22.Nome === campo);

    const infoCargosAdd = gggaaa.roleadd ? `Após a compra, terá o cargo <@&${gggaaa.roleadd}> adicionado` : '';
    const infoCargosRemove = gggaaa.rolerem ? `Após a compra, terá o cargo <@&${gggaaa.rolerem}> removido` : '';
    const infoCargosTemp24 = gggaaa.temprole24 ? `Tempo que o cargo <@&${gggaaa.roleadd}> irá durar após a compra: ${gggaaa.temprole24}` : '';
    const bothUndefined = !gggaaa.roleadd && !gggaaa.rolerem;

    const a1 = gggaaa.condicao?.idcargo ? `Possuir o cargo <@&${gggaaa.condicao?.idcargo}>.` : '';
    const a2 = gggaaa.condicao?.valorminimo ? `Comprar no mínimo ${gggaaa.condicao?.valorminimo} unidades.` : '';
    const a3 = gggaaa.condicao?.valormaximo ? `Comprar no máximo ${gggaaa.condicao?.valormaximo} unidades.` : '';
    const a4 = !gggaaa.condicao?.idcargo && !gggaaa.condicao?.valorminimo && !gggaaa.condicao?.valormaximo;
    const condicaoInfoValue = `${a1}${a2 && (a1 || a3) ? '\n' : ''}${a2}${a3 && (a2 || a1) ? '\n' : ''}${a3 || ''}`;

    const ggawdwadaw = produtos.get(`${ggg.name}.UltimaReposicao`);
    const detalhesaa = ggawdwadaw !== null
        ? `Última reposição no estoque <t:${Math.ceil(ggawdwadaw / 1000)}:R>`
        : `Criado <t:${Math.ceil(gggaaa.criado / 1000)}:R>`;

    const container = new ContainerBuilder();
    container;

    let content =
        `## ${gggaaa.Nome} — ${ggg.name}\n` +
        `**Estoque:** \`${gggaaa.estoque.length}\` | **Preço:** \`R$ ${Number(gggaaa.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`\n` +
        `**Condições:** ${a4 ? 'Não Definido' : condicaoInfoValue}\n` +
        `**Cargos:** ${bothUndefined ? 'Não Definido' : `${infoCargosAdd}${infoCargosTemp24 ? '\n' + infoCargosTemp24 : ''}${infoCargosRemove ? '\n' + infoCargosRemove : ''}`}\n` +
        `**Detalhes:** ${detalhesaa}`;

    if (gggaaa.desc !== '') content += `\n\n${gggaaa.desc}`;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("editarcampooo").setLabel('Editar').setEmoji("1501804003850322052").setStyle(1),
        new ButtonBuilder().setCustomId("cargosremadd").setLabel('Cargos').setEmoji("1501804124298023035").setStyle(1),
        new ButtonBuilder().setCustomId("gwdawdwadawawderenciarcampossss").setLabel('Definir condições').setEmoji("1501803905363869769").setStyle(1),
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("estoquedsadas").setLabel('Ver estoque').setEmoji("1501804058699366470").setStyle(2),
        new ButtonBuilder().setCustomId("addestoquecampos").setLabel('Adicionar estoque').setEmoji("1501803923126747178").setStyle(3),
        new ButtonBuilder().setCustomId("cleanestoquecampos").setLabel('Limpar estoque').setEmoji("1501803926180335727").setStyle(4),
    );

    const row5 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("Voltar4").setLabel('Voltar').setEmoji("1501803908589162537").setStyle(2),
    );

    container.addActionRowComponents(row2);
    container.addActionRowComponents(row3);
    container.addActionRowComponents(row5);

    const payload = { components: [container], flags: MessageFlags.IsComponentsV2, content: '', embeds: [] };

    if (produtoname == undefined) {
        await interaction.update(payload);
    } else {
        if (update !== true) {
            await interaction.reply({ ...payload, fetchReply: true, ephemeral: true }).then(async msg => {
                await db.set(`${msg.id}`, ggg);
            });
        } else {
            if (reply !== true) {
                await interaction.update(payload).then(async () => {
                    await db.set(`${interaction.message.id}`, ggg);
                });
            } else {
                await interaction.reply({ ...payload, ephemeral: true }).then(async () => {
                    const message = await interaction.fetchReply();
                    db.set(message.id, ggg);
                });
            }
        }
    }
}

async function GerenciarCampos(interaction, produtoname) {
    const ggg = produtos.get(produtoname);

    var campos = '';
    if (ggg.Campos.length === 0) {
        campos = 'Nenhum campo adicionado';
    } else {
        for (let i = ggg.Campos.length - 1; i >= Math.max(0, ggg.Campos.length - 5); i--) {
            const campooo = ggg.Campos[i];
            campos += `- Nome: \`${campooo.Nome}\` Estoque: \`${campooo.estoque.length}\` Valor: \`R$ ${Number(campooo.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`\n`;
        }
        if (ggg.Campos.length > 5) campos += `E mais ${ggg.Campos.length - 5}...`;
    }

    var cupom = '';
    if (ggg.Cupom.length === 0) {
        cupom = 'Nenhum cupom';
    } else {
        for (let i = ggg.Cupom.length - 1; i >= Math.max(0, ggg.Cupom.length - 3); i--) {
            const cupommmm = ggg.Cupom[i];
            const a1 = cupommmm.condicoes?.cargospodeusar ? `Possuí o cargo <@&${cupommmm.condicoes?.cargospodeusar}>` : '';
            const a2 = cupommmm.condicoes?.precominimo ? `Comprar no mínimo \`${cupommmm.condicoes?.precominimo}\` unidades` : '';
            const a3 = cupommmm.condicoes?.qtdmaxima ? `Comprar no máximo \`${cupommmm.condicoes?.qtdmaxima}\` unidades` : '';
            const a4 = !cupommmm.condicoes?.cargospodeusar && !cupommmm.condicoes?.precominimo && !cupommmm.condicoes?.qtdmaxima;
            const condicaoInfoValue = `${a1}${a2 && (a1 || a3) ? ',' : ''}${a2}${a3 && (a2 || a1) ? ',' : ''}${a3 || ''}`;
            cupom += `- Código: \`${cupommmm.Nome}\` Qtd: \`${cupommmm.qtd == undefined ? 'Ilimitado' : cupommmm.qtd}\` Desconto: \`${cupommmm.desconto}%\` Max. Usos: \`${cupommmm.maxuse == undefined ? 'Ilimitado' : cupommmm.maxuse}\` Validade: \`${cupommmm.diasvalidos2 == undefined ? 'Não expira' : cupommmm.diasvalidos2}\` N. Usos: \`${cupommmm.usos}\` Condições: ${a4 ? 'Não Definido' : condicaoInfoValue}\n`;
        }
        if (ggg.Cupom.length > 3) cupom += `E mais ${ggg.Cupom.length - 3}...`;
    }

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${ggg.Config.name} — Detalhes\n` +
            `**Entrega automática:** \`${ggg.Config.entrega}\`\n\n` +
            `**Campos:**\n${campos}\n\n` +
            `**Cupons:**\n${cupom}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const aaaaaa = produtos.get(`${produtoname}.Campos`);

    const selectMenuBuilder = new StringSelectMenuBuilder()
        .setCustomId('configurarcampooo')
        .setPlaceholder('Clique aqui para gerenciar algum campo')
        .setMinValues(0);

    for (const aaaaaab of aaaaaa) {
        const gggag = aaaaaab.desc == '' ? 'Não definido' : `${aaaaaab.desc}`;
        selectMenuBuilder.addOptions({
            label: `${aaaaaab.Nome}`,
            description: `${gggag.slice(0, 70)}`,
            value: aaaaaab.Nome,
        });
    }

    const row2 = new ActionRowBuilder().addComponents(selectMenuBuilder);

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("addcampoo").setLabel('Adicionar campo').setEmoji("1501803923126747178").setStyle(3),
        new ButtonBuilder().setCustomId("remcampo").setLabel('Remover campo').setEmoji("1501803926180335727").setStyle(4),
    );

    const row4 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("voltargerenciarproduto").setLabel('Voltar').setEmoji("1501803908589162537").setStyle(2),
    );

    if (selectMenuBuilder.options == 0) {
        container.addActionRowComponents(row3);
        container.addActionRowComponents(row4);
    } else {
        container.addActionRowComponents(row2);
        container.addActionRowComponents(row3);
        container.addActionRowComponents(row4);
    }

    const payload = { components: [container], flags: MessageFlags.IsComponentsV2, content: '', embeds: [] };

    if (selectMenuBuilder.options == 0) {
        try {
            await interaction.update(payload);
            await db.set(interaction.message.id, { name: produtoname });
        } catch (error) {
            await interaction.reply({ ...payload, fetchReply: true, ephemeral: true });
            interaction.fetchReply().then(async msg => {
                await db.set(`${msg.id}`, { name: produtoname });
            });
        }
    } else {
        try {
            await interaction.update(payload);
            await db.set(interaction.message.id, { name: produtoname });
        } catch (error) {
            interaction.reply({ ...payload, fetchReply: true, ephemeral: true });
            interaction.fetchReply().then(async msg => {
                await db.set(`${msg.id}`, { name: produtoname });
            });
        }
    }
}

module.exports = { GerenciarCampos, GerenciarCampos2 }
