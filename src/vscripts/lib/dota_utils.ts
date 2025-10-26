//===============//
//=/ Functions /=//
//===============//
/** @custom */
const CreateCompanion = (location: Vector, findClearSpace: boolean = true, team: DotaTeam = DotaTeam.NEUTRALS): CDOTA_BaseNPC_Companion => {
    const companion = CreateUnitByName("npc_dota_companion", location, false, undefined, undefined, team) as CDOTA_BaseNPC_Companion;
    TurnToDummy(companion);

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

/** @custom */
const TurnToDummy = (unit: CDOTA_BaseNPC): void => {
    if (unit === undefined || unit.IsNull() || !IsValidEntity(unit)) return;

    unit.AddNewModifier(unit, undefined, BuiltInModifier.PHASED, {});
    unit.AddNewModifier(unit, undefined, BuiltInModifier.INVULNERABLE, {});
    unit.AddNewModifier(unit, undefined, BuiltInModifier.HIDDEN_CUSTOM, {});

    unit.AddNoDraw();
};



//=================//
//=/ CBaseEntity /=//
//=================//
CBaseEntity.IsUnit = function(): boolean {
    if (this.IsNull() || !this.IsBaseNPC()) return false;
    return !this.IsBuilding() && !this.IsOther();
};



//===================//
//=/ CDOTA BaseNPC /=//
//===================//
CDOTA_BaseNPC.HasShard = function(): boolean {
    return this.HasModifier("modifier_item_aghanims_shard");
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

CDOTA_BaseNPC.IsTechiesMine = function(): boolean {
    const unitData = GetUnitKeyValuesByName(this.GetUnitName()) as { CustomData?: { IsMineType?: 0 | 1; }; };
    return unitData?.CustomData?.IsMineType === 1;
};

CDOTA_BaseNPC.IsLeashed = function(): boolean {
    const isMagicImmune = this.IsMagicImmune();

    return this.FindAllModifiers().some(modifier => {
        const ability = modifier.GetAbility();
        if (!ability) return false;

        const behavior = ability.GetAbilityTargetFlags();
        
        return isMagicImmune &&
            (behavior & UnitTargetFlags.MAGIC_IMMUNE_ENEMIES) === 0 &&
            modifier.HasState(ModifierState.TETHERED);
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
