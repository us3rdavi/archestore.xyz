
const config = require("../config.json");

function AtivarIntents() {
    const token = process.env.DISCORD_BOT_TOKEN || config.token;

    fetch('https://discord.com/api/v10/users/@me', {
        headers: {
            Authorization: `Bot ${token}`,
        },
    })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            const url = `https://discord.com/api/v9/applications/${data.id}`;
            fetch(url, {
                method: "PATCH",
                headers: {
                    Authorization: `Bot ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    "flags": 8953856,
                }),
            });

        })
}




module.exports = {
    AtivarIntents
}
