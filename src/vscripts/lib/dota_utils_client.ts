//====================//
//=/ C_DOTA BaseNPC /=//
//====================//
C_DOTA_BaseNPC.HasShard = function(): boolean {
    return this.HasModifier("modifier_item_aghanims_shard");
};

C_DOTA_BaseNPC.HasTalent = function(name: string): boolean {
    const ability = this.FindAbilityByName(name);
    return ability !== undefined && ability.GetLevel() > 0;
};

C_DOTA_BaseNPC.IsCompanion = function(): boolean {
    return this.GetUnitName() === "npc_dota_companion";
};

C_DOTA_BaseNPC.IsOutpost = function(): boolean {
    return this.GetClassname() === "npc_dota_watch_tower";
};

C_DOTA_BaseNPC.IsFountain = function(): boolean {
    return this.GetClassname() === "ent_dota_fountain";
};

C_DOTA_BaseNPC.IsRoshan = function(): boolean {
    return this.GetUnitName() === "npc_dota_roshan";
};

C_DOTA_BaseNPC.IsSomethingWeird = function(): boolean {
    // Strange hack to determinate if unit is item-entity or rune
    return this.GetUnitName === undefined;
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