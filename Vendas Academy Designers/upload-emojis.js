const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const token = process.env.DISCORD_BOT_TOKEN;
const ICON_BASE = "/tmp/iconpack";
const EMOJIS_JSON = path.join(__dirname, "DataBaseJson/Emojis.json");

const rest = new REST({ version: "10" }).setToken(token);

// Mapeamento: chave do Emojis.json → arquivo do iconpack
const mapping = {
    // Animados
    "loading_emoji":         "animated/spinning.gif",
    "success":               "animated/celebrating.gif",
    "loading":               "animated/torefresh.gif",
    "a0_emoji":              "animated/thinking.gif",
    "a1_emoji":              "animated/refreshing.gif",
    "a2_emoji":              "animated/refreshing.gif",
    "a3_emoji":              "animated/spinning.gif",
    "a4_emoji":              "animated/toright.gif",
    "a5_emoji":              "animated/celebrating.gif",
    "a6_emoji":              "animated/toright.gif",
    "a7_emoji":              "animated/bellringing.gif",

    // Usuários / membros
    "failuser_emoji":        "discord/user.png",
    "member_verified_emoji": "symbols/check.png",
    "member_remove_emoji":   "symbols/remove.png",
    "member_add_emoji":      "symbols/plus.png",
    "_silueta_emoji":        "discord/user.png",
    "_multi_silueta_emoji":  "discord/users.png",
    "_people_emoji":         "discord/users.png",
    "_support_emoji":        "core/account.png",
    "_staff_emoji":          "discord/crown.png",

    // Ações / navegação
    "_add_emoji":            "symbols/add.png",
    "_back_emoji":           "symbols/arrowl.png",
    "_left_emoji":           "symbols/left.png",
    "_right_emoji":          "symbols/rigth.png",
    "_rigth_emoji":          "symbols/rigth.png",
    "repost_emoji":          "symbols/arrowr.png",
    "_change_emoji":         "creation/roller.png",
    "_send_emoji":           "discord/send.png",
    "_confirm_emoji":        "symbols/check.png",
    "_trash_emoji":          "discord/trashcan.png",
    "_clean_emoji":          "discord/trashcan.png",
    "_search_emoji":         "symbols/question.png",

    // Status / resultado
    "confirmed_emoji":       "symbols/success.png",
    "negative_emoji":        "symbols/cancel.png",
    "error":                 "symbols/danger.png",
    "warn_emoji":            "symbols/warn.png",
    "confirmedpayment_emoji":"symbols/success.png",
    "failpayment_emoji":     "symbols/danger.png",
    "confirmed_backup_emoji":"symbols/check.png",
    "information_emoji":     "symbols/info.png",
    "question_emoji":        "symbols/question.png",

    // Economia / pagamentos
    "store_emoji":           "economy/shop.png",
    "neworder_emoji":        "economy/bag.png",
    "deliveredorder_emoji":  "economy/cardbox.png",
    "completedcart_emoji":   "economy/basket.png",
    "_cart_emoji":           "economy/cart.png",
    "config_cart_emoji":     "economy/cart.png",
    "_carrinhoyands_emoji":  "economy/cart.png",
    "caminhao_entrega":      "economy/truck.png",
    "realizou_pagamento":    "economy/receipt.png",
    "ltc_stamp_emoji":       "economy/receipt.png",
    "card_stamp_emoji":      "economy/card.png",
    "stripe_emoji":          "economy/card.png",
    "pix_stamp_emoji":       "economy/qrcode.png",
    "_efi_emoji":            "economy/bank.png",
    "_mp_emoji":             "economy/wallet.png",
    "_money_emoji":          "economy/dollar.png",
    "dindin_emoji":          "economy/coin.png",
    "ltc_emoji":             "economy/coin.png",
    "_transfer_emoji":       "economy/transfer.png",

    // Ferramentas / criação
    "_tool_emoji":           "creation/wrench.png",
    "_fixe_emoji":           "creation/wrench.png",
    "_lapis_emoji":          "creation/brush.png",
    "_pincel_emoji":         "creation/brush.png",
    "_custom_emoji":         "creation/colorpicker.png",
    "_folder_emoji":         "creation/folder.png",
    "_camp_emoji":           "creation/notes.png",
    "_text_emoji":           "creation/notes.png",
    "photo_emoji":           "core/upload.png",

    // Sistema / bot
    "system_emoji":          "discord/bot.png",
    "dreamapps":             "discord/bot.png",
    "restartbot_emoji":      "dashboard/reload.png",
    "command_emoji":         "discord/slash.png",
    "_settings_emoji":       "core/settings.png",
    "_ghost_emoji":          "discord/invisible.png",
    "_notify_emoji":         "core/bell.png",
    "_messages_emoji":       "discord/message.png",
    "_mail_emoji":           "discord/message.png",
    "_ticket_emoji":         "creation/key.png",
    "ecloud_emoji":          "dashboard/cloud.png",

    // Outros
    "_star_emoji":           "core/star.png",
    "_diamond_emoji":        "core/fav.png",
    "date_emoji":            "core/calendar.png",
    "clock_emoji":           "core/clock.png",
    "time_emoji":            "core/hourglass.png",
    "permissions_emoji":     "core/shield.png",
    "defense_emoji":         "core/shield.png",
    "_ban_emoji":            "core/block.png",
    "invite_emoji":          "discord/invite.png",
    "flag_emoji":            "discord/report.png",
    "_flag_emoji":           "discord/report.png",
    "brand_emoji":           "creation/web.png",
    "dream":                 "core/heart.png",
    "lupa":                  "symbols/question.png",
};

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function toDataURI(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === ".gif" ? "image/gif" : "image/png";
    const data = fs.readFileSync(filePath).toString("base64");
    return `data:${mime};base64,${data}`;
}

(async () => {
    try {
        const app = await rest.get(Routes.oauth2CurrentApplication());
        const clientId = app.id;
        console.log(`\nBot ID: ${clientId}`);

        // Apagar emojis antigos desta aplicação
        console.log("\n[1/3] Buscando emojis antigos...");
        const existing = await rest.get(`/applications/${clientId}/emojis`);
        const oldEmojis = existing.items || [];
        console.log(`Encontrados ${oldEmojis.length} emojis antigos.`);

        for (const emoji of oldEmojis) {
            try {
                await rest.delete(`/applications/${clientId}/emojis/${emoji.id}`);
                process.stdout.write(`  Apagado: ${emoji.name}\n`);
                await sleep(300);
            } catch (e) {
                console.warn(`  Erro ao apagar ${emoji.name}: ${e.message}`);
            }
        }

        // Fazer upload dos novos emojis
        console.log("\n[2/3] Fazendo upload dos novos emojis...");
        const newEmojis = {};
        const uploaded = {};

        for (const [key, iconPath] of Object.entries(mapping)) {
            const fullPath = path.join(ICON_BASE, iconPath);
            if (!fs.existsSync(fullPath)) {
                console.warn(`  ARQUIVO NÃO ENCONTRADO: ${iconPath}`);
                continue;
            }

            // Reusar upload se mesmo arquivo já foi feito
            if (uploaded[iconPath]) {
                const cached = uploaded[iconPath];
                const animated = iconPath.endsWith(".gif");
                newEmojis[key] = animated
                    ? `<a:${key}:${cached.id}>`
                    : `<:${key}:${cached.id}>`;
                console.log(`  Reutilizado: ${key} → ${cached.name} (${cached.id})`);
                continue;
            }

            try {
                const image = toDataURI(fullPath);
                const result = await rest.post(`/applications/${clientId}/emojis`, {
                    body: { name: key, image }
                });

                const animated = iconPath.endsWith(".gif");
                newEmojis[key] = animated
                    ? `<a:${key}:${result.id}>`
                    : `<:${key}:${result.id}>`;

                uploaded[iconPath] = result;
                console.log(`  ✓ ${key} (${result.id})`);
                await sleep(500);
            } catch (e) {
                console.error(`  ✗ Erro em ${key}: ${e.message}`);
                await sleep(1000);
            }
        }

        // Atualizar Emojis.json
        console.log("\n[3/3] Atualizando Emojis.json...");
        const oldJson = JSON.parse(fs.readFileSync(EMOJIS_JSON, "utf8"));

        // Manter chaves não mapeadas intactas
        const finalJson = { ...oldJson, ...newEmojis };
        fs.writeFileSync(EMOJIS_JSON, JSON.stringify(finalJson, null, 4), "utf8");

        console.log(`\n✅ Concluído! ${Object.keys(newEmojis).length} emojis atualizados.`);
        console.log("Reinicie o bot para aplicar as mudanças.\n");

    } catch (error) {
        console.error("Erro fatal:", error.message);
        process.exit(1);
    }
})();
