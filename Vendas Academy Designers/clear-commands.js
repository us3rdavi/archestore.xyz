const { REST, Routes } = require("discord.js");

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
    console.error("Token não encontrado. Configure DISCORD_BOT_TOKEN.");
    process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
    try {
        console.log("Buscando informações do bot...");
        const app = await rest.get(Routes.oauth2CurrentApplication());
        const clientId = app.id;
        console.log(`Bot ID: ${clientId}`);

        console.log("Apagando todos os comandos slash antigos...");
        await rest.put(Routes.applicationCommands(clientId), { body: [] });
        console.log("Comandos globais apagados com sucesso!");
    } catch (error) {
        console.error("Erro ao apagar comandos:", error.message);
    }
})();
