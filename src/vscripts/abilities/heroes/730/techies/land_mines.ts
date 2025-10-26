import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

@registerAbility()
export class techies_land_mines_custom_730 extends BaseAbility {
    private readonly plantSound: string = "Hero_Techies.LandMine.Plant";

    private readonly unitName: string = "npc_dota_techies_land_mine_custom_730";

    CastFilterResultLocation(location: Vector): UnitFilterResult {
        const caster = this.GetCaster();

        if (IsServer()) {
            const units = FindUnitsInRadius(
                caster.GetTeamNumber(),
                location,
                undefined,
                this.GetSpecialValueFor("radius"),
                UnitTargetTeam.FRIENDLY,
                UnitTargetType.OTHER,
                UnitTargetFlags.NONE,
                FindOrder.ANY,
                false
            ).filter(unit => unit.GetOwner() === caster && unit.GetUnitName() === this.unitName);

            if (units.length > 0)
                return UnitFilterResult.FAIL_CUSTOM;
        }
        
        return UnitFilterResult.SUCCESS;
    }

    GetCustomCastErrorLocation(location: Vector): string {
        return "#dota_hud_error_cant_place_near_mine";
    }
    
    GetCastRange(location: Vector, target: CDOTA_BaseNPC | undefined): number {
        const bonus = this.GetCaster().HasScepter() ? 300 : 0;

        return super.GetCastRange(location, target) + bonus;
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("radius");
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();
        const point = this.GetCursorPosition();

        const mine = CreateMineByName(this.unitName, point, caster);
        modifier_techies_land_mines_custom_730.apply(
            mine,
            caster,
            this,
            {}
        );

        if (caster.GetAbsOrigin() !== point) {
            FindClearSpaceForUnit(mine, mine.GetAbsOrigin(), true);
        }

        caster.EmitSound(this.plantSound);
    }
}



@registerModifier()
class modifier_techies_land_mines_custom_730 extends BaseModifier {
    private readonly plantParticleName: string = "particles/units/heroes/hero_techies/730/techies_land_mine.vpcf";
    private readonly detonateParticleName: string = "particles/units/heroes/hero_techies/730/techies_land_mine_explode.vpcf";

    private readonly primingSound: string = "Hero_Techies.LandMine.Priming";
    private readonly detonateSound: string = "Hero_Techies.LandMine.Detonate";
    
    private readonly tickInterval: number = 0.03;

    private readonly radius: number = 400;
    private readonly buildingDamagePct: number = 0.3;
    private readonly proximityThreshold: number = 1.6;
    private readonly activationDelay: number = 1.75;

    private triggered: boolean = false;
    private exploded: boolean = false;
    private triggerTime: number = 0.0;

    IsHidden(): boolean {
        return true;
    }

    IsPurgable(): boolean {
        return false;
    }

    CanParentBeAutoAttacked(): boolean {
        return false;
    }

    OnCreated(params: object): void {
        const parent = this.GetParent();

        if (!IsServer()) return;

        const particle = ParticleManager.CreateParticle(
            this.plantParticleName,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            parent
        );
        ParticleManager.SetParticleControl(particle, 0, parent.GetAbsOrigin());
        ParticleManager.SetParticleControl(particle, 2, Vector(0, 0, this.radius));
        ParticleManager.SetParticleControl(particle, 3, parent.GetAbsOrigin());
        this.AddParticle(particle, false, false, -1, false, false);

        parent.SetMoveCapability(
            this.GetSpecialValueFor("movement_speed") === 0 ? UnitMoveCapability.NONE : UnitMoveCapability.GROUND
        );
        
        this.StartIntervalThink(this.tickInterval);
    }

    OnIntervalThink(): void {
        const parent = this.GetParent();

        if (!parent.IsAlive()) {
            this.Destroy();
            return;
        }
        
        parent.SetMoveCapability(
            this.GetSpecialValueFor("movement_speed") === 0 ? UnitMoveCapability.NONE : UnitMoveCapability.GROUND
        );
        
        if (this.GetElapsedTime() <= this.activationDelay || this.exploded) return;

        const units = FindUnitsInRadius(
            parent.GetTeamNumber(),
            parent.GetAbsOrigin(),
            undefined,
            this.radius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO | UnitTargetType.BASIC | UnitTargetType.BUILDING | UnitTargetType.COURIER,
            UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
            FindOrder.ANY,
            false
        ).filter(unit => !unit.IsOutpost());

        const isAllImmune = units.every(unit => unit.IsMagicImmune());
        const enemyFound = units.some(
            unit => !unit.HasFlyMovementCapability() ||
                     unit.HasModifiersState(ModifierState.FLYING_FOR_PATHING_PURPOSES_ONLY)
        );

        if (!enemyFound) {
            this.triggered = false;
            this.triggerTime = 0.0;

            return;
        }

        if (!this.triggered) {
            this.triggered = true;
            this.triggerTime = 0.0;
            
            EmitSoundOn(this.primingSound, parent);
        } else {
            if (!isAllImmune) {
                this.triggerTime += this.tickInterval;
            }

            if (this.triggerTime >= this.proximityThreshold) {
                this.exploded = true;
                
                this.Detonate(units);
                this.StopIntervalThink();
            }
        }
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.MOVESPEED_ABSOLUTE
        ];
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        const states: Partial<Record<ModifierState, boolean>> = {
            [ModifierState.NO_UNIT_COLLISION]: true,
            [ModifierState.LOW_ATTACK_PRIORITY]: true
        };

        if (!this.triggered && this.GetElapsedTime() > (this.activationDelay + 0.15)) {
            states[ModifierState.INVISIBLE] = true;
            states[ModifierState.TRUESIGHT_IMMUNE] = true;
        }

        return states;
    }

    GetModifierMoveSpeed_Absolute(): number {
        return this.GetSpecialValueFor("movement_speed");
    }

    private Detonate(units: CDOTA_BaseNPC[]): void {
        const parent = this.GetParent();

        const particle = ParticleManager.CreateParticle(
            this.detonateParticleName,
            ParticleAttachment.WORLDORIGIN,
            undefined
        );
        ParticleManager.SetParticleControl(particle, 0, parent.GetAbsOrigin());
        ParticleManager.SetParticleControl(particle, 1, Vector(1, 1, this.radius));
        ParticleManager.SetParticleControl(particle, 2, Vector(1, 1, this.radius));
        ParticleManager.SetParticleShouldCheckFoW(particle, true);
        ParticleManager.SetParticleFoWProperties(particle, 0, 2, this.radius);
        ParticleManager.ReleaseParticleIndex(particle);

        EmitSoundOn(this.detonateSound, parent);

        const damage = this.GetSpecialValueFor("damage");
        const buildingDamage = damage * this.buildingDamagePct;

        const damageTable: ApplyDamageOptions = {
            attacker: parent,
            damage: damage,
            damage_type: DamageTypes.MAGICAL,
            victim: undefined!,
            ability: this.GetAbility()
        };

        units.filter(
            unit =>
                (
                    !unit.HasFlyMovementCapability() ||
                    unit.HasModifiersState(ModifierState.FLYING_FOR_PATHING_PURPOSES_ONLY)
                ) &&
                !unit.IsInvulnerable() &&
                !unit.IsCourier() &&
                !unit.IsMagicImmune()
        ).forEach(unit => {
            damageTable.damage = unit.IsBuilding() ? buildingDamage : damage;
            damageTable.victim = unit;

            ApplyDamage(damageTable);
        });

        AddFOWViewer(parent.GetTeamNumber(), parent.GetAbsOrigin(), 300, 1, false);

        parent.ForceKill(false);
        UTIL_Remove(parent);

        this.Destroy();
    }
}