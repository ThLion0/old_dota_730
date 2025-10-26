import { reloadable } from "../lib/tstl-utils";

@reloadable
export class GameRuleChange {
    public static handle(): void {
        const state = GameRules.State_Get();

        switch (state) {
            case GameState.CUSTOM_GAME_SETUP:
                this.setupGame(); break;

            case GameState.PRE_GAME:
                this.preGame(); break;

            case GameState.GAME_IN_PROGRESS:
                this.startGame(); break;

            default: break;
        }
    }

    private static setupGame(): void {
        GameRules.Manager.SaveKVData();
    }

    private static preGame(): void {
        // Save fountains units
        PlayerResource.GetTeamFountainEntity(DotaTeam.BADGUYS);
        PlayerResource.GetTeamFountainEntity(DotaTeam.GOODGUYS);
    }

    private static startGame(): void {
        GameRules.Addon.StartGame();
    }
}