import { DotaEvent } from "../utils/events/events";

class Event extends DotaEvent {
    public Register(): void {
        ListenToGameEvent("game_rules_state_change", () => this.handle(), undefined);
    }

    private handle(): void {
        const state = GameRules.State_Get();

        switch (state) {
            case GameState.CUSTOM_GAME_SETUP:
                this.setupGame(); break;

            case GameState.WAIT_FOR_MAP_TO_LOAD:
                this.waitForMapLoad(); break;

            case GameState.PRE_GAME:
                this.preGame(); break;

            case GameState.GAME_IN_PROGRESS:
                this.startGame(); break;

            default: break;
        }
    }

    private setupGame(): void {
        GameRules.Addon.OnGameSetup();
    }

    private waitForMapLoad(): void {
        GameRules.Addon.OnWaitMapToLoad();
    }

    private preGame(): void {
        GameRules.Addon.OnPreGame();
        
        // Save fountains units
        PlayerResource.GetTeamFountainEntity(DotaTeam.BADGUYS);
        PlayerResource.GetTeamFountainEntity(DotaTeam.GOODGUYS);
    }

    private startGame(): void {
        GameRules.Addon.OnStartGame();
    }
}

export const GameRuleChange = new Event();