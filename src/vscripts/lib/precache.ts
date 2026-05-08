/// <reference path="precache.d.ts" />

const particles: ParticlePrecache[] = [
    // Techies
    "particles/units/heroes/hero_techies/730/techies_remote_mines_detonate.vpcf",
    "particles/units/heroes/hero_techies/730/techies_remote_mine_plant.vpcf",
    "particles/units/heroes/hero_techies/730/techies_blast_off.vpcf",
    "particles/units/heroes/hero_techies/730/techies_suicide_arcana.vpcf",
    "particles/units/heroes/hero_techies/730/techies_blast_off_trail.vpcf",
    "particles/units/heroes/hero_techies/730/techies_stasis_trap_explode.vpcf",
    "particles/units/heroes/hero_techies/730/techies_stasis_trap_beams.vpcf",
    "particles/units/heroes/hero_techies/730/techies_remote_mine.vpcf",
    "particles/units/heroes/hero_techies/730/techies_land_mine.vpcf",
    "particles/units/heroes/hero_techies/730/techies_land_mine_explode.vpcf",
    
    // Tinker
    "particles/units/heroes/hero_tinker/730/tinker_motm.vpcf",
    "particles/units/heroes/hero_tinker/730/tinker_machine.vpcf"
];

const soundFiles: SoundPrecache[] = [
    "soundevents/game_sounds_heroes/game_sounds_techies_730.vsndevts"
];

const models: ModelPrecache[] = [
    // Techies
    "models/heroes/techies/fx_techiesfx_mine.vmdl",
    "models/heroes/techies/fx_techiesfx_stasis.vmdl",
    "models/heroes/techies/techies_sign.vmdl",
    "models/heroes/techies/fx_techies_remotebomb.vmdl",

    // Techies Arcana
    "models/items/techies/bigshot/fx_bigshot_mine.vmdl",
    "models/items/techies/bigshot/fx_bigshot_stasis.vmdl",
    "models/items/techies/bigshot/fx_bigshot_sign.vmdl",
    "models/items/techies/bigshot/bigshot_remotebomb.vmdl",

    // Techies Immortal
    "models/items/techies/techies_ti9_immortal_prox_mine/techies_ti9_immortal_prox_mine.vmdl",
    "models/items/techies/techies_ti9_immortal_sign/techies_ti9_immortal_sign.vmdl",
    "models/items/techies/techies_ti9_immortal_remote_mine/techies_ti9_immortal_remote_mine.vmdl"
];

export const PrecacheAllResources = (context: CScriptPrecacheContext): void => {
    particles.forEach(
        particle => {
            if (typeof particle === "string") {
                PrecacheResource(PrecacheType.PARTICLE, particle, context);
            } else if (typeof particle === "object" && particle.type === "folder") {
                PrecacheResource(PrecacheType.PARTICLE_FOLDER, particle.path, context);
            }
        }
    );
    
    soundFiles.forEach(sound => PrecacheResource(PrecacheType.SOUNDFILE, sound, context));
    
    models.forEach(model => PrecacheResource(PrecacheType.MODEL, model, context));
};