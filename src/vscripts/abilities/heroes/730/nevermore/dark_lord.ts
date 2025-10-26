import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

@registerAbility()
export class nevermore_dark_lord_custom_730 extends BaseAbility {
    private readonly radius: number = this.GetSpecialValueFor("presence_radius");
    
    GetAOERadius(): number {
        return this.radius;
    }
    
    GetIntrinsicModifierName(): string {
        return modifier_nevermore_dark_lord_custom_730_aura.name;
    }
}



@registerModifier()
class modifier_nevermore_dark_lord_custom_730_aura extends BaseModifier {
    private readonly radius: number = this.GetSpecialValueFor("presence_radius");
    
    IsHidden(): boolean {
        return true;
    }

    IsPurgable(): boolean {
        return false;
    }

    IsAura(): boolean {
        return !this.GetParent().PassivesDisabled();
    }
    
    GetAuraRadius(): number {
        return this.radius;
    }

    GetModifierAura(): string {
        return modifier_nevermore_dark_lord_custom_730.name;
    }

    GetAuraSearchType(): UnitTargetType {
        if (this.GetParent().HasTalent("special_bonus_unique_nevermore_730_custom"))
            return UnitTargetType.HERO | UnitTargetType.BASIC | UnitTargetType.BUILDING;
        
        return UnitTargetType.HERO | UnitTargetType.BASIC;
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return UnitTargetTeam.ENEMY;
    }

    GetAuraSearchFlags(): UnitTargetFlags {
        return UnitTargetFlags.MAGIC_IMMUNE_ENEMIES;
    }

    GetAuraEntityReject(entity: CDOTA_BaseNPC): boolean {
        return !entity.CanEntityBeSeenByMyTeam(this.GetParent());
    }
}

@registerModifier()
class modifier_nevermore_dark_lord_custom_730 extends BaseModifier {
    IsHidden(): boolean {
        return false;
    }

    IsPurgable(): boolean {
        return false;
    }

    IsDebuff(): boolean {
        return true;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.PHYSICAL_ARMOR_BONUS
        ];
    }

    GetModifierPhysicalArmorBonus(event: ModifierAttackEvent): number {
        return this.GetSpecialValueFor("presence_armor_reduction");
    }
}