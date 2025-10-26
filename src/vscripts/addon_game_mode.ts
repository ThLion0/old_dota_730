import "./lib/timers";
import "./lib/dota_utils";
import "./lib/selection";
import "./lib/custom_events";

import { GameMode } from "./GameMode";

Object.assign(getfenv(), {
    Activate: GameMode.Activate,
    Precache: GameMode.Precache,
});

if (GameRules.Addon !== undefined) {
    GameRules.Addon.Reload();
}
