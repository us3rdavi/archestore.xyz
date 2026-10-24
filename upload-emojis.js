const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const API_BASE = "https://discord.com/api/v10";
const CONFIG = require("./config.json");
const APPLICATION_ID = CONFIG.CLIENT_ID || CONFIG.botid;
const SOURCE_DIR = process.env.ICONPACK_DIR || path.join(__dirname, "iconpack");
const EMOJIS_JSON = path.join(__dirname, "Database/emojis.json");
const IMPORT_MANIFEST = path.join(__dirname, "Database/iconpack-import.json");
const DRY_RUN = process.argv.includes("--dry-run");

// Confirmed by comparing the source pixels/animation frames with the images
// returned by the application's emoji CDN. These IDs are used only when the
// exact source artwork is already present; names are not used for matching.
const VERIFIED_IMAGE_MATCHES = Object.freeze({
    "animated/bellringing.gif": "1501803880458092654",
    "animated/celebrating.gif": "1501803863546789900",
    "animated/refreshing.gif": "1501803873445351435",
    "animated/spinning.gif": "1501803860468174878",
    "animated/thinking.gif": "1501803870479843368",
    "animated/torefresh.gif": "1501803867023605873",
    "animated/toright.gif": "1501803876834345022",

    "core/account.png": "1501803899085131867",
    "core/bell.png": "1501804036540862464",
    "core/block.png": "1501804067616325723",
    "core/calendar.png": "1501804055826141246",
    "core/clock.png": "1501804058699366470",
    "core/fav.png": "1501804052827209768",
    "core/heart.png": "1501804079200993342",
    "core/hourglass.png": "1501804061719007232",
    "core/pin.png": "1501804120615555132",
    "core/settings.png": "1501804030605922346",
    "core/shield.png": "1501804064596558017",
    "core/star.png": "1501804049563910285",
    "core/upload.png": "1501804016210940075",

    "creation/brush.png": "1501804003850322052",
    "creation/colorpicker.png": "1501804007079936061",
    "creation/folder.png": "1501804010049634426",
    "creation/key.png": "1501804043121725490",
    "creation/notes.png": "1501804013262475275",
    "creation/roller.png": "1501803920576745522",
    "creation/sparks.png": "1501804125069901965",
    "creation/web.png": "1501804076189351949",
    "creation/wrench.png": "1501804000994132080",

    "dashboard/cloud.png": "1501804046229438585",
    "dashboard/console.png": "1502541664579879072",
    "dashboard/reload.png": "1501804022762573825",

    "discord/bot.png": "1501804019184828507",
    "discord/crown.png": "1501803902046048297",
    "discord/invite.png": "1501804070770573452",
    "discord/message.png": "1501804039451709441",
    "discord/report.png": "1501804073744072895",
    "discord/role.png": "1501804119030235136",
    "discord/send.png": "1501803923126747178",
    "discord/slash.png": "1501804027271319582",
    "discord/trashcan.png": "1501803926180335727",
    "discord/user.png": "1501803883452825611",
    "discord/users.png": "1501803896073621706",

    "economy/bag.png": "1501803951161479208",
    "economy/card.png": "1501803970337833040",
    "economy/cardbox.png": "1501803953841504327",
    "economy/cart.png": "1501803960393269298",
    "economy/coin.png": "1501803994861932625",
    "economy/dollar.png": "1501803982849445998",
    "economy/qrcode.png": "1501803973383028856",
    "economy/receipt.png": "1501803966806360084",
    "economy/shop.png": "1501803947898306724",
    "economy/transfer.png": "1501803997583904810",
    "economy/truck.png": "1501803963329286245",
    "economy/wallet.png": "1501803979456122884",

    "symbols/add.png": "1501803905363869769",
    "symbols/arrowl.png": "1501803908589162537",
    "symbols/arrowr.png": "1501803917640732722",
    "symbols/cancel.png": "1501803935453679616",
    "symbols/check.png": "1501803886283984948",
    "symbols/danger.png": "1501803938456932494",
    "symbols/info.png": "1501803944375222392",
    "symbols/left.png": "1501803911655198742",
    "symbols/plus.png": "1501803892889878548",
    "symbols/question.png": "1501803928973476023",
    "symbols/remove.png": "1501803889362473055",
    "symbols/rigth.png": "1501803914654257326",
    "symbols/success.png": "1501803932484108359",
    "symbols/warn.png": "1501803941112053861",
});

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function readJson(filePath, fallback) {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonAtomically(filePath, value) {
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 4)}\n`, "utf8");
    fs.renameSync(temporaryPath, filePath);
}

function collectImageFiles(directory, prefix = "") {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectImageFiles(absolutePath, relativePath);
        if (!entry.isFile() || !/\.(png|gif)$/i.test(entry.name)) return [];
        return [{ relativePath, absolutePath }];
    });
}

function makeBaseName(relativePath) {
    const stem = relativePath
        .replace(/\.(png|gif)$/i, "")
        .replace(/[\\/]/g, "_")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_");
    return `ip_${stem}`.slice(0, 32);
}

function addSuffix(base, number, maxLength = 32) {
    const suffix = `_${number}`;
    return `${base.slice(0, maxLength - suffix.length)}${suffix}`;
}

function chooseUnusedName(base, usedNames) {
    if (!usedNames.has(base)) return base;
    for (let number = 2; number < 10000; number += 1) {
        const candidate = addSuffix(base, number);
        if (!usedNames.has(candidate)) return candidate;
    }
    throw new Error(`Não foi possível criar um nome único para ${base}.`);
}

function chooseAliasKey(base, emojiMap, plannedKeys, mention) {
    if (!Object.prototype.hasOwnProperty.call(emojiMap, base) && !plannedKeys.has(base)) {
        return base;
    }
    if (emojiMap[base] === mention && !plannedKeys.has(base)) return base;
    for (let number = 2; number < 10000; number += 1) {
        const candidate = addSuffix(base, number);
        if (!Object.prototype.hasOwnProperty.call(emojiMap, candidate) && !plannedKeys.has(candidate)) {
            return candidate;
        }
        if (emojiMap[candidate] === mention && !plannedKeys.has(candidate)) return candidate;
    }
    throw new Error(`Não foi possível criar uma chave JSON única para ${base}.`);
}

async function discordRequest(token, route, options = {}) {
    for (let attempt = 1; attempt <= 8; attempt += 1) {
        const response = await fetch(`${API_BASE}${route}`, {
            ...options,
            headers: {
                Authorization: `Bot ${token}`,
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...options.headers,
            },
        });
        const responseText = await response.text();
        const body = responseText ? JSON.parse(responseText) : null;
        if (response.ok) return body;

        if (response.status === 429 && attempt < 8) {
            const retryAfter = Number(body?.retry_after || 1);
            await delay(Math.ceil(retryAfter * 1000) + 250);
            continue;
        }
        throw new Error(`${options.method || "GET"} ${route} retornou HTTP ${response.status}: ${body?.message || responseText}`);
    }
    throw new Error(`Limite de tentativas excedido em ${route}.`);
}

function emojiMention(emoji) {
    return emoji.animated
        ? `<a:${emoji.name}:${emoji.id}>`
        : `<:${emoji.name}:${emoji.id}>`;
}

async function main() {
    const tokenValue = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
    if (!tokenValue) throw new Error("Configure DISCORD_BOT_TOKEN nos Secrets do workspace.");
    if (!APPLICATION_ID) throw new Error("CLIENT_ID/botid não definido em config.json.");
    if (!fs.existsSync(SOURCE_DIR)) {
        throw new Error(`Pasta de imagens não encontrada. Extraia o ZIP e configure ICONPACK_DIR. Atual: ${SOURCE_DIR}`);
    }

    const token = tokenValue.trim().replace(/^Bot\s+/i, "");
    const apiRoute = `/applications/${APPLICATION_ID}/emojis`;
    const [remoteResult, emojiMap, manifest] = await Promise.all([
        discordRequest(token, apiRoute),
        Promise.resolve(readJson(EMOJIS_JSON, {})),
        Promise.resolve(readJson(IMPORT_MANIFEST, { version: 1, files: {} })),
    ]);
    const remoteEmojis = remoteResult.items || [];
    const byId = new Map(remoteEmojis.map(emoji => [emoji.id, emoji]));
    const byName = new Map(remoteEmojis.map(emoji => [emoji.name, emoji]));
    const files = collectImageFiles(SOURCE_DIR).sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    if (files.length === 0) throw new Error(`Nenhuma imagem PNG/GIF encontrada em ${SOURCE_DIR}.`);

    const plan = files.map(file => {
        const bytes = fs.readFileSync(file.absolutePath);
        const hash = crypto.createHash("sha256").update(bytes).digest("hex");
        const saved = manifest.files[file.relativePath];
        const savedEmoji = saved?.sha256 === hash ? byId.get(saved.id) : null;
        const verifiedEmoji = byId.get(VERIFIED_IMAGE_MATCHES[file.relativePath]);
        const reusable = savedEmoji || verifiedEmoji;
        return {
            ...file,
            bytes,
            hash,
            saved,
            savedEmoji,
            reusable,
            baseName: makeBaseName(file.relativePath),
        };
    });

    const reusableCount = plan.filter(item => item.reusable).length;
    const uploadCount = plan.length - reusableCount;
    if (DRY_RUN) {
        console.log(JSON.stringify({
            applicationId: APPLICATION_ID,
            currentApplicationEmojiCount: remoteEmojis.length,
            archiveImageCount: files.length,
            imageMatchesAlreadyInDiscord: reusableCount,
            imagesToUpload: uploadCount,
            noDeletions: true,
        }, null, 2));
        return;
    }

    const plannedKeys = new Set();
    const usedNames = new Set(byName.keys());
    let uploaded = 0;
    let reused = 0;
    const failures = [];

    for (let index = 0; index < plan.length; index += 1) {
        const item = plan[index];
        let emoji = item.reusable;
        let origin = item.savedEmoji ? "manifest" : "image-match";

        try {
            if (!emoji) {
                const name = chooseUnusedName(item.baseName, usedNames);
                const extension = path.extname(item.absolutePath).toLowerCase();
                const mimeType = extension === ".gif" ? "image/gif" : "image/png";
                emoji = await discordRequest(token, apiRoute, {
                    method: "POST",
                    body: JSON.stringify({
                        name,
                        image: `data:${mimeType};base64,${item.bytes.toString("base64")}`,
                    }),
                });
                usedNames.add(emoji.name);
                byId.set(emoji.id, emoji);
                byName.set(emoji.name, emoji);
                uploaded += 1;
                origin = "uploaded";
                manifest.files[item.relativePath] = {
                    id: emoji.id,
                    name: emoji.name,
                    key: null,
                    sha256: item.hash,
                    origin,
                };
                writeJsonAtomically(IMPORT_MANIFEST, manifest);
                await delay(350);
            } else {
                reused += 1;
            }

            const mention = emojiMention(emoji);
            const saved = manifest.files[item.relativePath] || {};
            const key = saved.key && (
                !Object.prototype.hasOwnProperty.call(emojiMap, saved.key) ||
                emojiMap[saved.key] === mention
            )
                ? saved.key
                : chooseAliasKey(item.baseName, emojiMap, plannedKeys, mention);

            plannedKeys.add(key);
            if (emojiMap[key] !== mention) emojiMap[key] = mention;
            manifest.files[item.relativePath] = {
                id: emoji.id,
                name: emoji.name,
                key,
                sha256: item.hash,
                origin,
            };
            writeJsonAtomically(IMPORT_MANIFEST, manifest);

            if ((index + 1) % 20 === 0 || index + 1 === plan.length) {
                console.log(`[${index + 1}/${plan.length}] ${item.relativePath}`);
            }
        } catch (error) {
            failures.push({ file: item.relativePath, error: error.message });
            console.error(`Falha em ${item.relativePath}: ${error.message}`);
        }
    }

    writeJsonAtomically(EMOJIS_JSON, emojiMap);
    console.log(JSON.stringify({
        applicationId: APPLICATION_ID,
        currentEmojiCountBeforeImport: remoteEmojis.length,
        sourceImages: files.length,
        imageMatchesReused: reused,
        uploaded,
        jsonReferencesAddedOrConfirmed: plannedKeys.size,
        failures,
        emojisDeleted: 0,
    }, null, 2));

    if (failures.length > 0) process.exitCode = 1;
}

main().catch(error => {
    console.error(`Importação interrompida: ${error.message}`);
    process.exitCode = 1;
});
