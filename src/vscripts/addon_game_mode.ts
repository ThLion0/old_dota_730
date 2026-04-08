import "./lib/dota_utils";

import "./lib/timers";
import "./lib/selection";

import { GameMode } from "./GameMode";

Object.assign(getfenv(), {
    Activate: GameMode.Activate,
    Precache: GameMode.Precache,
});

if (GameRules.Addon !== undefined) {
    GameRules.Addon.Reload();
}
