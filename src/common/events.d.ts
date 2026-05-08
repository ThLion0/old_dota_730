/**
 * This file contains types for the events you want to send between the UI (Panorama)
 * and the server (VScripts).
 */

//============//
//   Events   //
//============//
interface CustomGameEventDeclarations {
    dota_hud_error_message_player: DotaHudErrorMessageEvent;
    selection_update: SelectionUpdateEvent;
}

// Selection
interface SelectionUpdateEvent {
    entities: EntityIndex[];
}



//===============//
//   NetTables   //
//===============//
interface CustomNetTableDeclarations {
    custom_shop: CustomShopNetTable;
    entities: EntitiesNetTable;
    key_values: KeyValuesNetTable;

    ability_textures: AbilityTexturesNetTable;
}

// Custom Shop //
interface CustomShopNetTable {
    items: CustomShopItems;
}

// Entities
type EntityTableKey = {
    values: Record<EntityIndex, 1>;
};
interface EntitiesNetTable {
    heroes: EntityTableKey;
    creeps: EntityTableKey;
    mines: EntityTableKey;
}

// Key Values
// Ability
type AbilitiesKeyValueTable = {
    type: "ability";
    behavior: DOTA_ABILITY_BEHAVIOR;
    damageType: DAMAGE_TYPES;
    targetTeam: DOTA_UNIT_TARGET_TEAM;
    targetType: DOTA_UNIT_TARGET_TYPE;
    targetFlags: DOTA_UNIT_TARGET_FLAGS;
    immunityType: SpellImmunity;
    dispellableType: SpellDispellable;
    values: {
        [key: string]: ProcessedAbilityValue;
    };
};

// Item
type ItemsKeyValueTable = {
    type: "item";
}

// Hero
type HeroesKeyValueTable = {
    type: "hero";
};

interface KeyValuesNetTable {
    [key: string]: AbilitiesKeyValueTable | ItemsKeyValueTable | HeroesKeyValueTable;
}

// Ability textures
interface AbilityTexturesNetTable {
    [key: string]: {
        abilities: Record<string, string>;
    }
}