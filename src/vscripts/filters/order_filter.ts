import { DotaFilter, FilterOrder } from "../utils/filters";

import { CustomAbility } from "../lib/ability_extend";

class Event extends DotaFilter<ExecuteOrderFilterEvent> {
    public Register(context: {}): void {
        GameModeEntity.SetExecuteOrderFilter((event) => this.handle(event), context);
    }

    protected RegisterOrder(order: FilterOrder<ExecuteOrderFilterEvent>): void {
        order.set(0, (event) => this.filterCastInRoots(event));
    }

    private filterCastInRoots(event: ExecuteOrderFilterEvent): boolean | void {
        const hero = PlayerResource.GetSelectedHeroEntity(event.issuer_player_id_const);
        const ability = EntIndexToHScript(event.entindex_ability) as CDOTABaseAbility | undefined;

        const castOrderType = event.order_type === UnitOrder.CAST_POSITION || event.order_type === UnitOrder.CAST_TARGET;
        const isRooted = hero !== undefined && hero.IsRooted();
        const isCannotBeCasted = ability instanceof CustomAbility && !ability.IsCastableInRoots();
        
        if (castOrderType && isRooted && isCannotBeCasted) {
            hero.SendCustomError("dota_hud_error_ability_disabled_by_root", event.sequence_number_const);
            return false;
        }
    }
}

export const OrderFilter = new Event();