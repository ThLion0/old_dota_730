//================//
//=/ Dota Types /=//
//================//
interface CScriptBindingPR_Players {
    GetPlayerColorHex(iPlayerID: PlayerID): string;
}

interface CScriptBindingPR_Entities {
    HasShard(nEntityIndex: EntityIndex): boolean;

    FindModifierByName(nEntityIndex: EntityIndex, sModifierName: string): BuffID | null;
    HasModifierByName(nEntityIndex: EntityIndex, sModifierName: string): boolean;

    HasTalent(nEntityIndex: EntityIndex, sAbilityName: string): boolean;
}

interface CScriptBindingPR_Abilities {
    
}

interface DollarStatic {
    /**
     * Localize a string. Optionally accepts Quantity, Precision, and Panel arguments.
     */
    LocalizeEngine(token: string, parent?: PanelBase): string;

    IsTranslatable(token: string, panel?: PanelBase): boolean;
}



//===================//
//=/ Default Types /=//
//===================//
interface String {
    /**
     * Replace all instances of a substring in a string, using a regular expression or search string.
     *
     * @param searchValue — A string to search for.
     * @param replaceValue — A string containing the text to replace for every successful match of searchValue in this string.
     */
    replaceAll(searchValue: string | RegExp, replaceValue: string): string;
}

interface Array<T> {
    flatMap<U>(callback: (value: T, index: number, array: T[]) => U[], thisArg?: any): U[];
}

interface ObjectConstructor {
    fromEntries<T = any>(array: Array<readonly [PropertyKey, T]>): Record<string, T>;
    requireNonNull<T = any>(value: T | null | undefined): T;
}