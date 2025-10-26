import { reloadable } from "../lib/tstl-utils";

import { CustomAbility } from "../lib/ability_extend";

@reloadable
export class OrderFilter {
    public static filter(event: ExecuteOrderFilterEvent): boolean {
        return this.handleCustomAbility(event);
    }

    private static handleCustomAbility(event: ExecuteOrderFilterEvent): boolean {
        const hero = PlayerResource.GetSelectedHeroEntity(event.issuer_player_id_const);
        const ability = EntIndexToHScript(event.entindex_ability) as CDOTABaseAbility | undefined;

        const castOrderType = event.order_type === UnitOrder.CAST_POSITION || event.order_type === UnitOrder.CAST_TARGET;
        const isRooted = hero !== undefined && hero.IsRooted();
        const isCannotBeCasted = ability instanceof CustomAbility && !ability.IsCastableInRoots();
        
        if (castOrderType && isRooted && isCannotBeCasted) {
            hero.SendCustomError("dota_hud_error_ability_disabled_by_root", event.sequence_number_const);
            return false;
        }
        
        return true;
    }
}