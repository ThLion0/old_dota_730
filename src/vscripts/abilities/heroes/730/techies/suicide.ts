import { BaseAbility, BaseModifierMotionBoth, registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

@registerAbility()
export class techies_suicide_custom_730 extends BaseAbility {
    private readonly blastOffParticleName: string = "particles/units/heroes/hero_techies/730/techies_blast_off.vpcf";

    private readonly castSound: string = "Hero_Techies.BlastOff.Cast";
    private readonly blastOffSound: string = "Hero_Techies.Suicide";

    private readonly shardStunDuration: number = 1.75;
    private readonly healthCostMultiplier: number = 0.5;
    
    GetCastRange(location: Vector, target: CDOTA_BaseNPC | undefined): number {
        const bonus = this.GetCaster().HasShard() ? 300 : 0;

        return super.GetCastRange(location, target) + bonus;
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("radius");
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();
        const point = this.GetCursorPosition();

        modifier_techies_suicide_custom_730.apply(
            caster,
            caster,
            this,
            {
                x: point.x,
                y: point.y,
                z: point.z
            }
        );

        caster.EmitSound(this.castSound);
    }

    public BlastOff(): void {
        const caster = this.GetCaster();

        const location = caster.GetAbsOrigin();

        const radius = this.GetSpecialValueFor("radius");
        const damage = this.GetSpecialValueFor("damage");
        const duration = this.GetSpecialValueFor("silence_duration");

        const damageTable: ApplyDamageOptions = {
            attacker: caster,
            damage: damage,
            damage_type: DamageTypes.MAGICAL,
            victim: undefined!,
            ability: this
        };

        FindUnitsInRadius(
            caster.GetTeamNumber(),
            location,
            undefined,
            radius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO | UnitTargetType.BASIC,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        ).forEach(enemy => {
            if (caster.HasShard()) {
                enemy.AddNewModifier(
                    caster,
                    this,
                    BuiltInModifier.STUN,
                    {
                        duration: enemy.CalculateDuration(caster, this.shardStunDuration)
                    }
                );
            }

            enemy.AddNewModifier(
                caster,
                this,
                BuiltInModifier.SILENCE,
                {
                    duration: enemy.CalculateDuration(caster, duration)
                }
            );
            
            damageTable.victim = enemy;
            ApplyDamage(damageTable);
        });

        const particle = ParticleManager.CreateParticle(
            this.blastOffParticleName,
            ParticleAttachment.CUSTOMORIGIN,
            undefined
        );
        ParticleManager.SetParticleControl(particle, 0, caster.GetOrigin());
        ParticleManager.SetParticleControl(particle, 1, Vector(radius, 0, 1));
        ParticleManager.SetParticleControl(particle, 2, Vector(radius, 0, 1));
        ParticleManager.ReleaseParticleIndex(particle);

        caster.EmitSound(this.blastOffSound);

        GridNav.DestroyTreesAroundPoint(caster.GetOrigin(), radius, false);

        if (caster.IsAlive()) {
            const damage = caster.GetMaxHealth() * this.healthCostMultiplier;
            const selfDamageTable: ApplyDamageOptions = {
                attacker: caster,
                damage: damage,
                damage_type: DamageTypes.MAGICAL,
                victim: caster,
                ability: this,
                damage_flags: DamageFlag.HPLOSS
                            | DamageFlag.REFLECTION
                            | DamageFlag.NO_DAMAGE_MULTIPLIERS
                            | DamageFlag.NO_SPELL_AMPLIFICATION
            };
            
            ApplyDamage(selfDamageTable);
        }
    }
}



interface modifier_techies_suicide_custom_730 extends BaseModifierMotionBoth {
    /** @override changed type */
    GetAbility(): techies_suicide_custom_730 | undefined;
}

@registerModifier()
class modifier_techies_suicide_custom_730 extends BaseModifierMotionBoth {
    private readonly trailParticleName: string = "particles/units/heroes/hero_techies/730/techies_blast_off_trail.vpcf";
    
    private readonly duration: number = 0.75;

    private readonly accelerationZ: number = 4000;

    private motionInterrupted: boolean = false;

    private horizontalTime: number = 0.0;
    private verticalTime: number = 0.0;

    private initialVelocity: number = 0;
    private totalTime: number = 0;

    private startPosition!: Vector;
    private lastKnownPosition!: Vector;
    private horizontalVelocity!: Vector;

    IsHidden(): boolean {
        return true;
    }

    IsPurgable(): boolean {
        return false;
    }

    RemoveOnDeath(): boolean {
        return false;
    }

    OnCreated(params: { x: number; y: number; z: number;}): void {
        const parent = this.GetParent();

        this.motionInterrupted = false;
        this.horizontalTime = 0.0;
        this.verticalTime = 0.0;

        if (!IsServer()) return;

        if (!this.ApplyHorizontalMotionController() || !this.ApplyVerticalMotionController()) {
            this.Destroy();
            return;
        }

        this.startPosition = GetGroundPosition(parent.GetAbsOrigin(), parent);
        this.lastKnownPosition = Vector(params.x, params.y, params.z);

        const desiredHeight = 500 * (this.duration ** 2);

        const lowZ = Math.min(this.lastKnownPosition.z, this.startPosition.z);
        const highZ = Math.max(this.lastKnownPosition.z, this.startPosition.z);

        const arcTop = Math.max(lowZ + desiredHeight, highZ + 100);
        const arcDelta = arcTop - this.startPosition.z;

        this.initialVelocity = Math.sqrt(2 * arcDelta * this.accelerationZ);

        const deltaZ = this.lastKnownPosition.z - this.startPosition.z;
        const sqrtDelta = Math.sqrt(
            Math.max(0, this.initialVelocity ** 2) - 2 * this.accelerationZ * deltaZ
        );

        this.totalTime = Math.max(
            (this.initialVelocity + sqrtDelta) / this.accelerationZ,
            (this.initialVelocity - sqrtDelta) / this.accelerationZ
        );

        this.horizontalVelocity = this.lastKnownPosition.__sub(this.startPosition).__mul(1 / this.totalTime);
        this.horizontalVelocity.z = 0;
        
        const particle = ParticleManager.CreateParticle(
            this.trailParticleName,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            parent
        );
        ParticleManager.SetParticleControlEnt(
            particle,
            1,
            parent,
            ParticleAttachment.POINT_FOLLOW,
            AttachLocation.HITLOC,
            parent.GetOrigin(),
            true
        );
        this.AddParticle(particle, false, false, -1, false, false);
    }

    OnDestroy(): void {
        const parent = this.GetParent();
        
        if (!IsServer()) return;

        parent.RemoveHorizontalMotionController(this);
        parent.RemoveVerticalMotionController(this);
    }

    UpdateHorizontalMotion(me: CDOTA_BaseNPC, dt: number): void {
        this.horizontalTime = Math.min(this.horizontalTime + dt, this.totalTime);

        const time = this.horizontalTime / this.totalTime;

        const oldPosition = me.GetAbsOrigin();

        const desired = this.startPosition.__add(
            this.lastKnownPosition.__sub(this.startPosition).__mul(time)
        ).__sub(oldPosition);
        desired.z = 0;

        let velocityDiff = desired.__mul(1 / dt).__sub(this.horizontalVelocity);
        const velocityLength = velocityDiff.Length2D();
        velocityDiff = velocityDiff.Normalized();

        // this.horizontal_velocity = this.horizontal_velocity.__add(vel_dif.__mul(Math.min(vel_dif_length, 3000)).__mul(dt));
        this.horizontalVelocity = this.horizontalVelocity.__add(
            velocityDiff.__mul(Math.min(velocityLength, 3000)).__mul(dt)
        );
        
        me.SetOrigin(oldPosition.__add(this.horizontalVelocity.__mul(dt)));
    }

    UpdateVerticalMotion(me: CDOTA_BaseNPC, dt: number): void {
        this.verticalTime += dt;

        const newPosition = me.GetAbsOrigin();
        newPosition.z = this.startPosition.z +
            (-0.5 * this.accelerationZ * this.verticalTime ** 2 +
                this.initialVelocity * this.verticalTime);

        const groundHeight = GetGroundHeight(newPosition, me);

        let landed = false;
        if (
            newPosition.z < groundHeight &&
            (-this.accelerationZ * this.verticalTime + this.initialVelocity) < 0
        ) {
            newPosition.z = groundHeight;
            landed = true;
        }

        me.SetOrigin(newPosition);

        if (landed) {
            if (!this.motionInterrupted) {
                this.GetAbility()?.BlastOff();
            }
            
            me.RemoveHorizontalMotionController(this);
            me.RemoveVerticalMotionController(this);

            this.SetDuration(0.15, true);
        }
    }

    OnHorizontalMotionInterrupted(): void {
        this.motionInterrupted = true;
    }

    OnVerticalMotionInterrupted(): void {
        this.Destroy();
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.OVERRIDE_ANIMATION,
            ModifierFunction.TRANSLATE_ACTIVITY_MODIFIERS
        ];
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.STUNNED]: true
        };
    }

    GetOverrideAnimation(): GameActivity {
        return GameActivity.DOTA_OVERRIDE_ABILITY_2;
    }

    GetActivityTranslationModifiers(): string {
        return "suicide_squad";
    }
}