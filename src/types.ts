export interface Draft {
    id: string;
    name: string;
    creatorId: string;
    guildId: string;
    optionsPerPlayer: number;
    players: string[];
    pools: Record<string, string[]>;
    createdAt: string;
}
