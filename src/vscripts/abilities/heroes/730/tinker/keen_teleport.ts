import { CustomAbility, CustomModifier } from "../../../../lib/ability_extend";
import { registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

interface TeleportTargetResult {
    target?: CDOTA_BaseNPC;
    point?: Vector;
    isValid: boolean;
}

@registerAbility()
export class tinker_keen_teleport_custom_730 extends CustomAbility {
    private readonly teleportStartParticle: string = "particles/items2_fx/teleport_start.vpcf";
    private readonly teleportEndParticle: string = "particles/items2_fx/teleport_end.vpcf";

    private readonly teleportLoopSound: string = "Portal.Loop_Appear";
    private readonly teleportStartSound: string = "Portal.Hero_Appear";
    private readonly teleportEndSound: string = "Portal.Hero_Disappear";

    private teleportFromParticle?: ParticleID;
    private teleportTargetParticle?: ParticleID;

    private loopSoundTimer?: string;
    private endSoundTimer?: string;
    
    public teleportResult: TeleportTargetResult = { isValid: false };

    private currentTpTarget?: CDOTA_BaseNPC;
    private currentTeleportTime: number = 0;

    GetIntrinsicModifierName(): string {
        return modifier_tinker_keen_teleport_custom_730.name;
    }

    IsCastableInRoots(): boolean {
        return false;
    }

    GetBehavior(): AbilityBehavior | Uint64 {
        return AbilityBehavior.UNIT_TARGET
             | AbilityBehavior.POINT
             | AbilityBehavior.CHANNELLED
             | AbilityBehavior.DONT_RESUME_ATTACK
             | AbilityBehavior.DONT_CANCEL_CHANNEL;
    }

    OnAbilityPhaseStart(): boolean {
        this.teleportResult = this.GetTeleportTarget();
        if (!this.teleportResult.isValid) return false;

        this.currentTpTarget = this.CreateTeleportTargetEntity(this.teleportResult);
        return this.currentTpTarget !== undefined;
    }

    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        const caster = this.GetCaster();

        if (target === caster) return UnitFilterResult.SUCCESS;
        else if (target.IsCourier()) return UnitFilterResult.FAIL_COURIER;

        return UnitFilter(
            target,
            UnitTargetTeam.FRIENDLY,
            this.GetTargetType(),
            UnitTargetFlags.INVULNERABLE,
            caster.GetTeamNumber()
        );
    }

    GetChannelTime(): number {
        const caster = this.GetCaster();

        return caster.GetModifierStackCount(modifier_tinker_keen_teleport_custom_730.name, caster) / 100;
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();
        const casterTeam = caster.GetTeamNumber();
        if (!this.currentTpTarget) return;

        const teleportDuration = this.GetChannelTime();
        const tpPosition = this.currentTpTarget.GetAbsOrigin();

        caster.FaceTowards(tpPosition);

        if (!this.currentTpTarget.IsBuilding()) {
            modifier_tinker_keen_teleport_custom_730_incoming.apply(
                this.currentTpTarget,
                caster,
                this,
                {}
            );
        }

        modifier_tinker_keen_teleport_custom_730_teleporting.apply(
            caster,
            caster,
            this,
            {
                duration: teleportDuration
            }
        );

        this.currentTeleportTime = teleportDuration;

        this.PlayEffects(this.currentTpTarget);

        this.loopSoundTimer = Timers.CreateTimer(0.1, () => {
            if (this.currentTpTarget && !this.currentTpTarget.IsNull()) {
                this.currentTpTarget.EmitSound(this.teleportLoopSound);
            }

            caster.EmitSound(this.teleportLoopSound);
        });

        this.endSoundTimer = Timers.CreateTimer(teleportDuration - 0.2, () => {
            if (this.currentTpTarget && !this.currentTpTarget.IsNull()) {
                this.currentTpTarget.EmitSound(this.teleportStartSound);
            }

            caster.EmitSound(this.teleportEndSound);
        });

        AddFOWViewer(casterTeam, tpPosition, this.GetSpecialValueFor("vision_radius"), teleportDuration, true);
        MinimapEvent(
            casterTeam,
            caster,
            tpPosition.x,
            tpPosition.y,
            MinimapEventType.TEAMMATE_TELEPORTING,
            teleportDuration + 0.2
        );
    }

    OnChannelThink(interval: number): void {
        const caster = this.GetCaster();

        this.currentTeleportTime -= interval;

        if (
            !caster.CanTeleport() ||
            (this.currentTpTarget && !this.currentTpTarget.IsNull() && !this.currentTpTarget.IsAlive())
        ) {
            caster.InterruptChannel();
        }
    }

    OnChannelFinish(interrupted: boolean): void {
        const caster = this.GetCaster();
        
        if (!this.currentTpTarget || this.currentTpTarget.IsNull()) return;
        caster.RemoveModifierByName(modifier_tinker_keen_teleport_custom_730_teleporting.name);
        this.currentTpTarget.RemoveModifierByName(modifier_tinker_keen_teleport_custom_730_incoming.name);

        this.currentTpTarget.StopSound(this.teleportLoopSound);
        caster.StopSound(this.teleportLoopSound);

        if (this.loopSoundTimer) {
            Timers.RemoveTimer(this.loopSoundTimer);
        }
        if (this.endSoundTimer && this.currentTeleportTime <= 0.25) {
            Timers.RemoveTimer(this.endSoundTimer);
        }

        const dt = FrameTime();

        this.DestroyEffects(interrupted, dt);

        const tpPosition = this.currentTpTarget.GetAbsOrigin();
        if (this.currentTpTarget.IsCompanion()) {
            UTIL_Remove(this.currentTpTarget);
        }

        MinimapEvent(caster.GetTeamNumber(), caster, tpPosition.x, tpPosition.y, MinimapEventType.CANCEL_TELEPORTING, 0);

        if (interrupted) return;

        Timers.CreateTimer(dt, () => {
            ProjectileManager.ProjectileDodge(caster);
            
            caster.SetAbsOrigin(tpPosition);
            FindClearSpaceForUnit(caster, tpPosition, true);
        });

        caster.StartGesture(GameActivity.DOTA_TELEPORT_END);
    }

    private PlayEffects(target: CDOTA_BaseNPC): void {
        const caster = this.GetCaster();

        caster.StartGesture(GameActivity.DOTA_TELEPORT);

        this.teleportFromParticle = ParticleManager.CreateParticle(
            this.teleportStartParticle,
            ParticleAttachment.WORLDORIGIN,
            caster
        );
        ParticleManager.SetParticleControl(this.teleportFromParticle, 0, caster.GetAbsOrigin());
        ParticleManager.SetParticleControl(this.teleportFromParticle, 2, Vector(255, 255, 255));

        const targetOrigin = target.GetAbsOrigin();

        this.teleportTargetParticle = ParticleManager.CreateParticle(
            this.teleportEndParticle,
            ParticleAttachment.CUSTOMORIGIN,
            undefined
        );

        if (target.IsCompanion()) {
            ParticleManager.SetParticleControl(this.teleportTargetParticle, 0, targetOrigin);
            ParticleManager.SetParticleControl(this.teleportTargetParticle, 1, targetOrigin);

            ParticleManager.SetParticleControl(this.teleportTargetParticle, 5, targetOrigin);
        } else {
            ParticleManager.SetParticleControlEnt(
                this.teleportTargetParticle,
                0,
                target,
                ParticleAttachment.CUSTOMORIGIN_FOLLOW,
                AttachLocation.HITLOC,
                targetOrigin,
                true
            );
            ParticleManager.SetParticleControlEnt(
                this.teleportTargetParticle,
                1,
                target,
                ParticleAttachment.CUSTOMORIGIN_FOLLOW,
                AttachLocation.HITLOC,
                targetOrigin,
                true
            );
            
            ParticleManager.SetParticleControl(this.teleportTargetParticle, 5, targetOrigin.__add(Vector(0, 0, 180)));
        }

        ParticleManager.SetParticleControl(this.teleportTargetParticle, 2, Vector(255, 255, 255));
        ParticleManager.SetParticleControlEnt(
            this.teleportTargetParticle,
            3,
            caster,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            AttachLocation.HITLOC,
            targetOrigin,
            true
        );
        ParticleManager.SetParticleControl(this.teleportTargetParticle, 4, Vector(0.9, 0, 0));
    }

    private DestroyEffects(interrupted: boolean, dt: number): void {
        this.GetCaster().RemoveGesture(GameActivity.DOTA_TELEPORT);
        
        if (interrupted) {
            if (this.teleportFromParticle) {
                ParticleManager.SetParticleControl(this.teleportFromParticle, 0, Vector(0, 0, -9999));
            }

            if (this.teleportTargetParticle) {
                ParticleManager.SetParticleControl(this.teleportTargetParticle, 0, Vector(0, 0, -9999));
                ParticleManager.SetParticleControl(this.teleportTargetParticle, 1, Vector(0, 0, -9999));
            }
        }

        Timers.CreateTimer(dt, () => {
            if (this.teleportFromParticle) {
                ParticleManager.DestroyParticle(this.teleportFromParticle, interrupted);
                ParticleManager.ReleaseParticleIndex(this.teleportFromParticle);

                this.teleportFromParticle = undefined;
            }

            if (this.teleportTargetParticle) {
                ParticleManager.DestroyParticle(this.teleportTargetParticle, interrupted);
                ParticleManager.ReleaseParticleIndex(this.teleportTargetParticle);

                this.teleportTargetParticle = undefined;
            }
        });
    }

    private GetTargetType(): UnitTargetType {
        const level = this.GetLevel();

        if (level === 1) {
            return UnitTargetType.BUILDING;
        } else if (level === 2) {
            return UnitTargetType.BUILDING | UnitTargetType.BASIC;
        } else if (level === 3) {
            return UnitTargetType.BUILDING | UnitTargetType.BASIC | UnitTargetType.HERO;
        } else {
            return UnitTargetType.NONE;
        }
    }

    private ClampVector(a: Vector, b: Vector, radius: number): Vector {
        const vector = a.__sub(b);
        const length = vector.Length2D();
        
        if (length < radius) return a;

        const unitVector = vector.__mul(1 / length);
        return b.__add(unitVector.__mul(radius));
    }

    private GetTeleportTarget(): TeleportTargetResult {
        const caster = this.GetCaster();
        const cursorTarget = this.GetCursorTarget();
        const cursorPosition = this.GetCursorPosition();

        if (cursorTarget) {
            return this.GetCursorTargetTeleport(caster, cursorTarget);
        } else {
            return this.GetNearestUnitTeleport(caster, cursorPosition);
        }
    }

    private GetCursorTargetTeleport(caster: CDOTA_BaseNPC, cursorTarget: CDOTA_BaseNPC): TeleportTargetResult {
        if (cursorTarget === caster) {
            const fountain = PlayerResource.GetTeamFountainEntity(caster.GetTeamNumber());
            if (!fountain) return { isValid: false };

            return {
                target: fountain,
                isValid: true
            };
        } else {
            return {
                target: cursorTarget,
                isValid: true
            };
        }
    }

    private GetNearestUnitTeleport(caster: CDOTA_BaseNPC, cursorPosition: Vector): TeleportTargetResult {
        const units = this.FindValidTeleportUnits(caster, cursorPosition);

        if (units.length === 0) return { isValid: false };

        const nearestUnit = units[0];
        if (nearestUnit.IsBuilding()) {
            const radius = nearestUnit.IsOutpost() ? 250 : 800;
            const point = this.ClampVector(cursorPosition, nearestUnit.GetAbsOrigin(), radius);

            return {
                target: nearestUnit,
                point,
                isValid: true
            };
        } else {
            return {
                target: nearestUnit,
                isValid: true
            };
        }
    }

    private CreateTeleportTargetEntity(targetResult: TeleportTargetResult): CDOTA_BaseNPC | undefined {
        if (targetResult.point) {
            return CreateCompanion(targetResult.point);
        } else if (targetResult.target) {
            if (targetResult.target.IsBuilding()) {
                const location = this.ClampVector(
                    this.GetCaster().GetAbsOrigin(),
                    targetResult.target.GetAbsOrigin(),
                    targetResult.target.GetHullRadius() * 1.5
                );

                return CreateCompanion(location);
            } else {
                return targetResult.target;
            }
        }
        
        return undefined;
    }

    private FindValidTeleportUnits(caster: CDOTA_BaseNPC, position: Vector): CDOTA_BaseNPC[] {
        return FindUnitsInRadius(
            caster.GetTeamNumber(),
            position,
            undefined,
            FIND_UNITS_EVERYWHERE,
            UnitTargetTeam.FRIENDLY,
            this.GetTargetType(),
            UnitTargetFlags.INVULNERABLE,
            FindOrder.CLOSEST,
            false
        ).filter(unit => unit !== caster && !unit.IsCourier());
    }
}



@registerModifier()
class modifier_tinker_keen_teleport_custom_730 extends CustomModifier {
    IsHidden(): boolean {
        return true;
    }

    IsPurgable(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.ON_ABILITY_EXECUTED
        ];
    }

    OnAbilityExecuted(event: ModifierAbilityEvent): void {
        if (!IsServer()) return;

        const ability = this.GetAbility() as tinker_keen_teleport_custom_730;
        if (ability === undefined || event.ability !== ability) return;
        
        const tpResult = ability.teleportResult;

        const duration = tpResult.target && tpResult.target.IsOutpost()
            ? ability.GetSpecialValueFor("outpost_channel_time")
            : ability.GetSpecialValueFor("channel_time");

        this.SetStackCount(duration * 100);
    }
}

class BaseTeleportModifier extends CustomModifier {
    IsHidden(): boolean {
        return false;
    }

    IsPurgable(): boolean {
        return false;
    }

    IsPurgeException(): boolean {
        return false;
    }

    IsDebuff(): boolean {
        return false;
    }

    AllowIllusionDuplicate(): boolean {
        return false;
    }

    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }
}

@registerModifier()
class modifier_tinker_keen_teleport_custom_730_teleporting extends BaseTeleportModifier {}

@registerModifier()
class modifier_tinker_keen_teleport_custom_730_incoming extends BaseTeleportModifier {}