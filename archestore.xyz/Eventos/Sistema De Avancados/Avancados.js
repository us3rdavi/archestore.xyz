const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, InteractionType } = require('discord.js');
const { configuracao } = require("../../DataBaseJson");

function getSaudacao() {
    const brazilTime = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const hora = new Date(brazilTime).getHours();

    if (hora < 12) {
        return 'Bom dia';
    } else if (hora < 18) {
        return 'Boa tarde';
    } else {
        return 'Boa noite';
    }
}

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        if (customId === 'select_menu' && interaction.values.includes('banunba24')) {
            const embedBanUnban = new EmbedBuilder()
                .setColor(configuracao.get('Cores.Principal') || '5865F2')
                .setTitle('Ban & Unban')
                .setAuthor({ name: 'Sistema de proteção', iconURL: 'https://cdn.discordapp.com/emojis/1239020888398237766.gif?size=2048' })
                .setDescription(`> ** ${getSaudacao()} Sr ${interaction.user}, Você Está configurando o comando Ban & Unban**`)
                .addFields(
                    { name: '**Canal Atual:**', value: `<#${configuracao.get("ConfigCommands.banchannel") || 'Não Definido'}>`, inline: true },
                    { name: '**Cargo Atual**', value: `<@&${configuracao.get("ConfigCommands.banrole") || 'Não Definido'}>`, inline: true }
                )
                .setTimestamp();

            const buttonsBanUnban = [
                new ButtonBuilder()
                    .setCustomId('configurar_banunban')
                    .setLabel('Configurar')
                    .setEmoji("1248985812108841043")
                    .setStyle(1),

                new ButtonBuilder()
                    .setCustomId("comandosperm")
                    .setLabel("voltar")
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)
                    .setDisabled(false),
            ];

            await interaction.update({
                embeds: [embedBanUnban],
                components: [new ActionRowBuilder().addComponents(buttonsBanUnban)],
                ephemeral: true
            });
        }

        if (customId === 'select_menu' && interaction.values.includes('unlocklock24')) {
            const embedUnlockLock = new EmbedBuilder()
                .setColor(configuracao.get('Cores.Principal') || '5865F2')
                .setTitle('Unlock & Lock')
                .setAuthor({ name: 'Sistema de proteção', iconURL: 'https://cdn.discordapp.com/emojis/1239020888398237766.gif?size=2048' })
                .setDescription(`> ** ${getSaudacao()} Sr ${interaction.user}, Você Está configurando o comando Unlock & Lock**`)
                .addFields(
                    { name: '**Canal Atual:**', value: `<#${configuracao.get("ConfigCommands.lockschannel") || 'Não Definido'}>`, inline: true },
                    { name: '**Cargo Atual**', value: `<@&${configuracao.get("ConfigCommands.locksrole") || 'Não Definido'}>`, inline: true }
                )
                .setTimestamp();

            const row244 = [
                new ButtonBuilder()
                    .setCustomId('configurar_unlocklock')
                    .setLabel('Configurar')
                    .setEmoji("1248985812108841043")
                    .setStyle(1),
                new ButtonBuilder()
                    .setCustomId("comandosperm")
                    .setLabel("voltar")
                    .setEmoji(`1178068047202893869`)
                    .setStyle(2)
                    .setDisabled(false),
            ];

            await interaction.update({
                embeds: [embedUnlockLock],
                components: [new ActionRowBuilder().addComponents(row244)],
                ephemeral: true
            });
        }

        if (customId === 'select_menu' && interaction.values.includes('clearnuke24')) {
            const embed24 = new EmbedBuilder()
                .setColor(configuracao.get('Cores.Principal') || '5865F2')
                .setTitle('Clear & Nuke')
                .setAuthor({ name: 'Sistema de proteção', iconURL: 'https://cdn.discordapp.com/emojis/1239020888398237766.gif?size=2048' })
                .setDescription(`> ** ${getSaudacao()} Sr ${interaction.user}, Você Está configurando o comando Clear & Nuke**`)
                .addFields(
                    { name: '**Canal Atual:**', value: `<#${configuracao.get("ConfigCommands.nukechannel") || 'Não Definido'}>`, inline: true },
                    { name: '**Cargo Atual**', value: `<@&${configuracao.get("ConfigCommands.nukerole") || 'Não Definido'}>`, inline: true }
                )
                .setTimestamp();

                const row24 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('configurar_clearnuke')
                        .setLabel('Configurar')
                        .setEmoji("1248985812108841043")
                        .setStyle(1),
                    new ButtonBuilder()
                        .setCustomId("comandosperm")
                        .setLabel("voltar")
                        .setEmoji(`1178068047202893869`)
                        .setStyle(2)
                        .setDisabled(false),
                        )

            await interaction.update({
                embeds: [embed24],
                components: [row24],
                ephemeral: true
            });
        }
    }
};
