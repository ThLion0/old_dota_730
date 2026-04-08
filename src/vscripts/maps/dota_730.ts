import { MapSettings, ModifierHolder } from "./settings";

export class Dota730Map extends MapSettings {
    public ConfigureModifiers(holder: ModifierHolder): void {
        holder.disable(BuiltInModifier.FOUNTAIN_INVULNERABILITY);
    }

    public Configure(): void {
        GameModeEntity.SetAllowNeutralItemDrops(false);
    }
}