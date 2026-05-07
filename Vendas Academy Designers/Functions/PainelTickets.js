const { ButtonBuilder, ActionRowBuilder, AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { tickets } = require("../DataBaseJson");

async function painelTicket(interaction, useEditReply = false) {
    const atualstatus24 = tickets.get("statusmsg") || false;

    if (atualstatus24) {
        const mensagemConfigurada = tickets.get(`tickets.aparencia.message`) || 'Nenhuma mensagem configurada.';
        const bannerMensagem = tickets.get(`tickets.aparencia.bannermsg`) || null;

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("definiraparencia")
                .setLabel('Definir aparência')
                .setEmoji("1371593617868591185")
                .setStyle(2)
        );
        const row3 = new ActionRowBuilder().addComponents(
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
                .setLabel('Horário de atendimento')
                .setEmoji("1371593613665894562")
                .setStyle(2)
        );
        const row4 = new ActionRowBuilder().addComponents(
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
        if (bannerMensagem) attach24 = new AttachmentBuilder(bannerMensagem);

        const payload = {
            content: mensagemConfigurada,
            files: attach24 ? [attach24] : [],
            embeds: [],
            components: [row2, row3, row4]
        };

        if (useEditReply) await interaction.editReply(payload);
        else await interaction.update(payload);
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle('⚙️ Central de Atendimento')
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp();

    if (tickets.get(`tickets.aparencia.title`) !== null) {
        embed.addFields({ name: '📋 Título do Painel', value: tickets.get(`tickets.aparencia.title`) || 'Não definido', inline: true });
    }
    if (tickets.get(`tickets.aparencia.color`) !== null) {
        embed.setColor(tickets.get(`tickets.aparencia.color`) || '#5865F2');
    }

    const canalTickets = tickets.get('tickets.canalTickets');
    const canalLogs = tickets.get('tickets.canalLogs');
    const staffRoles = tickets.get('tickets.staffRoles') || [];
    const contador = tickets.get('tickets.contador') || 0;
    const botoesAdicionais = tickets.get('tickets.botoesAdicionais') || [];

    embed.addFields(
        { name: '🎫 Canal de Tickets', value: canalTickets ? `<#${canalTickets}>` : '`Não configurado`', inline: true },
        { name: '📋 Canal de Logs', value: canalLogs ? `<#${canalLogs}>` : '`Não configurado`', inline: true },
        { name: '👮 Cargos Staff', value: staffRoles.length > 0 ? staffRoles.map(r => `<@&${r}>`).join(', ') : '`Nenhum configurado`', inline: false },
        { name: '🔢 Total de Tickets', value: `\`${contador}\``, inline: true },
        { name: '➕ Botões Adicionais', value: `\`${botoesAdicionais.length}\` botão(ões)`, inline: true }
    );

    const funcoes = tickets.get(`tickets.funcoes`);
    if (funcoes !== null && Object.keys(funcoes).length > 0) {
        const funcList = Object.keys(funcoes).slice(0, 5).join(', ');
        embed.addFields({ name: '📁 Funções Configuradas', value: funcList + (Object.keys(funcoes).length > 5 ? ` +${Object.keys(funcoes).length - 5}` : ''), inline: false });
    }

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("definiraparencia")
            .setLabel('Aparência do Painel')
            .setEmoji("1371593617868591185")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("configmensageminicial")
            .setLabel('Mensagem Inicial')
            .setEmoji("1371593617868591185")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("configmensagemfinal")
            .setLabel('Mensagem de Finalização')
            .setEmoji("1371593617868591185")
            .setStyle(2)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("canalticketconfigsystem")
            .setLabel('Canal de Tickets')
            .setEmoji("1371593613665894562")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("canallogsticket2")
            .setLabel('Canal de Logs')
            .setEmoji("1371593613665894562")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("cargosstaff")
            .setLabel('Cargos Staff')
            .setEmoji("1371593623514124510")
            .setStyle(2)
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("addfuncaoticket")
            .setLabel('Adicionar Função')
            .setEmoji("1371593623514124510")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("remfuncaoticket")
            .setLabel('Remover Função')
            .setEmoji("1371593634029371432")
            .setStyle(4),
        new ButtonBuilder()
            .setCustomId("definirhorarioatendimento24")
            .setLabel('Horário de Atendimento')
            .setEmoji("1371593613665894562")
            .setStyle(2)
    );

    const row4 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("adicionarbotaoticket")
            .setLabel('Adicionar Botão')
            .setEmoji("1371593623514124510")
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("removerbotoesticket")
            .setLabel('Remover Botão')
            .setEmoji("1371593634029371432")
            .setStyle(4)
    );

    const row5 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("postarticket")
            .setLabel('Postar Painel')
            .setEmoji("1371593628685832293")
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId("voltar1")
            .setLabel('Voltar')
            .setEmoji("1371593637179297923")
            .setStyle(2)
    );

    const payload = { content: '', files: [], embeds: [embed], components: [row1, row2, row3, row4, row5] };

    if (useEditReply) await interaction.editReply(payload);
    else await interaction.update(payload);
}

module.exports = { painelTicket };
