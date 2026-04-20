import { CustomGameManager } from "../utils/managers/manager";

type CampTrigger = CBaseTrigger & CDOTA_BaseNPC;

type CampData = {
    spawner: CDOTA_NeutralSpawner;
    trigger: CampTrigger;
    radius: number;
};

export class NeutralCampsManager extends CustomGameManager {
    private readonly camps: CampData[] = [];
    
    public Initialize(): void {
        const spawners = Entities.FindAllByClassname("npc_dota_neutral_spawner") as CDOTA_NeutralSpawner[];
        const triggers = Entities.FindAllByClassname("trigger_multiple")
            .filter(trigger => trigger.GetName().includes("neutralcamp_")) as CampTrigger[];

        triggers.forEach((trigger) => {
            const spawner = this.findClosestSpawner(trigger, spawners);
            if (spawner === undefined) return;

            this.camps.push({
                spawner,
                trigger,
                radius: trigger.GetBoundingRadius()
            });
        });
    }

    public StartCycle(): void {
        Timers.CreateTimer(60.0, () => this.onThink());
    }

    private findClosestSpawner(trigger: CampTrigger, spawners: CDOTA_NeutralSpawner[]): CDOTA_NeutralSpawner | undefined {
        let closest: CDOTA_NeutralSpawner | undefined;
        let minDistance = Infinity;

        const triggerPos = trigger.GetOrigin();

        for (const spawner of spawners) {
            const dist = triggerPos.__sub(spawner.GetOrigin()).Length2D();

            if (dist < minDistance) {
                minDistance = dist;
                closest = spawner;
            }
        }
        
        return closest;
    }

    private onThink(): number {
        this.camps.forEach(({spawner, trigger, radius}) => {
            const units = FindUnitsInRadius(
                DotaTeam.NEUTRALS,
                trigger.GetAbsOrigin(),
                undefined,
                radius,
                UnitTargetTeam.BOTH,
                UnitTargetType.ALL,
                UnitTargetFlags.INVULNERABLE | UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
                FindOrder.ANY,
                false
            );

            let hasValidUnit = false;
            let hasBlockingUnit = false;

            for (const unit of units) {
                if (
                    !IsValidEntity(unit)
                    || !unit.IsBaseNPC()
                    || !unit.IsAlive()
                    || unit.IsOutOfGame()
                    || unit.IsCourier()
                    || !trigger.IsTouching(unit)
                ) continue;

                hasValidUnit = true;

                if (unit.IsBlockingCamp()) {
                    hasBlockingUnit = true;
                    break;
                }
            }

            if (hasValidUnit && !hasBlockingUnit) {
                spawner.SpawnNextBatch(true);
            }
        });

        return 60.0;
    }
}