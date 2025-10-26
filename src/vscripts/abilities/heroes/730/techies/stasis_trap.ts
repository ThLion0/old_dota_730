import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

@registerAbility()
export class techies_stasis_trap_custom_730 extends BaseAbility {
    private readonly plantSound: string = "Hero_Techies.StasisTrap.Plant";
    
    private readonly unitName: string = "npc_dota_techies_stasis_trap_custom_730";

    GetCastRange(location: Vector, target: CDOTA_BaseNPC | undefined): number {
        const bonus = this.GetCaster().HasScepter() ? 300 : 0;

        return super.GetCastRange(location, target) + bonus;
    }
    
    GetAOERadius(): number {
        return this.GetSpecialValueFor("activation_radius");
    }

    OnAbilityPhaseStart(): boolean {
        this.GetCaster().EmitSound(this.plantSound);

        return true;
    }

    OnAbilityPhaseInterrupted(): void {
        this.GetCaster().StopSound(this.plantSound);
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();
        const point = this.GetCursorPosition();

        const trap = CreateMineByName(this.unitName, point, caster);
        modifier_techies_stasis_trap_custom_730.apply(
            trap,
            caster,
            this,
            {}
        );
        
        FindClearSpaceForUnit(trap, trap.GetAbsOrigin(), true);

        Timers.CreateTimer(1.13, () => {
            if (!IsValidEntity(trap)) return;

            trap.StartGesture(GameActivity.DOTA_IDLE);
        });
    }
}



@registerModifier()
class modifier_techies_stasis_trap_custom_730 extends BaseModifier {
    private readonly detonateParticleName: string = "particles/units/heroes/hero_techies/730/techies_stasis_trap_explode.vpcf";
    private readonly stasisBeamParticleName: string = "particles/units/heroes/hero_techies/730/techies_stasis_trap_beams.vpcf";

    private readonly detonateSound: string = "Hero_Techies.StasisTrap.Stun";
    
    private readonly activationDelay: number = 2.0;
    private readonly activationRadius: number = 400;
    private readonly stunRadius: number = 600;

    private stunDuration: number = 0.0;
    
    IsHidden(): boolean {
        return true;
    }

    IsPurgable(): boolean {
        return false;
    }

    CanParentBeAutoAttacked(): boolean {
        return false;
    }

    OnCreated(params: object): void {
        this.stunDuration = this.GetSpecialValueFor("stun_duration");
        
        if (!IsServer()) return;

        this.GetParent().SetMoveCapability(
            this.GetSpecialValueFor("movement_speed") === 0 ? UnitMoveCapability.NONE : UnitMoveCapability.GROUND
        );

        this.StartIntervalThink(0.1);
    }

    OnIntervalThink(): void {
        const parent = this.GetParent();

        if (!parent.IsAlive()) {
            this.Destroy();
            return;
        }
        
        parent.SetMoveCapability(
            this.GetSpecialValueFor("movement_speed") === 0 ? UnitMoveCapability.NONE : UnitMoveCapability.GROUND
        );
        
        if (this.GetElapsedTime() <= this.activationDelay) return;

        const units = FindUnitsInRadius(
            parent.GetTeamNumber(),
            parent.GetAbsOrigin(),
            undefined,
            this.activationRadius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO | UnitTargetType.BASIC,
            UnitTargetFlags.NO_INVIS,
            FindOrder.ANY,
            false
        ).filter(unit => !unit.IsInvulnerable() && !unit.IsMagicImmune());

        if (units.length > 0) {
            this.Detonate();

            this.StopIntervalThink();
        }
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.MOVESPEED_ABSOLUTE
        ];
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        const states: Partial<Record<ModifierState, boolean>> = {
            [ModifierState.NO_UNIT_COLLISION]: true,
            [ModifierState.LOW_ATTACK_PRIORITY]: true
        };

        if (this.GetElapsedTime() > this.activationDelay) {
            states[ModifierState.INVISIBLE] = true;
        }
        
        return states;
    }

    GetModifierMoveSpeed_Absolute(): number {
        return this.GetSpecialValueFor("movement_speed");
    }

    private Detonate(): void {
        const parent = this.GetParent();
        const origin = parent.GetAbsOrigin();

        EmitSoundOn(this.detonateSound, parent);

        const particle = ParticleManager.CreateParticle(
            this.detonateParticleName,
            ParticleAttachment.WORLDORIGIN,
            undefined
        );
        ParticleManager.SetParticleControl(particle, 0, origin);
        ParticleManager.SetParticleControl(particle, 1, Vector(this.stunRadius, 1, 1));
        ParticleManager.SetParticleControl(particle, 3, origin);
        ParticleManager.SetParticleShouldCheckFoW(particle, true);
        ParticleManager.SetParticleFoWProperties(particle, 0, 3, this.stunRadius);
        ParticleManager.ReleaseParticleIndex(particle);

        FindUnitsInRadius(
            parent.GetTeamNumber(),
            origin,
            undefined,
            this.stunRadius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO | UnitTargetType.BASIC,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        ).forEach(enemy => {
            modifier_techies_stasis_trap_custom_730_stunned.apply(
                enemy,
                parent,
                this.GetAbility(),
                {
                    duration: enemy.CalculateDuration(undefined, this.stunDuration)
                }
            );

            const particle = ParticleManager.CreateParticle(
                this.stasisBeamParticleName,
                ParticleAttachment.ABSORIGIN,
                parent
            );
            ParticleManager.SetParticleControl(particle, 0, enemy.GetAbsOrigin());
            ParticleManager.SetParticleControl(particle, 1, origin);
        });

        FindUnitsInRadius(
            parent.GetTeamNumber(),
            origin,
            undefined,
            this.stunRadius,
            UnitTargetTeam.FRIENDLY,
            UnitTargetType.OTHER,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        ).filter(trap => trap.GetUnitName() === parent.GetUnitName() && trap.GetOwner() === parent.GetOwner()).forEach(trap => {
            if (trap !== parent) {
                trap.AddNoDraw();
                UTIL_Remove(trap);
            }
        });

        AddFOWViewer(parent.GetTeamNumber(), origin, 600, 1, false);
            
        parent.ForceKill(false);

        UTIL_Remove(parent);
        this.Destroy();
    }
}

@registerModifier()
class modifier_techies_stasis_trap_custom_730_stunned extends BaseModifier {
    private readonly statusEffectName: string = "particles/status_fx/status_effect_techies_stasis.vpcf";
    
    IsHidden(): boolean {
        return false;
    }

    IsPurgable(): boolean {
        return true;
    }

    IsDebuff(): boolean {
        return true;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.ROOTED]: true
        };
    }

    GetStatusEffectName(): string {
        return this.statusEffectName;
    }
}