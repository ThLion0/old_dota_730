import { reloadable } from "../lib/tstl-utils";

@reloadable
export class EntityKilled {
    public static handle(event: EntityKilledEvent & GameEventProvidedProperties): void {
        const killed = EntIndexToHScript(event.entindex_killed) as CDOTA_BaseNPC | undefined;
        if (killed === undefined) return;

        if (killed.IsRealHero()) {
            this.handleRealHero(killed);

            if (PlayerResource.IsFakeClient(killed.GetPlayerID())) {
                this.handleFakeClient(killed);
            }
        }

        GameRules.Manager.RemoveEntityFromNetTable(killed);
    }

    /* Real hero handlers */

    private static handleRealHero(hero: CDOTA_BaseNPC_Hero): void {
        
    }

    private static handleFakeClient(hero: CDOTA_BaseNPC_Hero): void {
        hero.__custom_data.debug_respawn_pos = hero.GetAbsOrigin();
    }
}