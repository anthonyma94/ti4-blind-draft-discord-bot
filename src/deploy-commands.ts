import { REST, Routes } from "discord.js";
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function deploy() {
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.DISCORD_GUILD_ID;

    if (!token || !clientId || !guildId) {
        console.error(
            "Missing DISCORD_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID environment variable",
        );
        process.exit(1);
    }

    const commands = [];
    const commandsDir = join(__dirname, "commands");
    const commandFiles = readdirSync(commandsDir).filter(
        (f) => f.endsWith(".ts") || f.endsWith(".js"),
    );

    for (const file of commandFiles) {
        const { data } = await import(join(commandsDir, file));
        if (data) {
            commands.push(data.toJSON());
        } else {
            console.warn(
                `[WARN] Command at ${join(commandsDir, file)} is missing a "data" export.`,
            );
        }
    }

    const rest = new REST().setToken(token);

    console.log(
        `Deploying ${commands.length} guild commands to guild ${guildId}...`,
    );
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
    });
    console.log("Commands deployed successfully.");
}

deploy().catch(console.error);
