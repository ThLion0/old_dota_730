class TinkerTeleportIndicator implements AbilityIndicator {
    public readonly abilityName: string;
    
    private readonly teleportParticleName: string = "particles/ui_mouseactions/range_finder_tp_dest.vpcf";

    private readonly buildingRadius: number = 875;

    private readonly buildings: EntityIndex[];
    private entities = new Set<EntityIndex>();

    private cursorParticle?: ParticleID;
    private lastTarget?: EntityIndex;

    private get localEntity(): EntityIndex {
        return Game.GetLocalPlayerInfo().player_selected_hero_entity_index;
    }

    constructor() {
        this.abilityName = "tinker_keen_teleport_custom_730";

        EntityManager.BindEntityListener(this.abilityName, {
            onAdd: (entity) => this.entities.add(entity),
            onRemove: (entity) => this.entities.delete(entity),
            onEntriesUpdate: (indexes) => (this.entities = new Set(indexes))
        });
        
        this.buildings = Entities.GetAllBuildingEntities();
    }
    
    ShowParticles(ability: AbilityEntityIndex, cursorPosition: Vector): void {
        const target = this.getNearestUnit(ability, cursorPosition);
        if (target === undefined) return;

        const building = this.getNearestBuilding(cursorPosition);
        if (building === undefined) return;

        if (target !== this.lastTarget) this.HideParticles();

        if (!Entities.IsBuilding(target) && !this.isInDistance(cursorPosition, Entities.GetAbsOrigin(building), this.buildingRadius)) {
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
        else return this.buildings.concat(Array.from(this.entities));
    }
}

CustomIndicator.AddIndicator(new TinkerTeleportIndicator());