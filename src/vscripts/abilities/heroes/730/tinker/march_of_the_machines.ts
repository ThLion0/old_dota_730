import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

@registerAbility()
export class tinker_march_of_the_machines_custom_730 extends BaseAbility {
    private readonly castParticle: string = "particles/units/heroes/hero_tinker/tinker_motm.vpcf";
    private readonly castSound: string = "Hero_Tinker.March_of_the_Machines.Cast";
    
    OnSpellStart(): void {
        const caster = this.GetCaster();
        let point = this.GetCursorPosition();

        if (caster.GetAbsOrigin() === point) {
            point = caster.GetAbsOrigin().__add(caster.GetForwardVector().__mul(15));
        }

        CreateModifierThinker(
            caster,
            this,
            modifier_tinker_march_of_the_machines_custom_730_thinker.name,
            {},
            point,
            caster.GetTeamNumber(),
            false
        );

        this.PlayEffects();
    }

    OnProjectileHit_ExtraData(target: CDOTA_BaseNPC | undefined, location: Vector, extraData: { radius: number; damage: number; }): boolean | void {
        if (!target) return true;

        const caster = this.GetCaster();

        const damageTable: ApplyDamageOptions = {
            attacker: caster,
            damage: extraData.damage,
            damage_type: DamageTypes.MAGICAL,
            victim: undefined!,
            ability: this
        };

        FindUnitsInRadius(
            caster.GetTeamNumber(),
            location,
            undefined,
            extraData.radius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO | UnitTargetType.BASIC,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        ).forEach(enemy => {
            damageTable.victim = enemy;
            ApplyDamage(damageTable);
        });

        return true;
    }

    private PlayEffects(): void {
        const caster = this.GetCaster();

        const origin = caster.GetAbsOrigin();

        const particle = ParticleManager.CreateParticle(
            this.castParticle,
            ParticleAttachment.CUSTOMORIGIN,
            caster
        );
        ParticleManager.SetParticleControlEnt(
            particle,
            0,
            caster,
            ParticleAttachment.POINT_FOLLOW,
            AttachLocation.ATTACK1,
            origin,
            true
        );
        ParticleManager.SetParticleControlEnt(
            particle,
            1,
            caster,
            ParticleAttachment.ABSORIGIN,
            undefined!,
            origin,
            true
        );
        ParticleManager.ReleaseParticleIndex(particle);

        EmitSoundOnLocationForAllies(origin, this.castSound, caster);
    }
}



@registerModifier()
class modifier_tinker_march_of_the_machines_custom_730_thinker extends BaseModifier {
    private marchParticle: string = "particles/units/heroes/hero_tinker/tinker_machine.vpcf";
    private marchSound: string = "Hero_Tinker.March_of_the_Machines";

    private radius: number = 0;

    private centerSpawn!: Vector;;
    private centerVector!: Vector;

    private projectileInfo!: CreateLinearProjectileOptions;

    IsHidden(): boolean {
        return true;
    }

    IsDebuff(): boolean {
        return false;
    }

    IsPurgable(): boolean {
        return false;
    }

    OnCreated(params: object): void {
        const parent = this.GetParent();
        const caster = this.GetCaster();
        const ability = this.GetAbility();

        if (!IsServer()) return;
        if (!caster || !ability) return;

        const damage = ability.GetSpecialValueFor("damage");
        const splashRadius = ability.GetSpecialValueFor("splash_radius");
        const collisionRadius = ability.GetSpecialValueFor("collision_radius");
        
        const duration = ability.GetSpecialValueFor("duration");
        const speed = ability.GetSpecialValueFor("speed");
        const distance = ability.GetSpecialValueFor("distance");
        
        // const machinesPerSecond = ability.GetSpecialValueFor("machines_per_sec");

        const center = parent.GetAbsOrigin();

        let direction = center.__sub(caster.GetAbsOrigin());
        if (direction.Length2D() === 0) {
            direction = caster.GetForwardVector();
        } else {
            direction.z = 0;
            direction = direction.Normalized();
        }

        parent.SetForwardVector(direction);

        this.radius = ability.GetSpecialValueFor("radius");

        this.centerVector = parent.GetLeftVector(); // parent.GetRightVector();
        this.centerSpawn = center.__sub(direction.__mul(this.radius));
        
        this.projectileInfo = {
            Source: caster,
            Ability: ability,
            
            iUnitTargetTeam: UnitTargetTeam.ENEMY,
            iUnitTargetType: UnitTargetType.HERO | UnitTargetType.BASIC,
            iUnitTargetFlags: UnitTargetFlags.NONE,

            EffectName: this.marchParticle,
            fDistance: distance,
            fStartRadius: collisionRadius,
            fEndRadius: collisionRadius,
            vVelocity: direction.__mul(speed),

            ExtraData: {
                radius: splashRadius,
                damage: damage
            }
        };
        
        this.SetDuration(duration, false);

        this.OnIntervalThink();
        // this.StartIntervalThink(1 / machinesPerSecond);
        // 1 / 24 = ~0.04166...
        this.StartIntervalThink(0.042);

        parent.EmitSound(this.marchSound);
    }

    OnDestroy(): void {
        const parent = this.GetParent();

        if (IsServer()) {
            parent.StopSound(this.marchSound);
    
            UTIL_Remove(parent);
        }
    }

    OnIntervalThink(): void {
        const spawn = this.centerSpawn.__add(this.centerVector.__mul(RandomInt(-this.radius, this.radius)));

        this.projectileInfo.vSpawnOrigin = spawn;
        ProjectileManager.CreateLinearProjectile(this.projectileInfo);
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.NO_UNIT_COLLISION]: true
        };
    }
}