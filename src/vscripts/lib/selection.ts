
class Selection {
    private static readonly entities: Partial<Record<PlayerID, EntityIndex[]>> = {};
    
    static {
        CustomGameEventManager.RegisterListener("selection_update", (_, event) => this.OnUpdate(event))
    }

    private static OnUpdate(event: NetworkedData<SelectionUpdateEvent> & { PlayerID: PlayerID }): void {
        this.entities[event.PlayerID] = Object.values(event.entities);
    }

    public static GetSelectedEntities(playerID: PlayerID): EntityIndex[] {
        return this.entities[playerID] || [];
    }
}