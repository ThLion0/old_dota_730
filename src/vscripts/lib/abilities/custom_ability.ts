/// <reference path="custom_ability.d.ts" />

import { Wearables } from "../../managers/wearable_manager";

import { BaseAbility, BaseModifier } from "../dota_ts_adapter";

export interface CustomAbility extends BaseAbility {
    
}
export class CustomAbility extends BaseAbility {
    private readonly customAbility$textureName: string;
    private readonly customAbility$assets = new Set<Wearables.AssetWrapper>();

    constructor() {
        super();

        this.customAbility$textureName = Wearables.Resolver.getAbilityTexture(this.GetWearableOwner(), this);

        this.processCustomBehavior();
    }

    OnPostUpdate(): void {
        this.processAssets();
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
        return this.customAbility$textureName;
    }

    /** @custom */
    protected GetWearableOwner(): CDOTA_BaseNPC {
        return this.GetCaster();
    }

    /** @custom */
    protected getWearableInfo(): Wearables.SkinMetaInfo {
        return Wearables.Resolver.getMetaInfo(this.GetWearableOwner());
    }

    /** @custom */
    protected particle(particleName: string): Wearables.AssetWrapper {
        return this.addWrapper(new Wearables.ParticleWrapper(particleName));
    }

    /** @custom */
    protected sound(soundName: string): Wearables.AssetWrapper {
        return this.addWrapper(new Wearables.SoundWrapper(soundName));
    }

    /** @custom */
    protected model(modelName: string): Wearables.AssetWrapper {
        return this.addWrapper(new Wearables.ModelWrapper(modelName));
    }

    private addWrapper(wrapper: Wearables.AssetWrapper): Wearables.AssetWrapper {
        this.customAbility$assets.add(wrapper);
        return wrapper;
    }

    private processAssets(): void {
        const owner = this.GetWearableOwner();
        this.customAbility$assets.forEach(
            wrapper => Wearables.Resolver.resolveAsset(owner, wrapper)
        );
    }

    private processCustomBehavior(): void {
        const customBehavior = this.GetCustomBehavior();
        const hasBehavior = (b: CustomAbilityBehavior): boolean => (customBehavior & b) === b;

        if (IsServer()) {
            if (hasBehavior(CustomAbilityBehavior.INNATE)) {
                if (!this.IsTrained()) {
                    this.SetLevel(this.GetMaxLevel());
                }
            }
        }
    }
}

export interface CustomModifier extends BaseModifier {
    /**
     * @override by `CustomModifier` class. Changed type to `CustomAbility` to apply custom methods.
     */
    GetAbility(): CustomAbility | undefined;
}
export class CustomModifier extends BaseModifier {
    private readonly customModifier$assets = new Set<Wearables.AssetWrapper>();

    constructor() {
        super();

        this.processAssets();
    }

    /** @custom */
    protected particle(particleName: string): Wearables.AssetWrapper {
        return this.addWrapper(new Wearables.ParticleWrapper(particleName));
    }

    /** @custom */
    protected sound(soundName: string): Wearables.AssetWrapper {
        return this.addWrapper(new Wearables.SoundWrapper(soundName));
    }

    /** @custom */
    protected model(modelName: string): Wearables.AssetWrapper {
        return this.addWrapper(new Wearables.ModelWrapper(modelName));
    }

    private addWrapper(wrapper: Wearables.AssetWrapper): Wearables.AssetWrapper {
        this.customModifier$assets.add(wrapper);
        return wrapper;
    }

    private processAssets(): void {
        if (IsServer()) {
            const owner = this.GetCaster();
            if (owner) {
                this.customModifier$assets.forEach(
                    wrapper => Wearables.Resolver.resolveAsset(owner, wrapper)
                );
            }
        }
    }
}