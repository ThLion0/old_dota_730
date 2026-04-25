/// <reference path="entity_manager.d.ts" />

const EntityManager = new class {
    private readonly listeners = new Map<string, EntityListenerSettings>();

    constructor() {
        GameEvents.Subscribe("entity_manager_append", (event) => this.onEntityAppend(event));
        GameEvents.Subscribe("entity_manager_remove", (event) => this.onEntityRemove(event));

        GameEvents.Subscribe("entity_manager_update_list", (event) => this.onUpdateList(event));
    }

    public BindEntityListener(abilityName: string, settings: EntityListenerSettings, requestUpdate: boolean = true): void {
        this.listeners.set(abilityName, settings);

        if (requestUpdate) {
            GameEvents.SendCustomGameEventToServer("entity_manager_request_client", {});
        }
    }

    private onEntityAppend(event: EntityManagerAppendEvent): void {
        this.listeners.get(event.abilityName)?.onAdd(event.entityIndex);
    }

    private onEntityRemove(event: EntityManagerRemoveEvent): void {
        this.listeners.get(event.abilityName)?.onRemove(event.entityIndex);
    }

    private onUpdateList(event: NetworkedData<EntityManagerUpdateEvent>): void {
        const indexes = Object.values(event.indexes);

        this.listeners.get(event.abilityName)?.onEntriesUpdate(indexes);
    }
};