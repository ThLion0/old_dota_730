import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

@registerAbility()
export class nevermore_requiem_custom_730 extends BaseAbility {
    private readonly castParticle: string = "particles/units/heroes/hero_nevermore/nevermore_wings.vpcf";
    private readonly groundParticle: string = "particles/units/heroes/hero_nevermore/nevermore_requiemofsouls.vpcf";
    private readonly soulsParticle: string = "particles/units/heroes/hero_nevermore/nevermore_requiemofsouls_a.vpcf";
    private readonly lineParticle: string = "particles/units/heroes/hero_nevermore/nevermore_requiemofsouls_line.vpcf";
    
    private readonly castSound: string = "Hero_Nevermore.RequiemOfSoulsCast";
    private readonly sound: string = "Hero_Nevermore.RequiemOfSouls";
    private readonly damageSound: string = "Hero_Nevermore.RequiemOfSouls.Damage";

    private readonly necromasteryModifierName: string = "modifier_nevermore_necromastery_custom_730";
    // private readonly requiemFearModifierName: string = "modifier_nevermore_requiem_fear";

    private readonly soulsTouched: Record<string, number> = {};

    private wingsParticle?: ParticleID;
    
    OnAbilityPhaseStart(): boolean {
        const caster = this.GetCaster();

        this.wingsParticle = ParticleManager.CreateParticle(
            this.castParticle,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            caster
        );

        EmitSoundOnLocationForAllies(caster.GetAbsOrigin(), this.castSound, caster);

        modifier_nevermore_requiem_custom_730.apply(
            caster,
            caster,
            this,
            {}
        );
        
        return true;
    }

    OnAbilityPhaseInterrupted(): void {
        const caster = this.GetCaster();

        if (this.wingsParticle) {
            ParticleManager.DestroyParticle(this.wingsParticle, true);
            ParticleManager.ReleaseParticleIndex(this.wingsParticle);
        }

        caster.StopSound(this.castSound);

        caster.RemoveModifierByName(modifier_nevermore_requiem_custom_730.name);
    }

    OnSpellStart(): void {
        this.CastRequiem(false);
    }

    public CastRequiem(deathCast: boolean): void {
        const caster = this.GetCaster();

        const origin = caster.GetAbsOrigin();

        if (this.wingsParticle) {
            ParticleManager.ReleaseParticleIndex(this.wingsParticle);
        }

        caster.EmitSound(this.sound);

        caster.RemoveModifierByName(modifier_nevermore_requiem_custom_730.name);
        
        const soulCount = caster.GetModifierStackCount(this.necromasteryModifierName, caster);
        if (soulCount === 0) return;

        const particle_souls = ParticleManager.CreateParticle(
            this.soulsParticle,
            ParticleAttachment.WORLDORIGIN,
            undefined
        );
        ParticleManager.SetParticleControl(particle_souls, 0, origin);
        ParticleManager.SetParticleControl(particle_souls, 1, Vector(soulCount, 0, 0));
        ParticleManager.SetParticleControl(particle_souls, 2, origin);
        ParticleManager.ReleaseParticleIndex(particle_souls);

        const particle_ground = ParticleManager.CreateParticle(
            this.groundParticle,
            ParticleAttachment.WORLDORIGIN,
            undefined
        );
        ParticleManager.SetParticleControl(particle_ground, 0, origin);
        ParticleManager.SetParticleControl(particle_ground, 1, Vector(soulCount, 0, 0));
        ParticleManager.ReleaseParticleIndex(particle_ground);

        // const maxDistanceTime = travelDistance / lineSpeed;
        // 1000 / 700 = ~1.4286...
        const maxDistanceTime = 1.43;

        this.Explode(soulCount, deathCast);

        if (caster.HasScepter() && !deathCast) {
            Timers.CreateTimer(maxDistanceTime, () => {
                const key = DoUniqueString(this.constructor.name);
                this.soulsTouched[key] = 0;

                this.Explode(soulCount, false, true, origin, key);

                Timers.CreateTimer(maxDistanceTime, () => {
                    if (caster && caster.IsAlive()) {
                        const damage = this.GetSpecialValueFor("requiem_damage");
                        const healAmount = this.soulsTouched[key] * damage; // * this.requiemHealPercentage / 100;
                        caster.Heal(healAmount, this);
                    }

                    delete this.soulsTouched[key];
                });
            });
        }
    }

    OnProjectileHit_ExtraData(target: CDOTA_BaseNPC | undefined, location: Vector, extraData: { isDeathCast: 0 | 1; isScepter: 0 | 1; soulKey: string; }): boolean | void {
        if (!target) return;

        const caster = this.GetCaster();

        const isScepter = extraData.isScepter === 1;
        
        if (isScepter) {
            this.soulsTouched[extraData.soulKey]++;
        }

        if (!target.IsMagicImmune()) {
            let damage = this.GetSpecialValueFor("requiem_damage");
            const slowDuration = this.GetSpecialValueFor("requiem_slow_duration");
            const maxSlowDuration = this.GetSpecialValueFor("requiem_slow_duration_max");

            if (isScepter) {
                const scepterDamagePercentage = this.GetSpecialValueFor("requiem_damage_pct_scepter");
                damage *= scepterDamagePercentage / 100;
            }

            const fearModifier = target.FindModifierByName(modifier_nevermore_requiem_custom_730_debuff.name);

            if (fearModifier) {
                const duration = Math.min(fearModifier.GetRemainingTime() + slowDuration, maxSlowDuration);
                fearModifier.SetDuration(target.CalculateDuration(caster, duration), true);
            } else {
                modifier_nevermore_requiem_custom_730_debuff.apply(
                    target,
                    caster,
                    this,
                    {
                        duration: target.CalculateDuration(caster, slowDuration),
                        death_cast: extraData.isDeathCast
                    }
                );
            }
    
            const damageTable: ApplyDamageOptions = {
                attacker: caster,
                damage: damage,
                damage_type: DamageTypes.MAGICAL,
                victim: target,
                ability: this
            };
            ApplyDamage(damageTable);
        }

        target.EmitSound(this.damageSound);
    }

    private Explode(count: number, deathCast: boolean, isScepter: boolean = false, castOrigin?: Vector, soulKey?: string): void {
        const caster = this.GetCaster();
        const origin = caster.GetAbsOrigin();

        const rotationRate = 360 / count;
        const qangle = QAngle(0, rotationRate, 0);

        const radius = this.GetSpecialValueFor("requiem_radius");

        // Визуально души летят к герою, но на деле же
        // проджектайлы зависят от места первоначального каста

        let linePosition = origin.__add(caster.GetForwardVector().__mul(radius));

        if (count >= 1) {
            const startPosition = origin.__add(linePosition.__sub(origin).Normalized().__mul(105));
            this.CreateSoulLine(startPosition, linePosition, deathCast, isScepter, soulKey);
        }

        for (let i = 0; i < count - 1; i++) {
            linePosition = RotatePosition(origin, qangle, linePosition);
            const startPosition = origin.__add(linePosition.__sub(origin).Normalized().__mul(105));
            this.CreateSoulLine(startPosition, linePosition, deathCast, isScepter, soulKey);
        }
    }

    private CreateSoulLine(startPosition: Vector, endPosition: Vector, deathCast: boolean, isScepter: boolean, soulKey?: string): void {
        const travelDistance = this.GetSpecialValueFor("requiem_radius");
        const lineSpeed = this.GetSpecialValueFor("requiem_line_speed");
        const lineStartWidth = this.GetSpecialValueFor("requiem_line_width_start");
        const lineEndWidth = this.GetSpecialValueFor("requiem_line_width_end");
        
        // const maxDistanceTime = travelDistance / lineSpeed;
        // 1000 / 700 = ~1.4286...
        const maxDistanceTime = 1.43;

        const start = isScepter ? endPosition : startPosition;
        const end = isScepter ? startPosition : endPosition;

        const velocity = end.__sub(start).Normalized().__mul(lineSpeed);
        velocity.z = 0;

        const info: CreateLinearProjectileOptions = {
            Ability: this,
            Source: this.GetCaster(),

            fStartRadius: isScepter ? lineEndWidth : lineStartWidth,
            fEndRadius: isScepter ? lineStartWidth: lineEndWidth,

            iUnitTargetTeam: UnitTargetTeam.ENEMY,
            iUnitTargetType: UnitTargetType.HERO | UnitTargetType.BASIC,
            iUnitTargetFlags: UnitTargetFlags.NONE,

            vSpawnOrigin: start,
            fDistance: travelDistance,
            vVelocity: velocity,

            bHasFrontalCone: false,
            bProvidesVision: false,

            ExtraData: {
                isDeathCast: deathCast,
                isScepter: isScepter,
                soulKey: soulKey
            }
        };
        ProjectileManager.CreateLinearProjectile(info);

        const particle = ParticleManager.CreateParticle(
            this.lineParticle,
            ParticleAttachment.WORLDORIGIN,
            undefined
        );
        ParticleManager.SetParticleControl(particle, 0, start);
        ParticleManager.SetParticleControl(particle, 1, velocity);
        ParticleManager.SetParticleControl(particle, 2, Vector(0, maxDistanceTime, 0));
        ParticleManager.ReleaseParticleIndex(particle);
    }
}



@registerModifier()
class modifier_nevermore_requiem_custom_730 extends BaseModifier {
    IsHidden(): boolean {
        return true;
    }

    IsPurgable(): boolean {
        return false;
    }
    
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.NO_UNIT_COLLISION]: true
        };
    }
}

@registerModifier()
class modifier_nevermore_requiem_custom_730_debuff extends BaseModifier {
    private readonly fearEffectName: string = "particles/units/heroes/hero_lone_druid/lone_druid_savage_roar_debuff.vpcf";
    private readonly fearStatusEffectName: string = "particles/status_fx/status_effect_lone_druid_savage_roar.vpcf";
    
    private slow: number = 0;

    private startOrigin?: Vector;
    private isDeathCast: boolean = false;

    IsHidden(): boolean {
        return false;
    }

    IsPurgable(): boolean {
        return true;
    }

    OnCreated(params: { death_cast: 0 | 1; }): void {
        const parent = this.GetParent();
        const caster = this.GetCaster();
        
        this.slow = this.GetSpecialValueFor("requiem_reduction_ms");

        if (!IsServer()) return;

        this.isDeathCast = params.death_cast === 1;

        if (!this.isDeathCast && !parent.IsCreep()) {
            this.startOrigin = caster?.GetAbsOrigin();
            if (!this.startOrigin) return;

            parent.InterruptMotionControllers(true);

            this.OnIntervalThink();
            this.StartIntervalThink(0.1);
        }
    }

    OnDestroy(): void {
        const parent = this.GetParent()
        if (IsServer() && !this.isDeathCast) {
            parent.Stop();
        }
    }

    OnIntervalThink(): void {
        const parent = this.GetParent();

        if (parent.IsMagicImmune() || parent.IsStunned()) return;

        const origin = parent.GetAbsOrigin();

        const fleeDirection = origin.__sub(this.startOrigin!).Normalized();
        const targetPoint = origin.__add(fleeDirection.__mul(400));

        parent.MoveToPosition(targetPoint);
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.MOVESPEED_BONUS_PERCENTAGE
        ];
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        if (!this.isDeathCast) {
            return {
                [ModifierState.FEARED]: true,
                [ModifierState.SILENCED]: true,
                [ModifierState.DISARMED]: true,
                [ModifierState.COMMAND_RESTRICTED]: true
            };
        }
        
        return {};
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.slow;
    }

    GetEffectName(): string {
        return this.fearEffectName;
    }

    GetStatusEffectName(): string {
        return this.fearStatusEffectName;
    }

    StatusEffectPriority(): ModifierPriority | number {
        return 10;
    }
}