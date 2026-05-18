const {
    ApplicationCommandType,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} = require('discord.js');
const { Emojis } = require('../../Database');
const { getPermissions, getRolePermissions } = require('../../Functions/PermissionsCache.js');
const config = require('../../config.json');

async function buildPermsPanel(client, interaction) {
    const permIds   = getPermissions();
    const roleIds   = getRolePermissions();
    const userName  = interaction?.member?.displayName
        || interaction?.user?.displayName
        || interaction?.user?.username;

    const userLines = permIds.map(id => {
        const isOwner = String(id) === String(config.owner);
        const cached  = client.users.cache.get(id);
        const label   = cached ? `**${cached.username}**` : `\`${id}\``;
        return `${Emojis.get('permissions_emoji')} ${label}${isOwner ? ' — *titular*' : ''}`;
    });

    const roleLines = roleIds.map(id => {
        const guild  = interaction?.guild;
        const cached = guild?.roles.cache.get(id);
        const label  = cached ? `**${cached.name}**` : `\`${id}\``;
        return `${Emojis.get('_staff_emoji')} ${label}`;
    });

    const usersList = userLines.length > 0
        ? userLines.join('\n')
        : `-# Nenhum usuário configurado além do titular.`;

    const rolesList = roleLines.length > 0
        ? roleLines.join('\n')
        : `-# Nenhum cargo configurado.`;

    const nonOwnerUsers = permIds.filter(id => String(id) !== String(config.owner));

    const c = new ContainerBuilder();

    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('permissions_emoji')} Sistema de Permissões\n` +
        `**${userName}** · Owner\n\n` +
        `${Emojis.get('information_emoji')} Gerencie quem pode usar os comandos do bot.\n` +
        `-# Somente o titular pode alterar permissões.`
    ));

    c.addSeparatorComponents(new SeparatorBuilder());

    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${Emojis.get('_silueta_emoji')} **Usuários autorizados:** \`${permIds.length}\`\n\n` +
        usersList
    ));

    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('perms_add')
            .setLabel('Adicionar usuário')
            .setEmoji({ id: '1501803905363869769' })
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('perms_remove')
            .setLabel('Remover usuário')
            .setEmoji({ id: '1501803926180335727' })
            .setDisabled(nonOwnerUsers.length === 0)
            .setStyle(ButtonStyle.Danger),
    ));

    c.addSeparatorComponents(new SeparatorBuilder());

    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${Emojis.get('_staff_emoji')} **Cargos autorizados:** \`${roleIds.length}\`\n\n` +
        rolesList
    ));

    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('perms_addrole')
            .setLabel('Adicionar cargo')
            .setEmoji({ id: '1501803905363869769' })
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('perms_removerole')
            .setLabel('Remover cargo')
            .setEmoji({ id: '1501803926180335727' })
            .setDisabled(roleIds.length === 0)
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('perms_refresh')
            .setLabel('Atualizar')
            .setEmoji({ id: '1501803920576745522' })
            .setStyle(ButtonStyle.Secondary),
    ));

    return c;
}

module.exports = {
    name: 'perms',
    description: 'Gerencia o sistema de permissões do bot.',
    type: ApplicationCommandType.ChatInput,
    buildPermsPanel,

    run: async (client, interaction) => {
        if (String(interaction.user.id) !== String(config.owner)) {
            return interaction.reply({
                content: `${Emojis.get('negative_emoji')} Apenas o titular pode gerenciar as permissões do bot.`,
                flags: MessageFlags.Ephemeral,
            });
        }

        const c = await buildPermsPanel(client, interaction);
        await interaction.reply({
            components: [c],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
    },
};
