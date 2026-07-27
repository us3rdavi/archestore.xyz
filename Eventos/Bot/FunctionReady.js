const { carregarCache } = require('../../Handler/EmojiFunctions');
const { WebhookClient } = require('discord.js');
const { CloseThreds } = require('../../Functions/CloseThread');
const { CheckPosition } = require('../../Functions/PosicoesFunction.js');
const { configuracao, Convites, GuildsInvites, carrinhos } = require('../../Database');
const { restart } = require('../../Functions/Restart.js');
const { Varredura } = require('../../Functions/Varredura.js');
const colors = require("colors");
const { ClearAutomatic, SystemLockAndUnlock, SystemNukedChannels } = require('../../Functions/SistemaAutomatico.js');
const { CheckarPunicoes } = require('../Sistema De Logs/NewMessage.js');
const { UploadEmojis } = require('../../FunctionEmojis/EmojisFunction.js');
const { TodosInvites } = require('./Entrada.js');
const path = require('path'); // Adicione esta linha
const fs = require('fs'); // Adicione esta linha se ainda não estiver presente

module.exports = {
    name: 'ready',

    run: async (client, interaction) => {
        TodosInvites(client)

        if (client.guilds.cache.size > 4) {
            client.guilds.cache.forEach(guild => {
                guild.leave()
                    .then(() => {
                        console.log(`Bot saiu do servidor: ${guild.name}`);
                    })
                    .catch(error => {
                        console.error(`Erro ao sair do servidor: ${guild.name}`, error);
                    });
            });
        }

        const closeThreads = () => {
            CloseThreds(client);
        };
        restart(client)
        Varredura(client)

        setInterval(() => {
            Varredura(client)
        }, 86400000);

        setInterval(closeThreads, 60000);
        console.log(`${colors.green(`[LOG]`)} ${client.user.tag} Is ready!`)
        console.log(`${colors.green(`[LOG]`)} Version: v2.0.0`)
        console.log(`${colors.green(`[LOG]`)} I'm not finished, but I'm being done with a lot of hate and stress\n`)
        await UploadEmojis(client).then(() => console.log('\x1b[36m[Emojis]\x1b[0m Todos os emojis foram carregados com sucesso.')).catch(err => console.error('\x1b[31m[Emojis]\x1b[0m Erro ao carregar os emojis:', err));

        console.log(`${colors.blue(`[CREDITS]`)} @odeletefodendoloiras - yands`)
        console.log(`${colors.blue(`[CREDITS]`)} @garotasmentem - sousadelas`)
        console.log(`${colors.blue(`[SERVER HELP]`)} https://discord.gg/barrinha\n`)

        CheckPosition(client)
        carregarCache()

        // ClearAutomatic(client)
        setInterval(() => {
            ClearAutomatic(client)
            SystemLockAndUnlock(client)
            SystemNukedChannels(client)
            CheckarPunicoes(client)
        }, 10000);
    }
}