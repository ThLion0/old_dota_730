
class TechiesMinesIndicator implements AbilityIndicator {
    private readonly minesFilter = (entity: EntityIndex) =>
        Entities.GetTeamNumber(entity) === this.localTeam &&
        Entities.GetPlayerOwnerID(entity) === this.localPlayer;

    private particleList = new Map<EntityIndex, ParticleID>();
    
    private readonly placementRadius: number = 400;

    private localPlayer: PlayerID;
    private localTeam: DOTATeam_t;
    
    private mines: EntityIndex[];

    constructor() {
        this.localPlayer = Players.GetLocalPlayer();
        this.localTeam = Players.GetTeam(this.localPlayer);

        this.mines = NetTableUtils.GetEntityList("mines", this.minesFilter);

        this.registerNetTableListener();
    }

    private registerNetTableListener(): void {
        CustomNetTables.SubscribeNetTableListener("entities", (_, key) => {
            $.Schedule(0, () => {
                if (key === "mines") {
                    this.mines = NetTableUtils.GetEntityList("mines", this.minesFilter);
                }
            });
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

CustomIndicator.AddIndicator("techies_land_mines_custom_730", new TechiesMinesIndicator());