import { CustomAbility } from "../../../../lib/abilities/custom_ability";
import { registerAbility } from "../../../../lib/dota_ts_adapter";

@registerAbility()
export class techies_remote_mines_self_detonate_custom_730 extends CustomAbility {
    private readonly detonateParticleName = this.particle("particles/units/heroes/hero_techies/730/techies_remote_mines_detonate.vpcf");
    private readonly detonateSound = this.sound("Hero_Techies.RemoteMine.Detonate");

    private readonly remoteMinesAbilityName = "techies_remote_mines_custom_730";

    private readonly radius: number = 425;

    protected GetWearableOwner(): CDOTA_BaseNPC {
        if (IsServer()) {
            return this.GetOwner() as CDOTA_BaseNPC;
        }
        
        return super.GetWearableOwner();
    }

    GetCustomBehavior(): CustomAbilityBehavior {
        return CustomAbilityBehavior.INNATE;
    }

    OnSpellStart(): void {
        const caster = this.GetCaster();
        const owner = caster.GetOwner() as CDOTA_BaseNPC;

        const ownerID = owner.GetPlayerOwnerID();

        const selectedMines = Selection.GetSelectedEntities(ownerID)
            .map(entity => EntIndexToHScript(entity) as CDOTA_BaseNPC | undefined)
            .filter(
                (entity) =>
                    entity !== undefined &&
                    entity.GetUnitName() === caster.GetUnitName() &&
                    entity.GetTeamNumber() === owner.GetTeamNumber()
        );

        let i = 0;
        Timers.CreateTimer(0.03, () => {
            if (i > selectedMines.length) return;

            const mine = selectedMines[i];
            if (IsValidEntity(mine) && mine.IsAlive()) {
                (mine.FindAbilityByName(this.GetAbilityName()) as this)?.Detonate();
            }
            
            i++;
            return 0.03;
        }, this);
    }

    public Detonate(): void {
        const caster = this.GetCaster();
        const owner = caster.GetOwner() as CDOTA_BaseNPC;
        if (!caster.IsAlive()) return;

        const ability = owner.FindAbilityByName(this.remoteMinesAbilityName);
        if (!ability) return;

        const damage = ability.GetSpecialValueFor("damage");

        const damageTable: ApplyDamageOptions = {
            attacker: caster,
            damage: damage,
            damage_type: DamageTypes.MAGICAL,
            victim: undefined!,
            ability: ability
        };

        FindUnitsInRadius(
            caster.GetTeamNumber(),
            caster.GetAbsOrigin(),
            undefined,
            this.radius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO | UnitTargetType.BASIC,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        ).forEach(enemy => {
            damageTable.victim = enemy;
            ApplyDamage(damageTable);
        });

        const particle = ParticleManager.CreateParticle(
            this.detonateParticleName.get(),
            ParticleAttachment.WORLDORIGIN,
            undefined
        );
        ParticleManager.SetParticleControl(particle, 0, caster.GetAbsOrigin());
        ParticleManager.SetParticleControl(particle, 1, Vector(this.radius, 1, 1));
        ParticleManager.SetParticleControl(particle, 3, caster.GetAbsOrigin());
        ParticleManager.ReleaseParticleIndex(particle);

        AddFOWViewer(owner.GetTeamNumber(), caster.GetAbsOrigin(), 500, 3, false);

        caster.ForceKill(false);

        Timers.CreateTimer(RandomFloat(0.01, 0.08), () => {
            if (!this.IsNull() && IsValidEntity(caster)) {
                caster.EmitSound(this.detonateSound.get());
                UTIL_Remove(caster);
            }
        });
    }
}