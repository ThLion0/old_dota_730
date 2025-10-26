
interface CustomEventDeclarations {
    modifier_added: OnModifierAdded;
    modifier_removed: OnModifierRemoved;
    modifier_refreshed: OnModifierRefreshed;
}

interface OnModifierAdded {
    modifier: CDOTA_Buff;
}
interface OnModifierRemoved {
    modifier: CDOTA_Buff;
}
interface OnModifierRefreshed {
    modifier: CDOTA_Buff;
}


class CustomEventManager {
    private static events: ({
        name: string;
        listener: (event: any) => void;
    })[];
    
    static {
        this.events = [];
    }

    public static RegisterHandler<TName extends keyof CustomEventDeclarations, TContext extends {}>(
        eventName: TName,
        listener: (event: CustomEventDeclarations[TName]) => void,
        context: TContext
    ): void {
        this.events.push({
            name: eventName,
            listener: listener.bind(context)
        });
    }

    public static FireEvent<TName extends keyof CustomEventDeclarations>(
        eventName: TName,
        data: CustomEventDeclarations[TName]
    ): void {
        this.events.filter(event => event.name === eventName)
            .forEach(event => event.listener(data));
    }
}