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

import { MapSettings } from "./maps/settings";
import { Dota730Map } from "./maps/dota_730";


// game mode variables
declare global {
    const GameModeEntity: CDOTABaseGameMode;

    interface CDOTAGameRules {
        Addon: GameMode;
        Manager: OldDotaManager;
        Settings: MapSettings;
    }
}

@reloadable
export class GameMode {
    public static Precache(this: void, context: CScriptPrecacheContext): void {
        PrecacheAllResources(context);
    }

    public static Activate(this: void): void {
        GameRules.Manager = new OldDotaManager();
        GameRules.Settings = new Dota730Map();

        // Addon should initialize only after all structure configs
        GameRules.Addon = new GameMode();

        SendToServerConsole("tv_delay 0");
        SendToServerConsole("dota_clientside_wearables false");

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

        GameRules.Settings.Configure();
    }

    private listenGameEvents(): void {
        GameRuleChange.Register();
        NpcSpawned.Register();
        EntityKilled.Register();
    }

    private setGameFilters(): void {
        GoldFilter.Register(this);
        OrderFilter.Register(this);
        ModifierGainFilter.Register(this);
    }

    public StartGame(): void {
        GameRules.SetTimeOfDay(0.25);
    }

    public Reload(): void {
        print("Script reloaded!");

        // GameRules.Manager.SaveKVData();
    }
}
