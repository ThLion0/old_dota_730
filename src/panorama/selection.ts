class Selection {
    constructor() {
        GameEvents.Subscribe("dota_player_update_selected_unit", () => this.OnUpdateSelectedUnit());
    }

    private OnUpdateSelectedUnit(): void {
        $.Schedule(0.03, () => this.SendSelectedEntities());
    }

    private SendSelectedEntities(): void {
        const entities = Players.GetSelectedEntities(Players.GetLocalPlayer());
        
        GameEvents.SendCustomGameEventToServer("selection_update", { entities });
    }
}

const selection = new Selection();