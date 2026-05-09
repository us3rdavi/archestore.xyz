const {
    ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, MessageFlags
} = require('discord.js');
const emojis = require("../../Database/emojis.json");
const { perms: permsDB } = require("../../Database");
const Emojis = { get: (name) => emojis[name] || "" };

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        const { owner } = require("../../config.json");

        if (customId === 'perm_add' || customId === 'perm_remove') {
            if (owner !== interaction.user.id) {
                return interaction.reply({ content: `${Emojis.get('negative_emoji')} Você não tem permissão para usar este comando.`, ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId(`${customId}_modal`)
                .setTitle(customId === 'perm_add' ? 'Adicionar Permissão' : 'Remover Permissão');

            const userIdInput = new TextInputBuilder()
                .setCustomId('user_id')
                .setLabel("ID do Usuário")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Digite o ID do usuário')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(userIdInput));
            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'perm_add_modal') {
                const userId = interaction.fields.getTextInputValue('user_id');

                if (permsDB.get(userId)) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} O usuário já possui permissão no BOT.`, ephemeral: true });
                }

                permsDB.set(String(userId), String(userId));
                return interaction.reply({ content: `${Emojis.get('confirmed_emoji')} O usuário com ID \`${userId}\` foi adicionado à lista de permissões do BOT.`, ephemeral: true });
            }

            if (interaction.customId === 'perm_remove_modal') {
                const userId = interaction.fields.getTextInputValue('user_id');

                if (!permsDB.get(userId)) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} O usuário com ID \`${userId}\` não está na lista de permissões do BOT.`, ephemeral: true });
                }

                permsDB.delete(String(userId));
                return interaction.reply({ content: `${Emojis.get('confirmed_emoji')} O usuário com ID \`${userId}\` foi removido da lista de permissões do BOT.`, ephemeral: true });
            }
        }

        if (customId === 'perm_list') {
            if (owner !== interaction.user.id) {
                return interaction.reply({ content: `${Emojis.get('negative_emoji')} Você não tem permissão para usar este comando.`, ephemeral: true });
            }

            const mempegarperm24 = permsDB.all().map(e => `<@${e.id}> (\`${e.id}\`)`);

            if (mempegarperm24.length === 0) {
                return interaction.reply({ content: `${Emojis.get('_silueta_emoji')} Nenhum membro foi autorizado a utilizar o BOT.`, ephemeral: true });
            }

            const container = new ContainerBuilder();
            container;
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('confirmed_emoji')} Membros Autorizados (${mempegarperm24.length})\n${mempegarperm24.join('\n')}`
                )
            );

            return interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                embeds: [],
                ephemeral: true
            });
        }
    }
};
