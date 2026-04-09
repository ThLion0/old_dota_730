import { DotaFilter, FilterOrder } from "../utils/filters";

export const GoldFilter = new class extends DotaFilter<ModifyGoldFilterEvent> {
    public Register(context: {}): void {
        GameModeEntity.SetModifyGoldFilter((event) => this.handle(event), context);
    }

    protected RegisterOrder(order: FilterOrder<ModifyGoldFilterEvent>): void {
        
    }
}