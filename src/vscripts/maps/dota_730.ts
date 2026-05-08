import { MapSettings, ModifierHolder } from "../utils/settings/settings";

export class Dota730Map extends MapSettings {
    public ConfigureModifiers(holder: ModifierHolder): void {
        holder.disable(BuiltInModifier.FOUNTAIN_INVULNERABILITY);
    }

    public SendToConsole(): void {
        SendToServerConsole("dota_alt_right_range_hint 0");
        SendToServerConsole("dota_alt_show_rune_spawn_times 0");
        SendToServerConsole("dota_alt_show_ward_suggestions 0");
        SendToServerConsole("dota_alt_show_neutral_stack_times_and_arrow 0");
        SendToServerConsole("dota_alt_show_neutral_creep_gold_bounty 0");
        SendToServerConsole("dota_alt_show_lane_creep_gold_bounty 0");
    }

    public Configure(): void {
        GameModeEntity.SetAllowNeutralItemDrops(false);
    }
}