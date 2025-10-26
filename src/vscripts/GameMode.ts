import { reloadable } from "./lib/tstl-utils";

import { PrecacheAllResources } from "./lib/precache";

// events
import { GameRuleChange } from "./events/game_rules_state_change";
import { NpcSpawned } from "./events/npc_spawned";
import { EntityKilled } from "./events/entity_killed";

// filters
import { GoldFilter } from "./filters/gold_filter";
import { OrderFilter } from "./filters/order_filter";
import { ModifierGainFilter } from "./filters/modifier_gain_filter";

// managers
import { OldDotaManager } from "./managers/map_manager";


// game mode variables
declare global {
    const GameModeEntity: CDOTABaseGameMode;

    interface CDOTAGameRules {
        Addon: GameMode;
        Manager: OldDotaManager;
    }
}

@reloadable
export class GameMode {
    public static Precache(this: void, context: CScriptPrecacheContext): void {
        PrecacheAllResources(context);
    }

    public static Activate(this: void): void {
        GameRules.Addon = new GameMode();
        GameRules.Manager = new OldDotaManager();

        SendToServerConsole("tv_delay 0");
        if (IsInToolsMode()) {
            SendToServerConsole("dota_easybuy 1");
        }
    }

    public static ActivateClient(this: any): void {
        require("./lib/dota_utils_client");
    }

    constructor() {
        // @ts-ignore
        GameModeEntity = GameRules.GetGameModeEntity();
        
        this.configure();

        this.listenGameEvents();
        this.setGameFilters();
    }

    private configure(): void {
        GameRules.SetCustomGameTeamMaxPlayers(DotaTeam.GOODGUYS, 5);
        GameRules.SetCustomGameTeamMaxPlayers(DotaTeam.BADGUYS, 5);

        GameRules.SetFilterMoreGold(true);
        GameRules.SetSafeToLeave(true);

        GameRules.SetEnableAlternateHeroGrids(false);
        
        GameRules.SetGoldPerTick(1);
        GameRules.SetGoldTickTime(0.67);

        GameRules.SetStrategyTime(25);
        GameRules.SetPostGameTime(180);
        GameRules.SetPreGameTime(90);

        GameModeEntity.SetFreeCourierModeEnabled(true);

        GameModeEntity.SetDraftingHeroPickSelectTimeOverride(110);

        if (IsInToolsMode()) {
            GameRules.SetCreepSpawningEnabled(false);
            GameRules.SetStartingGold(99999);

            GameRules.SetPreGameTime(10);

            GameModeEntity.SetCustomBackpackSwapCooldown(0);
            
            GameModeEntity.SetFixedRespawnTime(3);
        }
    }

    private listenGameEvents(): void {
        ListenToGameEvent("game_rules_state_change", () => GameRuleChange.handle(), undefined);
        ListenToGameEvent("npc_spawned", event => NpcSpawned.handle(event), undefined);
        ListenToGameEvent("npc_spawn_finished", event => NpcSpawned.handleFinished(event), undefined);
        ListenToGameEvent("entity_killed", event => EntityKilled.handle(event), undefined);
    }

    private setGameFilters(): void {
        GameModeEntity.SetModifyGoldFilter(event => GoldFilter.filter(event), this);
        GameModeEntity.SetExecuteOrderFilter(event => OrderFilter.filter(event), this);
        GameModeEntity.SetModifierGainedFilter(event => ModifierGainFilter.filter(event), this);
    }

    public StartGame(): void {
        GameRules.SetTimeOfDay(0.25);
    }

    public Reload(): void {
        print("Script reloaded!");

        GameRules.Manager.SaveKVData();
    }
}
