import { reloadable } from "../lib/tstl-utils";

@reloadable
export class NpcSpawned {
    public static handle(event: NpcSpawnedEvent & GameEventProvidedProperties): void {
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

    public static handleFinished(event: NpcSpawnFinishedEvent & GameEventProvidedProperties): void {
        const baseNPC = EntIndexToHScript(event.entindex) as CDOTA_BaseNPC | undefined;
        if (baseNPC === undefined) return;
        
        GameRules.Manager.PushEntityToNetTable(baseNPC);
    }

    /* Real hero handlers */

    private static handleRealHero(hero: CDOTA_BaseNPC_Hero, isRespawn: boolean): void {
        if (!isRespawn) {
            this.initRealHero(hero);
        }
    }

    private static handleFakeClient(hero: CDOTA_BaseNPC_Hero): void {
        const respawnPosition = hero.__custom_data.debug_respawn_pos;
        if (respawnPosition) {
            hero.SetAbsOrigin(respawnPosition);
            FindClearSpaceForUnit(hero, respawnPosition, true);
        }
    }

    private static initRealHero(hero: CDOTA_BaseNPC_Hero): void {
        const playerId = hero.GetPlayerID();

        CustomNetTables.SetTableValue("hero_values", playerId.toString(), {
            stats: {
                cooldownReduction: 0,
                manaCostReduction: 0,
                spellAmplification: 0
            }
        });
    }

    /* Creep handlers */

    private static handleCreep(creep: CDOTA_BaseNPC, isRespawn: boolean) {
        if (!isRespawn) {
            this.initCreep(creep);
        }
    }

    private static initCreep(creep: CDOTA_BaseNPC): void {
        
    }
}