import { randomUUID } from "node:crypto";
import type { Draft } from "../types.js";
import { addDraft, readDrafts, getDraft } from "./data.js";
import { FACTIONS } from "../factions.js";

export function loadFactions(): string[] {
    return FACTIONS;
}

function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function defaultDraftName(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `Draft ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export async function createDraft(
    name: string | null,
    playerIds: string[],
    optionsPerPlayer: number,
    creatorId: string,
    guildId: string,
): Promise<Draft> {
    const factions = loadFactions();
    const shuffled = shuffle(factions);
    const needed = playerIds.length * optionsPerPlayer;
    const selected = shuffled.slice(0, needed);
    const shuffledPlayers = shuffle([...playerIds]);

    const pools: Record<string, string[]> = {};
    for (let i = 0; i < shuffledPlayers.length; i++) {
        pools[shuffledPlayers[i]] = selected.slice(
            i * optionsPerPlayer,
            (i + 1) * optionsPerPlayer,
        );
    }

    const draft: Draft = {
        id: randomUUID(),
        name: name || defaultDraftName(),
        creatorId,
        guildId,
        optionsPerPlayer,
        players: playerIds,
        pools,
        createdAt: new Date().toISOString(),
    };

    await addDraft(draft);
    return draft;
}

export async function getPlayerPool(
    draftId: string,
    userId: string,
): Promise<string[] | null> {
    const drafts = await readDrafts();
    const draft = getDraft(drafts, draftId);
    if (!draft) return null;
    return draft.pools[userId] || null;
}
