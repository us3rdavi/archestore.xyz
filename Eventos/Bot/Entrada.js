const { WebhookClient, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { Convites, GuildsInvites, configuracao } = require("../../Database");
const { Emojis } = require("../../Database");

module.exports = {
    name: 'guildMemberAdd',
    TodosInvites,

    run: async (member, client) => {
        try {
            let GuildInvites = await GuildsInvites.get(member.guild.id) || [];
            await TodosInvites(client)

            const invites = await member.guild.invites.fetch();

            let invite = invites.find(invite => {
                const guildInvite = GuildInvites.find(guildInvite => guildInvite.code === invite.code);
                return guildInvite && guildInvite.uses < invite.uses;
            });

            let convidante

            if (invite) {
                try {
                    let user = await client.users.fetch(invite.inviterId);
                    let info = Convites.get(user.id) || { saidas: 0, fakes: 0, total: 0, convidados: [] };

                    if (member.id == user.id) {
                        info.fakes++;
                    }
                    info.total++;
                    info.convidados.push(member.id);
                    Convites.set(user.id, info);

                    convidante = `${user}\`${user.username}\` \n-# ${info.saidas} Saídas, ${info.fakes} Fakes, ${info.total} Total.`;
                } catch (error) {
                    console.error('Erro ao buscar o usuário:', error);
                    convidante = 'Erro ao processar o convidante.';
                }
            } else {
                convidante = 'Vanity URL';
            }

            let diasnodiscord = Math.floor((new Date() - member.user.createdAt) / (1000 * 60 * 60 * 24));

            const embed = new EmbedBuilder()
                .setTitle(`${Emojis.get(`member_add_emoji`)} | Entrada`)
                .setColor('#5865F2')
                .setDescription(`-# ${member}${member.user.username}\n${Emojis.get(`date_emoji`)} **Criação:** ${diasnodiscord} dias no Discord\n${Emojis.get(`invite_emoji`)} **Convidante:** ${convidante}`)

            try {
                let canal = await client.channels.fetch(configuracao.get(`ConfigChannels.entradas`));
                canal.send({ embeds: [embed] });
            } catch (error) {

            }
            try {
                const cargoID = configuracao.get(`ConfigRoles.cargomembro`);
                const cargo = await member.guild.roles.fetch(cargoID);
                if (!cargo) return console.error("Cargo não encontrado.");
                await member.roles.add(cargo);
            } catch (error) {
            }
        } catch (error) {
            console.error('Erro ao verificar o link do convite usado:', error);
        }

        async function sendEmbed(channelId, member, reason, description) {
            let diasnodiscord = Math.floor((new Date() - member.user.createdAt) / (1000 * 60 * 60 * 24));

            const embedMessage = new EmbedBuilder()
                .setAuthor({ name: member.user.username })
                .setTitle(`Anti-Fake`)
                .setDescription(description)
                .addFields(
                    { name: `User ID`, value: `${member.user.id}`, inline: true },
                    { name: `Data de criação`, value: `${diasnodiscord} dias no Discord`, inline: true }
                )
                .setFooter({ text: member.guild.name })
                .setTimestamp()
                .setColor(configuracao.get(`Cores.Principal`) || `#5865F2`);

            try {
                const notificationChannel = client.channels.cache.get(channelId);
                await notificationChannel.send({ embeds: [embedMessage] });
            } catch (error) {
                console.error('Erro ao enviar embed:', error);
            }
        }

        async function kickMember(member, reason, channelId) {
            await member.kick(reason);
            await sendEmbed(channelId, member, reason, `Usuário foi expulso por ${reason}.`);
        }

        try {
            const welcomeMessageTemplate = configuracao.get(`Entradas.msg`);

            const replacementMap = {
                "{member}": `<@${member.user.id}>`,
                "{guildname}": `${member.guild.name}`
            };

            const formattedMessage = welcomeMessageTemplate.replace(/{member}|{guildname}/g, match => replacementMap[match] || match);
            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('asSs')
                        .setLabel('Mensagem do Sistema')
                        .setStyle(2)
                        .setDisabled(true)
                );

            let canaisentradas = configuracao.get(`Entradas.entradas`) || [];

            if (canaisentradas.length > 0) {
                for (const key in canaisentradas) {
                    const canalid = canaisentradas[key];
                    try {
                        let canal = await client.channels.fetch(canalid);
                        canal.send({ content: formattedMessage, components: [buttonRow] }).then(async (msg) => {
                            let tempo = configuracao.get(`Entradas.tempo`);
                            if (tempo > 0) {
                                setTimeout(async () => {
                                    try {
                                        await msg.delete();
                                    } catch (error) {
                                        console.error('Erro ao deletar mensagem:', error);
                                    }
                                }, tempo * 1000);
                            }
                        });
                    } catch (error) {
                        canaisentradas = canaisentradas.filter(item => item !== canalid);
                        configuracao.set(`Entradas.entradas`, canaisentradas);
                    }
                }
            }

            const blacklistedNames = configuracao.get(`AntiFake.nomes`);
            if (blacklistedNames) {
                const isNameBlacklisted = blacklistedNames.some(name => member.user.username.includes(name));
                if (isNameBlacklisted) {
                    await kickMember(member, `ter o nome \`${member.user.username}\` que está na blacklist.`, configuracao.get(`ConfigChannels.boasvindascoole`));
                }
            }

            const blacklistedStatuses = configuracao.get(`AntiFake.status`);
            if (blacklistedStatuses) {
                try {
                    await member.fetch(true);
                    const presence = member?.presence;
                    if (presence && presence.activities) {
                        const customStatusActivity = presence.activities.find(activity => activity.type === 4);
                        const customStatusState = customStatusActivity ? customStatusActivity.state : null;

                        const isStatusBlacklisted = blacklistedStatuses.some(name => customStatusState && customStatusState.includes(name));
                        if (isStatusBlacklisted) {
                            await kickMember(member, `ter o status \`${customStatusState}\` na blacklist.`, configuracao.get(`ConfigChannels.boasvindascoole`));
                        }
                    }
                } catch (error) {
                    console.error('Erro ao buscar presença do membro:', error);
                }
            }

            const minimumAccountDays = configuracao.get(`AntiFake.diasminimos`);
            if (minimumAccountDays !== null) {
                let daysElapsed = Math.floor((new Date() - member.user.createdAt) / (1000 * 60 * 60 * 24));
                if (daysElapsed < minimumAccountDays) {
                    await kickMember(member, `ter uma conta com menos de \`${daysElapsed}\` dias.`, configuracao.get(`ConfigChannels.boasvindascoole`));
                }
            }
        } catch (error) {
            console.error('Erro na execução:', error);
        }
    }
}

async function TodosInvites(client) {
    client.guilds.cache.forEach(async (guild) => {
        const invites = await guild.invites.fetch();
        let convites = GuildsInvites.get(guild.id) || [];
        const existingInviteCodes = new Set(invites.map(invite => invite.code));

        convites = convites.filter(existingInvite => {
            const stillExists = existingInviteCodes.has(existingInvite.code);
            if (stillExists) {
                const currentInvite = invites.find(invite => invite.code === existingInvite.code);
                existingInvite.uses = currentInvite ? currentInvite.uses : 0;
                return true;
            }
            return false;
        });

        invites.forEach((invite) => {
            const inviteData = {
                guildId: invite.guildId,
                code: invite.code,
                temporary: invite.temporary,
                maxAge: invite.maxAge,
                maxUses: invite.maxUses,
                inviterId: invite.inviterId,
                targetUser: invite.targetUser,
                targetApplication: invite.targetApplication,
                targetType: invite.targetType,
                channelId: invite.channelId,
                createdTimestamp: invite.createdTimestamp,
                url: invite.url,
                expiresTimestamp: invite.expiresTimestamp,
                uses: invite.uses || 0,
            };

            const existingInvite = convites.find(existingInvite => existingInvite.code === invite.code);
            if (!existingInvite) {
                convites.push(inviteData);
            }
        });

        GuildsInvites.set(guild.id, convites);
    });
}


