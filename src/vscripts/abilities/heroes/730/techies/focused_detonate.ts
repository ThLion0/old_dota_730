import { BaseAbility, registerAbility } from "../../../../lib/dota_ts_adapter";

import { type techies_remote_mines_self_detonate_custom_730 } from "./remote_mines_self_detonate";

@registerAbility()
export class techies_focused_detonate_custom_730 extends BaseAbility {
    private readonly activateSound: string = "Hero_Techies.RemoteMine.Activate";
    
    private readonly detonateAbilityName: string = "techies_remote_mines_self_detonate_custom_730";
    private readonly unitName: string = "npc_dota_techies_remote_mine_custom_730";

    private readonly radius: number = 700;

    private readonly detonateDelay: number = 0.25;
    
    GetAOERadius(): number {
        return this.radius;
    }

    RequiresFacing(): boolean {
        return false;
    }

    ProcsMagicStick(): boolean {
        return false;
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();
        const point = this.GetCursorPosition();

        const mines = FindUnitsInRadius(
            caster.GetTeamNumber(),
            point,
            undefined,
            this.radius,
            UnitTargetTeam.FRIENDLY,
            UnitTargetType.OTHER,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        ).filter(
            unit => unit.GetUnitName() === this.unitName && unit.GetOwner() === caster
        );

        mines.forEach(mine => mine.EmitSound("Hero_Techies.RemoteMine.Activate"));

        Timers.CreateTimer(this.detonateDelay, () => {
            mines.forEach(mine => {
                if (IsValidEntity(mine) && mine.IsAlive()) {
                    const ability = mine.FindAbilityByName(this.detonateAbilityName) as techies_remote_mines_self_detonate_custom_730 | undefined;
                    ability?.Detonate();
                }
            });
        });
    }
}