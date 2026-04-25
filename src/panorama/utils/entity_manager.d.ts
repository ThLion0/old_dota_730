type EntityListenerSettings = {
    onAdd: (entityIndex: EntityIndex) => void;
    onRemove: (entityIndex: EntityIndex) => void;
    onEntriesUpdate: (indexes: EntityIndex[]) => void;
};