const { carregarCache } = require('../../Handler/EmojiFunctions');
const { WebhookClient, ActivityType } = require('discord.js');
const { CloseThreds } = require('../../Functions/CloseThread');
const { VerificarPagamento } = require('../../Functions/VerficarPagamento');
const { EntregarPagamentos } = require('../../Functions/AprovarPagamento');
const { CheckPosition } = require('../../Functions/PosicoesFunction.js');
const { configuracao, Convites, GuildsInvites } = require('../../DataBaseJson');
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
        const configuracoes = ['Status1', 'Status2'];
        let indiceAtual = 0;

        TodosInvites(client)

        function setActivityWithInterval(client, configuracoes, type, interval) {
            setInterval(() => {
                const configuracaoKey = configuracoes[indiceAtual];
                const status = configuracao.get(configuracaoKey);

                if (status !== null) {
                    client.user.setActivity(status, { type, url: "https://www.twitch.tv/discord" });
                }

                indiceAtual = (indiceAtual + 1) % configuracoes.length;
            }, interval);
        }

        setActivityWithInterval(client, configuracoes, ActivityType.Streaming, 5000);

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

        // Limpar carrinhos.js
        async function resetCarrinhosFile() {
            const filePath = path.resolve(__dirname, '../../DataBaseJson/carrinhos.json');
            const content = '{}';

            try {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log('Arquivo carrinhos.json foi limpo e redefinido com sucesso.');
            } catch (error) {
                console.error('Erro ao redefinir o arquivo carrinhos.js:', error);
            }
        }

        // Atualizando bio e descrição do bot logo após ele ligar
        async function updateBotInfo() {
            const bio = "bots oficiais da wish";  // Sua nova bio aqui
            const description = "🔧 Powered By Wish";  // Sua nova descrição aqui
            const endpoint = `https://discord.com/api/v9/applications/${client.user.id}`;
            const headers = {
                "Authorization": `Bot ${client.token}`,
                "Content-Type": "application/json"
            };

            try {
                // Pega a descrição atual do bot
                const currentInfo = await fetch(endpoint, { headers, method: "GET" });
                const currentData = await currentInfo.json();

                // Verifica se já há uma descrição e apaga se houver
                if (currentData.description && currentData.description !== description) {
                    console.log('Apagando descrição antiga antes de definir a nova...');
                    await fetch(endpoint, {
                        headers,
                        method: "PATCH",
                        body: JSON.stringify({ description: null, bio: null })  // Apaga a descrição e bio atuais
                    });
                }

                // Define a nova bio e descrição
                const response = await fetch(endpoint, {
                    headers,
                    method: "PATCH",
                    body: JSON.stringify({ description, bio })
                });

                if (!response.ok) {
                    throw new Error('Erro ao atualizar a bio e a descrição do bot');
                }
                console.log('Bio e descrição atualizadas com sucesso');
            } catch (error) {
                console.error('Erro ao atualizar bio e descrição do bot:', error);
            }
        }

        // Chamar a função logo após o bot ligar
        await resetCarrinhosFile();
        await updateBotInfo();

        // Agenda para verificar e aprovar pagamentos

        const verifyPayments = () => {
            VerificarPagamento(client);
        };
        const deliverPayments = () => {
            EntregarPagamentos(client, interaction);
        };
        const closeThreads = () => {
            CloseThreds(client);
        };
        const updateGeneral = async () => {
            await UpdateGeral(client);
        };

        restart(client)
        Varredura(client)

        setInterval(() => {
            Varredura(client)
        }, 86400000);

        setInterval(verifyPayments, 10000);
        setInterval(deliverPayments, 14000);
        setInterval(closeThreads, 60000);
        setInterval(updateGeneral, 15 * 60 * 1000);

        async function UpdateGeral(client) {

            let config = {
                method: 'GET',
                headers: {
                    'token': 'ac3add76c5a3c9fd6952a#'
                }
            };

            const description = "faster solutions 🔧 Powered By Wish";

            const addonsFetch = await fetch(`http://apivendas.squareweb.app/api/v1/adicionais/${client.user.id}`, config).catch(() => null);
            if (addonsFetch) {

                const addonsData = await addonsFetch.json().catch(() => null);
                if (addonsData && addonsData?.adicionais?.RemoverAnuncio !== true) {
                    const endpoint = `https://discord.com/api/v9/applications/${client.user.id}`;
                    const headers = {
                        "Authorization": `Bot ${client.token}`,
                        "Content-Type": "application/json"
                    };

                    fetch(endpoint, { headers, method: "PATCH", body: JSON.stringify({}) })
                        .then(async (response) => {
                            const body = await response.json();
                            if (!body) return;

                            if (JSON.stringify(body.description) !== JSON.stringify(description)) {

                                await fetch(endpoint, { headers, method: "PATCH", body: JSON.stringify({ description }) }).catch(() => null);
                            }
                        })
                        .catch(() => null);
                }
            }
        }

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