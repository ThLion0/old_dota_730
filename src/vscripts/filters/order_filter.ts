import { DotaFilter, FilterOrder } from "../utils/filters/filters";

import { CustomAbility } from "../lib/abilities/custom_ability";

class Event extends DotaFilter<ExecuteOrderFilterEvent> {
    public Register(): void {
        GameModeEntity.SetExecuteOrderFilter(this.getHandler(), this);
    }

    protected RegisterOrder(order: FilterOrder<ExecuteOrderFilterEvent>): void {
        order.set(0, (event) => this.filterAbilityCustomBehavior(event));
    }

    private filterAbilityCustomBehavior(event: ExecuteOrderFilterEvent): boolean | void {
        let unitIndex = event.units?.["0"] as EntityIndex;
        const unit = EntIndexToHScript(unitIndex) as CDOTA_BaseNPC | undefined;
        
        const ability = EntIndexToHScript(event.entindex_ability) as CDOTABaseAbility | undefined;
        if (!(ability instanceof CustomAbility)) return;

        const customBehavior = ability.GetCustomBehavior();

        const hasBehavior = (b: CustomAbilityBehavior): boolean => (customBehavior & b) === b;

        if (hasBehavior(CustomAbilityBehavior.ROOT_DISABLES)) {
            const isCastOrder = event.order_type === UnitOrder.CAST_POSITION || event.order_type === UnitOrder.CAST_TARGET;
            const isRooted = unit !== undefined && unit.IsRooted();
            
            if (isCastOrder && isRooted) {
                unit.SendCustomError("dota_hud_error_ability_disabled_by_root", event.sequence_number_const);
                return false;
            }
        }
    }
}

export const OrderFilter = new Event();