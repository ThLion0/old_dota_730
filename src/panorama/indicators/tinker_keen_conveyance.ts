
class TinkerTeleportIndicator implements AbilityIndicator {
    private readonly teleportParticleName: string = "particles/ui_mouseactions/range_finder_tp_dest.vpcf";
    
    private readonly entityFilter =
        (entity: EntityIndex) => entity !== this.localEntity && Entities.GetTeamNumber(entity) === this.localTeam;

    private cursorParticle?: ParticleID;
    private lastTarget?: EntityIndex;

    private localTeam: DOTATeam_t;

    private heroes: EntityIndex[];
    private creeps: EntityIndex[];
    private buildings: EntityIndex[];

    private get localEntity(): EntityIndex {
        return Game.GetLocalPlayerInfo().player_selected_hero_entity_index;
    }

    constructor() {
        this.localTeam = Players.GetTeam(Players.GetLocalPlayer());

        this.heroes = NetTableUtils.GetEntityList("heroes", this.entityFilter);
        this.creeps = NetTableUtils.GetEntityList("creeps", this.entityFilter);
        
        this.buildings = Entities.GetAllBuildingEntities();

        this.registerNetTableListener();
    }

    private registerNetTableListener(): void {
        CustomNetTables.SubscribeNetTableListener("entities", (_, key) => {
            $.Schedule(0, () => {
                if (key === "heroes") {
                    this.heroes = NetTableUtils.GetEntityList("heroes", this.entityFilter);
                } else if (key === "creeps") {
                    this.creeps = NetTableUtils.GetEntityList("creeps", this.entityFilter);
                }
            });
        });
    }
    
    ShowParticles(ability: AbilityEntityIndex, cursorPosition: Vector): void {
        const target = this.getNearestUnit(ability, cursorPosition);
        if (target === undefined) return;
        const building = this.getNearestBuilding(cursorPosition);
        if (building === undefined) return;

        if (target !== this.lastTarget) this.HideParticles();

        if (!Entities.IsBuilding(target) && !this.isInDistance(cursorPosition, Entities.GetAbsOrigin(building), 900)) {
            if (!this.cursorParticle) {
                this.cursorParticle = Particles.CreateParticle(
                    this.teleportParticleName,
                    ParticleAttachment_t.PATTACH_CUSTOMORIGIN,
                    Players.GetLocalPlayerPortraitUnit()
                );
                Particles.SetParticleControl(this.cursorParticle, 2, [9999, 9999, 9999]);
                Particles.SetParticleControl(this.cursorParticle, 3, [128, 0, 0]);
            }
            
            Particles.SetParticleControl(this.cursorParticle, 7, Entities.GetAbsOrigin(target));
        } else this.HideParticles();
        
        this.lastTarget = target;
    }

    HideParticles(): void {
        if (this.cursorParticle) {
            Particles.DestroyParticleEffect(this.cursorParticle, true);
            Particles.ReleaseParticleIndex(this.cursorParticle);

            this.cursorParticle = undefined;
        }
    }
    
    private getNearestUnit(ability: AbilityEntityIndex, cursorPosition: Vector): EntityIndex | undefined {
        const localPlayer = Players.GetLocalPlayer();
        const localTeam = Players.GetTeam(localPlayer);

        const abilityLevel = Abilities.GetLevel(ability);

        const units = this.getAllEntities(abilityLevel)
            .filter(
                entity => entity !== this.localEntity && Entities.GetTeamNumber(entity) === localTeam && Entities.IsAlive(entity)
            );

        if (units.length === 0) return undefined;

        const sortedEntities = this.sortEntitiesByDistance(units, cursorPosition);
        return sortedEntities[0];
    }

    private getNearestBuilding(cursorPosition: Vector): EntityIndex | undefined {
        const localPlayer = Players.GetLocalPlayer();
        const localTeam = Players.GetTeam(localPlayer);
        
        const units = this.buildings
            .filter(entity => Entities.GetTeamNumber(entity) === localTeam && Entities.IsAlive(entity));

        if (units.length === 0) return undefined;

        const sortedEntities = this.sortEntitiesByDistance(units, cursorPosition);
        return sortedEntities[0];
    }

    private sortEntitiesByDistance(entities: EntityIndex[], position: Vector): EntityIndex[] {
        const distance = (entity: EntityIndex): number => position.__sub(Entities.GetAbsOrigin(entity)).Length2D();
        
        return entities.sort((a, b) => distance(a) - distance(b));
    }

    private isInDistance(a: Vector, b: ArrayVector, distance: number): boolean {
        return a.__sub(b).Length2D() < distance;
    }

    private getAllEntities(level: number): EntityIndex[] {
        if (level === 1) return this.buildings;
        else if (level === 2) return this.buildings.concat(this.creeps);
        else return this.buildings.concat(this.creeps, this.heroes);
    }
}

CustomIndicator.AddIndicator("tinker_keen_teleport_custom_730", new TinkerTeleportIndicator());