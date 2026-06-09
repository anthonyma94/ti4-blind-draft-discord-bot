interface PendingDraft {
    name: string | null;
    playerIds: string[];
    creatorId: string;
    guildId: string;
}

const store = new Map<string, PendingDraft>();

export function setPending(key: string, data: PendingDraft): void {
    store.set(key, data);
}

export function getPending(key: string): PendingDraft | undefined {
    return store.get(key);
}

export function deletePending(key: string): void {
    store.delete(key);
}
