const colors = require("colors");

process.on('unhandledRejection', (err) => {
    console.log(`${colors.red(`[UNHANDLED]`)} ${err?.message || err}`);
});

(async () => {
    // 1. Conectar MongoDB e carregar todos os dados na memória ANTES de qualquer require que use banco
    const { initDatabase } = require('./Database');
    await initDatabase();

    // 2. Agora é seguro carregar tudo
    const { GatewayIntentBits, Client, Collection } = require("discord.js");
    const { AtivarIntents } = require("./Functions/StartIntents");
    const { configuracao, carrinhos } = require("./Database");
    const { handleDeletedMessage, handleUpdatedMessage } = require('./Functions/MsgsLogs');
    const { handleVoiceStateUpdate } = require('./Functions/VoiceLogs');
    const { handleProfileUpdate } = require('./Functions/ProfileLog');
    const { agendarRepostagem } = require('./Functions/repostagem');
    const _nodeFetch = require('node-fetch');
    const fetch = _nodeFetch.default || _nodeFetch;
    const schedule = require('node-schedule');
    const fs = require('fs');
    const path = require('path');
    const config = require("./config.json");

    const { sendMessage } = require('./Functions/MsgAutomatics');

    const estatisticasKingInstance = require("./Functions/VariaveisEstatisticas");
    const EstatisticasKing = new estatisticasKingInstance();
    module.exports.EstatisticasKing = EstatisticasKing;

    AtivarIntents();

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

    client.setMaxListeners(30);
    client.slashCommands = new Collection();
    module.exports.client = client;

    const events = require('./Handler/events');
    const slash = require('./Handler/slash');

    slash.run(client);
    events.run(client);

    // Evento ready
    client.once('ready', async () => {
        console.log(`Bot ${client.user.tag} está online!`);
        agendarRepostagem(client);
    });

    // Log de mensagens/voz/perfil — IDs lidos depois que o banco foi carregado
    const messageLogChannelId = configuracao.get(`ConfigChannels.mensagens`);
    const trafficLogChannelId = configuracao.get(`ConfigChannels.tráfego`);
    const profileLogChannelId = configuracao.get(`ConfigChannels.tráfego`);

    client.on('messageDelete', message => {
        if (messageLogChannelId) handleDeletedMessage(message, messageLogChannelId, client);
    });

    client.on('messageUpdate', (oldMessage, newMessage) => {
        if (messageLogChannelId) handleUpdatedMessage(oldMessage, newMessage, messageLogChannelId, client);
    });

    client.on('voiceStateUpdate', (oldState, newState) => {
        if (trafficLogChannelId) handleVoiceStateUpdate(oldState, newState, trafficLogChannelId, client);
    });

    client.on('guildMemberUpdate', (oldMember, newMember) => {
        if (profileLogChannelId) handleProfileUpdate(oldMember, newMember, profileLogChannelId, client);
    });

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isStringSelectMenu()) return;
        if (interaction.customId === 'extensaoapenasparaogeradorkkkk') {
            const selectedValue = interaction.values[0];
            if (selectedValue === 'geradorextensao') {
                await configgenpainelzika(interaction, client);
            }
        }
    });

    client.on('error', (err) => {
        console.log(`${colors.red(`[ERROR]`)} ${err.message}`);
    });

    // Reset de carrinhos às 05:55 (America/Sao_Paulo) — limpa cache e MongoDB
    function resetCarrinhos() {
        for (const key of Object.keys(carrinhos._cache)) {
            delete carrinhos._cache[key];
        }
        carrinhos._col?.deleteMany({}).catch(() => {});
        console.log('[Reset carrinhos] Carrinhos zerados com sucesso!');
    }

    schedule.scheduleJob({ hour: 5, minute: 55, tz: 'America/Sao_Paulo' }, resetCarrinhos);

    const botToken = process.env.DISCORD_BOT_TOKEN || config.token;
    client.login(botToken).catch((err) => {
        if (err?.message?.includes("intent")) return console.log(`${colors.red(`[LOG]`)} Ativa as Intents do Bot`);
        if (err?.message?.includes("invalid")) return console.log(`${colors.red(`[LOG]`)} Token Incorreto`);
        console.error(`${colors.red(`[LOGIN ERROR]`)}`, err);
    });

})().catch(err => {
    console.error('[FATAL] Falha ao iniciar o bot:', err);
    process.exit(1);
});
