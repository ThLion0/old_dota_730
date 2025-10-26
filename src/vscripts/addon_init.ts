import { GameMode } from "./GameMode";

LinkLuaModifier(BuiltInModifier.HIDDEN_CUSTOM, `abilities/generic/${BuiltInModifier.HIDDEN_CUSTOM}.lua`, LuaModifierMotionType.NONE);

if (IsClient()) {
    GameMode.ActivateClient.call(getfenv());
}