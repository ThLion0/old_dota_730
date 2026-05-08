/// <reference path="entity_manager.d.ts" />

import { CustomGameManager } from "../utils/managers/manager";

export class EntityManager extends CustomGameManager {
    private readonly entityMap = new Map<EntityIndex, CDOTA_BaseNPC>();

    private readonly listenerMap = new Map<PlayerID, EntityListener<CDOTABaseAbility>>();

    public Initialize(): void {
        CustomGameEventManager.RegisterListener(
            "entity_manager_request_client",
            (_, event) => this.onClientRequestUpdate(event)
        );
    }

    public BindEntityListener<T extends CDOTABaseAbility>(ability: T, settings: EntityListenerSettings<T>): void {
        const owner = ability.GetCaster();
        if (!owner.IsRealHero()) return;

        const playerId = owner.GetPlayerID();

        const listener: EntityListener<T> = {
            ability,
            owner: owner.GetPlayerOwner(),
            filter: settings.filter
        };

        this.listenerMap.set(playerId, listener as any);
    }

    public RequestUpdate(ability: CDOTABaseAbility): void {
        const owner = ability.GetCaster();
        if (!owner.IsRealHero()) return;

        const playerId = owner.GetPlayerID();

        this.updateClientList(playerId);
    }

    public AppendEntity(entity: CDOTA_BaseNPC): void {
        this.entityMap.set(entity.entindex(), entity);

        this.walkTroughListeners(entity, false);
    }

    public RemoveEntity(entity: CDOTA_BaseNPC): void {
        this.entityMap.delete(entity.entindex());

        this.walkTroughListeners(entity, true);
    }

    /* Events */

    private onClientRequestUpdate(event: EntityManagerRequestUpdateEvent & { PlayerID: PlayerID }): void {
        const playerId = event.PlayerID;
        if (playerId === undefined || !PlayerResource.IsValidPlayerID(playerId)) return;

        this.updateClientList(playerId);
    }

    /* Helpers */

    private walkTroughListeners(entity: CDOTA_BaseNPC, removeEntity: boolean): void {
        this.listenerMap.forEach((listener) => {
            const ability = listener.ability;

            const isCorrectEntity = listener.filter.call(ability, ability.GetCaster(), entity);
            if (isCorrectEntity) {
                this.sendEntityModification(
                    listener.owner,
                    entity,
                    ability,
                    removeEntity
                );
            }
        });
    }

    private sendEntityModification(
        player: CDOTAPlayerController,
        entity: CDOTA_BaseNPC,
        ability: CDOTABaseAbility,
        removeEntity: boolean
    ): void {
        const abilityName = ability.GetAbilityName();

        const eventName: keyof CustomGameEventDeclarations = removeEntity
            ? "entity_manager_remove"
            : "entity_manager_append";

        CustomGameEventManager.Send_ServerToPlayer(player, eventName, {
            abilityName,
            entityIndex: entity.entindex()
        });
    }

    private updateClientList(playerId: PlayerID): void {
        const player = PlayerResource.GetPlayer(playerId);
        if (!player) return;

        const settings = this.listenerMap.get(playerId);
        if (!settings) return;

        const { ability, filter } = settings;
        const caster = ability.GetCaster();
        const abilityName = ability.GetAbilityName();

        const indexes = Array.from(this.entityMap)
            .filter(([_, entity]) => filter.call(ability, caster, entity))
            .map(([index]) => index);

        CustomGameEventManager.Send_ServerToPlayer(player, "entity_manager_update_list", {
            abilityName,
            indexes
        });
    }
}