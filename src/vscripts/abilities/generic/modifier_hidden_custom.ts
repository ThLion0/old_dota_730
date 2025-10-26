import { BaseModifier, registerModifier } from "../../lib/dota_ts_adapter";

@registerModifier()
export class modifier_hidden_custom extends BaseModifier {
    IsHidden(): boolean {
        return false;
    }

    IsPurgable(): boolean {
        return false;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.UNSELECTABLE]: true,
            [ModifierState.NOT_ON_MINIMAP]: true,
            [ModifierState.NO_HEALTH_BAR]: true,
            [ModifierState.OUT_OF_GAME]: true
        };
    }
}