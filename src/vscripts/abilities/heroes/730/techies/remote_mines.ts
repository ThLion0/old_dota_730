import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

@registerAbility()
export class techies_remote_mines_custom_730 extends BaseAbility {
    private readonly plantParticleName: string = "particles/units/heroes/hero_techies/730/techies_remote_mine_plant.vpcf";
    
    private readonly tossSound: string = "Hero_Techies.RemoteMine.Toss";
    private readonly plantSound: string = "Hero_Techies.RemoteMine.Plant";

    private readonly modelName: string = "models/heroes/techies/fx_techies_remotebomb.vmdl";

    private readonly unitName: string = "npc_dota_techies_remote_mine_custom_730";

    private castParticle?: ParticleID;
    private castMine?: CDOTA_BaseNPC;
    
    GetCastRange(location: Vector, target: CDOTA_BaseNPC | undefined): number {
        const bonus = this.GetCaster().HasScepter() ? 300 : 0;

        return super.GetCastRange(location, target) + bonus;
    }

    OnUpgrade(): void {
        if (IsServer()) {
            const focusedDetonate = this.GetCaster().FindAbilityByName("techies_focused_detonate_custom_730");
            if (focusedDetonate && !focusedDetonate.IsTrained()) {
                focusedDetonate.SetLevel(1);
            }
        }
    }

    OnAbilityPhaseStart(): boolean {
        const caster = this.GetCaster();
        const point = this.GetCursorPosition();

        this.castMine = CreateUnitByName(this.unitName, caster.GetAbsOrigin(), true, caster, caster, caster.GetTeamNumber());
        TurnToDummy(this.castMine);

        this.castMine.AddNewModifier(
            caster,
            this,
            BuiltInModifier.KILL,
            {
                duration: 3.0
            }
        );

        this.castMine.SetOriginalModel(this.modelName);
        this.castMine.SetModel(this.modelName);

        this.castParticle = ParticleManager.CreateParticle(
            this.plantParticleName,
            ParticleAttachment.CUSTOMORIGIN,
            caster
        );
        ParticleManager.SetParticleControlEnt(
            this.castParticle,
            0,
            caster,
            ParticleAttachment.POINT_FOLLOW,
            AttachLocation.REMOTE,
            caster.GetAbsOrigin(),
            true
        );
        ParticleManager.SetParticleControl(this.castParticle, 1, point);
        ParticleManager.SetParticleControlEnt(
            this.castParticle,
            2,
            this.castMine,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            AttachLocation.HITLOC,
            this.castMine.GetAbsOrigin(),
            true
        );
        ParticleManager.SetParticleControlEnt(
            this.castParticle,
            3,
            caster,
            ParticleAttachment.POINT_FOLLOW,
            AttachLocation.REMOTE,
            caster.GetAbsOrigin(),
            true
        );
        ParticleManager.SetParticleControl(this.castParticle, 4, point);

        caster.EmitSound(this.tossSound);

        return true;
    }

    OnAbilityPhaseInterrupted(): void {
        this.HideCastParticle();
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();
        const point = this.GetCursorPosition();

        this.HideCastParticle();

        const mine = CreateMineByName(this.unitName, point, caster);
        modifier_techies_remote_mines_custom_730.apply(
            mine,
            caster,
            this,
            {}
        );
        mine.AddNewModifier(
            caster,
            this,
            BuiltInModifier.KILL,
            {
                duration: this.GetSpecialValueFor("duration")
            }
        );

        mine.SetOriginalModel(this.modelName);
        mine.SetModel(this.modelName);

        FindClearSpaceForUnit(mine, mine.GetAbsOrigin(), false);

        mine.SetForwardVector(caster.GetForwardVector());
        mine.SetAngles(RandomFloat(10, 15) * (RollPercentage(50) ? 1 : -1), 0, 0);

        Timers.CreateTimer(0.67, () => {
            if (!IsValidEntity(mine)) return;

            mine.StartGesture(GameActivity.DOTA_IDLE);
        });

        mine.EmitSound(this.plantSound);
    }

    private HideCastParticle(): void {
        if (this.castParticle) {
            ParticleManager.DestroyParticle(this.castParticle, true);
            ParticleManager.ReleaseParticleIndex(this.castParticle);

            this.castParticle = undefined;
        }

        if (IsValidEntity(this.castMine)) {
            UTIL_Remove(this.castMine);
            
            this.castMine = undefined;
        }
    }
}



@registerModifier()
class modifier_techies_remote_mines_custom_730 extends BaseModifier {
    private readonly particleName: string = "particles/units/heroes/hero_techies/730/techies_remote_mine.vpcf";
    
    private readonly activationDelay: number = 2;

    private modelScale: number = 0;

    IsHidden(): boolean {
        return true;
    }

    IsPurgable(): boolean {
        return true;
    }

    CanParentBeAutoAttacked(): boolean {
        return false;
    }
    
    OnCreated(params: object): void {
        const parent = this.GetParent();
        
        this.modelScale = this.GetSpecialValueFor("model_scale");

        if (!IsServer()) return;

        const particle = ParticleManager.CreateParticle(
            this.particleName,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            parent
        );
        ParticleManager.SetParticleControl(particle, 0, parent.GetAbsOrigin());
        ParticleManager.SetParticleControl(particle, 3, parent.GetAbsOrigin());
        ParticleManager.ReleaseParticleIndex(particle);
        
        parent.SetMoveCapability(
            this.GetSpecialValueFor("movement_speed") === 0 ? UnitMoveCapability.NONE : UnitMoveCapability.GROUND
        );
        
        this.StartIntervalThink(0.1);
    }

    OnIntervalThink(): void {
        const moveSpeed = this.GetSpecialValueFor("movement_speed");
        
        if (moveSpeed > 0) {
            this.GetParent().SetMoveCapability(UnitMoveCapability.GROUND);
            this.StopIntervalThink();
        }
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.MOVESPEED_ABSOLUTE,
            ModifierFunction.MODEL_SCALE
        ];
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        const states: Partial<Record<ModifierState, boolean>> = {
            [ModifierState.NO_UNIT_COLLISION]: true,
            [ModifierState.LOW_ATTACK_PRIORITY]: true
        };

        if (this.GetElapsedTime() > this.activationDelay) {
            states[ModifierState.INVISIBLE] = true;
        }
        
        return states;
    }

    GetModifierMoveSpeed_Absolute(): number {
        return this.GetSpecialValueFor("movement_speed");
    }

    GetModifierModelScale(): number {
        return this.modelScale;
    }
}