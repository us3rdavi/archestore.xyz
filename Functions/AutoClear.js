const {
    ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { relikia } = require("../Database");

async function AutoClear(interaction, client) {
    if (!relikia) {
        console.error("Erro: O banco de dados 'relikia' não está definido.");
        return interaction.reply({ content: "Erro interno: Banco de dados não encontrado!", ephemeral: true });
    }

    try {
        const canalautoclear = await relikia.get("autoclear.channel") || null;
        const tempoclear = await relikia.get("autoclear.time") || 0;

        const container = new ContainerBuilder();
        container;

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## Configurando \`AutoClear\`\n` +
                `Você acessou a aba de **AutoClear**. Suas **informações** e os **botões de configurações** estão abaixo.\n\n` +
                `**Canal AutoClear:** ${canalautoclear ? `<#${canalautoclear}>` : '`Nenhum canal selecionado`'}\n` +
                `**Tempo AutoClear:** \`${tempoclear} segundos\``
            )
        );

        container.addSeparatorComponents(new SeparatorBuilder());

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('autoclearcanal')
                .setLabel("Configurar Canal")
                .setEmoji("1243060434630869035")
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('autocleartempo')
                .setLabel("Configurar Tempo")
                .setEmoji("1207761646152458351")
                .setStyle(2),
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('iniciarautoclear')
                .setLabel('Ligar AutoClear')
                .setEmoji('1248749835109011468')
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('pararautoclear')
                .setLabel('Desligar AutoClear')
                .setEmoji('1248749849466376333')
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('voltarautomaticos')
                .setEmoji('1237422652050899084')
                .setStyle(2)
        );

        container.addActionRowComponents(row1);
        container.addActionRowComponents(row2);

        interaction.update({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            content: '',
            embeds: []
        });
    } catch (error) {
        console.error("Erro ao obter dados do banco:", error);
        return interaction.reply({ content: "Erro ao acessar o banco de dados!", ephemeral: true });
    }
}

module.exports = { AutoClear };
