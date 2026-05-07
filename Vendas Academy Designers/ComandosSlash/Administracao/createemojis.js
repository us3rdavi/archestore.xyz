const { PermissionFlagsBits, ApplicationCommandType } = require("discord.js");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { owner } = require('../../config.json');
const { configuracao } = require("../../DataBaseJson/index.js");
const { Emojis } = require("../../DataBaseJson");

module.exports = {
    name: "emojis",
    description: "[🤖] Criar emojis",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,

    run: async (client, interaction) => {
        const ownerIdList = owner;
        if (!ownerIdList.includes(interaction.user.id)) {
            return interaction.reply({
                content: `${Emojis.get(`negative_emoji`)} Você não possui permissão para usar este comando.`,
                ephemeral: true
            });
        }

        // Adia a resposta para não causar erro de "InteractionAlreadyReplied"
        await interaction.deferReply();

        configuracao.set(`Emojis_EntregAbaixo`, []);
        configuracao.set(`Emojis_EntregAuto`, []);

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

        // Criação dos emojis e atualização da configuração
        for (let i = 0; i < emojiArray.length; i++) {
            try {
                const emojiName = `eb${i + 1}`;
                const createdEmoji = await interaction.guild.emojis.create({
                    attachment: emojiArray[i],
                    name: emojiName
                });
                configuracao.push(`Emojis_EntregAbaixo`, { id: createdEmoji.id, name: createdEmoji.name });
            } catch (error) {
                console.error(error);
            }
        }

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

        // Criação dos emojis de vendas automáticas
        for (let i = 0; i < arrayVendasAuto.length; i++) {
            try {
                const emojiName = `ea${i + 1}`;
                const createdEmoji = await interaction.guild.emojis.create({
                    attachment: arrayVendasAuto[i],
                    name: emojiName
                });
                configuracao.push(`Emojis_EntregAuto`, { id: createdEmoji.id, name: createdEmoji.name });
            } catch (error) {
                console.error(error);
            }
        }

        // Responde ao usuário após a criação dos emojis
        await interaction.editReply(`Emojis foram adicionados com sucesso ao servidor!`);
    },
};
