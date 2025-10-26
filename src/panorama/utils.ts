//================//
//=/ Dota Utils /=//
//================//
const FindDotaHudElement = (id: string): Panel | null => dotaHud.FindChildTraverse(id);
const dotaHud = ((): Panel => {
    let panel: Panel | null = $.GetContextPanel();
    while (panel) {
        if (panel.id === "DotaHud") return panel;
        panel = panel.GetParent();
    }

    return panel!;
})();

// Entities
Entities.HasShard = (nEntityIndex: EntityIndex): boolean => {
    return Entities.HasModifierByName(nEntityIndex, "modifier_item_aghanims_shard");
};

Entities.FindModifierByName = (nEntityIndex: EntityIndex, sModifierName: string): BuffID | null => {
    for (let i = 0; i < Entities.GetNumBuffs(nEntityIndex); i++) {
        const buff = Entities.GetBuff(nEntityIndex, i);
        const buff_name = Buffs.GetName(nEntityIndex, buff);

        if (buff_name === sModifierName) return buff;
    }

    return null;
};

Entities.HasModifierByName = (nEntityIndex: EntityIndex, sModifierName: string): boolean => {
    for (let i = 0; i < Entities.GetNumBuffs(nEntityIndex); i++) {
        const buffName = Buffs.GetName(nEntityIndex, Entities.GetBuff(nEntityIndex, i));

        if (buffName === sModifierName) return true;
    }

    return false;
};

Entities.HasTalent = (nEntityIndex: EntityIndex, sAbilityName: string): boolean => {
    return Abilities.GetLevel(Entities.GetAbilityByName(nEntityIndex, sAbilityName)) > 0;
};

// Players
Players.GetPlayerColorHex = (iPlayerID: PlayerID): string => {
    const playerColor = Players.GetPlayerColor(iPlayerID).toString(16);
    const hexColor = playerColor.substring(6, 8) +
                     playerColor.substring(4, 6) +
                     playerColor.substring(2, 4) +
                     playerColor.substring(0, 2);

    return "#" + hexColor;
};

// GameUI
GameUI.IsHudFlipped = (): boolean => {
    const hud = dotaHud.GetChild(0);
    return hud?.BHasClass("HUDFlipped") || false;
};

// $
const _default_context = $.GetContextPanel();

if (!$.LocalizeEngine) {
    $.LocalizeEngine = $.Localize;

    // @ts-ignore
    $.Localize = (text: string, parent?: PanelBase): string => {
        const token = text.startsWith("#") ? text : "#" + text;
        const localized = $.LocalizeEngine(token, parent || _default_context);
        return localized === token ? text : localized;
    };
}

$.IsTranslatable = (token: string, parent?: PanelBase): boolean => {
    const localized = $.Localize(token, parent);
    return localized !== token && token.trim().length > 0;
};


// Other Utils
class NetTableUtils {
    public static GetEntityList(key: keyof EntitiesNetTable, filter?: (value: EntityIndex) => boolean): EntityIndex[] {
        const table = CustomNetTables.GetTableValue("entities", key);
        if (!table) return [];

        const result: EntityIndex[] = [];
        for (const entityKey in table.values) {
            const entityIndex = parseInt(entityKey, 10) as EntityIndex;

            if (!filter || filter(entityIndex)) {
                result.push(entityIndex);
            }
        }
        
        return result;
    }
}



//=================//
//=/ Value Utils /=//
//=================//
const RandomFloat = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
};

const RandomInt = (min: number, max: number): number => {
    return Math.floor(RandomFloat(min, max));
};

String.prototype.replaceAll = function(searchValue: string | RegExp, replaceValue: string): string {
    const regexp = searchValue instanceof RegExp
        ? searchValue
        : new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');

    return this.replace(regexp, replaceValue);
};

Array.prototype.flatMap = function<T, U>(
    callback: (value: T, index: number, array: T[]) => U[],
    thisArg?: any
): U[] {
    return this.reduce<U[]>(
        (acc, item, index) =>
            acc.concat(callback.call(thisArg, item, index, this)),
        []
    );
};

Object.fromEntries = function<V>(array: Array<readonly [PropertyKey, V]>): Record<string, V> {
    return array.reduce((obj, [key, value]) => {
        obj[key.toString()] = value;
        return obj;
    }, {} as Record<string, V>);
};

Object.requireNonNull = function<T>(value: T | null | undefined): T {
    if (value === undefined || value === null || value === void 0) {
        throw new Error();
    }

    return value as T;
};







const objectToCSS = (obj: Record<string, string>): string => Object.entries(obj)
    .map(([key, value]) => key + ": " + value + ";")
    .join("");
