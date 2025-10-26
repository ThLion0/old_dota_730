type ParseValueConfig = {
    value?: string,
    specialBonus?: AbilitySpecialBonus,
    caster?: EntityIndex;
    level: number,
    isDescription?: boolean,
    isPercentage?: boolean
};

type AbilityTooltipData = {
    abilityName?: string;
    abilityOwner?: EntityIndex;
    abilityButton?: Panel;
};



const MAX_NOTES: number = 8;

const DEBUG_ABILITIES: string[] = [
    // "nevermore_shadowraze1_custom_730",
    "nevermore_shadowraze2_custom_730",
    "nevermore_shadowraze3_custom_730",
    "nevermore_necromastery_custom_730",
    "nevermore_dark_lord_custom_730",
    "nevermore_requiem_custom_730"
];

const flagExist = (a: number, b: number): boolean => (a & b) === b;
const formatValue = (value: number): string => Math.abs(value).toFixed(4).replace(/\.?0+$/, "");

class CustomAbilityTooltip {
    private readonly xmlTooltip: string = "file://{resources}/layout/custom_game/tooltips/custom_ability.xml";
    
    private readonly abilitiesKeyValues: Map<string, AbilitiesKeyValueTable>;
    
    private hideTooltipScheduler: ScheduleID | undefined;

    private tickScheduler: ScheduleID | undefined;

    private tooltipData: AbilityTooltipData = {};

    private isAltDown: boolean = false;

    private get localEntity(): EntityIndex {
        return Game.GetLocalPlayerInfo().player_selected_hero_entity_index;
    }

    constructor() {
        this.abilitiesKeyValues = new Map(
            CustomNetTables.GetAllTableValues("key_values")
                .filter(({value}) => value.type === "ability")
                .map(({ key, value }) => [key, value as AbilitiesKeyValueTable])
        );
        
        this.registerShowTooltipEvents();
        this.registerHideTooltipEvent();
    }

    private registerShowTooltipEvents(): void {
        /*
        const handler = (panel: Panel): void => {
            if (this.hideTooltipScheduler) {
                $.CancelScheduled(this.hideTooltipScheduler);

                this.hideTooltipScheduler = undefined;
            }

            this.injectAbilityTooltip(panel);
        };
        
        $.RegisterForUnhandledEvent("DOTAShowAbilityTooltip", handler);
        $.RegisterForUnhandledEvent("DOTAShowAbilityTooltipForEntityIndex", handler);
        $.RegisterForUnhandledEvent("DOTAShowAbilityTooltipForLevel", handler);
        $.RegisterForUnhandledEvent("DOTAShowAbilityTooltipForGuide", handler);
        $.RegisterForUnhandledEvent("DOTAShowAbilityTooltipForHero", handler);
         */

        $.RegisterForUnhandledEvent("DOTAShowAbilityTooltipForEntityIndex", (panel: Panel, abilityName: string, entityIndex: EntityIndex) => {
            if (this.hideTooltipScheduler) {
                $.CancelScheduled(this.hideTooltipScheduler);

                this.hideTooltipScheduler = undefined;
            }

            this.injectAbilityTooltip(panel, abilityName, entityIndex);
        });
    }

    private registerHideTooltipEvent(): void {
        $.RegisterForUnhandledEvent("DOTAHideAbilityTooltip", () => {
            this.stopTick();

            this.hideTooltipScheduler = $.Schedule(0.2, () => this.hideAbilityTooltip());
        });
    }

    private findTooltipPanel(panelId: string): Panel | null {
        return FindDotaHudElement("Tooltips")
            ?.FindChildTraverse("DOTAAbilityTooltip")
            ?.FindChildTraverse(panelId) ?? null;
    }

    private injectAbilityTooltip(shownPanel: Panel, abilityName: string, entityIndex: EntityIndex): void {
        this.tooltipData = {
            abilityName,
            abilityOwner: entityIndex,
            abilityButton: shownPanel
        };
        
        const tooltipContents = this.findTooltipPanel("Contents");
        if (!tooltipContents) {
            $.Schedule(0, () => this.injectAbilityTooltip(shownPanel, abilityName, entityIndex));
            return;
        }

        const abilityImage = shownPanel.FindChildTraverse("AbilityImage") as AbilityImage;
        const abilityIndex = (abilityImage || shownPanel).contextEntityIndex as AbilityEntityIndex;
        if (!abilityIndex) return;

        const abilityData = this.abilitiesKeyValues.get(abilityName);

        // const isCustom = DEBUG_ABILITIES.includes(abilityName)
        const isCustom = abilityData !== undefined;
        // const isCustom = false;

        const detailsPanel = tooltipContents.FindChildTraverse("AbilityDetails");
        if (detailsPanel) {
            detailsPanel.visible = !isCustom;
        }

        tooltipContents.SetHasClass("AbilityContents", !isCustom);

        if (isCustom) {
            let customTooltip = tooltipContents.FindChildTraverse("CustomTooltip");
            if (!customTooltip) {
                customTooltip = $.CreatePanel("Panel", tooltipContents, "CustomTooltip");
                customTooltip.BLoadLayout(this.xmlTooltip, false, false);
            }
            customTooltip.visible = true;

            this.updateCustomTooltip(customTooltip, entityIndex, abilityIndex, abilityData);
        } else {
            const customTooltip = tooltipContents.FindChildTraverse("CustomTooltip");
            if (customTooltip) {
                customTooltip.visible = false;
            }
        }

        tooltipContents.style.width = isCustom ? "360px" : null;
        tooltipContents.style.backgroundColor = isCustom ? "#10171c" : null;
    }

    private hideAbilityTooltip(): void {
        this.hideTooltipScheduler = undefined;

        this.tooltipData = {};

        const tooltipContents = this.findTooltipPanel("Contents");
        if (!tooltipContents) return;

        const details = tooltipContents.FindChildTraverse("AbilityDetails");
        const customTooltip = tooltipContents.FindChildTraverse("CustomTooltip");

        if (customTooltip) {
            customTooltip.visible = false;
        }

        tooltipContents.SetHasClass("AbilityContents", true);

        if (details) {
            details.visible = true;
        }
    }

    private refreshAbilityTooltip(): void {
        const { abilityName, abilityOwner, abilityButton } = this.tooltipData;
        
        if (abilityName === undefined || abilityOwner === undefined || abilityButton === undefined) return;
        
        $.DispatchEvent("DOTAShowAbilityTooltipForEntityIndex", abilityButton, abilityName, abilityOwner);

        $.Schedule(0.1, () => {
            if (abilityButton && abilityButton.IsValid() && !abilityButton.BHasHoverStyle()) {
                $.DispatchEvent("DOTAHideAbilityTooltip", abilityButton);
            }
        });
    }

    private updateCustomTooltip(tooltip: Panel, owner: EntityIndex, abilityIndex: AbilityEntityIndex, abilityData: AbilitiesKeyValueTable): void {
        const abilityName = Abilities.GetAbilityName(abilityIndex);
        const level = Entities.GetTeamNumber(owner) === Entities.GetTeamNumber(this.localEntity)
            ? Abilities.GetLevel(abilityIndex)
            : -1;

        tooltip.SetHasClass("IsAbility", true);
        tooltip.SetHasClass("ShowExtraDescription", GameUI.IsAltDown());

        this.renderHeader(tooltip, abilityIndex, abilityName, level);
        this.renderTargetInfo(tooltip, abilityData);
        this.renderDescription(tooltip, owner, abilityName, level, abilityData.values);
        this.renderExtraDescription(tooltip, owner, abilityName, level, abilityData.values);
        this.renderCharges(tooltip, owner, level, abilityData.values);
        this.renderExtraAttributes(tooltip, owner, abilityName, level, abilityData.values);
        this.renderCooldownAndManacost(tooltip, owner, level, abilityData.values);
        this.renderLore(tooltip, abilityName);

        this.stopTick();
        this.startTick();
    }

    // --- Render Methods --- //

    private renderHeader(tooltip: Panel, abilityIndex: AbilityEntityIndex, abilityName: string, abilityLevel: number): void {
        const prefix = `DOTA_Tooltip_Ability_${abilityName}`;

        tooltip.SetDialogVariableLocString("name", prefix);
        tooltip.SetDialogVariable("level", abilityLevel === -1 ? "?" : abilityLevel.toString());

        // TODO: add support for cooldown & manacost reductions

        const manaCost = Abilities.GetManaCost(abilityIndex);
        const cooldown = Abilities.GetCooldown(abilityIndex);

        const manaCostLabel = tooltip.FindChildTraverse("CurrentAbilityManaCost") as LabelPanel | null;
        if (manaCostLabel) manaCostLabel.SetHasClass("Hidden", manaCost === 0 || abilityLevel === -1);

        const cooldownLabel = tooltip.FindChildTraverse("CurrentAbilityCooldown") as LabelPanel | null;
        if (cooldownLabel) cooldownLabel.SetHasClass("Hidden", cooldown === 0 || abilityLevel === -1);

        tooltip.SetDialogVariable("current_manacost", manaCost.toFixed(0));
        tooltip.SetDialogVariable("current_cooldown", cooldown.toFixed(0));
    }

    private renderTargetInfo(tooltip: Panel, abilityData: AbilitiesKeyValueTable): void {
        const setOptionalVariable = (labelId: string, dialogVariable: string, value: string | undefined): void => {
            const label = tooltip.FindChildTraverse(labelId);
            if (label) {
                const hasValue = value !== undefined;
                label.SetHasClass("Hidden", !hasValue);

                if (hasValue) {
                    tooltip.SetDialogVariableLocString(dialogVariable, value);
                }
            }
        };

        const behavior = this.getBehaviorString(abilityData.behavior);
        setOptionalVariable("AbilityCastType", "casttype", behavior);

        const targetType = this.getTargetTypeString(abilityData.targetTeam, abilityData.targetType);
        setOptionalVariable("AbilityTargetType", "targettype", targetType);

        const damageType = this.getDamageTypeString(abilityData.damageType);
        setOptionalVariable("AbilityDamageType", "damagetype", damageType);

        const spellImmunity = this.getSpellImmunityString(abilityData.immunityType);
        setOptionalVariable("AbilitySpellImmunityType", "spellimmunity", spellImmunity);

        const dispellableType = this.getDispellableTypeString(abilityData.dispellableType);
        setOptionalVariable("AbilityDispelType", "dispeltype", dispellableType);
    }

    private renderDescription(
        tooltip: Panel,
        abilityCaster: EntityIndex,
        abilityName: string,
        abilityLevel: number,
        values: Record<string, ProcessedAbilityValue>
    ): void {
        const container = tooltip.FindChildTraverse("AbilityDescriptionContainer");
        if (!container) return;

        container.RemoveAndDeleteChildren();

        const key = `DOTA_Tooltip_Ability_${abilityName}_Description`;
        if ($.IsTranslatable(key)) {
            const rawDescription = $.Localize(key);
            const formatted = this.formatTooltipString(rawDescription, abilityCaster, abilityLevel, values);
            $.CreatePanel("Label", container, "", { text: formatted, html: true });
        }
    }

    private renderExtraDescription(
        tooltip: Panel,
        abilityCaster: EntityIndex,
        abilityName: string,
        abilityLevel: number,
        values: Record<string, ProcessedAbilityValue>
    ): void {
        const prefix = `DOTA_Tooltip_Ability_${abilityName}_Note`;

        const notes: string[] = [];

        for (let i = 0; i < MAX_NOTES; i++) {
            const key = prefix + i;
            if (!$.IsTranslatable(key)) break;

            const rawNote = $.Localize(key);
            notes.push(this.formatTooltipString(rawNote, abilityCaster, abilityLevel, values));
        }

        const label = tooltip.FindChildTraverse("AbilityExtraDescription");
        if (label) {
            const hasNotes = notes.length > 0;
            label.SetHasClass("Hidden", !hasNotes);

            if (hasNotes) {
                tooltip.SetDialogVariable("extradescription", notes.join("<br>"));
            }
        }
    }

    private renderCharges(
        tooltip: Panel,
        caster: EntityIndex,
        level: number,
        values: Record<string, ProcessedAbilityValue>
    ): void {
        this.setAbilityValueVariable(tooltip, caster, level, "AbilityCharges", "max_charges", values.AbilityCharges);
        this.setAbilityValueVariable(tooltip, caster, level, "AbilityCharges", "charge_restore_time", values.AbilityChargeRestoreTime);
    }

    private renderExtraAttributes(
        tooltip: Panel,
        caster: EntityIndex,
        abilityName: string,
        level: number,
        values: Record<string, ProcessedAbilityValue>
    ): void {
        const prefix = `DOTA_Tooltip_Ability_${abilityName}_`;
        
        const portraitUnit = Players.GetLocalPlayerPortraitUnit();
        const hasShard = Entities.HasShard(portraitUnit);
        const hasScepter = Entities.HasScepter(portraitUnit);

        const attributes = Object.entries(values)
            .filter(([key, { requiresShard, requiresScepter }]) =>
                $.IsTranslatable(prefix + key) &&
                (!requiresShard || hasShard) &&
                (!requiresScepter || hasScepter)
            )
            .sort(([, a], [, b]) => a.index - b.index)
            .map(([key, { value, requiresShard, requiresScepter, specialBonus }]) => {
                const localizedKey = $.Localize(prefix + key);
                const isPercentage = localizedKey.startsWith("%");
                
                const specialKey = isPercentage ? localizedKey.slice(1) : localizedKey;
                const parsedValue = this.parseSpecialValue({ value, specialBonus, caster, level, isPercentage });
                
                const result = `${specialKey} <span class="GameplayValues">${parsedValue}</span>`;

                return (requiresShard || requiresScepter)
                    ? `<span class="ScepterUpgrade">${result}</span>`
                    : result;
            })
            .join("<br>");

        const label = tooltip.FindChildTraverse("AbilityExtraAttributes");
        if (label) {
            const hasAttributes = attributes.length > 0;
            label.SetHasClass("Hidden", !hasAttributes);

            if (hasAttributes) {
                tooltip.SetDialogVariable("extra_attributes", attributes);
            }
        }
    }

    private renderCooldownAndManacost(
        tooltip: Panel,
        caster: EntityIndex,
        level: number,
        values: Record<string, ProcessedAbilityValue>
    ): void {
        const cooldownValue = values.AbilityCooldown || values.AbilityChargeRestoreTime;
        this.setAbilityValueVariable(tooltip, caster, level, "AbilityCooldown", "cooldown", cooldownValue);
        this.setAbilityValueVariable(tooltip, caster, level, "AbilityManaCost", "manacost", values.AbilityManaCost);
    }

    private renderLore(tooltip: Panel, abilityName: string): void {
        const key = `DOTA_Tooltip_Ability_${abilityName}_Lore`;

        const label = tooltip.FindChildTraverse("AbilityLore");
        if (label) {
            const hasLore = $.IsTranslatable(key);
            label.SetHasClass("Hidden", !hasLore);

            if (hasLore) {
                tooltip.SetDialogVariableLocString("lore", key);
            }
        }
    }

    private setAbilityValueVariable(
        tooltip: Panel,
        caster: EntityIndex,
        level: number,
        panelId: string,
        variableId: string,
        value: ProcessedAbilityValue | undefined
    ): void {
        const cooldownLabel = tooltip.FindChildTraverse(panelId);
        if (cooldownLabel) {
            cooldownLabel.SetHasClass("Hidden", !value);
            if (!value) return;

            const parsedValue = this.parseSpecialValue({
                value: value.value,
                specialBonus: value.specialBonus,
                caster,
                level
            });

            if (parsedValue) {
                tooltip.SetDialogVariable(variableId, parsedValue);
            }
        }
    }

    // --- Tick Logic --- //

    private stopTick(): void {
        if (this.tickScheduler) {
            $.CancelScheduled(this.tickScheduler);

            this.tickScheduler = undefined;
        }

        this.isAltDown = GameUI.IsAltDown();
    }

    private startTick(): void {
        const altDown = GameUI.IsAltDown();

        if (this.isAltDown !== altDown) {
            this.refreshAbilityTooltip();

            this.isAltDown = altDown;
        }

        this.tickScheduler = $.Schedule(0.03, () => this.startTick());
    }

    // --- Formatting Utilities --- //

    private formatTooltipString(
        rawText: string,
        caster: EntityIndex,
        level: number,
        keyValues: Record<string, ProcessedAbilityValue>
    ): string {
        return rawText.replace(/%([^%]+)%(%%)?/g, (match, key, percentageMarker) => {
            if (key in keyValues) {
                const isPercentage = !!percentageMarker;
                const data = keyValues[key];
                
                if (data) {
                    const parsedValues = this.parseSpecialValue({
                        value: data.value,
                        specialBonus: data.specialBonus,
                        caster,
                        level,
                        isDescription: true,
                        isPercentage
                    });

                    if (parsedValues)
                        return parsedValues;
                }

                return match;
            }

            return match;
        });
    }

    private parseSpecialValue(config: ParseValueConfig): string | undefined {
        const { value, specialBonus, caster, level, isDescription, isPercentage } = config;
        
        if (!value) return undefined;
        
        const percentSymbol = isPercentage ? "%" : "";
        
        const values = value.split(" ").map(v => {
            let numValue = parseFloat(v);
            if (specialBonus && caster && Entities.HasTalent(caster, specialBonus.name)) {
                numValue += specialBonus.value;
            }

            return formatValue(numValue) + percentSymbol;
        });

        if (level > 0) {
            const activeIndex = Math.max(0, Math.min(level - 1, values.length - 1));
            values[activeIndex] = `<span class="GameplayVariable">${values[activeIndex]}</span>`;
        } else if (isDescription && values.length === 1) {
            values[0] = `<span class="GameplayVariable">${values[0]}</span>`;
        }

        return `<span class="GameplayValues">${values.join(" / ")}</span>`;
    }
    
    // --- Localization Key Getters --- //

    private getBehaviorString(behavior: number): string | undefined {
        const behaviors: [DOTA_ABILITY_BEHAVIOR, string][] = [
            [DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_CHANNELLED, "DOTA_ToolTip_Ability_Channeled"],
            [DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_TOGGLE, "DOTA_ToolTip_Ability_Toggle"],
            [DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_AUTOCAST, "DOTA_ToolTip_Ability_NoTarget"],
            [DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_AURA, "DOTA_ToolTip_Ability_Aura"],
            [DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_UNIT_TARGET | DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_POINT, "DOTA_ToolTip_Ability_UnitOrPoint_Target"],
            [DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_NO_TARGET, "DOTA_ToolTip_Ability_NoTarget"],
            [DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_PASSIVE, "DOTA_ToolTip_Ability_Passive"],
            [DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_UNIT_TARGET, "DOTA_ToolTip_Ability_Target"],
            [DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_POINT, "DOTA_ToolTip_Ability_Point"],
        ];

        for (const [key, value] of behaviors) {
            if (flagExist(behavior, key)) return value;
        }
        
        return undefined;
    }

    private getDamageTypeString(damageType: DAMAGE_TYPES): string | undefined {
        const map: Partial<Record<DAMAGE_TYPES, string>> = {
            [DAMAGE_TYPES.DAMAGE_TYPE_PHYSICAL]: "DOTA_ToolTip_Damage_Physical",
            [DAMAGE_TYPES.DAMAGE_TYPE_MAGICAL]: "DOTA_ToolTip_Damage_Magical",
            [DAMAGE_TYPES.DAMAGE_TYPE_PURE]: "DOTA_ToolTip_Damage_Pure",
        };

        return map[damageType];
    }

    private getTargetTypeString(targetTeam: DOTA_UNIT_TARGET_TEAM, targetType: DOTA_UNIT_TARGET_TYPE): string | undefined {
        const hero = DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_HERO;
        const creep = DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_CREEP;
        const basic = DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_BASIC;
        const building = DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_BUILDING;
        const all = DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_ALL;
        
        if (targetType === DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_NONE) {
            if (targetTeam === DOTA_UNIT_TARGET_TEAM.DOTA_UNIT_TARGET_TEAM_ENEMY) {
                return "DOTA_ToolTip_Targeting_Enemy";
            } else if (targetTeam === DOTA_UNIT_TARGET_TEAM.DOTA_UNIT_TARGET_TEAM_FRIENDLY) {
                return "DOTA_ToolTip_Targeting_Allies";
            } else if (targetTeam === DOTA_UNIT_TARGET_TEAM.DOTA_UNIT_TARGET_TEAM_BOTH) {
                return "DOTA_ToolTip_Targeting_Units";
            }
        } else if (targetTeam === DOTA_UNIT_TARGET_TEAM.DOTA_UNIT_TARGET_TEAM_BOTH) {
            if (flagExist(targetType, hero | basic)) {
                return "DOTA_ToolTip_Targeting_Units";
            } else if (flagExist(targetType, all) || flagExist(targetType, basic) || flagExist(targetType, creep)) {
                return "DOTA_ToolTip_Targeting_Units";
            } else if (flagExist(targetType, hero)) {
                return "DOTA_Tooltip_Targeting_All_Heroes";
            }
        } else if (targetTeam === DOTA_UNIT_TARGET_TEAM.DOTA_UNIT_TARGET_TEAM_ENEMY) {
            if (flagExist(targetType, hero)) {
                if (flagExist(targetType, basic | building)) {
                    return "DOTA_ToolTip_Targeting_EnemyUnitsAndBuildings";
                } else if (flagExist(targetType, building)) {
                    return "DOTA_ToolTip_Targeting_EnemyUnitsAndBuildings";
                } else if (flagExist(targetType, basic)) {
                    return "DOTA_ToolTip_Targeting_EnemyUnits";
                } else {
                    return "DOTA_ToolTip_Targeting_EnemyHero";
                }
            } else if (flagExist(targetType, basic)) {
                return "DOTA_ToolTip_Targeting_EnemyCreeps";
            } else {
                return "DOTA_ToolTip_Targeting_Enemy";
            }
        } else if (targetTeam === DOTA_UNIT_TARGET_TEAM.DOTA_UNIT_TARGET_TEAM_FRIENDLY) {
            if (flagExist(targetType, hero)) {
                if (flagExist(targetType, basic | building)) {
                    return "DOTA_ToolTip_Targeting_AlliedUnitsAndBuildings";
                } else if (flagExist(targetType, building)) {
                    return "DOTA_ToolTip_Targeting_AlliedUnitsAndBuildings";
                } else if (flagExist(targetType, basic)) {
                    return "DOTA_ToolTip_Targeting_AlliedUnits";
                } else {
                    return "DOTA_ToolTip_Targeting_AlliedHeroes";
                }
            } else if (flagExist(targetType, basic)) {
                return "DOTA_ToolTip_Targeting_AlliedCreeps";
            } else {
                return "DOTA_ToolTip_Targeting_Allies";
            }
        } else {
            if (targetType === DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_TREE) {
                return "DOTA_ToolTip_Targeting_Trees";
            } else if (targetType === DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_SELF) {
                return "DOTA_ToolTip_Targeting_Self";
            } else {
                return undefined;
            }
        }
    }

    private getSpellImmunityString(spellImmunity: SpellImmunity): string | undefined {
        const map: Partial<Record<SpellImmunity, string>> = {
            [SpellImmunity.ENEMIES_NO]: "DOTA_ToolTip_PiercesSpellImmunity_No",
            [SpellImmunity.ALLIES_NO]: "DOTA_ToolTip_PiercesSpellImmunity_No",
            [SpellImmunity.ENEMIES_YES]: "DOTA_ToolTip_PiercesSpellImmunity_Yes",
            [SpellImmunity.ALLIES_YES]: "DOTA_ToolTip_PiercesSpellImmunity_Yes",
            [SpellImmunity.ALLIES_YES_ENEMIES_NO]: "DOTA_ToolTip_PiercesSpellImmunity_AlliesYesEnemiesNo",
        };

        return map[spellImmunity];
    }

    private getDispellableTypeString(dispellableType: SpellDispellable): string | undefined {
        const map: Partial<Record<SpellDispellable, string>> = {
            [SpellDispellable.NO]: "DOTA_ToolTip_Dispellable_No",
            [SpellDispellable.YES]: "DOTA_ToolTip_Dispellable_Yes_Soft",
            [SpellDispellable.YES_STRONG]: "DOTA_ToolTip_Dispellable_Yes_Strong",
        };

        return map[dispellableType];
    }
}

const abilityTooltip = new CustomAbilityTooltip();