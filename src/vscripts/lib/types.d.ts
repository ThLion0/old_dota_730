declare const enum BuiltInModifier {
    STUN = "modifier_stunned",
    SILENCE = "modifier_silence",
    DISARM = "modifier_disarmed",
    KNOCKBACK = "modifier_knockback",
    KILL = "modifier_kill",
    BASH = "modifier_bashed",
    PHASED = "modifier_phased",
    INVULNERABLE = "modifier_invulnerable",
    FOUNTAIN_INVULNERABILITY = "modifier_fountain_invulnerability",

    /** @custom */
    HIDDEN_CUSTOM = "modifier_hidden_custom",
}

declare const enum AttachLocation {
    EMPTY = "",
    HITLOC = "attach_hitloc",
    EYES = "attach_eyes",
    WEAPON = "attach_weapon",
    WEAPON1 = "attach_weapon1",
    WEAPON2 = "attach_weapon2",
    HEAD = "attach_head",
    SWORD_END = "attach_sword_end",
    ATTACK1 = "attach_attack1",
    ATTACK2 = "attach_attack2",
    ATTACK3 = "attach_attack3",
    THORAX = "attach_thorax",
    REMOTE = "attach_remote",
    LASSO_ATTACK = "lasso_attack",
    STAFF = "attach_staff",
}

declare const enum PrecacheType {
    SOUNDFILE = "soundfile",
    PARTICLE = "particle",
    PARTICLE_FOLDER = "particle_folder",
    MODEL = "model",
}