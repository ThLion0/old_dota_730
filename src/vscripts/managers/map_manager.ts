import { reloadable } from "../lib/tstl-utils";

interface DefaultMap {
    type: 'default';
}
interface ReferenceMap {
    type: 'reference';
    name: string;
    overrides: MapData;
}
interface OldMap {
    type: 'old_map';
    values: MapData;
}

interface MapData {
    shops: string;
    items: string;
}

type Maps = DefaultMap | ReferenceMap | OldMap;
type CorrectMaps = DefaultMap | OldMap;
interface MapList {
    [key: string]: Maps;
}


type KvAbilityValue = number | string | {
    value?: string;
    RequiresShard?: 1;
    RequiresScepter?: 1;
};

type NpcAbilitiesCustom = {
    AbilityBehavior: string;
    AbilityUnitDamageType?: string;
    AbilityUnitTargetTeam?: string;
    AbilityUnitTargetType?: string;
    AbilityUnitTargetFlags?: string;
    SpellImmunityType?: string;
    SpellDispellableType?: string;

    AbilityCastRange?: number;
    AbilityCastPoint?: number;
    AbilityChannelTime?: number;
    AbilityCooldown?: number;
    AbilityCharges?: number;
    AbilityChargeRestoreTime?: number;
    AbilityManaCost?: number;

    AbilityValues: {
        [key: string]: KvAbilityValue;
    };

    KeyIndexes: { [key: string]: number; };
};


type NpcHeroesCustom = {

};


type NpcItemsCustom = {

};



const DEFAULT_MAP_DATA: DefaultMap = {
    type: "default"
};

@reloadable
export class OldDotaManager {    
    private currentMapData?: CorrectMaps;
    
    constructor() {
        this.loadData();
        this.setupNetTables();
    }

    private setupNetTables(): void {
        CustomNetTables.SetTableValue("entities", "heroes", { values: {} });
        CustomNetTables.SetTableValue("entities", "creeps", { values: {} });
        CustomNetTables.SetTableValue("entities", "mines", { values: {} });
    }

    private loadData(): void {
        const currentMap = GetMapName();
        const maps = LoadKeyValues("scripts/kv/maps.kv") as MapList;
        const mapData = maps[currentMap];

        if (mapData === undefined)
            throw `Unable to load map data for ${currentMap}`;

        switch (mapData.type) {
            case "default":
                this.currentMapData = DEFAULT_MAP_DATA;
                break;

            case "old_map":
                this.loadMapData(maps, currentMap);
                break;

            case "reference":
                print(`Preparing referenced map data for ${currentMap}`);
                this.loadMapData(maps, mapData.name);
                break;

            default:
                throw `Unable to load map data for ${currentMap}`;
        }
        
        print(`Loaded map data with type '${mapData.type}' for ${currentMap}`);
    }

    private loadMapData(list: MapList, name: string): void {
        if (this.currentMapData !== undefined) {
            throw `Trying to overwrite current map data, cancelled.`;
        }
        
        const data = list[name];
        if (data === undefined)
            throw `Unable to load map data for ${name}`;

        if (data.type === "reference") {
            if (data.name === name) {
                throw `Found infinite reference loop in ${name}`;
            }

            this.loadMapData(list, data.name);
            return;
        }

        this.currentMapData = data;
    }

    public SaveKVData(): void {
        this.SaveShopData();
        this.SaveAbilitiesKeyValue();
        this.SaveHeroKeyValue();
        this.SaveItemKeyValue();
    }

    public SaveShopData(): void {
        if (this.currentMapData === undefined || this.currentMapData.type === "default") return;

        const shopData = LoadKeyValues(this.currentMapData.values.shops) as CustomShopItems;

        CustomNetTables.SetTableValue("custom_shop", "items", {
            basics: shopData.basics,
            upgrades: shopData.upgrades
        });
    }

    public SaveAbilitiesKeyValue(): void {
        const abilities = LoadKeyValues("scripts/npc/npc_abilities_custom.txt") as { [key: string]: NpcAbilitiesCustom; };

        const MAPPERS = {
            behavior: {
                "DOTA_ABILITY_BEHAVIOR_PASSIVE": AbilityBehavior.PASSIVE,
                "DOTA_ABILITY_BEHAVIOR_NO_TARGET": AbilityBehavior.NO_TARGET,
                "DOTA_ABILITY_BEHAVIOR_UNIT_TARGET": AbilityBehavior.UNIT_TARGET,
                "DOTA_ABILITY_BEHAVIOR_POINT": AbilityBehavior.POINT,
                "DOTA_ABILITY_BEHAVIOR_AOE": AbilityBehavior.AOE,
                "DOTA_ABILITY_BEHAVIOR_CHANNELLED": AbilityBehavior.CHANNELLED,
                "DOTA_ABILITY_BEHAVIOR_TOGGLE": AbilityBehavior.TOGGLE,
                "DOTA_ABILITY_BEHAVIOR_AUTOCAST": AbilityBehavior.AUTOCAST,
                "DOTA_ABILITY_BEHAVIOR_AURA": AbilityBehavior.AURA,
            },
            damageType: {
                "DAMAGE_TYPE_PHYSICAL": DamageTypes.PHYSICAL,
                "DAMAGE_TYPE_MAGICAL": DamageTypes.MAGICAL,
                "DAMAGE_TYPE_PURE": DamageTypes.PURE
            } as Record<string, DamageTypes>,
            targetTeam: {
                "DOTA_UNIT_TARGET_TEAM_FRIENDLY": UnitTargetTeam.FRIENDLY,
                "DOTA_UNIT_TARGET_TEAM_ENEMY": UnitTargetTeam.ENEMY,
                "DOTA_UNIT_TARGET_TEAM_BOTH": UnitTargetTeam.BOTH
            } as Record<string, UnitTargetTeam>,
            targetType: {
                "DOTA_UNIT_TARGET_HERO": UnitTargetType.HERO,
                "DOTA_UNIT_TARGET_CREEP": UnitTargetType.CREEP,
                "DOTA_UNIT_TARGET_BUILDING": UnitTargetType.BUILDING,
                "DOTA_UNIT_TARGET_BASIC": UnitTargetType.BASIC,
                "DOTA_UNIT_TARGET_OTHER": UnitTargetType.OTHER,
                "DOTA_UNIT_TARGET_ALL": UnitTargetType.ALL,
                "DOTA_UNIT_TARGET_TREE": UnitTargetType.TREE,
                "DOTA_UNIT_TARGET_SELF": UnitTargetType.SELF
            },
            targetFlags: {
                "DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES": UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
                "DOTA_UNIT_TARGET_FLAG_NOT_MAGIC_IMMUNE_ALLIES": UnitTargetFlags.NOT_MAGIC_IMMUNE_ALLIES,
                "DOTA_UNIT_TARGET_FLAG_INVULNERABLE": UnitTargetFlags.INVULNERABLE,
                "DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE": UnitTargetFlags.FOW_VISIBLE,
                "DOTA_UNIT_TARGET_FLAG_NO_INVIS": UnitTargetFlags.NO_INVIS,
                "DOTA_UNIT_TARGET_FLAG_NOT_ANCIENTS": UnitTargetFlags.NOT_ANCIENTS,
                "DOTA_UNIT_TARGET_FLAG_NOT_ATTACK_IMMUNE": UnitTargetFlags.NOT_ATTACK_IMMUNE,
                "DOTA_UNIT_TARGET_FLAG_MANA_ONLY": UnitTargetFlags.MANA_ONLY,
                "DOTA_UNIT_TARGET_FLAG_NOT_CREEP_HERO": UnitTargetFlags.NOT_CREEP_HERO
            },
            immunityType: {
                "SPELL_IMMUNITY_ENEMIES_NO": SpellImmunity.ENEMIES_NO,
                "SPELL_IMMUNITY_ENEMIES_YES": SpellImmunity.ENEMIES_YES,
                "SPELL_IMMUNITY_ALLIES_NO": SpellImmunity.ALLIES_NO,
                "SPELL_IMMUNITY_ALLIES_YES": SpellImmunity.ALLIES_YES,
                "SPELL_IMMUNITY_ALLIES_YES_ENEMIES_NO": SpellImmunity.ALLIES_YES_ENEMIES_NO,
            } as Record<string, SpellImmunity>,
            dispellableType: {
                "SPELL_DISPELLABLE_NO": SpellDispellable.NO,
                "SPELL_DISPELLABLE_YES": SpellDispellable.YES,
                "SPELL_DISPELLABLE_YES_STRONG": SpellDispellable.YES_STRONG
            } as Record<string, SpellDispellable>
        };

        for (const [abilityName, data] of Object.entries(abilities)) {
            if (abilityName === "Version" || abilityName.startsWith("special_")) continue;

            const { abilityValues, maxIndex } = this.processSpecialValues(data.AbilityValues, data.KeyIndexes);

            this.addSimpleValues(abilityValues, data, maxIndex);

            const abilityData: AbilitiesKeyValueTable = {
                type: "ability",
                behavior: this.parseBitmaskString(data.AbilityBehavior, MAPPERS.behavior),
                damageType: this.parseSingleValue(data.AbilityUnitDamageType, MAPPERS.damageType),
                targetTeam: this.parseSingleValue(data.AbilityUnitTargetTeam, MAPPERS.targetTeam),
                targetType: this.parseBitmaskString(data.AbilityUnitTargetType, MAPPERS.targetType),
                targetFlags: this.parseBitmaskString(data.AbilityUnitTargetFlags, MAPPERS.targetFlags),
                immunityType: this.parseSingleValue(data.SpellImmunityType, MAPPERS.immunityType),
                dispellableType: this.parseSingleValue(data.SpellDispellableType, MAPPERS.dispellableType),
                values: abilityValues
            };

            CustomNetTables.SetTableValue("key_values", abilityName, abilityData);
        }
    }

    private processSpecialValues(
        values: Record<string, KvAbilityValue>,
        indexes?: Record<string, number>
    ): { abilityValues: Record<string, ProcessedAbilityValue>; maxIndex: number; } {
        const abilityValues: Record<string, ProcessedAbilityValue> = {};

        let maxIndex = 0;

        for (const [key, value] of Object.entries(values)) {
            const index = indexes?.[key] ?? -1;
            if (index > maxIndex) {
                maxIndex = index
            }
            abilityValues[key] = this.normalizeAbilityValue(value, index);
        }

        return { abilityValues, maxIndex };
    }

    private addSimpleValues(
        abilityValues: Record<string, ProcessedAbilityValue>,
        data: NpcAbilitiesCustom,
        startIndex: number
    ): void {
        const simpleValueKeys: (keyof NpcAbilitiesCustom)[] = [
            "AbilityCastRange",
            "AbilityCastPoint",
            "AbilityChannelTime",
            "AbilityCooldown",
            "AbilityCharges",
            "AbilityChargeRestoreTime",
            "AbilityManaCost"
        ];

        let currentIndex = startIndex;
        for (const key of simpleValueKeys) {
            const value = data[key];
            if (value !== undefined) {
                currentIndex++;
                abilityValues[key] = this.normalizeAbilityValue(value.toString(), currentIndex);
            }
        }
    }

    private normalizeAbilityValue(value: KvAbilityValue, index: number): ProcessedAbilityValue {
        const isObject = typeof value === "object" && value !== undefined;

        const rawValue = isObject ? value.value : value;

        const requiresShard = (isObject && value.RequiresShard === 1) ? 1 : 0;
        const requiresScepter = (isObject && value.RequiresScepter === 1) ? 1 : 0;

        const specialBonus: AbilitySpecialBonus = { name: "", value: 0 };
        if (isObject) {
            const specialKey = Object.keys(value).find(key => key.startsWith("special_bonus_unique")) as keyof KvAbilityValue;
            if (specialKey) {
                specialBonus.name = specialKey;
                specialBonus.value = value[specialKey];
            }
        }

        return {
            index,
            value: rawValue?.toString() ?? "0",
            requiresShard,
            requiresScepter,
            specialBonus
        };
    }

    private parseSingleValue(value: string | undefined, map: Record<string, number>): number {
        if (!value) return 0;
        return map[value.trim()] ?? 0;
    }

    private parseBitmaskString(value: string | undefined, map: Record<string, number>): number {
        if (!value) return 0;

        return value.split(" | ")
            .map(key => map[key.trim()])
            .filter((value): value is number => value !== undefined)
            .reduce((acc, current) => acc | current, 0);
    }

    public SaveHeroKeyValue(): void {
        const heroes = LoadKeyValues("scripts/npc/npc_abilities_custom.txt") as { [key: string]: NpcHeroesCustom; };
    }

    public SaveItemKeyValue(): void {
        const items = LoadKeyValues("scripts/npc/npc_abilities_custom.txt") as { [key: string]: NpcItemsCustom; };
    } 

    public PushEntityToNetTable(entity: CDOTA_BaseNPC): void {
        this.UpdateNetTableValue(entity, false);
    }

    public RemoveEntityFromNetTable(entity: CDOTA_BaseNPC): void {
        this.UpdateNetTableValue(entity, true);
    }

    private UpdateNetTableValue(entity: CDOTA_BaseNPC, remove: boolean): void {
        const tableName = this.getEntityKey(entity);
        if (tableName === undefined) return;

        const values = CustomNetTables.GetTableValue("entities", tableName).values;
        
        const entityIndex = entity.entindex();

        if (remove) {
            delete values[entityIndex];
        } else {
            values[entityIndex] = 1;
        }
        
        CustomNetTables.SetTableValue("entities", tableName, { values });
    }

    private getEntityKey(entity: CDOTA_BaseNPC): keyof EntitiesNetTable | undefined {
        if (entity.IsHero()) return "heroes";
        else if (entity.IsCreep()) return "creeps";
        else if (entity.IsTechiesMine()) return "mines";
        else return undefined;
    }
}