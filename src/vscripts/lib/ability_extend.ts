import { BaseAbility, BaseModifier } from "./dota_ts_adapter";

export class CustomAbility extends BaseAbility {
    /**
     * True/false if this ability can be casted while rooted.
     *
     * @custom
     * @both
     */
    IsCastableInRoots(): boolean {
        return true;
    }
}

export class CustomModifier extends BaseModifier {

}

/* Orb effect classes */

export interface BaseOrbAbility extends CustomAbility {
    /**
     * @custom
     * @abstract
     */
    OnOrbFire?(event: ModifierAttackEvent): void;
    /**
     * @custom
     * @abstract
     */
    OnOrbImpact?(event: ModifierAttackEvent): void;
    /**
     * @custom
     * @abstract
     */
    OnOrbFail?(event: ModifierAttackEvent): void;
    /**
     * @custom
     * @abstract
     */
    GetOrbProjectileName?(): string;
}
export class BaseOrbAbility {
    /**
     * @custom
     * @both
     */
    CanLaunchOrb(attacker: CDOTA_BaseNPC): boolean {
        return !attacker.IsSilenced();
    }
}

export interface BaseOrbModifier extends CustomModifier {
    /** @override changed type */
    GetAbility(): BaseOrbAbility | undefined;
}
export class BaseOrbModifier extends CustomModifier {
    private readonly MOVEMENT_ORDERS: UnitOrder[] = [
        UnitOrder.MOVE_TO_POSITION,
        UnitOrder.MOVE_TO_TARGET,
        UnitOrder.ATTACK_MOVE,
        UnitOrder.ATTACK_TARGET,
        UnitOrder.STOP,
        UnitOrder.HOLD_POSITION
    ];

    private readonly attackRecords = new Set<number>();

    private cast: boolean = false;
    
    /** @override */
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.ON_ATTACK,
            ModifierFunction.ON_ATTACK_FAIL,
            ModifierFunction.PROCATTACK_FEEDBACK,
            ModifierFunction.ON_ATTACK_RECORD_DESTROY,

            ModifierFunction.ON_ORDER,
            
            ModifierFunction.PROJECTILE_NAME
        ];
    }

    /** @override */
    OnAttack(event: ModifierAttackEvent): void {
        const ability = this.GetAbility();
        
        if (event.attacker !== this.GetParent()) return;
        if (event.no_attack_cooldown) return;

        if (ability !== undefined && this.ShouldLaunch(event.target)) {
            this.attackRecords.add(event.record);
            
            ability.UseResources(true, true, false, true);

            ability.OnOrbFire?.(event);
        }
        
        this.cast = false;
    }

    /** @override */
    OnAttackFail(event: ModifierAttackEvent): void {
        if (this.IsRecordedAttack(event)) {
            const ability = this.GetAbility();
            ability?.OnOrbFail?.(event);
        }
    }

    /** @override */
    GetModifierProcAttack_Feedback(event: ModifierAttackEvent): number {
        if (this.IsRecordedAttack(event)) {
            const ability = this.GetAbility();
            ability?.OnOrbImpact?.(event);
        }
        
        return 0;
    }

    /** @override */
    OnAttackRecordDestroy(event: ModifierAttackEvent): void {
        this.attackRecords.delete(event.record);
    }

    /** @override */
    OnOrder(event: ModifierUnitEvent & { ability?: CDOTABaseAbility; }): void {
        if (event.unit !== this.GetParent()) return;

        const ability = event.ability;

        if (this.cast) {
            if (ability || this.MOVEMENT_ORDERS.includes(event.order_type)) {
                this.cast = false;
            }
        }

        if (ability && ability === this.GetAbility() && event.order_type !== UnitOrder.CAST_TOGGLE_AUTO) {
            this.cast = true;
        }
    }

    /** @override */
    GetModifierProjectileName(): string {
        const ability = this.GetAbility();
        const target = this.GetParent().GetAggroTarget();

        if (ability !== undefined && (this.cast || this.ShouldLaunch(target))) {
            return ability.GetOrbProjectileName?.() || "";
        }
        
        return "";
    }

    /**
     * Must be called before the `OnAttack`-function and before
     * the `OnAttackRecordDestroy` function, otherwise it returns false.
     * 
     * For functions that do not meet this conditions,
     * use `ShouldLaunch` with the target of the attack.
     * 
     * @custom
     * @both
     */
    protected IsRecordedAttack(event: object & { record: number; }): boolean {
        return this.attackRecords.has(event.record);
    }

    /** @custom */
    protected ShouldLaunch(target: CDOTA_BaseNPC | undefined): boolean {
        if (target === undefined) return false;

        const ability = this.GetAbility();
        const caster = this.GetCaster();
        if (ability === undefined || caster === undefined) return false;

        if (ability.GetAutoCastState()) {
            if (ability.CastFilterResultTarget !== CDOTA_Ability_Lua.CastFilterResultTarget) {
                if (ability.CastFilterResultTarget(target) === UnitFilterResult.SUCCESS) {
                    this.cast = true;
                }
            } else {
                const result = UnitFilter(
                    target,
                    ability.GetAbilityTargetTeam(),
                    ability.GetAbilityTargetType(),
                    ability.GetAbilityTargetFlags(),
                    caster.GetTeamNumber()
                );

                if (result === UnitFilterResult.SUCCESS) {
                    this.cast = true;
                }
            }
        }

        return this.cast && ability.IsFullyCastable() && ability.CanLaunchOrb(this.GetParent());
    }
}
