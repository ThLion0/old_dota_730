/// <reference path="wearable_manager.d.ts" />

import { CustomGameManager } from "../utils/managers/manager";

const DEFAULT_ABILITY_ICON: string = "empty_png";

export class WearableManager extends CustomGameManager {
    private readonly hashStyles: Record<number, SkinStyle> = {
        [1977497166]: 0,
        [1055040020]: 0,
        [676911571]: 0,
        [628863847]: 1,
        [392129534]: 1,
        [1347516877]: 2
    };
    
    private wearablesKV: WearablesKeyValues = {};

    public Initialize(): void {
        this.loadKVFile();
    }

    /** @client */
    public static GetAbilityTexture(owner: CDOTA_BaseNPC, ability: CDOTABaseAbility): string {
        if (!IsClient()) return DEFAULT_ABILITY_ICON;

        const playerId = owner.GetPlayerOwnerID();

        const netTable = CustomNetTables.GetTableValue("hero_wearables", playerId.toString());
        const abilities = netTable?.abilities;
        if (!abilities) return DEFAULT_ABILITY_ICON;

        const abilityName = ability.GetAbilityName();
        const abilityIcon = abilities[abilityName];

        return abilityIcon ?? DEFAULT_ABILITY_ICON;
    }

    public ParseHeroSkins(hero: CDOTA_BaseNPC_Hero): void {
        const heroName = hero.GetUnitName();
        const playerId = hero.GetPlayerID();

        const wearableData = this.wearablesKV[heroName];
        if (wearableData === undefined) return;

        const models = this.getHeroWearables(hero);

        const textures: Record<string, string> = {};

        this.pushTextures(textures, wearableData.Default);

        const sortedData = Object.entries(wearableData)
            .sort(([_, a], [__, b]) => {
                const priorityA = a.SkinPriority ?? -Infinity;
                const priorityB = b.SkinPriority ?? -Infinity;
                return priorityB - priorityA;
            });

        for (const [name, data] of sortedData) {
            if (name === "Default" || !data.ModelPath) continue;

            if (models.has(data.ModelPath)) {
                const modelStyle = models.get(data.ModelPath);
                if (data.ModelStyle === undefined || modelStyle === data.ModelStyle) {
                    this.pushTextures(textures, data);
                }
            }
        }

        CustomNetTables.SetTableValue("hero_wearables", playerId.toString(), {
            abilities: textures
        });
    }

    private pushTextures(target: Record<string, string>, skin?: HeroSkin): void {
        if (!skin) return;
        
        if (skin.Abilities !== undefined) {
            for (const [name, texture] of Object.entries(skin.Abilities)) {
                target[name] = texture;
            }
        }
    }

    private loadKVFile(): void {
        this.wearablesKV = LoadKeyValues("scripts/kv/wearables.kv") as WearablesKeyValues;
    }

    private getHeroWearables(hero: CDOTA_BaseNPC_Hero): Map<string, SkinStyle> {
        const models = new Map<string, SkinStyle>();
        
        const base = hero.GetRootMoveParent() as CBaseModelEntity;
        models.set(base.GetModelName(), this.getHashStyle(base));

        let current = hero.FirstMoveChild() as CBaseModelEntity | undefined;

        while (current) {
            const modelName = current.GetModelName();

            if (modelName && this.isWearable(current)) {
                models.set(modelName, this.getHashStyle(current));
            }

            current = current.NextMovePeer() as CBaseModelEntity | undefined;
        }
        
        return models;
    }

    private getHashStyle(modelEntity: CBaseModelEntity): SkinStyle {
        const hash = modelEntity.GetMaterialGroupHash();
        return this.hashStyles[hash] ?? 0;
    }

    private isWearable(modelEntity: CBaseModelEntity): boolean {
        const className = modelEntity.GetClassname();
        return className === "prop_dynamic"
            || className === "dota_item_wearable"
            || className === "additional_wearable";
    }
}