import { CustomAbility, CustomModifier } from "./custom_ability";

/* Orb effect classes */

export interface CustomOrbAbility {
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
export class CustomOrbAbility extends CustomAbility {
    /**
     * @custom
     * @both
     */
    CanLaunchOrb(attacker: CDOTA_BaseNPC): boolean {
        return !attacker.IsSilenced();
    }
}

export interface CustomOrbModifier extends CustomModifier {
    /** @override changed type */
    GetAbility(): CustomOrbAbility | undefined;
}
export class CustomOrbModifier extends CustomModifier {
    private readonly customOrbModifier$movementOrders: UnitOrder[] = [
        UnitOrder.MOVE_TO_POSITION,
        UnitOrder.MOVE_TO_TARGET,
        UnitOrder.ATTACK_MOVE,
        UnitOrder.ATTACK_TARGET,
        UnitOrder.STOP,
        UnitOrder.HOLD_POSITION
    ];

    private readonly customOrbModifier$attackRecords = new Set<number>();

    private customOrbModifier$cast: boolean = false;
    
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
            this.customOrbModifier$attackRecords.add(event.record);
            
            ability.UseResources(true, true, false, true);

            ability.OnOrbFire?.(event);
        }
        
        this.customOrbModifier$cast = false;
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
        this.customOrbModifier$attackRecords.delete(event.record);
    }

    /** @override */
    OnOrder(event: ModifierUnitEvent & { ability?: CDOTABaseAbility; }): void {
        if (event.unit !== this.GetParent()) return;

        const ability = event.ability;

        if (this.customOrbModifier$cast) {
            if (ability || this.customOrbModifier$movementOrders.includes(event.order_type)) {
                this.customOrbModifier$cast = false;
            }
        }

        if (ability && ability === this.GetAbility() && event.order_type !== UnitOrder.CAST_TOGGLE_AUTO) {
            this.customOrbModifier$cast = true;
        }
    }

    /** @override */
    GetModifierProjectileName(): string {
        const ability = this.GetAbility();
        const target = this.GetParent().GetAggroTarget();

        if (ability !== undefined && (this.customOrbModifier$cast || this.ShouldLaunch(target))) {
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
     */
    protected IsRecordedAttack(event: object & { record: number; }): boolean {
        return this.customOrbModifier$attackRecords.has(event.record);
    }

    /**
     * @custom
     */
    protected ShouldLaunch(target: CDOTA_BaseNPC | undefined): boolean {
        if (target === undefined) return false;

        const ability = this.GetAbility();
        const caster = this.GetCaster();
        if (ability === undefined || caster === undefined) return false;
        if (!ability.IsFullyCastable()) return false;

        if (ability.GetAutoCastState()) {
            if (ability.CastFilterResultTarget !== CDOTA_Ability_Lua.CastFilterResultTarget) {
                if (ability.CastFilterResultTarget(target) === UnitFilterResult.SUCCESS) {
                    this.customOrbModifier$cast = true;
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
                    this.customOrbModifier$cast = true;
                }
            }
        }

        return this.customOrbModifier$cast && ability.CanLaunchOrb(this.GetParent());
    }
}
