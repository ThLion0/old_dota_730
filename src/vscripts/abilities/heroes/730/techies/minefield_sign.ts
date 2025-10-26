import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

@registerAbility()
export class techies_minefield_sign_custom_730 extends BaseAbility {
    private readonly placeSound: string = "Hero_Techies.Sign";
    
    private readonly unitName: string = "npc_dota_techies_minefield_sign_custom_730";

    private readonly radius: number = 125;
    
    private sign?: CDOTA_BaseNPC;
    
    CastFilterResultLocation(location: Vector): UnitFilterResult {
        if (IsServer()) {
            const fountains = [
                PlayerResource.GetTeamFountainEntity(DotaTeam.BADGUYS),
                PlayerResource.GetTeamFountainEntity(DotaTeam.GOODGUYS)
            ];

            const isNearFountain = fountains
                .filter(fountain => fountain !== undefined)
                .some(fountain => {
                    const radius = fountain.Script_GetAttackRange();
                    return fountain.GetAbsOrigin().__sub(location).Length2D() <= radius;
                });

            if (isNearFountain)
                return UnitFilterResult.FAIL_CUSTOM;
        }
        
        return UnitFilterResult.SUCCESS;
    }

    GetCustomCastErrorLocation(location: Vector): string {
        return "#dota_hud_error_no_minefield_here";
    }

    GetAOERadius(): number {
        return this.radius;
    }

    IsStealable(): boolean {
        return false;
    }

    ProcsMagicStick(): boolean {
        return false;
    }

    Spawn(): void {
        if (IsServer()) {
            if (!this.IsTrained()) {
                this.SetLevel(1);
            }
        }
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();
        const point = this.GetCursorPosition();

        if (this.sign && IsValidEntity(this.sign)) {
            this.sign.ForceKill(false);
        }

        const sign = CreateUnitByName(this.unitName, point, false, caster, caster, caster.GetTeamNumber());
        this.sign = sign;
        modifier_techies_minefield_sign_custom_730.apply(
            sign,
            caster,
            this,
            {}
        );
        sign.AddNewModifier(
            caster,
            this,
            BuiltInModifier.KILL,
            {
                duration: this.GetSpecialValueFor("lifetime")
            }
        );
        FindClearSpaceForUnit(sign, sign.GetAbsOrigin(), true);

        sign.SetForwardVector(Vector(RandomFloat(-0.5, 0.5), RandomFloat(-0.5, 0.5), 0));

        caster.EmitSound(this.placeSound);
    }
}



@registerModifier()
class modifier_techies_minefield_sign_custom_730 extends BaseModifier {
    private readonly radius: number = 125;
    private readonly duration: number = 0.1;

    IsHidden(): boolean {
        return false;
    }

    IsPurgable(): boolean {
        return false;
    }

    IsAura(): boolean {
        const hasScepter = this.GetCaster()?.HasScepter();
        return hasScepter === true;
    }
    
    GetAuraRadius(): number {
        return this.radius;
    }

    GetAuraDuration(): number {
        return this.duration;
    }

    GetModifierAura(): string {
        return modifier_techies_minefield_sign_custom_730_aura.name;
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return UnitTargetTeam.FRIENDLY;
    }

    GetAuraSearchType(): UnitTargetType {
        return UnitTargetType.OTHER;
    }

    GetAuraSearchFlags(): UnitTargetFlags {
        return UnitTargetFlags.NONE;
    }

    GetAuraEntityReject(entity: CDOTA_BaseNPC): boolean {
        return !entity.IsTechiesMine();
    }
    
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.NO_UNIT_COLLISION]: true,
            [ModifierState.NO_HEALTH_BAR]: true,
            [ModifierState.INVULNERABLE]: true,
            [ModifierState.UNSELECTABLE]: true,
            [ModifierState.STUNNED]: true
        };
    }
}

@registerModifier()
class modifier_techies_minefield_sign_custom_730_aura extends BaseModifier {
    IsHidden(): boolean {
        return false;
    }

    IsPurgable(): boolean {
        return false;
    }

    IsDebuff(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.INVISIBILITY_LEVEL
        ];
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.INVISIBLE]: true,
            [ModifierState.TRUESIGHT_IMMUNE]: true
        };
    }

    GetModifierInvisibilityLevel(): number {
        return 1;
    }

    GetPriority(): ModifierPriority | number {
        return 9999;
    }
}