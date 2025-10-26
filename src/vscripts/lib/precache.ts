type ParticlePrecache = string | {
    type: 'folder';
    path: string;
};

type SoundPrecache = string;

type ModelPrecache = string;



const particles: ParticlePrecache[] = [
    {
        type: "folder",
        path: "particles/units/heroes/hero_techies/730"
    }
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