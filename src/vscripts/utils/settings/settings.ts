/// <reference path="settings.d.ts" />

export abstract class MapSettings {
    private readonly modifierHolder: ModifierHolder;

    constructor() {
        this.modifierHolder = new ModifierHolder();
        this.ConfigureModifiers(this.modifierHolder);
    }

    public abstract ConfigureModifiers(holder: ModifierHolder): void;
    public abstract Configure(): void;
    public abstract SendToConsole(): void;

    public IsModifierEnabled(modifierName: string): boolean {
        const state = this.modifierHolder.get(modifierName);
        return state === undefined || state === ModifierAccess.NONE || state === ModifierAccess.ENABLED;
    }
}

export class ModifierHolder {
    private readonly modifierMap = new Map<string, ModifierAccess>();

    public disable(name: string): void {
        this.add(name, ModifierAccess.DISABLED);
    }

    public add(name: string, state: ModifierAccess): void {
        this.modifierMap.set(name, state);
    }

    public get(name: string): ModifierAccess {
        return this.modifierMap.get(name) ?? ModifierAccess.NONE;
    }
}