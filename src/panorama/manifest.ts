class Manifest {
    constructor() {
        this.hideDotaPlusTimers();
        this.hideRoshanTimer();
        this.hideInnateIcon();
        this.hideAttributePips();

        this.registerErrorEvent();
    }

    private registerErrorEvent(): void {
        GameEvents.Subscribe("dota_hud_error_message_player", event => {
            GameEvents.SendEventClientSide("dota_hud_error_message", {
                sequenceNumber: event.sequenceNumber,
                reason: event.reason,
                message: event.message
            });
        });
    }

    private hideDotaPlusTimers(): void {
        const timerPanel = FindDotaHudElement("TimersContainer");
        if (timerPanel) {
            timerPanel.style.visibility = "collapse";
        }

        const timeUntil = FindDotaHudElement("TimeUntil");
        if (timeUntil) {
            timeUntil.style.marginTop = "70px";
        }
    }

    private hideRoshanTimer(): void {
        const roshanTimer = FindDotaHudElement("RoshanTimerContainer");
        if (roshanTimer) {
            roshanTimer.style.visibility = "collapse";
        }
    }

    private hideInnateIcon(): void {
        const abilitiesContainer = FindDotaHudElement("AbilitiesAndStatBranch");
        if (abilitiesContainer) {
            abilitiesContainer.FindChildrenWithClassTraverse("RootInnateDisplay")
                .forEach(panel => panel.style.visibility = "collapse");
        }
    }

    private hideAttributePips(): void {
        const pipsContainer = FindDotaHudElement("AttributePipsContainer");
        if (pipsContainer) {
            pipsContainer.style.visibility = "collapse";
        }
    }
}

new Manifest();