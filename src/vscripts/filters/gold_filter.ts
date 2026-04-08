import { DotaFilter, FilterOrder } from "../utils/filters";

export class GoldFilter extends DotaFilter<ModifyGoldFilterEvent> {
    public static Register(context: {}): void {
        new GoldFilter().Register(context);
    }

    public Register(context: {}): void {
        GameModeEntity.SetModifyGoldFilter((event) => this.handle(event), context);
    }

    protected RegisterOrder(order: FilterOrder<ModifyGoldFilterEvent>): void {
        
    }
}