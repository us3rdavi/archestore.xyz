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

        console.log("Apagando comandos globais...");
        await rest.put(Routes.applicationCommands(clientId), { body: [] });
        console.log("Comandos globais apagados!");

        console.log("Buscando servidores do bot...");
        const guilds = await rest.get(`/users/@me/guilds`);
        console.log(`Bot está em ${guilds.length} servidor(es).`);

        for (const guild of guilds) {
            try {
                await rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body: [] });
                console.log(`Comandos apagados no servidor: ${guild.name}`);
            } catch (err) {
                console.warn(`Erro ao apagar comandos em ${guild.name}: ${err.message}`);
            }
        }

        console.log("\nTodos os comandos foram apagados com sucesso!");
        console.log("Reinicie o bot para registrar os novos comandos.");
    } catch (error) {
        console.error("Erro:", error.message);
    }
})();
