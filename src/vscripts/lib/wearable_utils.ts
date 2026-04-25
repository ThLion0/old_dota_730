const HASH_STYLES: Record<number, SkinStyle> = {
    [1977497166]: 0,
    [1055040020]: 0,
    [676911571]: 0,
    [628863847]: 1,
    [392129534]: 1,
    [1347516877]: 2
};

export class WearableUtils {
    private constructor() {}

    public static GetHeroWearables(hero: CDOTA_BaseNPC_Hero): Map<string, SkinStyle> {
        const models = new Map<string, SkinStyle>();
        
        const base = hero.GetRootMoveParent() as CBaseModelEntity;
        models.set(base.GetModelName(), this.getHashStyle(base));

        let current = hero.FirstMoveChild() as CBaseModelEntity | undefined;

        while (current) {
            const modelName = current.GetModelName();

            if (modelName && this.isWearable(current)) {
                models.set(modelName, this.getHashStyle(current));
            }

            current = current.NextMovePeer() as CBaseModelEntity | undefined;
        }
        
        return models;
    }

    /* Helpers */

    private static getHashStyle(modelEntity: CBaseModelEntity): SkinStyle {
        const hash = modelEntity.GetMaterialGroupHash();
        return HASH_STYLES[hash] ?? 0;
    }

    private static isWearable(modelEntity: CBaseModelEntity): boolean {
        const className = modelEntity.GetClassname();
        return className === "prop_dynamic"
            || className === "dota_item_wearable"
            || className === "additional_wearable";
    }
}