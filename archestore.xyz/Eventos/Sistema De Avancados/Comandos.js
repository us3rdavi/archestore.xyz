const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder } = require('discord.js');
const { configuracao } = require("../../DataBaseJson");

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            async function safeReply(content) {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply(content);
                } else {
                    await interaction.reply(content);
                }
            }

            const embeds = {
                banUnban: new EmbedBuilder()
                    .setColor(configuracao.get('Cores.Principal') || '5865F2')
                    .setTitle('Configuração de Ban & Unban')
                    .setAuthor({ name: 'Sistema de proteção', iconURL: 'https://cdn.discordapp.com/emojis/1239020888398237766.gif?size=2048' })
                    .setDescription('> **Você está configurando o comando Ban & Unban. Selecione o canal e o cargo abaixo:**')
                    .setTimestamp(),

                unlockLock: new EmbedBuilder()
                    .setColor(configuracao.get('Cores.Principal') || '5865F2')
                    .setTitle('Configuração de Unlock & Lock')
                    .setAuthor({ name: 'Sistema de proteção', iconURL: 'https://cdn.discordapp.com/emojis/1239020888398237766.gif?size=2048' })
                    .setDescription('> **Você está configurando o comando Unlock & Lock. Selecione o canal e o cargo abaixo:**')
                    .setTimestamp(),

                clearNuke: new EmbedBuilder()
                    .setColor(configuracao.get('Cores.Principal') || '5865F2')
                    .setTitle('Configuração de Clear & Nuke')
                    .setAuthor({ name: 'Sistema de proteção', iconURL: 'https://cdn.discordapp.com/emojis/1239020888398237766.gif?size=2048' })
                    .setDescription('> **Você está configurando o comando Clear & Nuke. Selecione o canal e o cargo abaixo:**')
                    .setTimestamp(),
            };

            const rows = (idRole, idChannel) => [
                new ActionRowBuilder().addComponents(
                    new RoleSelectMenuBuilder()
                        .setCustomId(idRole)
                        .setMaxValues(1)
                        .setPlaceholder("Selecione o cargo")
                ),
                new ActionRowBuilder().addComponents(
                    new ChannelSelectMenuBuilder()
                        .setCustomId(idChannel)
                        .setChannelTypes(ChannelType.GuildText)
                        .setMaxValues(1)
                        .setPlaceholder("Selecione o canal de logs")
                )
            ];

            // Configuração de Ban & Unban
            if (customId === 'configurar_banunban') {
                await safeReply({ embeds: [embeds.banUnban], components: rows('selecionar_cargo_banunban', 'selecionar_canal_banunban'), ephemeral: true });
            }
            if (customId === 'selecionar_canal_banunban') {
                configuracao.set('ConfigCommands.banchannel', interaction.values[0]);
                await safeReply({ content: `> Canal de logs configurado para: <#${interaction.values[0]}>`, ephemeral: true });
            }
            if (customId === 'selecionar_cargo_banunban') {
                configuracao.set('ConfigCommands.banrole', interaction.values[0]);
                await safeReply({ content: `> Cargo configurado para: <@&${interaction.values[0]}>`, ephemeral: true });
            }

            // Configuração de Unlock & Lock
            if (customId === 'configurar_unlocklock') {
                await safeReply({ embeds: [embeds.unlockLock], components: rows('selecionar_cargo_unlocklock', 'selecionar_canal_unlocklock'), ephemeral: true });
            }
            if (customId === 'selecionar_canal_unlocklock') {
                configuracao.set('ConfigCommands.lockschannel', interaction.values[0]);
                await safeReply({ content: `> Canal de logs configurado para: <#${interaction.values[0]}>`, ephemeral: true });
            }
            if (customId === 'selecionar_cargo_unlocklock') {
                configuracao.set('ConfigCommands.locksrole', interaction.values[0]);
                await safeReply({ content: `> Cargo configurado para: <@&${interaction.values[0]}>`, ephemeral: true });
            }

            // Configuração de Clear & Nuke
            if (customId === 'configurar_clearnuke') {
                await safeReply({ embeds: [embeds.clearNuke], components: rows('selecionar_cargo_clearnuke', 'selecionar_canal_clearnuke'), ephemeral: true });
            }
            if (customId === 'selecionar_canal_clearnuke') {
                configuracao.set('ConfigCommands.nukechannel', interaction.values[0]);
                await safeReply({ content: `> Canal de logs configurado para: <#${interaction.values[0]}>`, ephemeral: true });
            }
            if (customId === 'selecionar_cargo_clearnuke') {
                configuracao.set('ConfigCommands.nukerole', interaction.values[0]);
                await safeReply({ content: `> Cargo configurado para: <@&${interaction.values[0]}>`, ephemeral: true });
            }

        } catch (error) {
            console.error('Erro ao processar interação:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Ocorreu um erro ao processar a interação.', ephemeral: true });
            }
        }
    }
};
