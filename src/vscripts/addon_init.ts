LinkLuaModifier(BuiltInModifier.HIDDEN_CUSTOM, `abilities/generic/${BuiltInModifier.HIDDEN_CUSTOM}.lua`, LuaModifierMotionType.NONE);

if (IsClient()) {
    require("./lib/dota_utils_client");
}