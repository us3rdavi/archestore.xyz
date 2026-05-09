const { ActionRowBuilder, ModalBuilder, TextInputBuilder, RoleSelectMenuBuilder, TextInputStyle } = require("discord.js");
const { configuracao } = require("../../Database");
const { configrole24 } = require("../../Functions/cargocomprar.js");

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        if (interaction.isButton()) {
            if (interaction.customId === "onoffcargo24") {
                    const atualstatus = configuracao.get("ConfigRoles.statuscomprar");
                    const mudarstatus = !atualstatus;
            
                    configuracao.set("ConfigRoles.statuscomprar", mudarstatus);
            
                    const configrole244 = configuracao.get("ConfigRoles.statuscomprar") || false;

                    configrole24(interaction, client)
            
            }
            

            if (interaction.customId === "configurarcargocomprar") {
                const roleSelectMenu = new RoleSelectMenuBuilder()
                    .setCustomId('select_role_carrinho')
                    .setPlaceholder("Cargo que poderia abrir carrinho")
                    .setMinValues(1)
                    .setMaxValues(1);

                const row = new ActionRowBuilder().addComponents(roleSelectMenu);
                await interaction.update({ embeds: [], components: [row], ephemeral: true });
            }
            if (interaction.customId === "configurarlink") {
                const modal = new ModalBuilder()
                    .setCustomId('modal_link')
                    .setTitle('Configurar Link');

                const linkInput = new TextInputBuilder()
                    .setCustomId('input_link')
                    .setLabel('Insira o link (deve começar com https)')
                    .setStyle(TextInputStyle.Short);

                const actionRow = new ActionRowBuilder().addComponents(linkInput);
                modal.addComponents(actionRow);

                await interaction.showModal(modal);
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'modal_link') {
                const link = interaction.fields.getTextInputValue('input_link');

                if (link.startsWith('https')) {
                    configuracao.set("ConfigLinks.link", link);
                    configrole24(interaction, client);
                } else {
                    await interaction.reply({ content:  `${Emojis.get(`negative_emoji`)} Indetificamos que o link inserido não começa com https.`, ephemeral: true });
                }
            }
        }

        if (interaction.isRoleSelectMenu()) {
            if (interaction.customId === 'select_role_carrinho') {
                const selectedRoles = interaction.values;
                if (selectedRoles.length > 0) {
                    const roleId = selectedRoles[0];
                    configuracao.set("ConfigRoles.cargocarrinho", roleId);
                    configrole24(interaction, client);
                } else {
                    configrole24(interaction, client);
                }
            }
        }
    }
};
