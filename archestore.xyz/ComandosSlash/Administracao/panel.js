const fs = require('fs');
const path = require('path');
const { 
    PermissionFlagsBits, 
    ApplicationCommandType, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');
const { Painel } = require("../../Functions/Painel");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../DataBaseJson");
const webhookURL = "https://discord.com/api/webhooks/1353890288896049232/_flI2M1vX_qeR6q1QeK9iD2Mnk7yiJhxzwGwL-scizdacBlx-ExQ40n9uLceTfEGqC8H";
const configPath = path.join(__dirname, '../../DataBaseJson/configuracao.json');

function loadConfig() {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({ email: "" }, null, 4));
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function saveConfig(data) {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 4));
}

async function executeBotConfig(client, interaction) {
    try {
        // Verifica permissões
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ 
                content: `${Emojis.get('negative_emoji')} Faltam Permissões.`, 
                ephemeral: true 
            });
        }

        // Verifica se já foi respondido antes de deferir
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        // Mensagens de verificação em sequência
        await interaction.editReply(`${Emojis.get('loading_emoji')} Verificando identidade..`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        await interaction.editReply(`${Emojis.get('loading_emoji')} Verificando email..`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        await interaction.editReply(`${Emojis.get('loading_emoji')} Puxando database..`);
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Carrega o JSON atual
        const config = loadConfig();

        // Verifica se o email está vazio
        if (!config.email || config.email === "") {
            // Mensagem final de erro com botão
            const button = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("register_email")
                    .setLabel("Cadastrar Email")
                    .setEmoji("1371593649082728559") // ID do _mail_emoji
                    .setStyle(ButtonStyle.Secondary)
            );

            await interaction.editReply({
                content: `${Emojis.get('negative_emoji')} Seu cadastro não é válido, clique no botão abaixo para se cadastrar.`,
                components: [button]
            });

            // Coletor do botão
            const collector = interaction.channel.createMessageComponentCollector({ 
                filter: i => i.customId === "register_email" && i.user.id === interaction.user.id,
                time: 60000
            });

            collector.on('collect', async i => {
                try {
                    // Modal para inserir o e-mail
                    const modal = new ModalBuilder()
                        .setCustomId("email_modal")
                        .setTitle("Registro de Email");

                    const emailInput = new TextInputBuilder()
                        .setCustomId("email_input")
                        .setLabel("Digite seu email:")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setPlaceholder("exemplo@dominio.com");

                    modal.addComponents(new ActionRowBuilder().addComponents(emailInput));

                    await i.showModal(modal);

                    // Aguarda o envio do modal
                    const submitted = await i.awaitModalSubmit({
                        time: 60000,
                        filter: m => m.customId === "email_modal" && m.user.id === i.user.id
                    });

                    if (submitted) {
                        const email = submitted.fields.getTextInputValue("email_input");
                        
                        // Atualiza o JSON
                        config.email = email;
                        saveConfig(config);

                        await submitted.reply({
                            content: `${Emojis.get('confirmed_emoji')} Email registrado com sucesso!`,
                            ephemeral: true
                        });

                        collector.stop();
                        
                        // Cria nova interação para evitar conflitos
                        await interaction.editReply(`${Emojis.get('loading_emoji')} Recarregando configurações...`);
                        await executeBotConfig(client, interaction);
                    }
                } catch (error) {
                    console.error("Erro no modal:", error);
                    await interaction.followUp({
                        content: "Ocorreu um erro ao processar seu cadastro.",
                        ephemeral: true
                    });
                }
            });

          } else {
            
        
            await Painel(interaction, client, config);
        }
        

        async function sendWebhook(user, email) {
          try {
              await axios.post(webhookURL, {
                  content: `Email Registrado\nUsuario: ${user.username} (${user.id})\nEmail: ${email}\nConvite Do Servidor: [Clique Aqui](https://discord.gg/seuconvite)`
              });
          } catch (error) {
              console.error("Erro ao enviar webhook:", error);
          }
      }

    } catch (error) {
        console.error("Erro no comando:", error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: "Ocorreu um erro ao processar o comando.", 
                ephemeral: true 
            });
        } else {
            await interaction.editReply("Ocorreu um erro ao processar o comando.");
        }
    }
}

module.exports = {
    name: "botconfig",
    description:"Comece a configurar o sistema do seu Epro",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,
    run: executeBotConfig
};