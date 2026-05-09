const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
    InteractionType
} = require("discord.js");
const { tickets } = require("../../Database");
const { painelConfiguracaoTicket } = require("../../Functions/PainelTickets");
const emojis = require("../../Database/emojis.json");

const Emojis = { get: (name) => emojis[name] || "" };

const CONFIG_BUTTON_IDS = [
    'configuracaoticket',
    'canalticketconfigsystem',
    'canallogsticket2',
    'cargosstaff',
    'configmensageminicial',
    'configmensagemfinal',
    'adicionarbotaoticket',
    'removerbotoesticket',
    'cancelarconfigticket'
];

const CONFIG_CHANNEL_SELECT_IDS = ['selectcanaltickets', 'selectcanallogsticket'];
const CONFIG_ROLE_SELECT_IDS    = ['selectcargosstaff'];
const CONFIG_STRING_SELECT_IDS  = ['removerbotaoticketselect', 'config_ticket_settings'];
const CONFIG_MODAL_IDS          = ['modalmensageminicial', 'modalmensagemfinal', 'modaladicionarbotao'];

async function executeConfigAction(actionId, interaction) {
    if (actionId === 'canalticketconfigsystem') {
        const canalAtual = tickets.get('tickets.canalTickets');
        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('selectcanaltickets')
            .setPlaceholder('Selecione o canal onde os tópicos serão criados')
            .setChannelTypes(ChannelType.GuildText, ChannelType.GuildForum)
            .setMinValues(1).setMaxValues(1);
        await interaction.reply({
            content: `${Emojis.get('_notify_emoji')} **Canal de Tickets**\nSelecione o canal onde os tópicos (threads) dos tickets serão criados.\n${canalAtual ? `> Atual: <#${canalAtual}>` : '> Nenhum canal configurado.'}`,
            components: [
                new ActionRowBuilder().addComponents(channelSelect),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('cancelarconfigticket').setLabel('Cancelar').setStyle(ButtonStyle.Secondary)
                )
            ],
            ephemeral: true
        });
        return;
    }

    if (actionId === 'canallogsticket2') {
        const canalAtual = tickets.get('tickets.canalLogs');
        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('selectcanallogsticket')
            .setPlaceholder('Selecione o canal de logs dos tickets')
            .setChannelTypes(ChannelType.GuildText)
            .setMinValues(1).setMaxValues(1);
        await interaction.reply({
            content: `${Emojis.get('_messages_emoji')} **Canal de Logs**\nSelecione o canal onde os logs e transcripts dos tickets serão enviados.\n${canalAtual ? `> Atual: <#${canalAtual}>` : '> Nenhum canal configurado.'}`,
            components: [
                new ActionRowBuilder().addComponents(channelSelect),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('cancelarconfigticket').setLabel('Cancelar').setStyle(ButtonStyle.Secondary)
                )
            ],
            ephemeral: true
        });
        return;
    }

    if (actionId === 'cargosstaff') {
        const cargosAtuais = tickets.get('tickets.staffRoles') || [];
        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('selectcargosstaff')
            .setPlaceholder('Selecione os cargos que podem gerenciar tickets')
            .setMinValues(0).setMaxValues(10);
        await interaction.reply({
            content: `${Emojis.get('_staff_emoji')} **Cargos Staff**\nSelecione os cargos que poderão assumir, finalizar e gerenciar tickets.\n${cargosAtuais.length > 0 ? `> Atuais: ${cargosAtuais.map(r => `<@&${r}>`).join(', ')}` : '> Nenhum cargo configurado.'}`,
            components: [
                new ActionRowBuilder().addComponents(roleSelect),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('cancelarconfigticket').setLabel('Cancelar').setStyle(ButtonStyle.Secondary)
                )
            ],
            ephemeral: true
        });
        return;
    }

    if (actionId === 'configmensageminicial') {
        const atual = tickets.get('tickets.mensagemInicial') || {};
        const modal = new ModalBuilder()
            .setCustomId('modalmensageminicial')
            .setTitle('Mensagem Inicial do Ticket');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('titulo').setLabel('Título (use {numero} para o nº do ticket)')
                    .setPlaceholder('Ex: Ticket #{numero}').setValue(atual.msgTitulo || 'Ticket #{numero}')
                    .setMaxLength(100).setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('descricao').setLabel('Descrição (aparece abaixo das informações)')
                    .setPlaceholder('Ex: Nossa equipe irá te atender em breve!').setValue(atual.msgDescricao || '')
                    .setMaxLength(500).setStyle(TextInputStyle.Paragraph).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('banner').setLabel('URL do Banner (imagem no ticket)')
                    .setPlaceholder('https://exemplo.com/imagem.png').setValue(atual.msgBanner || '')
                    .setStyle(TextInputStyle.Short).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('cor').setLabel('Cor de Destaque (hex)')
                    .setPlaceholder('Ex: #5865F2').setValue(atual.msgCor || '#5865F2')
                    .setMaxLength(7).setStyle(TextInputStyle.Short).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('emoji').setLabel('Emoji do Título (opcional)')
                    .setPlaceholder('Ex: <:nome:123456789> ou <a:nome:123456789>').setValue(atual.msgEmoji || '')
                    .setMaxLength(100).setStyle(TextInputStyle.Short).setRequired(false)
            )
        );
        await interaction.showModal(modal);
        return;
    }

    if (actionId === 'configmensagemfinal') {
        const atual = tickets.get('tickets.mensagemFinalizacao') || {};
        const modal = new ModalBuilder()
            .setCustomId('modalmensagemfinal')
            .setTitle('Mensagem de Finalização do Ticket');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('titulo').setLabel('Título da mensagem de finalização')
                    .setPlaceholder('Ex: Ticket Marcado como Concluído').setValue(atual.titulo || 'Ticket Marcado como Concluído')
                    .setMaxLength(100).setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('descricao').setLabel('Descrição (instrução para o usuário)')
                    .setPlaceholder('Ex: Se resolvido, clique em Resolvido.').setValue(atual.descricao || '')
                    .setMaxLength(800).setStyle(TextInputStyle.Paragraph).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('banner').setLabel('URL do Banner (opcional)')
                    .setPlaceholder('https://exemplo.com/imagem.png').setValue(atual.banner || '')
                    .setStyle(TextInputStyle.Short).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('cor').setLabel('Cor de Destaque (hex)')
                    .setPlaceholder('Ex: #57F287').setValue(atual.cor || '#57F287')
                    .setMaxLength(7).setStyle(TextInputStyle.Short).setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('emoji').setLabel('Emoji do Título (opcional)')
                    .setPlaceholder('Ex: <:nome:123456789> ou <a:nome:123456789>').setValue(atual.emoji || '')
                    .setMaxLength(100).setStyle(TextInputStyle.Short).setRequired(false)
            )
        );
        await interaction.showModal(modal);
        return;
    }

    if (actionId === 'adicionarbotaoticket') {
        const modal = new ModalBuilder()
            .setCustomId('modaladicionarbotao')
            .setTitle('Adicionar Botão à Mensagem Inicial');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('label').setLabel('Texto do Botão')
                    .setPlaceholder('Ex: Nosso Site').setMaxLength(80).setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('url').setLabel('URL do Botão')
                    .setPlaceholder('https://seusite.com').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('emoji').setLabel('Emoji do Botão (opcional)')
                    .setPlaceholder('Ex: <:nome:123456789> ou <a:nome:123456789>').setStyle(TextInputStyle.Short).setRequired(false)
            )
        );
        await interaction.showModal(modal);
        return;
    }

    if (actionId === 'removerbotoesticket') {
        const botoesAdicionais = tickets.get('tickets.botoesAdicionais') || [];
        if (botoesAdicionais.length === 0) {
            return interaction.reply({
                content: `${Emojis.get('negative_emoji')} Nenhum botão adicional configurado.`,
                ephemeral: true
            });
        }
        const select = new StringSelectMenuBuilder()
            .setCustomId('removerbotaoticketselect')
            .setPlaceholder('Selecione o botão para remover')
            .setMinValues(1).setMaxValues(botoesAdicionais.length)
            .addOptions(
                botoesAdicionais.map((btn, i) => ({
                    label: btn.label.slice(0, 100),
                    value: String(i),
                    description: btn.url.slice(0, 100)
                }))
            );
        await interaction.reply({
            content: `${Emojis.get('_trash_emoji')} Selecione o(s) botão(ões) que deseja remover:`,
            components: [
                new ActionRowBuilder().addComponents(select),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('cancelarconfigticket').setLabel('Cancelar').setStyle(ButtonStyle.Secondary)
                )
            ],
            ephemeral: true
        });
        return;
    }
}

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            if (interaction.isButton()) {
                if (!CONFIG_BUTTON_IDS.includes(interaction.customId)) return;

                if (interaction.customId === 'configuracaoticket') {
                    await painelConfiguracaoTicket(interaction);
                    return;
                }

                if (interaction.customId === 'cancelarconfigticket') {
                    await interaction.update({
                        content: `${Emojis.get('confirmed_emoji')} Cancelado.`,
                        components: [],
                        embeds: []
                    });
                    return;
                }

                await executeConfigAction(interaction.customId, interaction);
                return;
            }

            if (interaction.isStringSelectMenu()) {
                if (!CONFIG_STRING_SELECT_IDS.includes(interaction.customId)) return;

                if (interaction.customId === 'config_ticket_settings') {
                    const action = interaction.values[0];
                    await executeConfigAction(action, interaction);
                    return;
                }

                if (interaction.customId === 'removerbotaoticketselect') {
                    const indices = interaction.values.map(Number).sort((a, b) => b - a);
                    const botoesAdicionais = tickets.get('tickets.botoesAdicionais') || [];
                    for (const idx of indices) {
                        botoesAdicionais.splice(idx, 1);
                    }
                    tickets.set('tickets.botoesAdicionais', botoesAdicionais);
                    await interaction.update({
                        content: `${Emojis.get('confirmed_emoji')} \`${indices.length}\` botão(ões) removido(s) com sucesso!`,
                        components: [],
                        embeds: []
                    });
                    return;
                }
            }

            if (interaction.isChannelSelectMenu()) {
                if (!CONFIG_CHANNEL_SELECT_IDS.includes(interaction.customId)) return;

                if (interaction.customId === 'selectcanaltickets') {
                    const channelId = interaction.values[0];
                    tickets.set('tickets.canalTickets', channelId);
                    await interaction.update({
                        content: `${Emojis.get('confirmed_emoji')} Canal de tickets configurado para <#${channelId}>!\nOs tópicos dos tickets serão criados nesse canal.`,
                        components: [],
                        embeds: []
                    });
                    return;
                }

                if (interaction.customId === 'selectcanallogsticket') {
                    const channelId = interaction.values[0];
                    tickets.set('tickets.canalLogs', channelId);
                    await interaction.update({
                        content: `${Emojis.get('confirmed_emoji')} Canal de logs configurado para <#${channelId}>!\nTranscripts e logs dos tickets serão enviados nesse canal.`,
                        components: [],
                        embeds: []
                    });
                    return;
                }
            }

            if (interaction.isRoleSelectMenu()) {
                if (!CONFIG_ROLE_SELECT_IDS.includes(interaction.customId)) return;

                if (interaction.customId === 'selectcargosstaff') {
                    const roleIds = interaction.values;
                    tickets.set('tickets.staffRoles', roleIds);
                    const rolesMentions = roleIds.length > 0 ? roleIds.map(id => `<@&${id}>`).join(', ') : 'Nenhum';
                    await interaction.update({
                        content: `${Emojis.get('confirmed_emoji')} Cargos staff atualizados!\n> ${rolesMentions}\nEsses cargos poderão assumir, finalizar e gerenciar tickets.`,
                        components: [],
                        embeds: []
                    });
                    return;
                }
            }

            if (InteractionType.ModalSubmit === interaction.type) {
                if (!CONFIG_MODAL_IDS.includes(interaction.customId)) return;

                if (interaction.customId === 'modalmensageminicial') {
                    const titulo    = interaction.fields.getTextInputValue('titulo');
                    const descricao = interaction.fields.getTextInputValue('descricao');
                    const banner    = interaction.fields.getTextInputValue('banner');
                    const cor       = interaction.fields.getTextInputValue('cor');
                    const emoji     = interaction.fields.getTextInputValue('emoji');

                    const config = {};
                    if (titulo)                                                   config.msgTitulo   = titulo;
                    if (descricao)                                                config.msgDescricao = descricao;
                    if (banner && (banner.startsWith('http://') || banner.startsWith('https://'))) config.msgBanner = banner;
                    if (cor && cor.startsWith('#'))                               config.msgCor      = cor;
                    if (emoji)                                                    config.msgEmoji    = emoji;

                    const atual = tickets.get('tickets.mensagemInicial') || {};
                    tickets.set('tickets.mensagemInicial', { ...atual, ...config });

                    await interaction.reply({
                        content: `${Emojis.get('confirmed_emoji')} Mensagem inicial do ticket atualizada com sucesso!`,
                        ephemeral: true
                    });
                    return;
                }

                if (interaction.customId === 'modalmensagemfinal') {
                    const titulo    = interaction.fields.getTextInputValue('titulo');
                    const descricao = interaction.fields.getTextInputValue('descricao');
                    const banner    = interaction.fields.getTextInputValue('banner');
                    const cor       = interaction.fields.getTextInputValue('cor');
                    const emoji     = interaction.fields.getTextInputValue('emoji');

                    const config = {};
                    if (titulo)                                                   config.titulo   = titulo;
                    if (descricao)                                                config.descricao = descricao;
                    if (banner && (banner.startsWith('http://') || banner.startsWith('https://'))) config.banner = banner;
                    if (cor && cor.startsWith('#'))                               config.cor      = cor;
                    if (emoji)                                                    config.emoji    = emoji;

                    const atual = tickets.get('tickets.mensagemFinalizacao') || {};
                    tickets.set('tickets.mensagemFinalizacao', { ...atual, ...config });

                    await interaction.reply({
                        content: `${Emojis.get('confirmed_emoji')} Mensagem de finalização atualizada com sucesso!`,
                        ephemeral: true
                    });
                    return;
                }

                if (interaction.customId === 'modaladicionarbotao') {
                    const label = interaction.fields.getTextInputValue('label');
                    const url   = interaction.fields.getTextInputValue('url');
                    const emoji = interaction.fields.getTextInputValue('emoji');

                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        return interaction.reply({
                            content: `${Emojis.get('negative_emoji')} A URL deve começar com \`http://\` ou \`https://\`.`,
                            ephemeral: true
                        });
                    }

                    const botoesAdicionais = tickets.get('tickets.botoesAdicionais') || [];
                    if (botoesAdicionais.length >= 5) {
                        return interaction.reply({
                            content: `${Emojis.get('negative_emoji')} Limite máximo de 5 botões adicionais atingido. Remova um botão antes de adicionar outro.`,
                            ephemeral: true
                        });
                    }

                    const novoBotao = { label, url };
                    if (emoji) novoBotao.emoji = emoji;
                    botoesAdicionais.push(novoBotao);
                    tickets.set('tickets.botoesAdicionais', botoesAdicionais);

                    await interaction.reply({
                        content: `${Emojis.get('confirmed_emoji')} Botão **${label}** adicionado com sucesso! Ele aparecerá na mensagem inicial de novos tickets.`,
                        ephemeral: true
                    });
                    return;
                }
            }
        } catch (error) {
            console.error('[configTickets] Erro:', error);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `Ocorreu um erro ao processar essa ação.`, ephemeral: true });
                }
            } catch (e) {}
        }
    }
};
