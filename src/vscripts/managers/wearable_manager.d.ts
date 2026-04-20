declare type SkinStyle = 0 | 1 | 2;
declare type ModelData = {
    modelName: string;
    style: SkinStyle;
};

declare type HeroSkin = {
    SkinPriority?: number;
    ModelPath?: string;
    ModelStyle?: SkinStyle;
    Abilities?: Record<string, string>;
    Particles?: Record<string, string>;
};

type HeroWearableData = Record<string, HeroSkin> & {
    Default?: HeroSkin;
};

declare type WearablesKeyValues = {
    [key: string]: HeroWearableData;
};