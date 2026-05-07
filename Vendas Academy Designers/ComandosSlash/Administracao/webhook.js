const { ApplicationCommandType, PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "criarwebhook",
    description: "[🤖] Crie um Webhook no canal atual",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "nome",
            description: "Nome do webhook",
            type: 3, // Tipo String
            required: true,
        },
    ],
    run: async (client, interaction) => {
        // Verifica se o usuário tem permissão para gerenciar o servidor
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                content: "❌ Você não tem permissão para usar este comando.",
                ephemeral: true,
            });
        }

        const webhookName = interaction.options.getString("nome");
        const channel = interaction.channel;

        try {
            // Cria o webhook no canal atual
            const webhook = await channel.createWebhook({
                name: webhookName,
            });

            // Envia a resposta com o link do webhook
            interaction.reply({
                content: `Webhook criado com sucesso! Aqui está o link: ${webhook.url}`,
            });

            // Registra a criação do webhook no console (opcional para logs)
            console.log(`Webhook criado: ${webhook.url}`);
        } catch (error) {
            console.error(error);
            interaction.reply({
                content: "❌ Houve um erro ao criar o webhook. Não tenho permissão suficiente.",
                ephemeral: true,
            });
        }
    },
};