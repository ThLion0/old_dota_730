import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

@registerAbility()
export class tinker_defense_matrix_custom_730 extends BaseAbility {
    private readonly castParticle: string = "particles/units/heroes/hero_tinker/tinker_defense_matrix_cast.vpcf";
    private readonly castSound: string = "Hero_Tinker.DefensiveMatrix.Cast";
    
    OnSpellStart(): void {
        const caster = this.GetCaster();
        const target = this.GetCursorTarget();
        if (!target) return;

        modifier_tinker_defense_matrix_custom_730.apply(
            target,
            caster,
            this,
            {
                duration: this.GetSpecialValueFor("barrier_duration")
            }
        );

        this.PlayEffects(target);
    }

    private PlayEffects(target: CDOTA_BaseNPC): void {
        const caster = this.GetCaster();

        const targetOrigin = target.GetAbsOrigin();
        
        const particle = ParticleManager.CreateParticle(
            this.castParticle,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            caster
        );
        ParticleManager.SetParticleControlEnt(
            particle,
            0, caster,
            ParticleAttachment.POINT_FOLLOW,
            AttachLocation.ATTACK1,
            caster.GetAbsOrigin(),
            true
        );
        ParticleManager.SetParticleControl(particle, 1, targetOrigin);
        ParticleManager.SetParticleControlEnt(
            particle,
            1,
            target,
            ParticleAttachment.POINT_FOLLOW,
            AttachLocation.HITLOC,
            targetOrigin,
            true
        );
        ParticleManager.ReleaseParticleIndex(particle);

        caster.EmitSound(this.castSound);
    }
}



@registerModifier()
class modifier_tinker_defense_matrix_custom_730 extends BaseModifier {
    private readonly particleName: string = "particles/units/heroes/hero_tinker/tinker_defense_matrix.vpcf";
    private readonly targetSound: string = "Hero_Tinker.DefensiveMatrix.Target";
    
    /** @both */
    private statusResistance: number = 0;
    private currentShield: number = 0;

    IsHidden(): boolean {
        return false;
    }

    IsPurgable(): boolean {
        return true;
    }

    OnCreated(params: object): void {
        const parent = this.GetParent();

        this.statusResistance = this.GetSpecialValueFor("status_resistance");
        
        if (!IsServer()) return;

        this.currentShield = this.GetSpecialValueFor("damage_absorb");

        const particle = ParticleManager.CreateParticle(
            this.particleName,
            ParticleAttachment.POINT_FOLLOW,
            parent
        );
        ParticleManager.SetParticleControlEnt(particle, 1, parent, ParticleAttachment.POINT_FOLLOW, AttachLocation.HITLOC, parent.GetAbsOrigin(), true);
        this.AddParticle(particle, false, false, -1, false, false);

        parent.EmitSound(this.targetSound);
    }

    OnRefresh(params: object): void {
        this.statusResistance = this.GetSpecialValueFor("status_resistance");

        if (IsServer()) {
            this.currentShield = this.GetSpecialValueFor("damage_absorb");
        }
    }

    OnDestroy(): void {
        if (IsServer())
            this.GetParent().StopSound(this.targetSound);
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATUS_RESISTANCE_STACKING,
            ModifierFunction.INCOMING_DAMAGE_CONSTANT
        ];
    }

    GetModifierStatusResistanceStacking(): number {
        return this.statusResistance;
    }

    GetModifierIncomingDamageConstant(event: ModifierAttackEvent): number {
        if (IsClient()) return 0;

        if (this.GetParent() === event.attacker && (event.damage_flags & DamageFlag.HPLOSS) === DamageFlag.HPLOSS)
            return 0;

        if (this.currentShield > event.damage) {
            this.currentShield -= event.damage;

            this.SendBuffRefreshToClients();

            return -event.damage;
        } else {
            const oldShield = this.currentShield;
            this.currentShield = 0;
            this.Destroy();

            return -oldShield;
        }
    }
}