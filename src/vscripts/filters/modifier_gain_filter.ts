import { reloadable } from "../lib/tstl-utils";

@reloadable
export class ModifierGainFilter {
    public static filter(event: ModifierGainedFilterEvent): boolean {
        const caster = EntIndexToHScript(event.entindex_caster_const) as CDOTA_BaseNPC | undefined;
        const ability = EntIndexToHScript(event.entindex_ability_const) as CDOTABaseAbility | undefined;
        const target = EntIndexToHScript(event.entindex_parent_const) as CDOTA_BaseNPC;

        const { duration, name_const: modifierName } = event;

        const modifiers = target.FindAllModifiersByName(modifierName) as CDOTA_Modifier_Lua[];
        modifiers.forEach(modifier => this.extendModifier(modifier));
        
        return true;
    }

    // :P
    private static extendModifier(modifier: CDOTA_Modifier_Lua): void {
        if ((modifier as any).____custom_modifier_updated === true) return;

        const originalOnDestroy = modifier.OnDestroy;
        modifier.OnDestroy = function(this: any): void {
            originalOnDestroy?.call(this);

            CustomEventManager.FireEvent("modifier_removed", {
                modifier: this
            });
        };

        const originalOnRefresh = modifier.OnRefresh;
        modifier.OnRefresh = function(params: object): void {
            originalOnRefresh?.call(this, params);

            CustomEventManager.FireEvent("modifier_refreshed", {
                modifier: this
            });
        };

        CustomEventManager.FireEvent("modifier_added", {
            modifier: modifier
        });
        
        (modifier as any).____custom_modifier_updated = true;
    }
}