const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { configuracao } = require("../Database");

async function protectConfig(interaction, client) {

    // Criando a primeira linha com um menu de seleção
    const row1 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("selectProtectBot")
                .addOptions(
                    {
                        value: "permsConfig",
                        label: "Permissões",
                        emoji: "1501804064596558017",
                        description: "Usuários com permissões de gerenciar o bot"
                    }
                )
                .setPlaceholder("Clique aqui para selecionar uma opção")
                .setMaxValues(1)
        );

    // Criando a segunda linha com um botão "Voltar"
    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("voltar1")
                .setLabel("Voltar")
                .setEmoji("1501803908589162537")
                .setStyle(2) // Estilo do botão, 2 é o estilo "Secondary"
        );

    // Editando a resposta da interação
    await interaction.editReply({
        content: "Selecione uma opção abaixo:", // Mensagem informativa
        embeds: [], // Não há embed, mas pode ser adicionado se necessário
        components: [row1, row2] // Adicionando as duas linhas de componentes
    });
}

module.exports = {
    protectConfig
};
