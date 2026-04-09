import { DotaFilter, FilterOrder } from "../utils/filters";

class Event extends DotaFilter<ModifyGoldFilterEvent> {
    public Register(context: {}): void {
        GameModeEntity.SetModifyGoldFilter((event) => this.handle(event), context);
    }

    protected RegisterOrder(order: FilterOrder<ModifyGoldFilterEvent>): void {
        
    }
}

export const GoldFilter = new Event();