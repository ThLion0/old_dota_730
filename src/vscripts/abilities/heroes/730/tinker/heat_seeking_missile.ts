import { BaseAbility, registerAbility } from "../../../../lib/dota_ts_adapter";

@registerAbility()
export class tinker_heat_seeking_missile_custom_730 extends BaseAbility {
    private readonly projectileName: string = "particles/units/heroes/hero_tinker/tinker_missile.vpcf";
    private readonly hitParticle: string = "particles/units/heroes/hero_tinker/tinker_missle_explosion.vpcf";
    private readonly dudParticle: string = "particles/units/heroes/hero_tinker/tinker_missile_dud.vpcf";

    private readonly castSound: string = "Hero_Tinker.Heat-Seeking_Missile";
    private readonly hitSound: string = "Hero_Tinker.Heat-Seeking_Missile.Impact";
    private readonly dudSound: string = "Hero_Tinker.Heat-Seeking_Missile_Dud";

    GetAOERadius(): number {
        return this.GetSpecialValueFor("radius");
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();

        const radius = this.GetSpecialValueFor("radius");
        const targetCount = this.GetSpecialValueFor("targets");
        const projectileSpeed = this.GetSpecialValueFor("speed");

        const attachment = caster.ScriptLookupAttachment(AttachLocation.ATTACK3) !== 0
            ? ProjectileAttachment.ATTACK_3
            : ProjectileAttachment.ATTACK_1;

        const projectileInfo: CreateTrackingProjectileOptions = {
            Source: caster,
            vSourceLoc: caster.GetAbsOrigin(),
            Ability: this,
            EffectName: this.projectileName,
            iMoveSpeed: projectileSpeed,
            bDodgeable: true,
            iSourceAttachment: attachment
        };

        const enemies = FindUnitsInRadius(
            caster.GetTeamNumber(),
            caster.GetAbsOrigin(),
            undefined,
            radius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO,
            UnitTargetFlags.FOW_VISIBLE | UnitTargetFlags.NO_INVIS,
            FindOrder.CLOSEST,
            false
        ).slice(0, targetCount);

        enemies.forEach(enemy => {
            projectileInfo.Target = enemy;
            ProjectileManager.CreateTrackingProjectile(projectileInfo);
        });

        if (enemies.length === 0) {
            this.PlayDudEffect();
        } else {
            caster.EmitSound(this.castSound);
        }
    }

    OnProjectileHit(target: CDOTA_BaseNPC | undefined, location: Vector): boolean | void {
        if (target === undefined) return;
        
        const caster = this.GetCaster();

        if (!target.IsMagicImmune()) {
            const damageTable: ApplyDamageOptions = {
                attacker: caster,
                damage: this.GetSpecialValueFor("damage"),
                damage_type: DamageTypes.MAGICAL,
                victim: target,
                ability: this
            };
            ApplyDamage(damageTable);
            
            const bashDuration = this.GetSpecialValueFor("bash_duration");
            if (bashDuration > 0) {
                target.AddNewModifier(
                    caster,
                    this,
                    BuiltInModifier.BASH,
                    {
                        duration: target.CalculateDuration(caster, bashDuration)
                    }
                );
            }
        }

        this.PlayEffects(target);
    }

    private PlayEffects(target: CDOTA_BaseNPC): void {
        const particle = ParticleManager.CreateParticle(
            this.hitParticle,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            target
        );
        ParticleManager.ReleaseParticleIndex(particle);

        target.EmitSound(this.hitSound);
    }

    private PlayDudEffect(): void {
        const caster = this.GetCaster();
        
        const attachment = caster.ScriptLookupAttachment(AttachLocation.ATTACK3) !== 0
            ? AttachLocation.ATTACK3
            : AttachLocation.ATTACK1;

        const point = caster.GetAttachmentOrigin(caster.ScriptLookupAttachment(attachment));

        const particle = ParticleManager.CreateParticle(
            this.dudParticle,
            ParticleAttachment.WORLDORIGIN,
            caster
        );
        ParticleManager.SetParticleControl(particle, 0, point);
        ParticleManager.SetParticleControlForward(particle, 0, caster.GetForwardVector());
        ParticleManager.ReleaseParticleIndex(particle);

        caster.EmitSound(this.dudSound);
    }
}