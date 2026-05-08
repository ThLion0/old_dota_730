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
import { NeutralCampsManager } from "./managers/neutral_camps_manager";
import { Wearables } from "./managers/wearable_manager";
import { EntityManager } from "./managers/entity_manager";

import { MapSettings } from "./utils/settings/settings";
import { Dota730Map } from "./maps/dota_730";


// Game Mode variables
declare global {
    const GameModeEntity: CDOTABaseGameMode;

    interface CDOTAGameRules {
        /** @custom */
        Addon: GameMode;
        /** @custom */
        Settings: MapSettings;

        WearableManager: Wearables.Manager;
        EntityManager: EntityManager;
    }
}

@reloadable
export class GameMode {
    public readonly neutralCampManager: NeutralCampsManager;

    constructor() {
        this.neutralCampManager = new NeutralCampsManager();

        this.configure();

        this.listenGameEvents();
        this.setGameFilters();
    }

    public static Precache(this: void, context: CScriptPrecacheContext): void {
        PrecacheAllResources(context);
    }

    public static Activate(this: void): void {
        // @ts-ignore
        GameModeEntity = GameRules.GetGameModeEntity();

        GameRules.Settings = new Dota730Map();

        GameRules.WearableManager = new Wearables.Manager();
        GameRules.EntityManager = new EntityManager();

        // Addon should initialize only after all structure configs
        GameRules.Addon = new GameMode();

        SendToServerConsole("tv_delay 0");
        SendToServerConsole("dota_clientside_wearables false");

        if (IsInToolsMode()) {
            SendToServerConsole("dota_easybuy 1");
        }

        GameRules.Settings.SendToConsole();
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
        GoldFilter.Register();
        ModifierGainFilter.Register();
        OrderFilter.Register();
    }

    public OnGameSetup(): void {
        GameRules.WearableManager.Initialize();
        GameRules.EntityManager.Initialize();
        
        this.neutralCampManager.Initialize();
    }

    public OnWaitMapToLoad(): void {

    }

    public OnPreGame(): void {
        
    }

    public OnStartGame(): void {
        this.neutralCampManager.StartCycle();
        
        GameRules.SetTimeOfDay(0.25);
    }

    public Reload(): void {
        print("Script reloaded!");
    }
}