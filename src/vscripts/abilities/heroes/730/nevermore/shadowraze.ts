import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

class Shadowraze extends BaseAbility {
    private readonly shadowrazeParticle: string = "particles/units/heroes/hero_nevermore/nevermore_shadowraze.vpcf";
    private readonly shadowrazeSound: string = "Hero_Nevermore.Shadowraze";
    
    GetAOERadius(): number {
        return this.GetSpecialValueFor("shadowraze_range");
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();

        const range = this.GetSpecialValueFor("shadowraze_range");
        const radius = this.GetSpecialValueFor("shadowraze_radius");
        const baseDamage = this.GetSpecialValueFor("shadowraze_damage");
        const bonusDamage = this.GetSpecialValueFor("stack_bonus_damage");
        const duration = this.GetSpecialValueFor("duration");

        const vector = caster.GetForwardVector();
        const position = caster.GetAbsOrigin().__add(vector.__mul(range));

        const damageTable: ApplyDamageOptions = {
            attacker: caster,
            damage: 0,
            damage_type: DamageTypes.MAGICAL,
            victim: undefined!,
            ability: this
        };

        FindUnitsInRadius(
            caster.GetTeamNumber(),
            position,
            undefined,
            radius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO | UnitTargetType.BASIC,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        ).forEach(target => {
            const modifier = target.FindModifierByName(modifier_nevermore_shadowraze_custom_730.name);
            const stacks = modifier !== undefined
                ? modifier.GetStackCount()
                : 0;

            damageTable.damage = baseDamage + bonusDamage * stacks;
            damageTable.victim = target;
            ApplyDamage(damageTable);

            if (modifier === undefined) {
                modifier_nevermore_shadowraze_custom_730.apply(
                    target,
                    caster,
                    this,
                    {
                        duration: target.CalculateDuration(caster, duration)
                    }
                );
            } else {
                modifier.IncrementStackCount();
                modifier.ForceRefresh();
            }
        });

        this.PlayEffects(position, radius);
    }

    private PlayEffects(position: Vector, radius: number): void {
        const caster = this.GetCaster();

        const ground = GetGroundPosition(position, undefined);

        const particle = ParticleManager.CreateParticle(
            this.shadowrazeParticle,
            ParticleAttachment.WORLDORIGIN,
            undefined
        );
        ParticleManager.SetParticleControl(particle, 0, ground);
        ParticleManager.SetParticleControl(particle, 1, Vector(radius, 1, 1));
        ParticleManager.ReleaseParticleIndex(particle);

        EmitSoundOnLocationWithCaster(ground, this.shadowrazeSound, caster);
    }
}

@registerAbility()
export class nevermore_shadowraze1_custom_730 extends Shadowraze {}
@registerAbility()
export class nevermore_shadowraze2_custom_730 extends Shadowraze {}
@registerAbility()
export class nevermore_shadowraze3_custom_730 extends Shadowraze {}



@registerModifier()
class modifier_nevermore_shadowraze_custom_730 extends BaseModifier {
    private readonly effectName: string = "particles/units/heroes/hero_nevermore/nevermore_shadowraze_debuff.vpcf";
    
    private stackDamage: number = 0;
    
    IsHidden(): boolean {
        return false;
    }

    IsDebuff(): boolean {
        return true;
    }

    IsStunDebuff(): boolean {
        return false;
    }

    IsPurgable(): boolean {
        return true;
    }

    OnCreated(params: object): void {
        this.SetStackCount(1);
        
        this.stackDamage = this.GetSpecialValueFor("stack_bonus_damage");
    }

    OnRefresh(params: object): void {
        this.stackDamage = this.GetSpecialValueFor("stack_bonus_damage");
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.TOOLTIP
        ];
    }

    OnTooltip(): number {
        return this.stackDamage * this.GetStackCount();
    }

    GetEffectName(): string {
        return this.effectName;
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN_FOLLOW;
    }
}