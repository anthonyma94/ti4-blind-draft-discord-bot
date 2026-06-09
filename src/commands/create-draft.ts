import { randomUUID } from "node:crypto";
import {
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    TextChannel,
    MessageFlags,
} from "discord.js";
import type {
    ChatInputCommandInteraction,
    StringSelectMenuInteraction,
    ModalSubmitInteraction,
} from "discord.js";
import { loadFactions, createDraft } from "../utils/draft.js";
import { setPending, getPending, deletePending } from "../utils/pending.js";

export const data = new SlashCommandBuilder()
    .setName("create-draft")
    .setDescription("Create a new blind draft");

export async function execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) {
        await interaction.reply({
            content: "This command can only be used in a server.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const stateKey = randomUUID();

    setPending(stateKey, {
        name: null,
        playerIds: [],
        creatorId: interaction.user.id,
        guildId: guild.id,
    });

    const modal = new ModalBuilder()
        .setCustomId(`create-draft:name:${stateKey}`)
        .setTitle("Create Draft — Step 1 of 3");

    const nameInput = new TextInputBuilder()
        .setCustomId("draft-name")
        .setLabel("Enter a name for the draft")
        .setPlaceholder("Leave empty for a default name")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(100);

    const inputRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
        nameInput,
    );

    modal.addComponents(inputRow);

    await interaction.showModal(modal);
}

export async function handleNameModal(interaction: ModalSubmitInteraction) {
    const stateKey = interaction.customId.replace("create-draft:name:", "");
    const pending = getPending(stateKey);
    if (!pending) {
        await interaction.reply({
            content:
                "Draft creation session expired. Please run /create-draft again.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const name = interaction.fields.getTextInputValue("draft-name").trim();
    pending.name = name || null;
    setPending(stateKey, pending);

    const guild = interaction.guild;
    if (!guild) {
        await interaction.reply({
            content: "This command can only be used in a server.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const members = await guild.members.fetch();
    const humanMembers = members.filter((m) => !m.user.bot);

    if (humanMembers.size < 1) {
        await interaction.reply({
            content:
                "Not enough human members in the server to create a draft (need at least 1).",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const options = humanMembers.map((member) =>
        new StringSelectMenuOptionBuilder()
            .setLabel(member.displayName)
            .setValue(member.id),
    );

    const select = new StringSelectMenuBuilder()
        .setCustomId(`create-draft:players:${stateKey}`)
        .setPlaceholder("Select players for the draft")
        .setMinValues(1)
        .setMaxValues(humanMembers.size)
        .setOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        select,
    );

    await interaction.reply({
        content: `**Create Draft${pending.name ? `: ${pending.name}` : ""} — Step 2 of 3**\nSelect the players who will participate:`,
        components: [row],
        flags: MessageFlags.Ephemeral,
    });
}

export async function handleSelectPlayers(
    interaction: StringSelectMenuInteraction,
) {
    const stateKey = interaction.customId.replace("create-draft:players:", "");
    const pending = getPending(stateKey);
    if (!pending) {
        await interaction.reply({
            content:
                "Draft creation session expired. Please run /create-draft again.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    pending.playerIds = interaction.values;
    setPending(stateKey, pending);

    const factionCount = loadFactions().length;
    const maxOptions = Math.min(
        25,
        Math.floor(factionCount / pending.playerIds.length),
    );

    const optionRows = [];
    for (let i = 1; i <= maxOptions; i++) {
        const opt = new StringSelectMenuOptionBuilder()
            .setLabel(`${i} option${i !== 1 ? "s" : ""} per player`)
            .setValue(i.toString());
        if (i === maxOptions) {
            opt.setDescription("Recommended — most options per player");
        }
        optionRows.push(opt);
    }

    const select = new StringSelectMenuBuilder()
        .setCustomId(`create-draft:options:${stateKey}`)
        .setPlaceholder("Select options per player")
        .setMinValues(1)
        .setMaxValues(1)
        .setOptions(optionRows);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        select,
    );

    const playerMentions = pending.playerIds.map((id) => `<@${id}>`).join(", ");

    await interaction.update({
        content: `**Create Draft${pending.name ? `: ${pending.name}` : ""} — Step 3 of 3**\nPlayers: ${playerMentions}\nSelect how many factions each player gets (max: ${maxOptions}):`,
        components: [row],
    });
}

export async function handleSelectOptions(
    interaction: StringSelectMenuInteraction,
) {
    const stateKey = interaction.customId.replace("create-draft:options:", "");
    const pending = getPending(stateKey);
    if (!pending) {
        await interaction.reply({
            content:
                "Draft creation session expired. Please run /create-draft again.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const optionsPerPlayer = parseInt(interaction.values[0], 10);

    const draft = await createDraft(
        pending.name,
        pending.playerIds,
        optionsPerPlayer,
        pending.creatorId,
        pending.guildId,
    );

    deletePending(stateKey);

    const playerMentions = draft.players.map((id) => `<@${id}>`).join(", ");

    const channel = interaction.channel as TextChannel;
    await channel.send({
        content: `**${draft.name}**\nA new blind draft has been created with ${draft.players.length} player${draft.players.length !== 1 ? "s" : ""} and ${draft.optionsPerPlayer} option${draft.optionsPerPlayer !== 1 ? "s" : ""} each.\n\nParticipants: ${playerMentions}\n\nUse \`/view-pool\` to see your assigned factions!`,
    });

    await interaction.update({
        content: `**Draft Created: ${draft.name}**\nPlayers: ${draft.players.length}\nOptions per player: ${draft.optionsPerPlayer}\n\nParticipants: ${playerMentions}\n\nUse \`/view-pool\` to see your assigned factions!`,
        components: [],
    });
}
