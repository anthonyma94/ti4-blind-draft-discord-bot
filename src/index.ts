import { Client, Events, GatewayIntentBits } from "discord.js";
import { execute as createDraft } from "./commands/create-draft.js";
import {
    handleNameModal,
    handleSelectPlayers,
    handleSelectOptions,
} from "./commands/create-draft.js";
import {
    execute as viewPool,
    handleViewPoolSelect,
} from "./commands/view-pool.js";
import {
    execute as deleteDraft,
    handleDeleteDraftSelect,
    handleDeleteConfirm,
    handleDeleteCancel,
} from "./commands/delete-draft.js";

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once(Events.ClientReady, (c) => {
    console.log(`Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            switch (interaction.commandName) {
                case "create-draft":
                    await createDraft(interaction);
                    break;
                case "view-pool":
                    await viewPool(interaction);
                    break;
                case "delete-draft":
                    await deleteDraft(interaction);
                    break;
            }
            return;
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith("create-draft:name:")) {
                await handleNameModal(interaction);
                return;
            }
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId.startsWith("create-draft:players:")) {
                await handleSelectPlayers(interaction);
                return;
            }
            if (interaction.customId.startsWith("create-draft:options:")) {
                await handleSelectOptions(interaction);
                return;
            }
            if (interaction.customId.startsWith("view-pool:select")) {
                await handleViewPoolSelect(interaction);
                return;
            }
            if (interaction.customId.startsWith("delete-draft:select")) {
                await handleDeleteDraftSelect(interaction);
                return;
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId.startsWith("delete-draft:confirm:")) {
                await handleDeleteConfirm(interaction);
                return;
            }
            if (interaction.customId === "delete-draft:cancel") {
                await handleDeleteCancel(interaction);
                return;
            }
        }
    } catch (error) {
        console.error("Interaction error:", error);
        const reply = {
            content: "An error occurred while processing your request.",
            flags: 64,
        };
        if (interaction.isRepliable()) {
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(reply).catch(() => {});
            } else {
                await interaction.reply(reply).catch(() => {
                    console.error("Failed to send error reply");
                });
            }
        }
    }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error("DISCORD_TOKEN environment variable is required");
    process.exit(1);
}

client.login(token);
