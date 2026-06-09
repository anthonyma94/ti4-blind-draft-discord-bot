import {
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} from "discord.js";
import type {
    ChatInputCommandInteraction,
    StringSelectMenuInteraction,
    ButtonInteraction,
} from "discord.js";
import {
    readDrafts,
    getDraftsByCreator,
    removeDraft,
    getDraft,
} from "../utils/data.js";

export const data = new SlashCommandBuilder()
    .setName("delete-draft")
    .setDescription("Delete a draft you created");

export async function execute(interaction: ChatInputCommandInteraction) {
    const drafts = await readDrafts();
    const userDrafts = getDraftsByCreator(drafts, interaction.user.id);

    if (userDrafts.length === 0) {
        await interaction.reply({
            content: "You have not created any drafts.",
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
        .setCustomId("delete-draft:select")
        .setPlaceholder("Select a draft to delete")
        .setMinValues(1)
        .setMaxValues(1)
        .setOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        select,
    );

    await interaction.reply({
        content: "Select a draft to delete:",
        components: [row],
        flags: MessageFlags.Ephemeral,
    });
}

export async function handleDeleteDraftSelect(
    interaction: StringSelectMenuInteraction,
) {
    const draftId = interaction.values[0];
    const drafts = await readDrafts();
    const draft = getDraft(drafts, draftId);

    if (!draft) {
        await interaction.reply({
            content: "Draft not found.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const confirmButton = new ButtonBuilder()
        .setCustomId(`delete-draft:confirm:${draftId}`)
        .setLabel("Yes, delete")
        .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
        .setCustomId("delete-draft:cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        cancelButton,
        confirmButton,
    );

    await interaction.update({
        content: `**Delete Draft: ${draft.name}**\n\nThis will permanently delete this draft and all player pools. Are you sure?`,
        components: [row],
    });
}

export async function handleDeleteConfirm(interaction: ButtonInteraction) {
    const draftId = interaction.customId.replace("delete-draft:confirm:", "");
    const removed = await removeDraft(draftId);

    if (removed) {
        await interaction.update({
            content: "Draft deleted successfully.",
            components: [],
        });
    } else {
        await interaction.update({
            content:
                "Failed to delete draft. It may have already been removed.",
            components: [],
        });
    }
}

export async function handleDeleteCancel(interaction: ButtonInteraction) {
    await interaction.update({
        content: "Deletion cancelled.",
        components: [],
    });
}
