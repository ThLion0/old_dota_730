import { BaseOrbAbility, BaseOrbModifier } from "../../../../lib/ability_extend";
import { registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

import { type nevermore_requiem_custom_730 } from "./requiem";

@registerAbility()
export class nevermore_necromastery_custom_730 extends BaseOrbAbility {
    private readonly shardProjectileName: string = "particles/units/heroes/hero_nevermore/sf_necromastery_attack.vpcf";
    
    private readonly shardCooldown: number = 3;

    GetBehavior(): AbilityBehavior | Uint64 {
        if (this.GetCaster().HasShard()) {
            return AbilityBehavior.UNIT_TARGET | AbilityBehavior.AUTOCAST | AbilityBehavior.ATTACK;
        }
        
        return AbilityBehavior.PASSIVE;
    }

    GetCooldown(level: number): number {
        return this.shardCooldown;
    }

    GetCastRange(location: Vector, target: CDOTA_BaseNPC | undefined): number {
        return this.GetCaster().Script_GetAttackRange()
    }

    ProcsMagicStick(): boolean {
        return false;
    }
    
    GetIntrinsicModifierName(): string {
        return modifier_nevermore_necromastery_custom_730.name;
    }

    OnOrbFire(event: ModifierAttackEvent): void {
        const caster = this.GetCaster();
        if (!IsServer()) return;
        
        const modifier = caster.FindModifierByName(modifier_nevermore_necromastery_custom_730.name);
        modifier?.DecrementStackCount();
    }

    CanLaunchOrb(attacker: CDOTA_BaseNPC): boolean {
        const stacks = attacker.GetModifierStackCount(modifier_nevermore_necromastery_custom_730.name, attacker);
        return super.CanLaunchOrb(attacker) && attacker.HasShard() && stacks > 0;
    }

    GetOrbProjectileName(): string {
        return this.shardProjectileName;
    }
}



@registerModifier()
class modifier_nevermore_necromastery_custom_730 extends BaseOrbModifier {
    private readonly killParticle: string = "particles/units/heroes/hero_nevermore/nevermore_necro_souls.vpcf";
    
    private readonly deathSoulLost: number = 0.6;

    private readonly requiemAbilityName: string = "nevermore_requiem_custom_730";
    
    IsHidden(): boolean {
        return false;
    }

    IsPurgable(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        const functions = [
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.PREATTACK_CRITICALSTRIKE,

            ModifierFunction.ON_DEATH
        ];

        return super.DeclareFunctions().concat(functions);
    }

    GetModifierPreAttack_BonusDamage(): number {
        const maxSouls = this.GetParent().HasScepter()
            ? this.GetSpecialValueFor("necromastery_max_souls_scepter")
            : this.GetSpecialValueFor("necromastery_max_souls");

        const stacks = Math.min(this.GetStackCount(), maxSouls);
        return stacks * this.GetSpecialValueFor("necromastery_damage_per_soul");
    }

    OnDeath(event: ModifierInstanceEvent): void {
        const parent = this.GetParent();
        const unit = event.unit;

        if (!IsServer()) return;

        if (event.attacker === parent) {
            if (
                !parent.PassivesDisabled() &&
                unit.IsBaseNPC() &&
                !unit.IsBuilding() &&
                !unit.IsSomethingWeird()
            ) {
                const maxSouls = this.GetSpecialValueFor("necromastery_max_souls");
                const scepterSouls = this.GetSpecialValueFor("necromastery_max_souls_scepter");

                if (parent.HasScepter() || this.GetStackCount() <= maxSouls) {
                    const soulsPerKill = parent.HasShard() ? 2 : 1;

                    const limit = parent.HasScepter() ? scepterSouls : maxSouls;
                    const souls = Math.min(this.GetStackCount() + soulsPerKill, limit);
                    this.SetStackCount(souls);
                }
                
                this.PlayEffects(unit);
            }
        } else {
            if (!parent.IsIllusion() && unit === parent) {
                const souls = Math.floor(this.GetStackCount() * this.deathSoulLost);

                const requiem = parent.FindAbilityByName(this.requiemAbilityName) as nevermore_requiem_custom_730 | undefined;
                if (requiem !== undefined) {
                    requiem.CastRequiem(true);
                }

                this.SetStackCount(souls);
            }
        }
    }

    GetModifierPreAttack_CriticalStrike(event: ModifierAttackEvent): number {
        const parent = this.GetParent();
        const target = event.target;

        if (event.attacker !== parent) return 0;
        if (target.IsBuilding() || target.IsOther() || target.IsSomethingWeird()) return 0;
        if (target.GetTeamNumber() === parent.GetTeamNumber()) return 0;

        if (this.ShouldLaunch(target)) return 170;
        
        return 0;
    }

    private PlayEffects(target: CDOTA_BaseNPC): void {
        const parent = this.GetParent();

        const info: CreateTrackingProjectileOptions = {
            Target: parent,
            Source: target,
            Ability: this.GetAbility(),
            EffectName: this.killParticle,
            bDodgeable: true,
            bProvidesVision: true,
            iMoveSpeed: 900,
            iSourceAttachment: ProjectileAttachment.HITLOCATION
        };

        ProjectileManager.CreateTrackingProjectile(info);
    }
}