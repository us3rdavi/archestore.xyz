const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../DataBaseJson");
const { owner } = require("../config.json");

function getSaudacao() {
    const brazilTime = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const hora = new Date(brazilTime).getHours();
    if (hora < 12) return 'Bom dia';
    else if (hora < 18) return 'Boa tarde';
    else return 'Boa noite';
}

function getAccentColor() {
    const cor = configuracao.get('Cores.Principal') || '5865F2';
    try { return parseInt(cor.replace('#', ''), 16); } catch (e) { return 0x5865F2; }
}

async function Avançados(interaction, client) {
    if (interaction.user.id !== owner) return interaction.reply({
        content: `${Emojis.get('negative_emoji')} Você precisa ser o owner para acessar essa parte. owner atual: <@${owner}>`,
        ephemeral: true
    });

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('defense_emoji')} Painel de Proteção\n` +
            `${getSaudacao()} **${interaction.user.displayName || interaction.user.username}**, gerencie a proteção e configurações avançadas do bot.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("comandosperm")
            .setLabel('Comandos')
            .setEmoji({ id: '1501803905363869769' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("permissaoadm")
            .setLabel('Add Perms')
            .setEmoji({ id: '1501804064596558017' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("configemojis24")
            .setLabel('Configurar Emojis')
            .setEmoji({ id: '1501804058699366470' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("limpardm")
            .setLabel("Limpar Dm")
            .setEmoji({ id: '1501803926180335727' })
            .setStyle(4),
        new ButtonBuilder()
            .setCustomId("voltar1")
            .setLabel('Menu Principal')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2)
    );

    container.addActionRowComponents(row);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

async function Configcomandos24(interaction, client) {
    if (interaction.user.id !== owner) return interaction.reply({
        content: `${Emojis.get('negative_emoji')} | Você precisa ser o owner para acessar essa parte. owner atual: <@${owner}>`,
        ephemeral: true
    });

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_support_emoji')} Configuração de Comandos\nSelecione o comando que deseja configurar.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const select = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('select_menu')
            .setPlaceholder('Clique aqui para configurar')
            .addOptions([
                {
                    label: 'Ban & Unban',
                    value: 'banunba24',
                    description: 'Cargos Que podem Banir e desbanir usuarios atravez do comando',
                    emoji: { id: '1246954960218886146' }
                },
                {
                    label: 'Unlock & Lock',
                    value: 'unlocklock24',
                    description: 'Cargos Que podem desbloquear e bloquear canais atravez do comando',
                    emoji: { id: '1297640825391681596' }
                },
                {
                    label: 'Clear & Nuke',
                    value: 'clearnuke24',
                    description: 'Cargos Que podem Limpar mensagens de canais e recriar canais atravez do comando',
                    emoji: { id: '1246953228655132772' }
                },
            ])
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('configavançadas24')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2)
    );

    container.addActionRowComponents(select);
    container.addActionRowComponents(row2);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

async function Emojis24(interaction, client) {
    if (interaction.user.id !== owner) return interaction.reply({
        content: `${Emojis.get('negative_emoji')} | Você precisa ser o owner para acessar essa parte. owner atual: <@${owner}>`,
        ephemeral: true
    });

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('_pincel_emoji')} Configuração de Emojis\n` +
            `Gerencie os emojis personalizados utilizados pelo bot.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("create_emojis")
            .setLabel('Adicionar Emojis')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("remove_emojis")
            .setLabel('Remover Emojis')
            .setEmoji({ id: '1501803926180335727' })
            .setStyle(4),
        new ButtonBuilder()
            .setCustomId('configavançadas24')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2)
    );

    container.addActionRowComponents(row);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

async function Perms24(interaction, client) {
    if (interaction.user.id !== owner) return interaction.reply({
        content: `${Emojis.get('negative_emoji')} | Você precisa ser o owner para acessar essa parte. owner atual: <@${owner}>`,
        ephemeral: true
    });

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${Emojis.get('permissions_emoji')} Configuração de Permissão\n` +
            `Gerencie quais usuários podem configurar o bot.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("perm_add")
            .setLabel('Adicionar Perm')
            .setEmoji({ id: '1501803923126747178' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("perm_remove")
            .setLabel('Remover Permissão')
            .setEmoji({ id: '1501803926180335727' })
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId("perm_list")
            .setLabel('Lista De Permissões')
            .setEmoji({ id: '1501804058699366470' })
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('configavançadas24')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2)
    );

    container.addActionRowComponents(row);

    await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}

module.exports = { Avançados, Configcomandos24, Emojis24, Perms24 };
