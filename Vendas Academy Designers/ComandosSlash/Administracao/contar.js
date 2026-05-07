const Discord = require("discord.js");

module.exports = {
    name: "contar",
    description: "[🤖] Conta o número de mensagens em um canal específico.",
    type: Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'canal',
            description: 'Selecione o canal no qual deseja contar as mensagens.',
            type: Discord.ApplicationCommandOptionType.Channel,
            required: true,
        }
    ],

    run: async (client, interaction) => {
        // Verifica se o membro tem permissão de Administrador
        if (!interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: `🚫 | Você não tem permissão para usar este comando. Apenas administradores podem acessá-lo.`,
                ephemeral: true
            });
        }

        const canal = interaction.options.getChannel('canal');

        // Verifica se o canal é do tipo texto
        if (![Discord.ChannelType.GuildText, Discord.ChannelType.PublicThread, Discord.ChannelType.PrivateThread].includes(canal.type)) {
            return interaction.reply({
                content: `⚠️ | O canal selecionado não é válido. Por favor, selecione um canal de texto ou thread.`,
                ephemeral: true
            });
        }

        // Função para contar mensagens
        async function contarMensagens(canal) {
            let totalMensagens = 0;
            let ultimaMensagemId;

            while (true) {
                const mensagens = await canal.messages.fetch({ limit: 100, before: ultimaMensagemId }).catch(() => null);
                if (!mensagens || mensagens.size === 0) break;

                totalMensagens += mensagens.size;
                ultimaMensagemId = mensagens.last().id; // Atualiza o ID da última mensagem
            }

            return totalMensagens;
        }

        try {
            // Notifica o usuário que o processo começou
            await interaction.reply({
                content: `🔄 | Aguarde! Estou contando as mensagens do canal **${canal.name}**. Isso pode demorar até **10 minutos**, dependendo da quantidade de mensagens.`,
                ephemeral: true
            });

            // Log para o console
            console.log(`Iniciando a contagem de mensagens no canal ${canal.name} (${canal.id}).`);

            const total = await contarMensagens(canal);

            // Envia o resultado ao usuário
            interaction.editReply({
                content: `📊 | A contagem foi concluída! O canal **${canal.name}** contém um total de **${total}** mensagens.`
            });

            // Log para o console
            console.log(`Contagem concluída no canal ${canal.name}: ${total} mensagens.`);
        } catch (error) {
            console.error(`Erro ao contar mensagens no canal ${canal.name}:`, error);

            // Notifica o usuário em caso de erro
            interaction.editReply({
                content: `❗ | Ocorreu um erro ao tentar contar as mensagens no canal **${canal.name}**. Tente novamente mais tarde.`
            });
        }
    }
};
