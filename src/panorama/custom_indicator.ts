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

class CustomIndicator {
    private static readonly allIndicators: Record<string, AbilityIndicator> = {};

    private static lastState: State;
    
    static {
        this.lastState = {
            ability: -1 as AbilityEntityIndex,
            behavior: CLICK_BEHAVIORS.DOTA_CLICK_BEHAVIOR_NONE
        };

        this.UpdateMousePosition();
    }

    public static AddIndicator(abilityName: string, indicator: AbilityIndicator): void {
        this.allIndicators[abilityName] = indicator;
    }

    private static UpdateMousePosition(): void {
        const currentState: State = {
            ability: Abilities.GetLocalPlayerActiveAbility(),
            behavior: GameUI.GetClickBehaviors()
        };

        this.ConsiderBehavior(CLICK_BEHAVIORS.DOTA_CLICK_BEHAVIOR_CAST, currentState);
        this.ConsiderBehavior(CLICK_BEHAVIORS.DOTA_CLICK_BEHAVIOR_VECTOR_CAST, currentState);

        this.lastState = currentState;

        $.Schedule(0.03, () => this.UpdateMousePosition());
    }

    private static ConsiderBehavior(target_behavior: CLICK_BEHAVIORS, currentState: State): void {
        if (currentState.behavior === target_behavior) {
            if (this.lastState.behavior !== target_behavior) {
                this.FireBehaviorEvent(BehaviorEvent.START, currentState);
            } else if (this.lastState.ability !== currentState.ability) {
                this.FireBehaviorEvent(BehaviorEvent.START, currentState);
                this.FireBehaviorEvent(BehaviorEvent.END, this.lastState);
            } else {
                this.FireBehaviorEvent(BehaviorEvent.UPDATE, currentState);
            }
        } else if (this.lastState.behavior === target_behavior) {
            this.FireBehaviorEvent(BehaviorEvent.END, this.lastState);
        }
    }

    private static FireBehaviorEvent(event: BehaviorEvent, state: State): void {
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