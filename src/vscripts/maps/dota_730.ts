import { MapSettings, ModifierHolder } from "../utils/settings/settings";

export class Dota730Map extends MapSettings {
    public ConfigureModifiers(holder: ModifierHolder): void {
        holder.disable(BuiltInModifier.FOUNTAIN_INVULNERABILITY);
    }

    public Configure(): void {
        GameModeEntity.SetAllowNeutralItemDrops(false);
    }
}