/**
 * @deprecated Used only local scope in selection.ts
 */
class _SelectionClass {
    private readonly entities: Partial<Record<PlayerID, EntityIndex[]>> = {};
    
    constructor() {
        CustomGameEventManager.RegisterListener("selection_update", (_, event) => this.OnUpdate(event))
    }

    private OnUpdate(event: NetworkedData<SelectionUpdateEvent> & { PlayerID: PlayerID }): void {
        this.entities[event.PlayerID] = Object.values(event.entities);
    }

    public GetSelectedEntities(playerID: PlayerID): EntityIndex[] {
        return this.entities[playerID] || [];
    }
}

const Selection = new _SelectionClass();