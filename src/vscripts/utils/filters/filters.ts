/// <reference path="filters.d.ts" />

export interface DotaFilter<T extends object> {

}
export abstract class DotaFilter<T extends object> {
    private readonly filterOrder: FilterOrder<T>;
    
    constructor() {
        this.filterOrder = new FilterOrder();
        this.RegisterOrder(this.filterOrder);
    }

    /**
     * @example GameModeEntity.SetExecuteOrderFilter((event) => this.handle(event), this);
     */
    public abstract Register(): void;

    protected abstract RegisterOrder(order: FilterOrder<T>): void;

    protected getHandler(): (event: T) => boolean {
        return this.handle.bind(this);
    } 

    protected handle(event: T): boolean {
        return this.filterOrder.filter(event, this);
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

    public filter(event: T, thisArg: {}): boolean {
        if (this.filterOrderMap.size === 0) return true;

        const entries = Array.from(this.filterOrderMap.entries());
        const sortedEntries = entries.sort(([a], [b]) => a - b);

        for (const [_, callback] of sortedEntries) {
            const result = callback.call(thisArg, event);
            if (result !== undefined) {
                return result;
            }
        }
        
        return true;
    }
}