const {
    ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags
} = require("discord.js");
const { configuracao, Emojis } = require("../DataBaseJson");


async function ConfigChannels(interaction, client) {
    const corPrincipal = configuracao.get('Cores.Principal') || '5865F2';
    let accentColor = 0x5865F2;
    try { accentColor = parseInt(corPrincipal.replace('#', ''), 16); } catch (e) {}

    const row1 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`selectChannelC`)
                .addOptions(
                    { value: `logpedidos`, label: `Definir canal de logs de pedidos`, emoji: `1371607279195127909` },
                    { value: `eventbuy`, label: `Definir canal de evento de compras`, emoji: `1371607279195127909` },
                    { value: `systemlogs`, label: `Definir canal de logs do sistema`, emoji: `${Emojis.get('_staff_emoji')}` },
                    { value: `antiraidlogschannel`, label: `Definir canal de logs do AntiRaid`, emoji: `${Emojis.get('_staff_emoji')}` },
                    { value: `logentrada`, label: `Definir canal de logs de entradas`, emoji: `1371607279195127909` },
                    { value: `logsaida`, label: `Definir canal de logs de saídas`, emoji: `1371607279195127909` },
                    { value: `logmensagem`, label: `Definir canal de logs de mensagens`, emoji: `1371607279195127909` },
                    { value: `trafegocall`, label: `Definir canal de logs de tráfego de call`, emoji: `1371607279195127909` },
                    { value: `feedback`, label: `Definir canal de logs de feedback`, emoji: `1371607279195127909` },
                    { value: `feedbackticket24`, label: `Definir canal de logs de feedback de ticket`, emoji: `1371607279195127909` }
                )
                .setPlaceholder(`Clique aqui para redefinir algum canal`)
                .setMaxValues(1)
        );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar2")
            .setEmoji(`1371605354605051996`)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji('1371605354605051996')
            .setStyle(1)
    );

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## Configurar Canais\n` +
            `**Canal de log de pedidos:** ${configuracao.get('ConfigChannels.logpedidos') == null ? 'Não definido' : `<#${configuracao.get('ConfigChannels.logpedidos')}>`}\n` +
            `**Canal de evento de compras:** ${configuracao.get('ConfigChannels.eventbuy') == null ? 'Não definido' : `<#${configuracao.get('ConfigChannels.eventbuy')}>`}\n` +
            `**Canal de logs do sistema:** ${configuracao.get('ConfigChannels.systemlogs') == null ? 'Não definido' : `<#${configuracao.get('ConfigChannels.systemlogs')}>`}\n` +
            `**Canal de logs do AntiRaid:** ${configuracao.get('ConfigChannels.antiraid') == null ? 'Não definido' : `<#${configuracao.get('ConfigChannels.antiraid')}>`}\n` +
            `**Canal de logs de entradas:** ${configuracao.get('ConfigChannels.entradas') == null ? 'Não definido' : `<#${configuracao.get('ConfigChannels.entradas')}>`}\n` +
            `**Canal de logs de saídas:** ${configuracao.get('ConfigChannels.saídas') == null ? 'Não definido' : `<#${configuracao.get('ConfigChannels.saídas')}>`}\n` +
            `**Canal de logs de mensagens:** ${configuracao.get('ConfigChannels.mensagens') == null ? 'Não definido' : `<#${configuracao.get('ConfigChannels.mensagens')}>`}\n` +
            `**Canal de logs de tráfego em call:** ${configuracao.get('ConfigChannels.tráfego') == null ? 'Não definido' : `<#${configuracao.get('ConfigChannels.tráfego')}>`}\n` +
            `**Canal de feedback:** ${configuracao.get('ConfigChannels.feedback') == null ? 'Não definido' : `<#${configuracao.get('ConfigChannels.feedback')}>`}\n` +
            `**Canal de feedback de ticket:** ${configuracao.get('ConfigChannels.feedbackticket') == null ? 'Não definido' : `<#${configuracao.get('ConfigChannels.feedbackticket')}>`}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(row1);
    container.addActionRowComponents(row2);

    interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}


async function ConfigRoles(interaction, client) {
    const corPrincipal = configuracao.get('Cores.Principal') || '5865F2';
    let accentColor = 0x5865F2;
    try { accentColor = parseInt(corPrincipal.replace('#', ''), 16); } catch (e) {}

    const row1 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`selectCargoC`)
                .addOptions(
                    { value: `definircargoadm`, label: `Definir cargo de Administrador`, emoji: `1246954960218886146` },
                    { value: `definircargosup`, label: `Definir cargo de Suporte`, emoji: `1246955036433453259` },
                    { value: `roleclienteease`, label: `Definir cargo de Cliente`, emoji: `1256806658101870684` },
                    { value: `rolememberok`, label: `Definir cargo de Membro`, emoji: `1246955106944028774` }
                )
                .setPlaceholder(`Clique aqui para redefinir algum cargo`)
                .setMaxValues(1)
        );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar2")
            .setEmoji(`1238413255886639104`)
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId(`voltar1`)
            .setEmoji('1292237216915128361')
            .setStyle(1)
    );

    const container = new ContainerBuilder();
    container;

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## Configurar Cargos\n` +
            `**Cargo de Administrador:** ${configuracao.get('ConfigRoles.cargoadm') == null ? 'Não definido' : `<@&${configuracao.get('ConfigRoles.cargoadm')}>`}\n` +
            `**Cargo de Suporte:** ${configuracao.get('ConfigRoles.cargosup') == null ? 'Não definido' : `<@&${configuracao.get('ConfigRoles.cargosup')}>`}\n` +
            `**Cargo de Cliente:** ${configuracao.get('ConfigRoles.cargoCliente') == null ? 'Não definido' : `<@&${configuracao.get('ConfigRoles.cargoCliente')}>`}\n` +
            `**Cargo de Membro:** ${configuracao.get('ConfigRoles.cargomembro') == null ? 'Não definido' : `<@&${configuracao.get('ConfigRoles.cargomembro')}>`}`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());
    container.addActionRowComponents(row1);
    container.addActionRowComponents(row2);

    interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        content: '',
        embeds: []
    });
}


module.exports = {
    ConfigRoles,
    ConfigChannels
};
