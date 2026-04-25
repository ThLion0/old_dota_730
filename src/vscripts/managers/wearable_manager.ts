/// <reference path="wearable_manager.d.ts" />

import { WearableUtils } from "../lib/wearable_utils";
import { CustomGameManager } from "../utils/managers/manager";

const DEFAULT_ABILITY_ICON: string = "empty_png";

class ReplacementMap {
    private readonly replacementMap = new Map<PlayerID, Record<string, string>>();

    public get(key: PlayerID, value: string, fallback: string = value): string {
        const list = this.replacementMap.get(key);
        const replacement = list ? list[value] : undefined;
        return replacement ? replacement : fallback;
    }

    public set(key: PlayerID, value: Record<string, string>): void {
        this.replacementMap.set(key, value);
    }
}

export namespace Wearables {
    const particlesReplacements = new ReplacementMap();
    const soundReplacements = new ReplacementMap();
    const modelsReplacements = new ReplacementMap();

    const metaInfoMap = new Map<PlayerID, SkinMetaInfo>();

    export interface SkinMetaInfo {
        IsArcana(): boolean;
    }

    class SkinMetaInfoImpl implements SkinMetaInfo {
        public static readonly EMPTY = new SkinMetaInfoImpl({});
        
        private readonly isArcana: boolean;
        
        constructor(metaInfo: Record<string, any>) {
            this.isArcana = metaInfo.IsArcana === 1;
        }
        
        IsArcana(): boolean {
            return this.isArcana;
        }
    }

    export interface AssetWrapper {
        set(assetName: string): void;
        get(): string;
    }

    class AssetWrapperImpl implements AssetWrapper {
        constructor(private assetName: string) {}

        public set(assetName: string): void {
            this.assetName = assetName;
        }

        public get(): string {
            return this.assetName;
        }
    }

    export class ParticleWrapper extends AssetWrapperImpl {}
    export class SoundWrapper extends AssetWrapperImpl {}
    export class ModelWrapper extends AssetWrapperImpl {}

    export namespace Resolver {
        export function resolveAsset(owner: CDOTA_BaseNPC, wrapper: AssetWrapper): void {
            const value = wrapper.get();
    
            if (wrapper instanceof ParticleWrapper) {
                wrapper.set(getParticle(owner, value));
            } else if (wrapper instanceof SoundWrapper) {
                wrapper.set(getSound(owner, value));
            } else if (wrapper instanceof ModelWrapper) {
                wrapper.set(getModel(owner, value));
            } else {
                throw new Error(`Failed to resolve the asset wrapper: ${wrapper}`);
            }
        }

        /** @both */
        export function getAbilityTexture(owner: CDOTA_BaseNPC, ability: CDOTABaseAbility): string {
            if (!IsClient()) return DEFAULT_ABILITY_ICON;

            const playerId = owner.GetPlayerOwnerID();

            const netTable = CustomNetTables.GetTableValue("ability_textures", playerId.toString());
            const abilities = netTable?.abilities;
            if (!abilities) return DEFAULT_ABILITY_ICON;

            const abilityName = ability.GetAbilityName();

            return abilities[abilityName] ?? DEFAULT_ABILITY_ICON;
        }

        export function getParticle(owner: CDOTA_BaseNPC, particleName: string): string {
            const playerId = owner.GetPlayerOwnerID();
            
            const replacement = particlesReplacements.get(playerId, particleName);
            return replacement;
        }

        export function getSound(owner: CDOTA_BaseNPC, soundName: string): string {
            const playerId = owner.GetPlayerOwnerID();

            const replacement = soundReplacements.get(playerId, soundName);
            return replacement;
        }

        export function getModel(owner: CDOTA_BaseNPC, modelName: string): string {
            const playerId = owner.GetPlayerOwnerID();

            const replacement = modelsReplacements.get(playerId, modelName);
            return replacement;
        }

        export function getMetaInfo(owner: CDOTA_BaseNPC): SkinMetaInfo {
            const playerId = owner.GetPlayerOwnerID();
            
            const metaInfo = metaInfoMap.get(playerId);
            return metaInfo ?? SkinMetaInfoImpl.EMPTY;
        }
    }

    export class Manager extends CustomGameManager {
        private wearablesKV: WearablesKeyValues = {};

        public Initialize(): void {
            this.loadKVFile();
        }

        public ParseHeroSkins(hero: CDOTA_BaseNPC_Hero): void {
            const heroName = hero.GetUnitName();
            const playerId = hero.GetPlayerID();

            const wearableData = this.wearablesKV[heroName];
            if (wearableData === undefined) return;

            const heroModels = WearableUtils.GetHeroWearables(hero);

            const textures: Record<string, string> = {};
            const particles: Record<string, string> = {};
            const sounds: Record<string, string> = {};
            const models: Record<string, string> = {};

            const metaInfo: Record<string, any> = {};

            this.pushData(textures, particles, sounds, models, metaInfo, wearableData.Default);

            const sortedData = Object.entries(wearableData)
                .sort(([_, a], [__, b]) => {
                    const priorityA = a.SkinPriority ?? -Infinity;
                    const priorityB = b.SkinPriority ?? -Infinity;
                    return priorityB - priorityA;
                });

            for (const [name, data] of sortedData) {
                if (name === "Default" || !data.ModelPath) continue;

                if (heroModels.has(data.ModelPath)) {
                    const modelStyle = heroModels.get(data.ModelPath);
                    if (data.ModelStyle === undefined || modelStyle === data.ModelStyle) {
                        this.pushData(textures, particles, sounds, models, metaInfo, data);
                    }
                }
            }

            particlesReplacements.set(playerId, particles);
            soundReplacements.set(playerId, sounds);
            modelsReplacements.set(playerId, models);

            metaInfoMap.set(playerId, new SkinMetaInfoImpl(metaInfo));

            CustomNetTables.SetTableValue("ability_textures", playerId.toString(), {
                abilities: textures
            });
        }

        private pushData(
            textures: Record<string, string>,
            particles: Record<string, string>,
            sounds: Record<string, string>,
            models: Record<string, string>,
            metaInfo: Record<string, any>,
            skin: HeroSkin | undefined
        ): void {
            if (!skin) return;

            this.assignIfNonNull(textures, skin.Abilities);
            this.assignIfNonNull(particles, skin.Particles);
            this.assignIfNonNull(sounds, skin.Sounds);
            this.assignIfNonNull(models, skin.Models);

            this.assignIfNonNull(metaInfo, skin.MetaInfo);
        }

        private assignIfNonNull(target: {}, source: {} | undefined): void {
            if (source !== undefined) {
                Object.assign(target, source);
            }
        }

        private loadKVFile(): void {
            this.wearablesKV = LoadKeyValues("scripts/kv/wearables.kv") as WearablesKeyValues;
        }
    }
}