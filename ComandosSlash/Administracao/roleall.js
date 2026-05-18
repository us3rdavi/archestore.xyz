const Discord = require("discord.js");
const emojis = require("../../Database/emojis.json");
const Emojis = { get: (name) => emojis[name] || "" };

module.exports = {
    name: "cargo-all",
    description: "Atribuir um cargo específico a todos os membros do servidor",
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

        if (!interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ 
                content: `${Emojis.get('_ban_emoji')} Desculpe, você não tem permissão para utilizar este comando. Apenas administradores podem usá-lo.`,
                ephemeral: true 
            });
        }

        if (!cargo) {
            return interaction.reply({ 
                content: `${Emojis.get('warn_emoji')} Cargo inválido. Por favor, selecione um cargo válido para continuar.`,
                ephemeral: true 
            });
        }

        if (cargo.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({ 
                content: `${Emojis.get('warn_emoji')} O cargo selecionado é igual ou superior ao cargo do bot. Ajuste a hierarquia dos cargos e tente novamente.`,
                ephemeral: true 
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const membros = await interaction.guild.members.fetch();
            const elegiveis = membros.filter(member => !member.user.bot && !member.roles.cache.has(cargo.id));

            if (elegiveis.size === 0) {
                return interaction.editReply({ 
                    content: `${Emojis.get('information_emoji')} Todos os membros elegíveis já possuem o cargo **${cargo.name}** ou não há membros elegíveis.`,
                    ephemeral: true 
                });
            }

            let sucesso = 0;
            let erro = 0;
            const totalMembros = elegiveis.size;

            const atualizarProgresso = async () => {
                await interaction.editReply({ 
                    content: `${Emojis.get('loading_emoji')} Adicionando cargo a todos os membros... \`${sucesso} / ${totalMembros}\` membros processados.` 
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

                if (sucesso % 5 === 0 || sucesso === totalMembros) {
                    await atualizarProgresso();
                }
            }

            interaction.editReply({ 
                content: `${Emojis.get('confirmed_emoji')} Cargo **${cargo.name}** atribuído com sucesso a ${sucesso} membros.\n${Emojis.get('warn_emoji')} ${erro} membros não puderam receber o cargo devido a erros.`,
                ephemeral: true 
            });
        } catch (error) {
            console.error("Erro ao buscar membros:", error);
            interaction.editReply({ 
                content: `${Emojis.get('negative_emoji')} Ocorreu um erro ao tentar buscar os membros do servidor. Por favor, tente novamente mais tarde.`,
                ephemeral: true 
            });
        }
    }
};
