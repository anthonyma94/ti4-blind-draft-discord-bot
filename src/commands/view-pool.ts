import {
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    MessageFlags,
} from "discord.js";
import type {
    ChatInputCommandInteraction,
    StringSelectMenuInteraction,
} from "discord.js";
import { readDrafts, getDraftsByPlayer } from "../utils/data.js";
import { getPlayerPool } from "../utils/draft.js";

export const data = new SlashCommandBuilder()
    .setName("view-pool")
    .setDescription("View your assigned faction pool for a draft");

export async function execute(interaction: ChatInputCommandInteraction) {
    const drafts = await readDrafts();
    const userDrafts = getDraftsByPlayer(drafts, interaction.user.id);

    if (userDrafts.length === 0) {
        await interaction.reply({
            content: "You are not a participant in any drafts.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const options = userDrafts.map((d) =>
        new StringSelectMenuOptionBuilder()
            .setLabel(d.name)
            .setValue(d.id)
            .setDescription(
                `${d.players.length} players, ${d.optionsPerPlayer} options each`,
            ),
    );

    const select = new StringSelectMenuBuilder()
        .setCustomId("view-pool:select")
        .setPlaceholder("Select a draft to view your pool")
        .setMinValues(1)
        .setMaxValues(1)
        .setOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        select,
    );

    await interaction.reply({
        content: "Select a draft to view your assigned faction pool:",
        components: [row],
        flags: MessageFlags.Ephemeral,
    });
}

export async function handleViewPoolSelect(
    interaction: StringSelectMenuInteraction,
) {
    const draftId = interaction.values[0];
    const pool = await getPlayerPool(draftId, interaction.user.id);

    if (!pool) {
        await interaction.reply({
            content:
                "Could not find your pool for this draft. You may not be a participant.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const poolList = pool.map((f) => `- ${f}`).join("\n");

    await interaction.update({
        content: `**Your Faction Pool**\n\n${poolList}`,
        components: [],
    });
}
