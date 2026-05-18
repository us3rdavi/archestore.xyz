const {
    ActionRowBuilder,
    UserSelectMenuBuilder,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
} = require('discord.js');
const { Emojis } = require('../../Database');
const {
    getPermissions, addPermission, removePermission,
    getRolePermissions, addRolePermission, removeRolePermission,
} = require('../../Functions/PermissionsCache.js');
const { buildPermsPanel } = require('../../ComandosSlash/Administracao/perms.js');
const config = require('../../config.json');

const CV2 = { flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };

function isOwner(interaction) {
    return String(interaction.user.id) === String(config.owner);
}

async function replyNoPerms(interaction) {
    return interaction.reply({
        content: `${Emojis.get('negative_emoji')} Sem permissão.`,
        flags: MessageFlags.Ephemeral,
    });
}

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        const cid = interaction.customId;
        if (!cid || !cid.startsWith('perms_')) return;

        if (!isOwner(interaction)) return replyNoPerms(interaction);

        // ── Botões ──────────────────────────────────────────────────────────

        if (interaction.isButton()) {

            // Atualizar painel
            if (cid === 'perms_refresh') {
                await interaction.deferUpdate();
                const c = await buildPermsPanel(client, interaction);
                await interaction.editReply({ components: [c], ...CV2 });
                return;
            }

            // Adicionar usuário
            if (cid === 'perms_add') {
                await interaction.deferUpdate();
                const cont = new ContainerBuilder();
                cont.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('permissions_emoji')} Adicionar Usuário\n` +
                    `Selecione o(s) usuário(s) que deseja autorizar a usar os comandos do bot.\n\n` +
                    `-# Você pode selecionar até 10 usuários de uma vez.`
                ));
                cont.addSeparatorComponents(new SeparatorBuilder());
                cont.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new UserSelectMenuBuilder()
                            .setCustomId('perms_add_select')
                            .setPlaceholder('Selecione um ou mais usuários...')
                            .setMaxValues(10)
                    )
                );
                await interaction.editReply({ components: [cont], ...CV2 });
                return;
            }

            // Remover usuário
            if (cid === 'perms_remove') {
                await interaction.deferUpdate();
                const permIds = getPermissions().filter(id => String(id) !== String(config.owner));
                if (permIds.length === 0) {
                    const cont = new ContainerBuilder();
                    cont.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `${Emojis.get('negative_emoji')} Não há usuários para remover além do titular.`
                    ));
                    await interaction.editReply({ components: [cont], ...CV2 });
                    return;
                }
                const options = permIds.map(id => {
                    const cached = client.users.cache.get(id);
                    return {
                        label: cached ? cached.username : `ID: ${id}`,
                        description: `ID: ${id}`,
                        value: id,
                        emoji: { id: '1501804064596558017' },
                    };
                });
                const cont = new ContainerBuilder();
                cont.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('permissions_emoji')} Remover Usuário\n` +
                    `Selecione o usuário que deseja remover do sistema de permissões.`
                ));
                cont.addSeparatorComponents(new SeparatorBuilder());
                cont.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('perms_remove_select')
                            .setPlaceholder('Selecione um usuário...')
                            .addOptions(options)
                    )
                );
                await interaction.editReply({ components: [cont], ...CV2 });
                return;
            }

            // Adicionar cargo
            if (cid === 'perms_addrole') {
                await interaction.deferUpdate();
                const cont = new ContainerBuilder();
                cont.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('_staff_emoji')} Adicionar Cargo\n` +
                    `Selecione o(s) cargo(s) cujos membros poderão usar os comandos do bot.\n\n` +
                    `-# Você pode selecionar até 10 cargos de uma vez.`
                ));
                cont.addSeparatorComponents(new SeparatorBuilder());
                cont.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId('perms_addrole_select')
                            .setPlaceholder('Selecione um ou mais cargos...')
                            .setMaxValues(10)
                    )
                );
                await interaction.editReply({ components: [cont], ...CV2 });
                return;
            }

            // Remover cargo
            if (cid === 'perms_removerole') {
                await interaction.deferUpdate();
                const roleIds = getRolePermissions();
                if (roleIds.length === 0) {
                    const cont = new ContainerBuilder();
                    cont.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `${Emojis.get('negative_emoji')} Não há cargos configurados para remover.`
                    ));
                    await interaction.editReply({ components: [cont], ...CV2 });
                    return;
                }
                const options = roleIds.map(id => {
                    const cached = interaction.guild?.roles.cache.get(id);
                    return {
                        label: cached ? cached.name : `ID: ${id}`,
                        description: `ID: ${id}`,
                        value: id,
                        emoji: { id: '1501803902046048297' },
                    };
                });
                const cont = new ContainerBuilder();
                cont.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('_staff_emoji')} Remover Cargo\n` +
                    `Selecione o cargo que deseja remover do sistema de permissões.`
                ));
                cont.addSeparatorComponents(new SeparatorBuilder());
                cont.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('perms_removerole_select')
                            .setPlaceholder('Selecione um cargo...')
                            .addOptions(options)
                    )
                );
                await interaction.editReply({ components: [cont], ...CV2 });
                return;
            }
        }

        // ── Select Menus ────────────────────────────────────────────────────

        // Usuário adicionado
        if (interaction.isUserSelectMenu() && cid === 'perms_add_select') {
            await interaction.deferUpdate();
            const added = [];
            for (const user of interaction.users.values()) {
                if (String(user.id) !== String(config.owner)) {
                    addPermission(user.id);
                    added.push(user.username);
                }
            }
            const c = await buildPermsPanel(client, interaction);
            await interaction.editReply({ components: [c], ...CV2 });
            if (added.length > 0) {
                await interaction.followUp({
                    content: `${Emojis.get('confirmed_emoji')} **${added.join(', ')}** adicionado(s) ao sistema de permissões.`,
                    flags: MessageFlags.Ephemeral,
                });
            }
            return;
        }

        // Usuário removido
        if (interaction.isStringSelectMenu() && cid === 'perms_remove_select') {
            await interaction.deferUpdate();
            const removedId = interaction.values[0];
            const cached    = client.users.cache.get(removedId);
            removePermission(removedId);
            const c = await buildPermsPanel(client, interaction);
            await interaction.editReply({ components: [c], ...CV2 });
            await interaction.followUp({
                content: `${Emojis.get('confirmed_emoji')} ${cached ? `**${cached.username}**` : `\`${removedId}\``} removido do sistema de permissões.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // Cargo adicionado
        if (interaction.isRoleSelectMenu() && cid === 'perms_addrole_select') {
            await interaction.deferUpdate();
            const added = [];
            for (const role of interaction.roles.values()) {
                addRolePermission(role.id);
                added.push(role.name);
            }
            const c = await buildPermsPanel(client, interaction);
            await interaction.editReply({ components: [c], ...CV2 });
            if (added.length > 0) {
                await interaction.followUp({
                    content: `${Emojis.get('confirmed_emoji')} Cargo(s) **${added.join(', ')}** adicionado(s) ao sistema de permissões.`,
                    flags: MessageFlags.Ephemeral,
                });
            }
            return;
        }

        // Cargo removido
        if (interaction.isStringSelectMenu() && cid === 'perms_removerole_select') {
            await interaction.deferUpdate();
            const removedId = interaction.values[0];
            const cached    = interaction.guild?.roles.cache.get(removedId);
            removeRolePermission(removedId);
            const c = await buildPermsPanel(client, interaction);
            await interaction.editReply({ components: [c], ...CV2 });
            await interaction.followUp({
                content: `${Emojis.get('confirmed_emoji')} Cargo ${cached ? `**${cached.name}**` : `\`${removedId}\``} removido do sistema de permissões.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }
    },
};
