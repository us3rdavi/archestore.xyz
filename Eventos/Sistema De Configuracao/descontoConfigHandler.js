'use strict';

/**
 * Handler do painel de administração de descontos/cupons.
 */

const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { Emojis } = require('../../Database');
const { listarDescontos, criarDesconto, removerDesconto } = require('../../Functions/DescontoVendas');

function formatBRL(v) {
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function descontoPainel(interaction) {
    const descontos = listarDescontos();

    const lista = descontos.length === 0
        ? `${Emojis.get('negative_emoji')} Nenhum desconto cadastrado.`
        : descontos.map((d, i) => {
            const val   = d.tipo === 'percent' ? `${d.valor}%` : formatBRL(d.valor);
            const usos  = d.usosMax ? `${d.usos}/${d.usosMax}` : `${d.usos} (ilimitado)`;
            const status = d.ativo !== false ? Emojis.get('confirmed_emoji') : Emojis.get('negative_emoji');
            return `**${i + 1}.** ${status} \`${d.codigo}\` — \`${val}\` — usos: \`${usos}\`\n-# ${d.nome}`;
        }).join('\n\n');

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## ${Emojis.get('dream')} Cupons de Desconto\n` +
        `Crie cupons de desconto por porcentagem ou valor fixo para seus clientes.\n\n` +
        lista
    ));
    container.addSeparatorComponents(new SeparatorBuilder());

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('desc_add')
            .setLabel('Criar Cupom')
            .setEmoji({ id: '1501803905363869769' })
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId('desc_remove_pick')
            .setLabel('Remover Cupom')
            .setEmoji({ id: '1501803935453679616' })
            .setStyle(4)
            .setDisabled(descontos.length === 0),
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vnd_voltar_config')
            .setLabel('Voltar')
            .setEmoji({ id: '1501803908589162537' })
            .setStyle(2),
    );

    container.addActionRowComponents(row1);
    container.addActionRowComponents(row2);

    const payload = { components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' };
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
    } else {
        await interaction.update(payload);
    }
}

module.exports = {
    descontoPainel,
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            // Mostrar painel de descontos
            if (interaction.isButton() && customId === 'vnd_gerenciar_descontos') {
                await descontoPainel(interaction);
                return;
            }

            // Criar cupom → modal
            if (interaction.isButton() && customId === 'desc_add') {
                const modal = new ModalBuilder()
                    .setCustomId('desc_modal_add')
                    .setTitle('Criar Cupom de Desconto');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('codigo')
                            .setLabel('Código do cupom (ex: PROMO10)')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(30)
                            .setRequired(true)
                            .setPlaceholder('NATAL20')
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('nome')
                            .setLabel('Nome/descrição do cupom')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(80)
                            .setRequired(false)
                            .setPlaceholder('Promoção de natal')
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('tipo')
                            .setLabel('Tipo: "percent" (%) ou "fixed" (R$)')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(7)
                            .setRequired(true)
                            .setPlaceholder('percent')
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('valor')
                            .setLabel('Valor do desconto (ex: 10 para 10% ou R$10)')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(10)
                            .setRequired(true)
                            .setPlaceholder('10')
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('usos_max')
                            .setLabel('Máximo de usos (deixe em branco = ilimitado)')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(6)
                            .setRequired(false)
                            .setPlaceholder('100')
                    ),
                );
                await interaction.showModal(modal);
                return;
            }

            // Modal: salvar novo cupom
            if (interaction.isModalSubmit() && customId === 'desc_modal_add') {
                const codigo  = interaction.fields.getTextInputValue('codigo').trim();
                const nome    = interaction.fields.getTextInputValue('nome').trim();
                const tipo    = interaction.fields.getTextInputValue('tipo').trim().toLowerCase();
                const valor   = interaction.fields.getTextInputValue('valor').trim();
                const usosMax = interaction.fields.getTextInputValue('usos_max').trim();

                if (!['percent', 'fixed'].includes(tipo)) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} Tipo inválido. Digite \`percent\` ou \`fixed\`.`, ephemeral: true });
                }

                try {
                    const novo = criarDesconto({ codigo, nome, tipo, valor, usosMax: usosMax || null });
                    const val = novo.tipo === 'percent' ? `${novo.valor}%` : formatBRL(novo.valor);
                    await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                    await descontoPainel(interaction);
                    try {
                        await interaction.followUp({ content: `${Emojis.get('confirmed_emoji')} Cupom \`${novo.codigo}\` criado com sucesso! Desconto: \`${val}\`.`, ephemeral: true });
                    } catch (e) { }
                } catch (err) {
                    return interaction.reply({ content: `${Emojis.get('negative_emoji')} ${err.message}`, ephemeral: true });
                }
                return;
            }

            // Picker: remover cupom
            if (interaction.isButton() && customId === 'desc_remove_pick') {
                const descontos = listarDescontos();
                if (descontos.length === 0) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Nenhum cupom para remover.`, ephemeral: true });

                const options = descontos.slice(0, 25).map(d => ({
                    label: `${d.codigo}`.slice(0, 100),
                    value: d.id,
                    description: `${d.tipo === 'percent' ? `${d.valor}%` : formatBRL(d.valor)} — ${d.nome || ''}`.slice(0, 100),
                }));

                const container = new ContainerBuilder();
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('_trash_emoji')} Remover Cupom\nSelecione o cupom que deseja remover permanentemente.`
                ));
                container.addSeparatorComponents(new SeparatorBuilder());
                container.addActionRowComponents(new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder().setCustomId('desc_select_remove').setPlaceholder('Selecione o cupom...').addOptions(options)
                ));
                container.addActionRowComponents(new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('vnd_gerenciar_descontos').setLabel('Cancelar').setEmoji({ id: '1501803908589162537' }).setStyle(2)
                ));

                await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
                return;
            }

            // Confirmar remoção do cupom
            if (interaction.isStringSelectMenu() && customId === 'desc_select_remove') {
                const id = interaction.values[0];
                const descontos = listarDescontos();
                const desconto = descontos.find(d => d.id === id);
                if (!desconto) return interaction.reply({ content: `${Emojis.get('negative_emoji')} Cupom não encontrado.`, ephemeral: true });
                removerDesconto(id);
                await interaction.update({ content: `${Emojis.get('loading_emoji')} Carregando...`, components: [], embeds: [], flags: MessageFlags.IsComponentsV2 });
                await descontoPainel(interaction);
                try {
                    await interaction.followUp({ content: `${Emojis.get('confirmed_emoji')} Cupom \`${desconto.codigo}\` removido.`, ephemeral: true });
                } catch (e) { }
                return;
            }

        } catch (err) {
            if (err.code === 10062) return;
            console.error('[DescontoConfigHandler] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Ocorreu um erro.`, ephemeral: true });
                }
            } catch (e) { }
        }
    },
};
