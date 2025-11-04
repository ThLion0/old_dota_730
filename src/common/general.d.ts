/**
 * This file contains some general types related to your game that can be shared between
 * front-end (Panorama) and back-end (VScripts). Only put stuff in here you need to share.
 */

// Custom Shop Net Table
interface CustomShopValue {
    index: number;
    items: Record<string, number>;
}

type CustomShopType = {
    [key: string]: CustomShopValue;
}

interface CustomShopItems {
    basics: CustomShopType;
    upgrades: CustomShopType;
}

// Key Values Net Table
type AbilitySpecialBonus = {
    name: string;
    value: number;
};

type ProcessedAbilityValue = {
    index: number;
    value: string;
    requiresShard: 0 | 1;
    requiresScepter: 0 | 1;
    specialBonus: AbilitySpecialBonus;
};

