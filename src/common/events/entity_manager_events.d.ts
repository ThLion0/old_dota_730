interface CustomGameEventDeclarations {
    entity_manager_request_client: EntityManagerRequestUpdateEvent;
    entity_manager_update_list: EntityManagerUpdateEvent;
    entity_manager_append: EntityManagerAppendEvent;
    entity_manager_remove: EntityManagerRemoveEvent;
}

type EntityManagerRequestUpdateEvent = {};

type EntityManagerUpdateEvent = {
    abilityName: string;
    indexes: EntityIndex[];
};

type EntityManagerAppendEvent = {
    abilityName: string;
    entityIndex: EntityIndex;
};

type EntityManagerRemoveEvent = EntityManagerAppendEvent;