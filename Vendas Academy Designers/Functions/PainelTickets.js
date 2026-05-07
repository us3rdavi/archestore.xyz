const { ButtonBuilder, ActionRowBuilder, AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { tickets } = require("../DataBaseJson");

async function painelTicket(interaction) {
    const atualstatus24 = tickets.get("statusmsg") || false;

    if (atualstatus24) {
        const mensagemConfigurada = tickets.get(`tickets.aparencia.message`) || 'Nenhuma mensagem configurada.';
        const bannerMensagem = tickets.get(`tickets.aparencia.bannermsg`) || null;

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("definiraparencia")
                    .setLabel('Definir aparência')
                    .setEmoji("1371593617868591185")
                    .setStyle(2),
            );

        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("addfuncaoticket")
                    .setLabel('Adicionar função')
                    .setEmoji("1371593623514124510")
                    .setStyle(2),
                new ButtonBuilder()
                    .setCustomId("remfuncaoticket")
                    .setLabel('Remover função')
                    .setEmoji("1371593634029371432")
                    .setStyle(4),
                new ButtonBuilder()
                    .setCustomId("definirhorarioatendimento24")
                    .setLabel('Horario de atendimento')
                    .setEmoji("1371593613665894562")
                    .setStyle(2),
            );

        const row4 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("postarticket")
                    .setLabel('Postar')
                    .setEmoji("1371593628685832293")
                    .setStyle(1),
                new ButtonBuilder()
                    .setCustomId("voltar1")
                    .setLabel('Voltar')
                    .setEmoji("1371593637179297923")
                    .setStyle(2)
            );

        let attach24 = null;
        if (bannerMensagem) {
            attach24 = new AttachmentBuilder(bannerMensagem);
        }

        await interaction.update({
            content: mensagemConfigurada,
            files: attach24 ? [attach24] : [],
            embeds: [],
            components: [row2, row3, row4]
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setFooter(
            { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) }
        )
        .setTimestamp();

    if (tickets.get(`tickets.aparencia.title`) !== null) {
        embed.setTitle(tickets.get(`tickets.aparencia.title`));
    }
    if (tickets.get(`tickets.aparencia.description`) !== null) {
        embed.setDescription(tickets.get(`tickets.aparencia.description`));
    }
    if (tickets.get(`tickets.aparencia.color`) !== null) {
        embed.setColor(tickets.get(`tickets.aparencia.color`));
    }
    if (tickets.get(`tickets.aparencia.banner`) !== null) {
        embed.setImage(tickets.get(`tickets.aparencia.banner`));
    }

    const funcoes = tickets.get(`tickets.funcoes`);

    if (funcoes !== null) {
        let count = 0;
        let maxItems = 4;
        for (const chave in funcoes) {
            if (count >= maxItems) {
                break;
            }

            const objetoAtual = funcoes[chave];

            const nome = objetoAtual.nome;
            const predescricao = objetoAtual.predescricao;
            const descricao = objetoAtual.descricao;
            const emoji = objetoAtual.emoji;

            embed.addFields({ 
                name: `**${nome}**`, 
                value: `**Pré descrição:** \`${predescricao}\`\n**Emoji:** ${emoji == undefined ? `Não definido.` : emoji}\n**Descrição:**\n${descricao == undefined ? `Não definido, será enviado o principal.` : descricao}\n\n`
            });

            count++;
        }

        if (Object.keys(funcoes).length > maxItems) {
            const maisItens = `Mais ${Object.keys(funcoes).length - maxItems} item${Object.keys(funcoes).length - maxItems > 1 ? 's' : ''}...`;
            embed.addFields({ name: '\u200B', value: maisItens });
        }
    }

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("definiraparencia")
                .setLabel('Definir aparência')
                .setEmoji("1371593617868591185")
                .setStyle(2),
        );

    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("addfuncaoticket")
                .setLabel('Adicionar função')
                .setEmoji("1371593623514124510")
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId("remfuncaoticket")
                .setLabel('Remover função')
                .setEmoji("1371593634029371432")
                .setStyle(4),
            new ButtonBuilder()
                .setCustomId("definirhorarioatendimento24")
                .setLabel('Horario de atendimento')
                .setEmoji("1371593613665894562")
                .setStyle(2),
        );

    const row4 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("postarticket")
                .setLabel('Postar')
                .setEmoji("1371593628685832293")
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId("voltar1")
                .setLabel('Voltar')
                .setEmoji("1371593637179297923")
                .setStyle(2)
        );

    await interaction.update({ content: '', files: [], embeds: [embed], components: [row2, row3, row4] });
}

module.exports = {
    painelTicket
};
