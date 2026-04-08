import { DotaFilter, FilterOrder } from "../utils/filters";

export class ModifierGainFilter extends DotaFilter<ModifierGainedFilterEvent> {
    public static Register(context: {}): void {
        new ModifierGainFilter().Register(context);
    }

    public Register(context: {}): void {
        GameModeEntity.SetModifierGainedFilter((event) => this.handle(event), context);
    }

    protected RegisterOrder(order: FilterOrder<ModifierGainedFilterEvent>): void {
        order.set(0, (event) => this.filterModifierAccess(event.name_const));
    }

    private filterModifierAccess(modifierName: string): boolean | void {
        const access = GameRules.Settings.modifierHolder.get(modifierName);
        return access !== ModifierAccess.DISABLED;
    }
}