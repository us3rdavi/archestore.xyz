const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } = require("discord.js");
const { configuracao, perms } = require("../DataBaseJson");

async function gerenciarPerms(interaction, client) {

    const permsusers = perms.all().map((entry, index) => `**${index + 1}** - (<@${entry.ID}> | \`${entry.ID}\`)`).join('\n')

    const embedInfoUsersPerm = new EmbedBuilder()
        .setColor(`${configuracao.get(`Cores.Principal`) == null ? "5865F2" : configuracao.get("Cores.Principal")}`)
        .setTitle(`Permissões`)
        .setDescription(`${perms.all().length == 0 ? `\n\n- Senhor(a) ${interaction.user}, nenhum usuário possui permissão de gerenciar seu ${client.user.username}.` : `- Senhor(a) ${interaction.user}, abaixo você pode gerenciar as pessoas que podem gerenciar o seu ${client.user.username}.\n\n**Usuários com permissão:**\n${permsusers}`}`)
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp();

    const rowConfigUsers = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
        .setCustomId(`selectAdd&RemPerm`)
        .addOptions(
            {
                value: `addPermUser`,
                label: `Adicionar`,
                description: `Adicionar um usuário que ainda não tem permissão`,
                emoji: `1238417761554927617`
            },
            {
                value: `remPermUser`,
                label: `Remover`,
                description: `Remover um usuário que tem permissão`,
                emoji: `1237188370116120606`
            }
        )
        .setPlaceholder('Clique aqui para redefinir as permissões')
        .setMaxValues(1)
    );

    const rowConfigUsers2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("resetPerms")
            .setLabel(`Resetar`)
            .setEmoji("1371593630707613846")
            .setStyle(4)
            .setDisabled(false),
        new ButtonBuilder()
            .setCustomId("voltarProtect")
            .setLabel("Voltar")
            .setEmoji("1371593637179297923")
            .setStyle(2)
    );

    interaction.editReply({ content: ``, components: [rowConfigUsers, rowConfigUsers2], embeds: [embedInfoUsersPerm] });
}

module.exports = {
    gerenciarPerms,
};