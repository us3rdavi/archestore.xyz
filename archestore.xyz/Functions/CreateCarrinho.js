const { EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ChannelType, ButtonStyle } = require("discord.js");
const { configuracao, produtos, Emojis } = require("../DataBaseJson");
const { DentroCarrinho1 } = require("./DentroCarrinho");
const { carrinhos } = require("../DataBaseJson");
const { owner } = require("../config.json");

function VerificaçõesCarrinho(infos) {
    if (infos.estoque <= 0) return { error: 400, message: `Sem Stock Disponível` };
    return { status: 202 };
}

async function CreateCarrinho(interaction, infos) {
    const status = configuracao.get("vendasstatus") || false
    if (status === true) {
        await interaction.reply({ content: `${Emojis.get('negative_emoji')} As vendas estão desabilitadas nesse momento`, ephemeral: true })
        return;
    }
    try {
        const statusAtivo = configuracao.get("ConfigRoles.statuscomprar");
        const cargoNecessario = configuracao.get("ConfigRoles.cargocarrinho");
        const linkConfigurado = configuracao.get("ConfigLinks.link") || `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}`;

        // Verifica se o membro tem o cargo necessário
        if (statusAtivo && cargoNecessario && !interaction.member.roles.cache.has(cargoNecessario)) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Obter Acesso')
                    .setStyle(ButtonStyle.Link)
                    .setURL(linkConfigurado)
            );

            await interaction.reply({
                content: `Este servidor requer que os membros estejam verificados para abrir carrinhos. Por favor, clique no botão abaixo e autorize para continuar.`,
                components: [row],
                ephemeral: true
            });
            return;
        }

        // Verifica se o canal de logs de pedidos foi configurado
        if (configuracao.get("ConfigChannels.logpedidos") == null) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(`Ops... o canal de logs pedidos ainda não foi configurado, faça um retorno em breve!`)
                    .setColor(configuracao.get('Cores.Erro') || 'ff0000')
                ],
                ephemeral: true
            });
        }

        // Verifica se a forma de pagamento está configurada
        if (configuracao.get("pagamentos.MpOnOff") != true && configuracao.get("pagamentos.SemiAutomatico.status") != true && configuracao.get("pagamentos.EfiOnOff") != true) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(`Ops... a forma de pagamento não foi configurada ainda, faça um retorno em breve!`)
                    .setColor(configuracao.get('Cores.Erro') || 'ff0000')
                ],
                ephemeral: true
            });
        }

        // Resposta inicial indicando que o carrinho está sendo criado
        await interaction.reply({ content: `${Emojis.get('loading_emoji')} Criando seu carrinho...`, ephemeral: true }).then(async msg => {
            // Verifica se já existe um carrinho ou thread de troca
            const cartThread = interaction.channel.threads.cache.find(x => x.name === `🛒・${interaction.user.username}・${interaction.user.id}`);
            const exchangeThread = interaction.channel.threads.cache.find(x => x.name === `💱・${interaction.user.username}・${interaction.user.id}`);

            // Caso já exista, envia um botão para o usuário acessar o carrinho
            if (cartThread || exchangeThread) {
                const row4 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setURL(`https://discord.com/channels/${interaction.guild.id}/${cartThread ? cartThread.id : exchangeThread.id}`)
                            .setLabel('Ir para o carrinho')
                            .setStyle(ButtonStyle.Link)
                    );

                interaction.editReply({ content: `${Emojis.get('negative_emoji')} Você já possui um carrinho aberto.`, components: [row4] });
                return;
            }

            // Cria a thread do carrinho
            const thread = await interaction.channel.threads.create({
                name: `🛒・${interaction.user.username}・${interaction.user.id}`,
                autoArchiveDuration: 60,
                type: ChannelType.PrivateThread,
                reason: 'Needed a separate thread for moderation',
                members: [interaction.user.id],
            });

            // Envia o link para o carrinho recém-criado
            const row4 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setURL(`https://discord.com/channels/${interaction.guild.id}/${thread.id}`)
                        .setLabel('Ir para o carrinho')
                        .setStyle(ButtonStyle.Link)
                );

            msg.edit({ content: `${Emojis.get('confirmed_emoji')} Seu carrinho foi criado com êxito.`, components: [row4] });

            // Armazena o carrinho na base de dados
            await carrinhos.set(thread.id, { user: interaction.user.id, guild: interaction.guild.id, threadid: thread.id, infos: infos });

            // Chama a função para adicionar o usuário ao carrinho
            DentroCarrinho1(thread, undefined, interaction.client);
        });
    } catch (error) {
        console.error(error);
        interaction.reply({
            content: "Ocorreu um erro ao tentar criar o carrinho. Tente novamente mais tarde.",
            ephemeral: true
        });
    }
}

module.exports = {
    VerificaçõesCarrinho,
    CreateCarrinho
};
