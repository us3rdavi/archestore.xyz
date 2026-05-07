const Discord = require("discord.js");
const emojis = require("../../DataBaseJson/Emojis.json"); // Importa o arquivo de emojis

// Define Emojis
const Emojis = {
    get: (name) => emojis[name] || ""
};

module.exports = {
    name: "cargo-all",
    description:"Atribuir um cargo específico a todos os membros do servidor",
    type: Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'cargo',
            description:'Selecione o cargo que deseja atribuir a todos os membros',
            type: Discord.ApplicationCommandOptionType.Role,
            required: true,
        }
    ],

    run: async (client, interaction) => {
        const cargo = interaction.options.getRole('cargo');

        // Verifica se o usuário tem permissão de administrador
        if (!interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ 
                content: `🚫 | Desculpe, você não tem permissão para utilizar este comando. Apenas administradores podem usá-lo.`,
                ephemeral: true 
            });
        }

        // Verifica se o cargo selecionado é válido
        if (!cargo) {
            return interaction.reply({ 
                content: `⚠️ | Cargo inválido. Por favor, selecione um cargo válido para continuar.`,
                ephemeral: true 
            });
        }

        // Verifica se o cargo é superior ao cargo do bot
        if (cargo.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({ 
                content: `⚠️ | O cargo selecionado é igual ou superior ao cargo do bot. Ajuste a hierarquia dos cargos e tente novamente.`,
                ephemeral: true 
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Busca todos os membros do servidor
            const membros = await interaction.guild.members.fetch();
            const elegiveis = membros.filter(member => !member.user.bot && !member.roles.cache.has(cargo.id));

            if (elegiveis.size === 0) {
                return interaction.editReply({ 
                    content: `👋 | Todos os membros elegíveis já possuem o cargo **${cargo.name}** ou não há membros elegíveis.`,
                    ephemeral: true 
                });
            }

            let sucesso = 0;
            let erro = 0;
            const totalMembros = elegiveis.size;

            // Atualiza a mensagem de progresso a cada 5 membros processados
            const atualizarProgresso = async () => {
                await interaction.editReply({ 
                    content: `🛠️ | Adicionando cargo a todos os membros... \`${sucesso} / ${totalMembros}\` membros processados.` 
                });
            };

            for (const membro of elegiveis.values()) {
                try {
                    await membro.roles.add(cargo);
                    sucesso++;
                } catch (error) {
                    console.error(`Erro ao adicionar cargo para ${membro.user.tag}:`, error);
                    erro++;
                }

                // Atualiza a cada 5 membros adicionados para evitar sobrecarga
                if (sucesso % 5 === 0 || sucesso === totalMembros) {
                    await atualizarProgresso();
                }
            }

            // Mensagem final com o resultado
            interaction.editReply({ 
                content: `✅ | Cargo **${cargo.name}** atribuído com sucesso a ${sucesso} membros.\n⚠️ | ${erro} membros não puderam receber o cargo devido a erros.`,
                ephemeral: true 
            });
        } catch (error) {
            console.error("Erro ao buscar membros:", error);
            interaction.editReply({ 
                content: `❌ | Ocorreu um erro ao tentar buscar os membros do servidor. Por favor, tente novamente mais tarde.`,
                ephemeral: true 
            });
        }
    }
};
