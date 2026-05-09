const {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    InteractionType,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ChannelType,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
} = require('discord.js');
const { configuracao, produtos, Emojis } = require("../../Database");
const { SincronizarDados, SalvarTemplate } = require('../../Functions/SincronizarDados');
const { BackupFunction } = require('../../ComandosSlash/Administracao/backup');
const { default: axios } = require('axios');

let BackupStorage;
try {
    BackupStorage = require("../../Database").BackupStorage;
} catch (_) {}

const CV2 = { flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };

function loadingContainer(msg) {
    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${Emojis.get('loading_emoji')} ${msg}`
    ));
    return c;
}

function infoContainer(msg) {
    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(msg));
    return c;
}

function selectContainer(titulo, texto, selectRow) {
    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('ecloud_emoji')} ${titulo}`
    ));
    c.addSeparatorComponents(new SeparatorBuilder());
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(texto));
    c.addSeparatorComponents(new SeparatorBuilder());
    c.addActionRowComponents(selectRow);
    return c;
}

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        if (interaction.isButton()) {

            if (interaction.customId === 'sincronizardados') {
                await interaction.update({
                    components: [loadingContainer('Sincronizando dados do servidor...')],
                    ...CV2,
                });
                await SincronizarDados(client);
                await BackupFunction(client, interaction);
            }

            if (interaction.customId === 'salvartemplate') {
                await interaction.update({
                    components: [loadingContainer('Salvando template do servidor...')],
                    ...CV2,
                });
                await SalvarTemplate(client);
                await BackupFunction(client, interaction);
            }

            if (interaction.customId === 'apagarbackup') {
                await interaction.update({
                    components: [loadingContainer('Carregando backups...')],
                    ...CV2,
                });

                const backups = BackupStorage?.fetchAll?.() || {};
                const opcoes = Object.values(backups).map(element => ({
                    label: `${element.data[0].name} — ID: ${element.ID?.startsWith('Template_') ? 'template_' : ''}${element.data[0].id}`,
                    description: `Canais: ${element.data[0].channels.length} · Cargos: ${element.data[0].roles.length}`,
                    emoji: { id: '1501804046229438585' },
                    value: element.ID,
                }));

                const selectRow = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('apagarbackup')
                        .setPlaceholder('Selecione o backup a apagar...')
                        .addOptions(opcoes)
                );

                const c = selectContainer(
                    'Apagar Backup',
                    `${Emojis.get('_trash_emoji')} Selecione abaixo qual backup deseja remover permanentemente.\n-# Esta ação não pode ser desfeita.`,
                    selectRow
                );

                await interaction.editReply({ components: [c], ...CV2 });
            }

            if (interaction.customId === 'restaurarservidor') {
                await interaction.update({
                    components: [loadingContainer('Carregando backups...')],
                    ...CV2,
                });

                const backups = BackupStorage?.fetchAll?.() || {};
                const opcoes = Object.values(backups).map(element => ({
                    label: `${element.data[0].name} — ID: ${element.ID?.startsWith('Template_') ? 'template_' : ''}${element.data[0].id}`,
                    description: `Canais: ${element.data[0].channels.length} · Cargos: ${element.data[0].roles.length}`,
                    emoji: { id: '1501804046229438585' },
                    value: element.ID,
                }));

                const selectRow = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('restaurarservidor')
                        .setPlaceholder('Selecione o backup a restaurar...')
                        .addOptions(opcoes)
                );

                const c = selectContainer(
                    'Restaurar Servidor',
                    `${Emojis.get('_transfer_emoji')} Selecione abaixo qual backup deseja restaurar.\n-# Canais, cargos e configurações do servidor serão substituídos.`,
                    selectRow
                );

                await interaction.editReply({ components: [c], ...CV2 });
            }
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'apagarbackup') {
                const modal = new ModalBuilder()
                    .setTitle('Apagar backup')
                    .setCustomId(`apagarbackup_${interaction.values[0]}`);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('confirmacao')
                            .setLabel('CONFIRMAÇÃO')
                            .setPlaceholder('Digite "sim" para confirmar')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(3)
                            .setRequired(true)
                    )
                );
                return interaction.showModal(modal);
            }

            if (interaction.customId === 'restaurarservidor') {
                const modal = new ModalBuilder()
                    .setTitle('Restaurar servidor')
                    .setCustomId(`restaurarservidor_${interaction.values[0]}`);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('confirmacao')
                            .setLabel('CONFIRMAÇÃO')
                            .setPlaceholder('Digite "sim" para confirmar')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(3)
                            .setRequired(true)
                    )
                );
                return interaction.showModal(modal);
            }
        }

        if (interaction.type === InteractionType.ModalSubmit) {
            if (interaction.customId.startsWith('apagarbackup_')) {
                const confirmacao = interaction.fields.getTextInputValue('confirmacao');
                if (confirmacao.toLowerCase() !== 'sim') {
                    await interaction.deferUpdate();
                    await interaction.editReply({
                        components: [infoContainer(`${Emojis.get('negative_emoji')} Processo cancelado.`)],
                        ...CV2,
                    });
                    setTimeout(() => BackupFunction(client, interaction), 1500);
                    return;
                }

                const parts = interaction.customId.split('_');
                BackupStorage.delete(`${parts[1]}_${parts[2]}`);

                await interaction.deferUpdate();
                await interaction.editReply({
                    components: [infoContainer(`${Emojis.get('confirmed_emoji')} Backup apagado com sucesso.`)],
                    ...CV2,
                });
                setTimeout(() => BackupFunction(client, interaction), 1500);
            }

            if (interaction.customId.startsWith('restaurarservidor_')) {
                const confirmacao = interaction.fields.getTextInputValue('confirmacao');
                if (confirmacao.toLowerCase() !== 'sim') {
                    await interaction.deferUpdate();
                    await interaction.editReply({
                        components: [infoContainer(`${Emojis.get('negative_emoji')} Processo cancelado.`)],
                        ...CV2,
                    });
                    setTimeout(() => BackupFunction(client, interaction), 1500);
                    return;
                }

                await interaction.deferUpdate();
                await interaction.editReply({
                    components: [loadingContainer('Verificando permissões...')],
                    ...CV2,
                });

                const parts = interaction.customId.split('_');
                const selecionado = `${parts[1]}_${parts[2]}`;
                const backup = BackupStorage.get(selecionado)?.[0];

                if (!backup) {
                    await interaction.editReply({
                        components: [infoContainer(`${Emojis.get('negative_emoji')} Backup/Template não encontrado.`)],
                        ...CV2,
                    });
                    setTimeout(() => BackupFunction(client, interaction), 1500);
                    return;
                }

                try {
                    const guild = await client.guilds.fetch(interaction.guild.id);
                    const botMember = await guild.members.fetch(client.user.id);
                    const perm = botMember.permissions.has('Administrator');
                    if (!perm) {
                        await interaction.editReply({
                            components: [infoContainer(`${Emojis.get('negative_emoji')} Faltam permissões de administrador.`)],
                            ...CV2,
                        });
                        setTimeout(() => BackupFunction(client, interaction), 1500);
                        return;
                    }

                    const highestRole = guild.roles.highest;
                    const highestBot = botMember.roles.cache.sort((a, b) => b.position - a.position).first();
                    if (highestRole.position < highestBot.position) {
                        await interaction.editReply({
                            components: [infoContainer(`${Emojis.get('negative_emoji')} Adicione-me o cargo mais alto para restaurar.`)],
                            ...CV2,
                        });
                        setTimeout(() => BackupFunction(client, interaction), 1500);
                        return;
                    }
                } catch (error) {
                    console.log(error);
                    await interaction.editReply({
                        components: [infoContainer(`${Emojis.get('negative_emoji')} Erro ao verificar permissões. Processo cancelado.`)],
                        ...CV2,
                    });
                    setTimeout(() => BackupFunction(client, interaction), 1500);
                    return;
                }

                await interaction.editReply({
                    components: [loadingContainer('Restaurando servidor... Atualizações serão enviadas no seu privado.')],
                    ...CV2,
                });

                await RestaurandoServidor(client, interaction, selecionado);
            }
        }
    }
};

async function RestaurandoServidor(client, interaction, selecionado) {
    try {
        await interaction.user.send({ content: `${Emojis.get('loading_emoji')} Restaurando servidor...` }).then(async (msg) => {
            await configuracao.set('RestaurandoBackup', {
                status: 'Iniciando',
                mensagem: msg.id,
                canal: msg.channel.id,
            });
        });
    } catch (error) {
        await interaction.editReply({
            components: [loadingContainer('Não foi possível enviar DM, mas a restauração continuará...')],
            flags: MessageFlags.IsComponentsV2,
        });
    }

    const guild = await client.guilds.fetch(interaction.guild.id).catch(() => null);
    if (!guild) {
        await interaction.editReply({
            components: [infoContainer(`${Emojis.get('negative_emoji')} Servidor não encontrado. Processo cancelado.`)],
            flags: MessageFlags.IsComponentsV2,
        });
        setTimeout(() => BackupFunction(client, interaction), 1500);
        return;
    }

    let DM_message;
    try {
        const DM = await client.channels.fetch(configuracao.get('RestaurandoBackup.canal')).catch(() => null);
        DM_message = DM ? await DM.messages.fetch(configuracao.get('RestaurandoBackup.mensagem')).catch(() => null) : null;
    } catch { DM_message = null; }

    const step = async (msg) => { if (DM_message) await DM_message.edit({ content: msg }).catch(() => {}); };

    await step(`${Emojis.get('loading_emoji')} Deletando canais...`);
    for (const [, ch] of guild.channels.cache) await ch.delete().catch(() => {});

    await step(`${Emojis.get('confirmed_emoji')} Canais deletados.\n${Emojis.get('loading_emoji')} Deletando cargos...`);
    for (const [, r] of guild.roles.cache.filter(r => r.id !== guild.id)) await r.delete().catch(() => {});

    await step(`${Emojis.get('confirmed_emoji')} Cargos deletados.\n${Emojis.get('loading_emoji')} Deletando emojis...`);
    for (const [, e] of guild.emojis.cache) await e.delete().catch(() => {});

    await step(`${Emojis.get('confirmed_emoji')} Emojis deletados.\n${Emojis.get('loading_emoji')} Deletando stickers...`);
    for (const [, s] of guild.stickers.cache) await s.delete().catch(() => {});

    await step(`${Emojis.get('confirmed_emoji')} Stickers deletados.\n${Emojis.get('loading_emoji')} Restaurando cargos...`);
    const rolescriados = [];
    const cargos = BackupStorage.get(selecionado)[0].roles;
    await Promise.all(cargos.map(async el => {
        try {
            const r = await guild.roles.create({ name: el.name, color: el.color, hoist: el.hoist, permissions: el.permissions, mentionable: el.mentionable });
            if (r) rolescriados.push(r.id);
        } catch (e) { console.log(`Erro ao criar cargo: ${el.name} - ${e.message}`); }
    }));

    await step(`${Emojis.get('confirmed_emoji')} \`${rolescriados.length}\` cargos criados.\n${Emojis.get('loading_emoji')} Criando categorias...`);
    const categoriascriadas = [];
    for (const el of BackupStorage.get(selecionado)[0].channels) {
        if (el.type === 4) {
            try {
                const cat = await guild.channels.create({ name: el.name, type: ChannelType.GuildCategory, permissionOverwrites: el.permissionOverwrites || [] });
                if (cat) categoriascriadas.push(cat.id);
            } catch (e) { console.log(`Erro ao criar categoria: ${el.name} - ${e.message}`); }
        }
    }

    await step(`${Emojis.get('confirmed_emoji')} \`${rolescriados.length}\` cargos · \`${categoriascriadas.length}\` categorias.\n${Emojis.get('loading_emoji')} Criando canais...`);
    const canaiscriados = [];
    const canais = BackupStorage.get(selecionado)[0].channels;
    await Promise.all(canais.map(async el => {
        if (el.type !== 4) {
            try {
                const ch = await guild.channels.create({
                    name: el.name, type: el.type,
                    parent: guild.channels.cache.find(c => c.name === el.categoria)?.id || null,
                    permissionOverwrites: el.permissionOverwrites || [],
                });
                if (ch) {
                    const novoset = configuracao.get('ConfigChannels');
                    if (el.type === 0) {
                        for (const key in novoset) { if (novoset[key] === el.id) novoset[key] = ch.id; }
                        configuracao.set('ConfigChannels', novoset);
                    }
                    canaiscriados.push(ch.id);
                }
            } catch (e) { console.log(`Erro ao criar canal: ${el.name} - ${e.message}`); }
        }
    }));

    await step(`${Emojis.get('confirmed_emoji')} \`${canaiscriados.length}\` canais criados.\n${Emojis.get('loading_emoji')} Restaurando emojis...`);
    const emojisrestaurados = [];
    for (const el of BackupStorage.get(selecionado)[0].emojis) {
        const em = await guild.emojis.create({ attachment: el.url, name: el.name }).catch(() => null);
        if (em) emojisrestaurados.push(em.id);
    }

    await step(`${Emojis.get('confirmed_emoji')} \`${emojisrestaurados.length}\` emojis restaurados.\n${Emojis.get('loading_emoji')} Restaurando stickers...`);
    const stickersrestaurados = [];
    for (const el of BackupStorage.get(selecionado)[0].stickers) {
        const st = await guild.stickers.create({ file: el.url, name: el.name }).catch(() => null);
        if (st) stickersrestaurados.push(st.id);
    }

    await step(
        `${Emojis.get('confirmed_emoji')} \`${rolescriados.length}\` Cargos\n` +
        `${Emojis.get('confirmed_emoji')} \`${categoriascriadas.length}\` Categorias\n` +
        `${Emojis.get('confirmed_emoji')} \`${canaiscriados.length}\` Canais\n` +
        `${Emojis.get('confirmed_emoji')} \`${emojisrestaurados.length}\` Emojis\n` +
        `${Emojis.get('confirmed_emoji')} \`${stickersrestaurados.length}\` Stickers\n` +
        `${Emojis.get('confirmed_emoji')} Restauração concluída.`
    );

    if (DM_message) setTimeout(() => DM_message.delete().catch(() => {}), 10000);
}
