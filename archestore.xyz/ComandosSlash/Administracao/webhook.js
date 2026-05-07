const { ApplicationCommandType, PermissionFlagsBits } = require("discord.js");
const emojis = require("../../DataBaseJson/Emojis.json");
const Emojis = { get: (name) => emojis[name] || "" };

module.exports = {
    name: "criarwebhook",
    description:"Crie um Webhook no canal atual",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "nome",
            description:"Nome do webhook",
            type: 3,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                content: `${Emojis.get('negative_emoji')} Você não tem permissão para usar este comando.`,
                ephemeral: true,
            });
        }

        const webhookName = interaction.options.getString("nome");
        const channel = interaction.channel;

        try {
            const webhook = await channel.createWebhook({
                name: webhookName,
            });

            interaction.reply({
                content: `${Emojis.get('confirmed_emoji')} Webhook criado com sucesso! Aqui está o link: ${webhook.url}`,
            });

            console.log(`Webhook criado: ${webhook.url}`);
        } catch (error) {
            console.error(error);
            interaction.reply({
                content: `${Emojis.get('negative_emoji')} Houve um erro ao criar o webhook. Não tenho permissão suficiente.`,
                ephemeral: true,
            });
        }
    },
};
