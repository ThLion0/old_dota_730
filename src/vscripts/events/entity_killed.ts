import { DotaEvent } from "../utils/events/events";

class Event extends DotaEvent {
    public Register(): void {
        ListenToGameEvent("entity_killed", event => this.handle(event), undefined);
    }

    private handle(event: EntityKilledEvent & GameEventProvidedProperties): void {
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

    private handleRealHero(hero: CDOTA_BaseNPC_Hero): void {
        
    }

    private handleFakeClient(hero: CDOTA_BaseNPC_Hero): void {
        hero.__custom_data.debug_respawn_pos = hero.GetAbsOrigin();
    }
}

export const EntityKilled = new Event();