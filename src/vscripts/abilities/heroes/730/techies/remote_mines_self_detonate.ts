import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../../lib/dota_ts_adapter";

@registerAbility()
export class techies_remote_mines_self_detonate_custom_730 extends BaseAbility {
    private readonly detonateParticleName: string = "particles/units/heroes/hero_techies/730/techies_remote_mines_detonate.vpcf";
    private readonly detonateSound: string = "Hero_Techies.RemoteMine.Detonate";

    private readonly remoteMinesAbilityName: string = "techies_remote_mines_custom_730";

    private readonly radius: number = 425;

    Spawn(): void {
        if (IsServer()) {
            if (!this.IsTrained()) {
                this.SetLevel(1);
            }
        }
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
                (mine.FindAbilityByName(this.constructor.name) as this).Detonate();
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
            this.detonateParticleName,
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
                caster.EmitSound(this.detonateSound);
                UTIL_Remove(caster);
            }
        });
    }
}