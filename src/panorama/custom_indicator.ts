enum BehaviorEvent {
    START = 0,
    UPDATE = 1,
    END = 2
}

interface State {
    ability: AbilityEntityIndex,
    behavior: CLICK_BEHAVIORS
}

interface AbilityIndicator {
    ShowParticles(ability: AbilityEntityIndex, cursorPosition: Vector): void;
    HideParticles(): void;
}

const CustomIndicator = new class {
    private readonly allIndicators: Record<string, AbilityIndicator> = {};

    private lastState: State;
    
    constructor() {
        this.lastState = {
            ability: -1 as AbilityEntityIndex,
            behavior: CLICK_BEHAVIORS.DOTA_CLICK_BEHAVIOR_NONE
        };

        this.updateMousePosition();
    }

    public AddIndicator(abilityName: string, indicator: AbilityIndicator): void {
        this.allIndicators[abilityName] = indicator;
    }

    private updateMousePosition(): void {
        const currentState: State = {
            ability: Abilities.GetLocalPlayerActiveAbility(),
            behavior: GameUI.GetClickBehaviors()
        };

        this.considerBehavior(CLICK_BEHAVIORS.DOTA_CLICK_BEHAVIOR_CAST, currentState);
        this.considerBehavior(CLICK_BEHAVIORS.DOTA_CLICK_BEHAVIOR_VECTOR_CAST, currentState);

        this.lastState = currentState;

        $.Schedule(0.03, () => this.updateMousePosition());
    }

    private considerBehavior(target_behavior: CLICK_BEHAVIORS, currentState: State): void {
        if (currentState.behavior === target_behavior) {
            if (this.lastState.behavior !== target_behavior) {
                this.fireBehaviorEvent(BehaviorEvent.START, currentState);
            } else if (this.lastState.ability !== currentState.ability) {
                this.fireBehaviorEvent(BehaviorEvent.START, currentState);
                this.fireBehaviorEvent(BehaviorEvent.END, this.lastState);
            } else {
                this.fireBehaviorEvent(BehaviorEvent.UPDATE, currentState);
            }
        } else if (this.lastState.behavior === target_behavior) {
            this.fireBehaviorEvent(BehaviorEvent.END, this.lastState);
        }
    }

    private fireBehaviorEvent(event: BehaviorEvent, state: State): void {
        const mousePos = GameUI.GetScreenWorldPosition(GameUI.GetCursorPosition());
        const abilityName = Abilities.GetAbilityName(state.ability);

        if (mousePos === null) return;

        const indicator = this.allIndicators[abilityName];

        if (indicator === undefined) return;

        if (event === BehaviorEvent.UPDATE) {
            indicator.ShowParticles.call(indicator, state.ability, Vector.toVector(mousePos));
        } else if (event === BehaviorEvent.END) {
            indicator.HideParticles.call(indicator);
        }
    }
}