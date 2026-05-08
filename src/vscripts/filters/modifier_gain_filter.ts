import { DotaFilter, FilterOrder } from "../utils/filters/filters";

class Event extends DotaFilter<ModifierGainedFilterEvent> {
    public Register(): void {
        GameModeEntity.SetModifierGainedFilter(this.getHandler(), this);
    }

    protected RegisterOrder(order: FilterOrder<ModifierGainedFilterEvent>): void {
        order.set(0, (event) => this.filterModifierAccess(event.name_const));
    }

    private filterModifierAccess(modifierName: string): boolean | void {
        return GameRules.Settings.IsModifierEnabled(modifierName);
    }
}

export const ModifierGainFilter = new Event();