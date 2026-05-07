const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, perms } = require("../DataBaseJson");

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function gerenciarPerms(interaction, client) {
    const permsusers = perms.all().map((entry, index) => `**${index + 1}** - (<@${entry.ID}> | \`${entry.ID}\`)`).join('\n');

    const container = new ContainerBuilder();
    container.setAccentColor(getAccentColor());

    const descricao = perms.all().length === 0
        ? `\n${interaction.user}, nenhum usuário possui permissão de gerenciar o ${client.user.username}.`
        : `${interaction.user}, abaixo você pode gerenciar as pessoas que podem gerenciar o **${client.user.username}**.\n\n**Usuários com permissão:**\n${permsusers}`;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## Permissões\n${descricao}`)
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const rowConfigUsers = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('selectAdd&RemPerm')
            .addOptions(
                { value: 'addPermUser', label: 'Adicionar', description: 'Adicionar um usuário que ainda não tem permissão', emoji: '1238417761554927617' },
                { value: 'remPermUser', label: 'Remover', description: 'Remover um usuário que tem permissão', emoji: '1237188370116120606' }
            )
            .setPlaceholder('Clique aqui para redefinir as permissões')
            .setMaxValues(1)
    );

    const rowConfigUsers2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("resetPerms").setLabel('Resetar').setEmoji("1371593630707613846").setStyle(4).setDisabled(false),
        new ButtonBuilder().setCustomId("voltarProtect").setLabel("Voltar").setEmoji("1371593637179297923").setStyle(2)
    );

    container.addActionRowComponents(rowConfigUsers);
    container.addActionRowComponents(rowConfigUsers2);

    interaction.editReply({
        content: '',
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        embeds: []
    });
}

module.exports = { gerenciarPerms };
