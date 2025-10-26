import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

@registerAbility()
export class tinker_laser_custom_730 extends BaseAbility {
    private readonly laserParticle: string = "particles/units/heroes/hero_tinker/tinker_laser.vpcf";
    private readonly splashParticle: string = "particles/units/heroes/hero_tinker/tinker_laser_secondary.vpcf";
    
    private readonly laserSound: string = "Hero_Tinker.Laser";
    private readonly impactSound: string = "Hero_Tinker.LaserImpact";

    GetCastRange(location: Vector, target: CDOTA_BaseNPC | undefined): number {
        const bonus = this.GetCaster().HasScepter() ? 300 : 0;

        return super.GetCastRange(location, target) + bonus;
    }
    
    OnSpellStart(): void {
        const caster = this.GetCaster();
        const target = this.GetCursorTarget();

        if (target === undefined || target.TriggerSpellAbsorb(this)) return;

        const casterTeam = caster.GetTeamNumber();

        const heroDuration = this.GetSpecialValueFor("duration_hero");
        const creepDuration = this.GetSpecialValueFor("duration_creep");
        
        const targets = [ target ];
        if (caster.HasScepter()) {
            const bounceRadius = this.GetSpecialValueFor("scepter_bounce_radius");

            const enemies = FindUnitsInRadius(
                casterTeam,
                target.GetAbsOrigin(),
                undefined,
                bounceRadius,
                UnitTargetTeam.ENEMY,
                UnitTargetType.HERO | UnitTargetType.BASIC,
                UnitTargetFlags.FOW_VISIBLE | UnitTargetFlags.NO_INVIS,
                FindOrder.FARTHEST,
                false
            ).filter(enemy => enemy != target).sort((a, b) => {
                if (a.IsCreep() === b.IsCreep()) return 0;

                return a.IsCreep()
                    ? 1
                    : -1;
            });

            if (enemies.length > 0) {
                targets.push(enemies[0]);
            }
        }

        const damage = this.GetSpecialValueFor("laser_damage");
        const splashPercentage = this.GetSpecialValueFor("splash_pct");
        const damageRadius = this.GetSpecialValueFor("radius_explosion");
        
        const damageTable: ApplyDamageOptions = {
            attacker: caster,
            damage: damage,
            damage_type: DamageTypes.PURE,
            victim: undefined!,
            ability: this
        };

        const splashDamage = damage * (splashPercentage / 100);
        const splashDamageTable: ApplyDamageOptions = {
            attacker: caster,
            damage: splashDamage,
            damage_type: DamageTypes.PURE,
            victim: undefined!,
            ability: this
        };

        targets.forEach(target => {
            const duration = target.IsCreep()
                ? creepDuration
                : heroDuration;

            modifier_tinker_laser_custom_730_blind.apply(
                target,
                caster,
                this,
                {
                    duration: target.CalculateDuration(caster, duration)
                }
            );

            damageTable.victim = target;
            ApplyDamage(damageTable);

            FindUnitsInRadius(
                casterTeam,
                target.GetAbsOrigin(),
                undefined,
                damageRadius,
                UnitTargetTeam.ENEMY,
                UnitTargetType.HERO | UnitTargetType.BASIC,
                UnitTargetFlags.FOW_VISIBLE | UnitTargetFlags.NO_INVIS,
                FindOrder.ANY,
                false
            ).forEach(enemy => {
                if (enemy === target) return;

                this.PlaySplashEffect(target, enemy);

                splashDamageTable.victim = enemy;
                ApplyDamage(splashDamageTable);
            });
        });

        this.PlayEffects(targets);
    }

    private PlayEffects(targets: Array<CDOTA_BaseNPC>): void {
        const caster = this.GetCaster();

        const mainTarget = targets[0];

        const attachment = caster.ScriptLookupAttachment(AttachLocation.ATTACK2) !== 0
            ? AttachLocation.ATTACK2
            : AttachLocation.ATTACK1;

        this.PlayFromToTargetEffect(caster, mainTarget, this.laserParticle, attachment);

        caster.EmitSound(this.laserSound);
        mainTarget.EmitSound(this.impactSound);

        if (targets.length > 1) {
            for (let i = 1; i < targets.length; i++) {
                this.PlayFromToTargetEffect(targets[i], targets[i - 1], this.laserParticle);

                targets[i].EmitSound(this.impactSound);
            }
        }
    }

    private PlaySplashEffect(target: CDOTA_BaseNPC, additional: CDOTA_BaseNPC): void {
        this.PlayFromToTargetEffect(target, additional, this.splashParticle);
    }

    private PlayFromToTargetEffect(
        fromTarget: CDOTA_BaseNPC,
        toTarget: CDOTA_BaseNPC,
        particleName: string,
        secondAttachment: string = AttachLocation.HITLOC
    ): void {
        const particle = ParticleManager.CreateParticle(
            particleName,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.GetCaster()
        );
        ParticleManager.SetParticleControlEnt(
            particle,
            1,
            toTarget,
            ParticleAttachment.POINT_FOLLOW,
            AttachLocation.HITLOC,
            Vector(0, 0, 0),
            true
        );
        ParticleManager.SetParticleControlEnt(
            particle,
            9,
            fromTarget,
            ParticleAttachment.POINT_FOLLOW,
            secondAttachment,
            Vector(0, 0, 0),
            true
        );
        ParticleManager.ReleaseParticleIndex(particle);
    }
}



@registerModifier()
class modifier_tinker_laser_custom_730_blind extends BaseModifier {
    private healthReduction: number = 0;
    
    IsHidden(): boolean {
        return false;
    }

    IsDebuff(): boolean {
        return true;
    }

    IsPurgable(): boolean {
        return true;
    }

    GetAttributes(): ModifierAttribute {
        const hasScepter = this.GetCaster()?.HasScepter();
        return hasScepter === true
            ? ModifierAttribute.MULTIPLE
            : ModifierAttribute.NONE;
    }

    OnCreated(params: object): void {
        const parent = this.GetParent();
        const caster = this.GetCaster();

        if (!IsServer()) return;

        if (parent.IsCreep()) {
            this.healthReduction = 0;
        } else if (caster?.HasScepter()) {
            this.healthReduction = this.GetSpecialValueFor("scepter_health_reduction");

            const health = parent.GetHealth();
        
            parent.ModifyHealth(
                health - (health * this.healthReduction / 100),
                this.GetAbility(),
                false,
                DamageFlag.NON_LETHAL
                    | DamageFlag.HPLOSS
                    | DamageFlag.NO_DAMAGE_MULTIPLIERS
                    | DamageFlag.NO_SPELL_AMPLIFICATION
            );
        }
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.MISS_PERCENTAGE,
            ModifierFunction.EXTRA_HEALTH_PERCENTAGE,
            ModifierFunction.MODEL_SCALE
        ];
    }

    GetModifierMiss_Percentage(): number {
        return 100;
    }

    GetModifierExtraHealthPercentage(): number {
        return -this.healthReduction;
    }

    GetModifierModelScale(): number {
        return -this.healthReduction;
    }
}