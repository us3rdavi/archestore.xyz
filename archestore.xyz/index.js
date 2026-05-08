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

// Evento ready
client.once('ready', async () => {
    console.log(`Bot ${client.user.tag} está online!`);

    // Agendar repostagem
    agendarRepostagem(client);
});

slash.run(client);
events.run(client);

client.slashCommands = new Collection();

client.on('error', (err) => {
    console.log(`${colors.red(`[ERROR]`)} ${err.message}`);
});

process.on('unhandledRejection', (err) => {
    console.log(`${colors.red(`[UNHANDLED]`)} ${err?.message || err}`);
});

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

