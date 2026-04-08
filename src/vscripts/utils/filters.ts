/// <reference path="filters.d.ts" />

export abstract class DotaFilter<T extends object> {
    private readonly filterOrder: FilterOrder<T>;
    
    constructor() {
        this.filterOrder = new FilterOrder();
        this.RegisterOrder(this.filterOrder);
    }

    /**
     * @example GameModeEntity.SetExecuteOrderFilter((event) => this.handle(event), context);
     */
    public abstract Register(context: {}): void;

    protected abstract RegisterOrder(order: FilterOrder<T>): void;

    protected handle(event: T): boolean {
        return this.filterOrder.filter(event);
    }
}

export class FilterOrder<T extends object> {
    private readonly filterOrderMap = new Map<number, FilterCallback<T>>();

    public set(order: number, callback: FilterCallback<T>): void {
        if (this.filterOrderMap.has(order)) {
            throw `Filter order already have order: ${order}`;
        }
        
        this.filterOrderMap.set(order, callback);
    }

    public filter(event: T): boolean {
        if (this.filterOrderMap.size === 0) return true;

        const entries = Array.from(this.filterOrderMap.entries());
        const sortedEntries = entries.sort(([a], [b]) => a - b);

        for (const [_, callback] of sortedEntries) {
            const result = callback(event);
            if (result !== undefined) {
                return result;
            }
        }
        
        return true;
    }
}