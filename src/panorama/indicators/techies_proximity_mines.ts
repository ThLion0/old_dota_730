class TechiesMinesIndicator implements AbilityIndicator {
    public readonly abilityName: string;

    private particleList = new Map<EntityIndex, ParticleID>();
    
    private readonly placementRadius: number = 400;
    
    private mines = new Set<EntityIndex>();

    constructor() {
        this.abilityName = "techies_land_mines_custom_730";

        EntityManager.BindEntityListener(this.abilityName, {
            onAdd: (entity) => this.mines.add(entity),
            onRemove: (entity) => this.mines.delete(entity),
            onEntriesUpdate: (indexes) => (this.mines = new Set(indexes))
        });
    }
    
    ShowParticles(ability: AbilityEntityIndex, cursorPosition: Vector): void {
        for (const mine of this.mines) {
            let particle = this.particleList.get(mine);

            if (Entities.IsAlive(mine)) {
                const location = Entities.GetAbsOrigin(mine);

                if (particle === undefined) {
                    particle = Particles.CreateParticle(
                        "particles/ui_mouseactions/range_finder_tp_dest.vpcf",
                        ParticleAttachment_t.PATTACH_ABSORIGIN_FOLLOW,
                        mine
                    );
                    Particles.SetParticleControl(particle, 3, [this.placementRadius, 1, 1]);
                    Particles.SetParticleControl(particle, 4, [255, 22, 22]);

                    this.particleList.set(mine, particle);
                }

                Particles.SetParticleControl(particle, 0, location);
                Particles.SetParticleControl(particle, 2, location);
            } else {
                if (particle !== undefined) {
                    Particles.DestroyParticleEffect(particle, true);
                    Particles.ReleaseParticleIndex(particle);

                    this.particleList.delete(mine);
                }
            }
        }
    }

    HideParticles(): void {
        this.particleList.forEach((particle) => {
            Particles.DestroyParticleEffect(particle, true);
            Particles.ReleaseParticleIndex(particle);
        });

        this.particleList.clear();
    }
}

CustomIndicator.AddIndicator(new TechiesMinesIndicator());