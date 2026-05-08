//===============//
//=/ Functions /=//
//===============//
/**
 * @param ability specify ability to prevent leaks
 * 
 * @custom
 */
const CreateCompanion = (ability: CDOTABaseAbility, location: Vector, findClearSpace: boolean = true, team: DotaTeam = DotaTeam.NEUTRALS): CDOTA_BaseNPC_Companion => {
    const companion = CreateUnitByName("npc_dota_companion", location, false, undefined, undefined, team) as CDOTA_BaseNPC_Companion;
    TurnToDummy(companion, ability);

    companion.SetAbsOrigin(location);

    if (findClearSpace) {
        FindClearSpaceForUnit(companion, location, true);
    }

    return companion;
};

/** @custom */
const CreateMineByName = (unitName: string, location: Vector, owner: CDOTA_BaseNPC): CDOTA_BaseNPC => {
    const mine = CreateUnitByName(unitName, location, false, owner, owner, owner.GetTeamNumber());
    mine.SetControllableByPlayer(owner.GetPlayerOwnerID(), true);
    mine.SetOwner(owner);

    return mine;
};

/**
 * @param ability specify ability to prevent leaks
 * 
 * @custom
 */
const TurnToDummy = (unit: CDOTA_BaseNPC, ability: CDOTABaseAbility): void => {
    if (unit === undefined || unit.IsNull() || !IsValidEntity(unit)) return;

    unit.AddNewModifier(unit, ability, BuiltInModifier.PHASED, {});
    unit.AddNewModifier(unit, ability, BuiltInModifier.INVULNERABLE, {});
    unit.AddNewModifier(unit, ability, BuiltInModifier.HIDDEN_CUSTOM, {});

    unit.AddNoDraw();
};

/**
 * @deprecated Used to override EntIndexToHScript
 */
declare var _EntIndexToHScriptEngine_Server: typeof globalThis.EntIndexToHScript;
if (_EntIndexToHScriptEngine_Server === undefined) {
    _EntIndexToHScriptEngine_Server = globalThis.EntIndexToHScript;
}

globalThis.EntIndexToHScript = function(entityIndex: EntityIndex): CBaseEntity | undefined {
    if (entityIndex === undefined) return undefined;
    return _EntIndexToHScriptEngine_Server(entityIndex);
};



//=================//
//=/ CBaseEntity /=//
//=================//
CBaseEntity.IsUnit = function(): boolean {
    if (this.IsNull() || !this.IsBaseNPC()) return false;
    return !this.IsBuilding() && !this.IsOther();
};

CBaseEntity.GetBoundingRadius = function(): number {
    return this.GetBoundingMins().__sub(this.GetBoundingMaxs()).Length2D();
};



//===================//
//=/ CDOTA BaseNPC /=//
//===================//
CDOTA_BaseNPC.HasShard = function(): boolean {
    return this.HasModifier(BuiltInModifier.ITEM_AGHANIMS_SHARD);
};

CDOTA_BaseNPC.HasTalent = function(name: string): boolean {
    const ability = this.FindAbilityByName(name);
    return ability !== undefined && ability.GetLevel() > 0;
};

CDOTA_BaseNPC.IsCompanion = function(): boolean {
    return this.GetUnitName() === "npc_dota_companion";
};

CDOTA_BaseNPC.IsOutpost = function(): boolean {
    return this.GetClassname() === "npc_dota_watch_tower";
};

CDOTA_BaseNPC.IsFountain = function(): boolean {
    return this.GetClassname() === "ent_dota_fountain";
};

CDOTA_BaseNPC.IsRoshan = function(): boolean {
    return this.GetUnitName() === "npc_dota_roshan";
};

CDOTA_BaseNPC.IsSomethingWeird = function(): boolean {
    // Strange hack to determinate if unit is item-entity or rune
    return this.GetUnitName === undefined;
};

// TODO: Optimize this shit
CDOTA_BaseNPC.IsTechiesMine = function(): boolean {
    const unitData = GetUnitKeyValuesByName(this.GetUnitName()) as { CustomData?: { IsTechiesMine?: 0 | 1; }; };
    return unitData?.CustomData?.IsTechiesMine === 1;
};

// TODO: Optimize this shit
CDOTA_BaseNPC.IsBlockingCamp = function(): boolean {
    const unitData = GetUnitKeyValuesByName(this.GetUnitName()) as { CustomData?: { BlockNeutralCamps?: 0 | 1; }; };
    return unitData?.CustomData?.BlockNeutralCamps !== 0;
};

CDOTA_BaseNPC.IsLeashed = function(): boolean {
    const isMagicImmune = this.IsMagicImmune();

    return this.FindAllModifiers().some(modifier => {
        const ability = modifier.GetAbility();
        if (!ability) return false;

        const behavior = ability.GetAbilityTargetFlags();
        
        return isMagicImmune
            && (behavior & UnitTargetFlags.MAGIC_IMMUNE_ENEMIES) === 0
            && modifier.HasState(ModifierState.TETHERED);
    });
};

CDOTA_BaseNPC.CanTeleport = function(): boolean {
    return !(
        this.IsRooted()
        || this.IsHexed()
        || this.IsNightmared()
        || this.IsFeared()
        || this.IsTaunted()
        || this.IsLeashed()
    );
};

CDOTA_BaseNPC.CalculateDuration = function(caster: CDOTA_BaseNPC | undefined, duration: number): number {
    const statusResistance = this.GetStatusResistance();
    return duration * (1 - statusResistance);
};

CDOTA_BaseNPC.GetAbilities = function(): CDOTABaseAbility[] {
    const result: CDOTABaseAbility[] = [];

    for (let i = 0; i < this.GetAbilityCount(); i++) {
        const ability = this.GetAbilityByIndex(i);
        if (ability === undefined) continue;

        result.push(ability);
    }

    return result;
};

CDOTA_BaseNPC.GetItems = function(slots: InventorySlot = InventorySlot.SLOT_9): CDOTA_Item[] {
    const items: CDOTA_Item[] = [];

    for (let i = 0; i <= slots; i++) {
        const item = this.GetItemInSlot(i);
        if (item === undefined) continue;

        items.push(item);
    }

    return items;
};

CDOTA_BaseNPC.PostUpdateAbilities = function(): void {
    this.GetAbilities().forEach(ability => ability.OnPostUpdate());
};

CDOTA_BaseNPC.HasModifiersState = function(state: ModifierState): boolean {
    return this.FindAllModifiers().some(modifier => modifier.HasState(state));
};

CDOTA_BaseNPC.SendCustomError = function(message: string, sequenceNumber: number = 0): void {
    CustomGameEventManager.Send_ServerToPlayer(this.GetPlayerOwner(), "dota_hud_error_message_player", {
        message: message,
        reason: 80,
        sequenceNumber: sequenceNumber
    });
};



//======================//
//=/ CDOTABaseAbility /=//
//======================//
CDOTABaseAbility.OnPostUpdate = function(): void {};

CDOTABaseAbility.UpgradeLinkedAbility = function(abilityName: string): void {
    const ability = this.GetCaster().FindAbilityByName(abilityName);
    if (ability && !ability.IsTrained()) {
        ability.SetLevel(ability.GetMaxLevel());
    }
};



//================//
//=/ CDOTA Buff /=//
//================//
CDOTA_Buff.GetCheckStates = function(): Partial<Record<ModifierState, boolean>> {
    const states: Partial<Record<ModifierState, boolean>> = {};
    this.CheckStateToTable(states);
    return states;
};

CDOTA_Buff.HasState = function(state: ModifierState): boolean {
    const states = this.GetCheckStates();
    return states[state] === true;
};



//==========================//
//=/ CDOTA PlayerResource /=//
//==========================//
/**
 * @deprecated Used only local scope in dota_utils.ts
 */
const _teamFountains: Partial<Record<DotaTeam, CDOTA_BaseNPC_Building | undefined>> = {};

CDOTA_PlayerResource.GetTeamFountainEntity = function(team: DotaTeam): CDOTA_BaseNPC_Building | undefined {
    if (_teamFountains[team]) return _teamFountains[team];

    const buildings = FindUnitsInRadius(
        team,
        Vector(0, 0, 0),
        undefined,
        FIND_UNITS_EVERYWHERE,
        UnitTargetTeam.FRIENDLY,
        UnitTargetType.BUILDING,
        UnitTargetFlags.INVULNERABLE,
        FindOrder.CLOSEST,
        false
    );

    return _teamFountains[team] = buildings.find(building => building.IsFountain());
};
