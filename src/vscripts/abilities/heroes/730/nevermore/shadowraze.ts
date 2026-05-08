import { CustomAbility } from "../../../../lib/abilities/custom_ability";
import { BaseModifier, registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

class NevermoreShadowrazeCustom extends CustomAbility {
    private readonly shadowrazeParticle = this.particle("particles/units/heroes/hero_nevermore/nevermore_shadowraze.vpcf");
    private readonly shadowrazeSound = this.sound("Hero_Nevermore.Shadowraze");
    
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

        const enemies = FindUnitsInRadius(
            caster.GetTeamNumber(),
            position,
            undefined,
            radius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO | UnitTargetType.BASIC,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        );

        enemies.forEach(target => {
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

        const isArcana = this.getWearableInfo().IsArcana();
        if (isArcana) {
            this.processArcanaCounter(enemies);
        }

        this.playEffects(position, radius);
    }

    private processArcanaCounter(enemies: CDOTA_BaseNPC[]): void {
        const caster = this.GetCaster();
        
        const hasEnemies = enemies.length > 0;
        const enoughStacks = enemies
            .filter(enemy => enemy.IsHero())
            .some(enemy => {
                const modifier = enemy.FindModifierByName(modifier_nevermore_shadowraze_custom_730.name);
                if (!modifier) return true;
                
                return modifier.GetStackCount() <= 3;
            });

        if (hasEnemies && enoughStacks) {
            const counterModifier = caster.FindModifierByName(modifier_nevermore_shadowraze_custom_730_counter.name);

            if (counterModifier === undefined) {
                modifier_nevermore_shadowraze_custom_730_counter.apply(
                    caster,
                    caster,
                    this,
                    {
                        duration: 3.0
                    }
                );
            } else {
                counterModifier.IncrementStackCount();
                counterModifier.ForceRefresh();
            }
        } else {
            caster.RemoveModifierByName(modifier_nevermore_shadowraze_custom_730_counter.name);
        }
    }

    private playEffects(position: Vector, radius: number): void {
        const ground = GetGroundPosition(position, undefined);

        const particle = ParticleManager.CreateParticle(
            this.shadowrazeParticle.get(),
            ParticleAttachment.WORLDORIGIN,
            undefined
        );
        ParticleManager.SetParticleControl(particle, 0, ground);
        ParticleManager.SetParticleControl(particle, 1, Vector(radius, 1, 1));
        ParticleManager.ReleaseParticleIndex(particle);

        EmitSoundOnLocationWithCaster(ground, this.shadowrazeSound.get(), this.GetCaster());
    }
}

@registerAbility()
export class nevermore_shadowraze1_custom_730 extends NevermoreShadowrazeCustom {}
@registerAbility()
export class nevermore_shadowraze2_custom_730 extends NevermoreShadowrazeCustom {}
@registerAbility()
export class nevermore_shadowraze3_custom_730 extends NevermoreShadowrazeCustom {}



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

@registerModifier()
class modifier_nevermore_shadowraze_custom_730_counter extends BaseModifier {
    private readonly doubleRaze: string = "particles/econ/items/shadow_fiend/sf_fire_arcana/sf_fire_arcana_shadowraze_double.vpcf";
    private readonly tripleRaze: string = "particles/econ/items/shadow_fiend/sf_fire_arcana/sf_fire_arcana_shadowraze_triple.vpcf";
    
    private particle?: ParticleID;
    
    IsHidden(): boolean {
        return true;
    }

    IsPurgable(): boolean {
        return false;
    }

    OnCreated(params: object): void {
        this.SetStackCount(1);
    }

    OnRefresh(params: object): void {
        if (!IsServer()) return;

        const stackCount = this.GetStackCount();

        if (stackCount === 2) {
            this.showCounter(this.doubleRaze);
        } else if (stackCount >= 3) {
            this.showCounter(this.tripleRaze);
            
            this.Destroy();
        }
    }

    private showCounter(particleName: string): void {
        if (this.particle !== undefined) {
            ParticleManager.DestroyParticle(this.particle, true);
            this.particle = undefined;
        }
        
        const parent = this.GetParent();

        this.particle = ParticleManager.CreateParticle(
            particleName,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            parent
        );
        ParticleManager.SetParticleControl(this.particle, 0, parent.GetOrigin());
        ParticleManager.ReleaseParticleIndex(this.particle);
    }
}