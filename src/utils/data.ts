import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Draft } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRAFTS_PATH = join(__dirname, "..", "..", "data", "drafts.json");

async function ensureDraftsFile(): Promise<void> {
    try {
        await readFile(DRAFTS_PATH, "utf-8");
    } catch {
        await writeFile(DRAFTS_PATH, "[]", "utf-8");
    }
}

export async function readDrafts(): Promise<Draft[]> {
    await ensureDraftsFile();
    const data = await readFile(DRAFTS_PATH, "utf-8");
    return JSON.parse(data) as Draft[];
}

export async function writeDrafts(drafts: Draft[]): Promise<void> {
    await ensureDraftsFile();
    await writeFile(DRAFTS_PATH, JSON.stringify(drafts, null, 4), "utf-8");
}

export async function addDraft(draft: Draft): Promise<void> {
    const drafts = await readDrafts();
    drafts.push(draft);
    await writeDrafts(drafts);
}

export async function removeDraft(id: string): Promise<boolean> {
    const drafts = await readDrafts();
    const index = drafts.findIndex((d) => d.id === id);
    if (index === -1) return false;
    drafts.splice(index, 1);
    await writeDrafts(drafts);
    return true;
}

export function getDraftsByCreator(drafts: Draft[], userId: string): Draft[] {
    return drafts.filter((d) => d.creatorId === userId);
}

export function getDraftsByPlayer(drafts: Draft[], userId: string): Draft[] {
    return drafts.filter((d) => d.players.includes(userId));
}

export function getDraft(drafts: Draft[], id: string): Draft | undefined {
    return drafts.find((d) => d.id === id);
}
