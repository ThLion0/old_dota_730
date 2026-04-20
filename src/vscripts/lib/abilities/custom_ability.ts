/// <reference path="custom_ability.d.ts" />

import { BaseAbility, BaseModifier } from "../dota_ts_adapter";

import { WearableManager } from "../../managers/wearable_manager";

export interface CustomAbility {
    
}
export class CustomAbility extends BaseAbility {
    private readonly __customAbilityTextureName: string;
    
    constructor() {
        super();

        this.__customAbilityTextureName = WearableManager.GetAbilityTexture(this.GetCaster(), this);
    }

    /**
     * Return custom cast behavior type of this ability.
     * Similar to `CDOTABaseAbility#GetBehavior`.
     *
     * @custom
     * @both
     */
    GetCustomBehavior(): CustomAbilityBehavior {
        return CustomAbilityBehavior.NONE;
    }

    /**
     * @override the `CustomAbility` class, used to change the icon based on owner's skins
     */
    GetAbilityTextureName(): string {
        return this.__customAbilityTextureName;
    }
}

export class CustomModifier extends BaseModifier {

}