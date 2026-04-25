type EntityFilter<TThis> = (this: TThis, caster: CDOTA_BaseNPC, entity: CDOTA_BaseNPC) => boolean;

type EntityListenerSettings<T extends {}> = {
    filter: EntityFilter<T>;
};

type EntityListener<A = CDOTABaseAbility> = {
    ability: A;
    owner: CDOTAPlayerController;
    filter: EntityFilter<A>;
}