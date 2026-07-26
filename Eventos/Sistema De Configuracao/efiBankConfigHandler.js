'use strict';

/**
 * Handler para configuração completa do EfiBank PIX.
 * Gerencia: credenciais (client_id, client_secret, cert, chave pix) e toggle on/off.
 */

const {
    ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require('discord.js');
const { configuracao, Emojis } = require('../../Database');
const { EfiBankConfiguracao } = require('../../Functions/FormasDePagamentosConfig');

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            // ── Alterar credenciais → step 1: client_id + client_secret ──────────
            if (interaction.isButton() && customId === 'alterarcredenciais') {
                const atual = configuracao.get('pagamentos.EfiAPI') || {};
                const modal = new ModalBuilder()
                    .setCustomId('efi_modal_creds_step1')
                    .setTitle('EfiBank — Credenciais (1/2)');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('client_id')
                            .setLabel('Client ID')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(200)
                            .setRequired(true)
                            .setPlaceholder('Client_Id_...')
                            .setValue(atual.client_id || '')
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('client_secret')
                            .setLabel('Client Secret')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(200)
                            .setRequired(true)
                            .setPlaceholder('Client_Secret_...')
                            .setValue(atual.client_secret || '')
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('chavepix')
                            .setLabel('Chave PIX (CPF, CNPJ, email, aleatória)')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(200)
                            .setRequired(true)
                            .setPlaceholder('Sua chave PIX cadastrada na EfiBank')
                            .setValue(atual.chavepix || '')
                    ),
                );
                await interaction.showModal(modal);
                return;
            }

            // ── Modal step 1: salva client_id, secret, chave pix → pede certificado ─
            if (interaction.isModalSubmit() && customId === 'efi_modal_creds_step1') {
                const clientId     = interaction.fields.getTextInputValue('client_id').trim();
                const clientSecret = interaction.fields.getTextInputValue('client_secret').trim();
                const chavepix     = interaction.fields.getTextInputValue('chavepix').trim();

                // Salva parcialmente (cert será configurado no passo 2)
                const atual = configuracao.get('pagamentos.EfiAPI') || {};
                configuracao.set('pagamentos.EfiAPI', {
                    ...atual,
                    client_id: clientId,
                    client_secret: clientSecret,
                    chavepix,
                });

                await interaction.deferUpdate();

                // Mostra painel para configurar o certificado
                const container = new ContainerBuilder();
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${Emojis.get('_efi_emoji')} EfiBank — Certificado (2/2)\n\n` +
                    `${Emojis.get('confirmed_emoji')} Client ID, Client Secret e Chave PIX salvos.\n\n` +
                    `Agora configure o certificado \`.p12\` convertido em **base64**.\n\n` +
                    `**Como converter:**\n` +
                    `-# 1. Baixe seu certificado \`.p12\` do portal EfiBank\n` +
                    `-# 2. Converta para base64: \`base64 -w 0 certificado.p12\`\n` +
                    `-# 3. Cole o resultado no campo abaixo\n\n` +
                    `-# Sem o certificado o PIX automático não funcionará.`
                ));
                container.addSeparatorComponents(new SeparatorBuilder());
                container.addActionRowComponents(new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('efi_set_cert')
                        .setLabel('Configurar Certificado')
                        .setEmoji({ id: '1501803923126747178' })
                        .setStyle(3),
                    new ButtonBuilder()
                        .setCustomId('configurarefibank')
                        .setLabel('Pular (já configurado)')
                        .setEmoji({ id: '1501803908589162537' })
                        .setStyle(2),
                ));

                await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, embeds: [], content: '' });
                return;
            }

            // ── Botão: configurar certificado → modal ────────────────────────────
            if (interaction.isButton() && customId === 'efi_set_cert') {
                const modal = new ModalBuilder()
                    .setCustomId('efi_modal_cert')
                    .setTitle('EfiBank — Certificado .p12 em Base64');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('cert_base64')
                            .setLabel('Certificado .p12 em Base64')
                            .setStyle(TextInputStyle.Paragraph)
                            .setMaxLength(4000)
                            .setRequired(true)
                            .setPlaceholder('Cole aqui o conteúdo base64 do seu certificado .p12')
                    ),
                );
                await interaction.showModal(modal);
                return;
            }

            // ── Modal: salva certificado ─────────────────────────────────────────
            if (interaction.isModalSubmit() && customId === 'efi_modal_cert') {
                const certBase64 = interaction.fields.getTextInputValue('cert_base64').trim();
                const atual = configuracao.get('pagamentos.EfiAPI') || {};
                configuracao.set('pagamentos.EfiAPI', { ...atual, cert_base64: certBase64 });
                await interaction.deferUpdate();
                await EfiBankConfiguracao(client, interaction, 1);
                return;
            }

            // ── Toggle EfiBank on/off ────────────────────────────────────────────
            if (interaction.isButton() && customId === 'efionoff') {
                const atual = configuracao.get('pagamentos.EfiOnOff') === true;
                configuracao.set('pagamentos.EfiOnOff', !atual);
                await interaction.deferUpdate();
                await EfiBankConfiguracao(client, interaction, 1);
                return;
            }

            // ── Navegar para tela de config EFI ─────────────────────────────────
            if (interaction.isButton() && customId === 'configurarefibank') {
                await EfiBankConfiguracao(client, interaction, 0);
                return;
            }

        } catch (err) {
            if (err.code === 10062) return;
            console.error('[EfiBankConfigHandler] Erro:', err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `${Emojis.get('negative_emoji')} Erro: ${err.message}`, ephemeral: true });
                }
            } catch (e) { }
        }
    },
};
