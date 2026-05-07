const { ApplicationCommandType } = require("discord.js");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { configuracao, Emojis } = require("../../DataBaseJson/index.js");

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        if (customId === "create_emojis") {
            const perm = await getPermissions(client.user.id);
            if (!perm || !perm.includes(interaction.user.id)) {
                return interaction.reply({ content: `${Emojis.get(`negative_emoji`)} Você não possui permissão para usar esse comando.`, ephemeral: true });
            }

            await interaction.reply({ content: `${Emojis.get('loading_emoji')} **Colocando os emojis, aguarde...**`, ephemeral: true });

            const emojiArray = [
                "https://cdn.discordapp.com/emojis/1183841001824067676.webp?size=96&quality=lossless",
                "https://cdn.discordapp.com/emojis/1183841127661580339.webp?size=96&quality=lossless",
                "https://cdn.discordapp.com/emojis/1183841205839220776.webp?size=96&quality=lossless",
                "https://cdn.discordapp.com/emojis/1183841312018026556.webp?size=96&quality=lossless",
                "https://cdn.discordapp.com/emojis/1183841529148739669.webp?size=96&quality=lossless",
                "https://cdn.discordapp.com/emojis/1183841627425476621.webp?size=96&quality=lossless",
                "https://cdn.discordapp.com/emojis/1183841719976996885.webp?size=96&quality=lossless",
                "https://cdn.discordapp.com/emojis/1183841795864535151.webp?size=96&quality=lossless",
                "https://cdn.discordapp.com/emojis/1183841842467446844.webp?size=96&quality=lossless"
            ];

            const arrayVendasAuto = [
                "https://cdn.discordapp.com/emojis/1194131420499677317.webp?size=96&quality=lossless",
                "https://cdn.discordapp.com/emojis/1194131444797288549.webp?size=96&quality=lossless",
                "https://cdn.discordapp.com/emojis/1194131474534899753.webp?size=96&quality=lossless",
                "https://cdn.discordapp.com/emojis/1194131507858636961.webp?size=96&quality=lossless",
                "https://cdn.discordapp.com/emojis/1194131544764317736.webp?size=96&quality=lossless",
                "https://cdn.discordapp.com/emojis/1194131583767162960.webp?size=96&quality=lossless",
                "https://cdn.discordapp.com/emojis/1194131629812220005.webp?size=96&quality=lossless",
                "https://cdn.discordapp.com/emojis/1194131674196344922.webp?size=96&quality=lossless",
            ];

            
            const emojiscarrinhos242 = [
                "https://cdn.discordapp.com/emojis/1309529320007532647.gif?size=2048"
            ];

            try {
                await Promise.all(emojiArray.map(async (url, index) => {
                    const emojiName = `eb${index + 1}`;
                    const createdEmoji = await interaction.guild.emojis.create({ attachment: url, name: emojiName });
                    await configuracao.push(`Emojis_EntregAbaixo`, { id: createdEmoji.id, name: createdEmoji.name });
                }));

                await Promise.all(arrayVendasAuto.map(async (url, index) => {
                    const emojiName = `ea${index + 1}`;
                    const createdEmoji = await interaction.guild.emojis.create({ attachment: url, name: emojiName });
                    await configuracao.push(`Emojis_EntregAuto`, { id: createdEmoji.id, name: createdEmoji.name });
                }));

                await Promise.all(emojiscarrinhos242.map(async (url, index) => {
                    const emojiName = `ea${index + 1}`;
                    const createdEmoji = await interaction.guild.emojis.create({ attachment: url, name: emojiName });
                    await configuracao.push(`Emojis_carrinho`, { id: createdEmoji.id, name: createdEmoji.name });
                }));

                await interaction.editReply({ content: `${Emojis.get(`confirmed_emoji`)} Emojis adicionados com sucesso neste servidor! Lembre-se de reiniciar o bot para garantir que as alterações entrem em vigor.`, ephemeral: true });
            } catch (error) {
                console.error("Erro ao criar emojis:", error);
                await interaction.editReply({ content: `${Emojis.get(`negative_emoji`)} Ocorreu um erro ao adicionar os emojis.`, ephemeral: true });
            }
        }
    }
};
