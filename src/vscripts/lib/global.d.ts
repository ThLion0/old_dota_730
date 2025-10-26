/**
 * This file contains type declarations for extending the Dota 2 API
 * and global Lua environment.
 */

interface CBaseEntity {
    /** @custom */
    IsUnit(): this is CDOTA_BaseNPC;
}

interface CDOTA_BaseNPC {
    /** @custom */
    __custom_data: {
        debug_respawn_pos?: Vector;
    };
    
    /**
     * @custom
     * @both
     */
    HasShard(): boolean;

    /**
     * @custom
     * @both
     */
    HasTalent(name: string): boolean;

    /**
     * @custom
     * @both
     */
    IsCompanion(): boolean;
    /**
     * @custom
     * @both
     */
    IsOutpost(): this is CDOTA_BaseNPC_Building;
    /**
     * @custom
     * @both
     */
    IsFountain(): this is CDOTA_BaseNPC_Building;
    /**
     * @custom
     * @both
     */
    IsRoshan(): boolean;
    /**
     * @custom
     * @both
     */
    IsSomethingWeird(): boolean;
    
    /** @custom */
    IsTechiesMine(): boolean;

    /** @custom */
    IsLeashed(): boolean;
    /** @custom */
    CanTeleport(): boolean;

    /** @custom */
    CalculateDuration(caster: CDOTA_BaseNPC | undefined, duration: number): number;

    /** @custom */
    GetAbilities(): CDOTABaseAbility[];
    /** @custom */
    GetItems(slots?: InventorySlot): CDOTA_Item[];

    /**
     * Goes through all the modifiers of the unit and checks if it has the specific state.
     * @custom
     */
    HasModifiersState(state: ModifierState): boolean;

    /** @custom */
    SendCustomError(message: string): void;
    SendCustomError(message: string, sequenceNumber: number): void;
}

interface CDOTA_BaseNPC_Companion extends CDOTA_BaseNPC {
    
}

interface CDOTA_BaseNPC_Hero {

}

interface CDOTABaseAbility {

}

interface CDOTA_Item {

}

interface CDOTA_Buff {
    /**
     * @custom
     * @both
     */
    GetCheckStates(): Partial<Record<ModifierState, boolean>>;

    /**
     * @custom
     * @both
     */
    HasState(state: ModifierState): boolean;
}

interface CDOTA_PlayerResource {
    /** @custom */
    GetTeamFountainEntity(team: DotaTeam): CDOTA_BaseNPC_Building | undefined;
}
