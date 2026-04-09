import { DotaEvent } from "../utils/events";

class Event extends DotaEvent {
    public Register(): void {
        ListenToGameEvent("npc_spawned", (event) => this.handle(event), undefined);
        ListenToGameEvent("npc_spawn_finished", (event) => this.handleFinished(event), undefined);
    }

    private handle(event: NpcSpawnedEvent & GameEventProvidedProperties): void {
        const baseNPC = EntIndexToHScript(event.entindex) as CDOTA_BaseNPC | undefined;
        if (baseNPC === undefined) return;

        const isRespawn = event.is_respawn === 1;

        baseNPC.__custom_data ??= {};

        if (baseNPC.IsRealHero()) {
            this.handleRealHero(baseNPC, isRespawn);

            if (PlayerResource.IsFakeClient(baseNPC.GetPlayerID())) {
                this.handleFakeClient(baseNPC);
            }
        } else if (baseNPC.IsCreep()) {
            this.handleCreep(baseNPC, isRespawn);
        }

        GameRules.Manager.PushEntityToNetTable(baseNPC);
    }

    private handleFinished(event: NpcSpawnFinishedEvent & GameEventProvidedProperties): void {
        const baseNPC = EntIndexToHScript(event.entindex) as CDOTA_BaseNPC | undefined;
        if (baseNPC === undefined) return;
        
        GameRules.Manager.PushEntityToNetTable(baseNPC);
    }

    /* Real hero handlers */

    private handleRealHero(hero: CDOTA_BaseNPC_Hero, isRespawn: boolean): void {
        if (!isRespawn) {
            this.initRealHero(hero);
        }
    }

    private handleFakeClient(hero: CDOTA_BaseNPC_Hero): void {
        const respawnPosition = hero.__custom_data.debug_respawn_pos;
        if (respawnPosition) {
            hero.SetAbsOrigin(respawnPosition);
            FindClearSpaceForUnit(hero, respawnPosition, true);
        }
    }

    private initRealHero(hero: CDOTA_BaseNPC_Hero): void {
        
    }

    /* Creep handlers */

    private handleCreep(creep: CDOTA_BaseNPC, isRespawn: boolean) {
        if (!isRespawn) {
            this.initCreep(creep);
        }
    }

    private initCreep(creep: CDOTA_BaseNPC): void {
        
    }
}

export const NpcSpawned = new Event();