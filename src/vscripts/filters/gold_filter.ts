import { DotaFilter, FilterOrder } from "../utils/filters/filters";

class Event extends DotaFilter<ModifyGoldFilterEvent> {
    public Register(): void {
        GameModeEntity.SetModifyGoldFilter(this.getHandler(), this);
    }

    protected RegisterOrder(order: FilterOrder<ModifyGoldFilterEvent>): void {
        
    }
}

export const GoldFilter = new Event();