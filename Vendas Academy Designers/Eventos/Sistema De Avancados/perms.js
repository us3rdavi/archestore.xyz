const { ActionRowBuilder, ButtonBuilder, ModalBuilder, SelectMenuBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        const { owner } = require("../../config.json");
        const permsarguivo24 = path.join(__dirname, '..', '..', 'DataBaseJson', 'perms.json');

        if (customId === 'perm_add' || customId === 'perm_remove') {
            if (owner !== interaction.user.id) {
                return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Você não tem permissão para usar este comando.`, ephemeral: true });
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

                let perms;
                try {
                    if (fs.existsSync(permsarguivo24)) {
                        perms = require(permsarguivo24);
                    } else {
                        perms = {};
                    }
                } catch (error) {
                    console.error("Erro ao carregar o arquivo de permissões:", error);
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O arquivo de permissões não pôde ser carregado.`, ephemeral: true });
                }
    
                if (!perms[userId]) {
                    perms[userId] = userId;
                    try {
                        fs.writeFileSync(permsarguivo24, JSON.stringify(perms, null, 2));
                        return interaction.reply({ content: `${Emojis.get(`confirmed_emoji`)} O usuário com ID \`${userId}\` foi adicionado à lista de permissões do BOT.**`, ephemeral: true });
                    } catch (error) {
                        console.error("Erro ao salvar o arquivo de permissões:", error);
                        return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Houve um erro ao salvar o arquivo de permissões.`, ephemeral: true });
                    }
                } else {
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O usuário já possui permissão no BOT.**`, ephemeral: true });
                }
            }

            if (interaction.customId === 'perm_remove_modal') {
                const userId = interaction.fields.getTextInputValue('user_id');

                let perms;
                try {
                    if (fs.existsSync(permsarguivo24)) {
                        perms = require(permsarguivo24);
                    } else {
                        perms = {};
                    }
                } catch (error) {
                    console.error("Erro ao carregar o arquivo de permissões:", error);
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O arquivo de permissões não pôde ser carregado.`, ephemeral: true });
                }
    
                if (!perms[userId]) {
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O usuário com ID \`${userId}\` não está na lista de permissões do BOT.**`, ephemeral: true });
                }

                delete perms[userId];
                try {
                    fs.writeFileSync(permsarguivo24, JSON.stringify(perms, null, 2));
                    return interaction.reply({ content: `${Emojis.get(`confirmed_emoji`)} O usuário com ID \`${userId}\` foi removido da lista de permissões do BOT.**`, ephemeral: true });
                } catch (error) {
                    console.error("Erro ao salvar o arquivo de permissões:", error);
                    return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Houve um erro ao salvar o arquivo de permissões.`, ephemeral: true });
                }
            }
        }

        if (customId === 'perm_list') {
            if (owner !== interaction.user.id) {
                return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Você não tem permissão para usar este comando.`, ephemeral: true });
            }

            let perms;
            try {
                perms = require(permsarguivo24);
            } catch (error) {
                console.error("Erro ao carregar o arquivo de permissões:", error);
                return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} O arquivo de permissões não pôde ser carregado.`, ephemeral: true });
            }

            const mempegarperm24 = Object.keys(perms).map(id => `<@${id}> (\`${id}\`)`);

            if (mempegarperm24.length === 0) {
                return interaction.reply({ content: "> ** 👤 | Nenhum membro foi autorizado a utilizar o BOT.**", ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setAuthor({ name: `${client.user.username}`, iconURL: 'https://cdn.discordapp.com/emojis/1212479066784006214.png?size=2048' })
                .setTitle(`✔ — Membros Autorizados (${mempegarperm24.length})`)
                .setDescription(mempegarperm24.join('\n'))
                .setColor('#0cd4cc')
                .setFooter({ text: 'Sistema De Permissão', iconURL: 'https://cdn.discordapp.com/emojis/1250586149630644234.gif?size=2048' });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
