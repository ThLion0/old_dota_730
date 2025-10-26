
class CustomShop {
    private context: Panel = $.GetContextPanel();

    private searchTextEntry?: TextEntry;
    private searchResultContainer?: Panel;
    private searchContents?: Panel;
    private searchNoMatchesTitle?: Panel;

    private shopData?: CustomShopItems;
    private allItems?: string[];

    private isLargeShop: boolean = false;

    constructor() {
        this.loadShopData();

        this.hideElements();

        // this.setShopGrids();
        this.initLargeShopToggle();
        this.replaceSearchBox();

        this.refreshShop();

        this.registerEvents();
    }

    private loadShopData(): void {
        const shopData = CustomNetTables.GetTableValue("custom_shop", "items");
        if (!shopData) return;

        this.shopData = shopData;
        this.allItems = [];

        Object.values({...shopData.basics, ...shopData.upgrades})
            .forEach(
                ({ items }) => Object.keys(items)
                    .forEach((item) => this.allItems?.push(item))
            );
    }
    
    private registerEvents(): void {
        GameEvents.Subscribe("hud_flip_changed", () => {
            $.Schedule(Game.GetGameFrameTime(), () => this.refreshShop());
        });

        $.RegisterForUnhandledEvent("DOTAHUDShopClosed", () => this.closeShop());
    }

    private closeShop(): void {
        if (this.searchTextEntry) {
            this.searchTextEntry.text = "";
        }
    }

    private hideElements(): void {
        const shop = FindDotaHudElement("shop");
        if (shop) {
            const instruction = shop.FindChildrenWithClassTraverse("ItemContextMenuInstructionsContainer")[0] as Panel | undefined;
            if (instruction) {
                instruction.style.visibility = "collapse";
            }
        }

        const quickbuy = FindDotaHudElement("quickbuy");
        if (quickbuy) {
            Object.requireNonNull(
                quickbuy.FindChildTraverse("BuybackProtection")
            ).style.visibility = "collapse";
        }
    }

    private initLargeShopToggle(): void {
        const shop = FindDotaHudElement("shop");
        if (!shop) return;

        this.isLargeShop = shop.BHasClass("ShopLarge");

        const toggleShop = Object.requireNonNull(
            shop.FindChildTraverse("ToggleMinimalShop")
        );

        toggleShop.ClearPanelEvent("onactivate");

        toggleShop.SetPanelEvent("onactivate", () => {
            shop.SetHasClass("ShopLarge", !this.isLargeShop);
            this.isLargeShop = shop.BHasClass("ShopLarge");

            this.refreshShop();
        });
    }

    private replaceSearchBox(): void {
        const shop = FindDotaHudElement("shop");
        if (!shop) return;

        // Create search input

        const container = shop.FindChildTraverse("SearchAndButtonsContainer");
        if (container) {
            const button = container.FindChildTraverse("SearchContainer");
            if (!button) return;
    
            button.style.visibility = "collapse";
    
            container.FindChildrenWithClassTraverse("Custom_SearchContainer__DELETE")
                .forEach(c => c.DeleteAsync(0));

            const newButton = $.CreatePanel("Panel", this.context, "Custom_SearchContainer", {
                class: "Custom_SearchContainer__DELETE"
            });
            newButton.SetAcceptsFocus(true);
    
            const box = $.CreatePanel("Panel", newButton, "Custom_SearchBox");
    
            const searchIcon = $.CreatePanel("Panel", box, "Custom_ShopSearchIcon");
    
            const textEntry = $.CreatePanel("TextEntry", box, "Custom_SearchTextEntry");
            this.searchTextEntry = textEntry;

            $.CreatePanel("Label", textEntry, "Custom_PlaceholderText", {
                text: "#DOTA_Search"
            });
    
            const closeButton = $.CreatePanel("Button", box, "Custom_ClearSearchButton", {
                class: "CloseButton"
            });
    
            searchIcon.SetPanelEvent("onactivate", () => textEntry.SetFocus());
            closeButton.SetPanelEvent("onactivate", () => textEntry.text = "");
    
            textEntry.SetPanelEvent("ontextentrychange", () => this.onSearchInput(textEntry.text));
    
            newButton.SetParent(container);
            container.MoveChildAfter(newButton, button);
        }

        // Create search output

        const heightLimiter = shop.FindChildTraverse("HeightLimiter");
        if (heightLimiter) {
            const searchResults = heightLimiter.FindChildTraverse("SearchResults");
            if (!searchResults) return;

            this.searchResultContainer = searchResults;

            searchResults.style.marginTop = "55px";
            searchResults.style.paddingBottom = "6px";
            searchResults.style.paddingTop = "0px";
            searchResults.style.paddingLeft = "10px";
            searchResults.style.paddingRight = "10px";
            searchResults.style.backgroundColor = "#3f474d";

            const resultTitle = searchResults.FindChildTraverse("SearchResultsTitle");
            if (resultTitle) {
                resultTitle.style.fontSize = "14px";
                resultTitle.style.height = "14px";
                resultTitle.style.color = "white";
                resultTitle.style.marginRight = "0px";
                resultTitle.style.marginBottom = "6px";
                resultTitle.style.marginTop = "6px";
                resultTitle.style.letterSpacing = "2px";
            }

            const noMatchesTitle = searchResults.FindChildrenWithClassTraverse("SearchResultsNoMatches")[0] as Panel | undefined;
            if (noMatchesTitle) {
                this.searchNoMatchesTitle = noMatchesTitle;

                noMatchesTitle.style.fontSize = "15px";
                noMatchesTitle.style.marginBottom = "0px";
                noMatchesTitle.style.marginLeft = "0px";
                noMatchesTitle.style.marginRight = "0px";
                noMatchesTitle.style.paddingLeft = "2px";
            }

            const contents = searchResults.FindChildTraverse("SearchResultsContents");
            if (contents) {
                this.searchContents = contents;
    
                contents.style.height = "fit-children";

                contents.RemoveAndDeleteChildren();
            }
        }

        shop.SetHasClass("Custom_ShowSearchResults", false);
    }

    private onSearchInput(input: string): void {
        if (!this.allItems || this.allItems.length === 0) return;
        
        const shop = FindDotaHudElement("shop");
        if (!shop) return;

        shop.SetHasClass("Custom_ShowSearchResults", input.length > 0);

        if (!this.searchResultContainer || !this.searchContents || !this.searchNoMatchesTitle) return;

        this.searchResultContainer.SetHasClass("Hidden", input.length === 0);

        this.searchContents.RemoveAndDeleteChildren();

        const slicedItems = this.allItems
            .filter((itemName) => {
                const localized = $.LocalizeEngine("#DOTA_Tooltip_Ability_" + itemName);
                return localized.toLowerCase().includes(input);
            })
            .sort()
            .slice(0, 12);

        this.searchNoMatchesTitle.style.visibility = slicedItems.length === 0 ? "visible" : "collapse";

        if (slicedItems.length > 0) {
            slicedItems.forEach(itemName => {
                const result = $.CreatePanel("Panel", this.context, "", {
                    class: "Custom_SearchResult",
                    hittest: false
                });
    
                const container = $.CreatePanel("Panel", result, "Custom_SearchResultContainer");
    
                // fake item
                $.CreatePanel("DOTAShopItem", result, "", {
                    style: objectToCSS({
                        "width": "100%",
                        "height": "26.172px",
                        "opacity": "0.00001"
                    }),
                    itemname: itemName,
                    hittest: true
                });
    
                // real item
                $.CreatePanel("DOTAShopItem", container, "ShopItem", {
                    style: objectToCSS({
                        "width": "36px",
                        "height": "width-percentage( 72.7% )",
                        "margin-bottom": "2px"
                    }),
                    itemname: itemName,
                    hittest: false
                });
    
                $.CreatePanel("Label", container, "ItemName", {
                    text: $.LocalizeEngine("#DOTA_Tooltip_Ability_" + itemName),
                    hittest: false
                });
    
                $.CreatePanel("Label", container, "ItemCost", {
                    style: objectToCSS({
                        "visibility": "visible"
                    }),
                    text: "228",
                    hittest: false
                });
        
                result.SetParent(this.searchContents!);
            });
        }

    }

    private refreshShop(): void {
        this.setShopGrids();

        this.applyOldStyles();
    }

    private applyOldStyles(): void {
        const shop = FindDotaHudElement("shop");
        if (!shop) return;

        const isFlipped = GameUI.IsHudFlipped();

        const shopWidth = "360px";
        const largeShopWidth = "400px";
        
        const width = this.isLargeShop ? largeShopWidth : shopWidth;

        const guidesButton = shop.FindChildTraverse("GuidesButton");
        if (guidesButton) {
            guidesButton.style.marginRight = isFlipped ? "0px" : width;
            guidesButton.style.marginLeft = isFlipped ? width : "0px";
        }

        Object.requireNonNull(
            shop.FindChildTraverse("GridShopHeaders")
        ).style.paddingRight = "10px";

        Object.requireNonNull(
            shop.FindChildTraverse("FilterContainer")
        ).style.width = "0";

        Object.requireNonNull(
            shop.FindChildTraverse("Main")
        ).style.width = width;

        Object.requireNonNull(
            shop.FindChildTraverse("ToggleShopFilter")
        ).style.visibility = "collapse";

        Object.requireNonNull(
            shop.FindChildTraverse("BuybackProtection")
        ).style.visibility = "collapse";

        const heightLimiter = shop.FindChildTraverse("HeightLimiter");
        if (heightLimiter) {
            heightLimiter.style.height = "650px";
            
            const container = heightLimiter.FindChildTraverse("HeightLimiterContainer");
            if (container) {
                container.style.backgroundColor = "transparent";
                container.style.backgroundImage = "url(\"file://{resources}/images/custom_game/bg_mainshop_psd.png\")";
                container.style.backgroundSize = "cover";
                container.style.backgroundRepeat = "no-repeat";
            }
        }

        const commonItems = shop.FindChildTraverse("CommonItems");
        if (commonItems) {
            commonItems.style.width = "100%";
            commonItems.style.visibility = "visible";
            
            const itemList = commonItems.FindChildTraverse("ItemList");
            if (itemList) {
                itemList.style.flowChildren = "right";
                itemList.style.horizontalAlign = "center";
            }
        }

        const commonItemTitle = shop.FindChildTraverse("CommonItemTitleContainer");
        if (commonItemTitle) {
            commonItemTitle.style.marginBottom = "3px";
            commonItemTitle.style.marginTop = "0px";

            const pinnedTitle = commonItemTitle.FindChildrenWithClassTraverse("CommonItemsTitle")[0] as LabelPanel | undefined;
            if (pinnedTitle) {
                pinnedTitle.style.fontSize = "15px";
                pinnedTitle.style.color = "#5b6872";
                pinnedTitle.style.marginBottom = "3px";
                pinnedTitle.style.fontWeight = "bold";
                pinnedTitle.style.letterSpacing = "2px";

                commonItemTitle.SetPanelEvent("onmouseover", () => pinnedTitle.style.color = "white");
                commonItemTitle.SetPanelEvent("onmouseout", () => pinnedTitle.style.color = "#5b6872");
            }
        }

        Object.requireNonNull(
            shop.FindChildTraverse("TeamItems")
        ).style.visibility = "collapse";

        const itemBuild = shop.FindChildTraverse("ItemBuild");
        if (itemBuild) {
            const container = itemBuild.FindChildrenWithClassTraverse("BuildHeaderContainer")[0] as Panel | undefined;
            if (container) {
                const label = container.FindChildTraverse("Browse") as LabelPanel | null;
                if (label) {
                    label.style.color = "#616f7b";
                    label.style.paddingLeft = "12px";
                    label.style.textAlign = "left";
                    label.style.textDecoration = "underline";

                    container.SetPanelEvent("onmouseover", () => label.style.color = "#8da1b1");
                    container.SetPanelEvent("onmouseout", () => label.style.color = "#616f7b");
                }
            }
        }

        Object.requireNonNull(
            shop.FindChildTraverse("ItemBuildBackground")
        ).style.visibility = "collapse";

        const guideContainer = shop.FindChildTraverse("GuideFlyoutContainer");
        if (guideContainer) {
            guideContainer.style.backgroundImage = "url(\"s2r://panorama/images/hud/reborn/bg_shop_guide_psd.vtex\")";
            guideContainer.style.backgroundPosition = "bottom";
            guideContainer.style.backgroundSize = "cover";
        }

        const gridMainContents = shop.FindChildTraverse("GridMainShopContents");
        if (gridMainContents) {
            gridMainContents.style.paddingLeft = "4px";
            gridMainContents.style.paddingRight = "2px";
        }
        
        const searchButton = shop.FindChildTraverse("SearchAndButtonsContainer");
        if (searchButton) {
            searchButton.style.paddingLeft = "0px";
        }
    }

    private setShopGrids(): void {
        if (!this.shopData) return;

        const shop = FindDotaHudElement("shop");
        if (!shop) return;

        const basicGrid = Object.requireNonNull(
            shop.FindChildTraverse("GridBasicItemsCategory")
        ).FindChildTraverse("GridBasicItems");

        this.createGridItems(basicGrid, this.shopData.basics);

        const upgradesGrid = Object.requireNonNull(
            shop.FindChildTraverse("GridUpgradesCategory")
        ).FindChildTraverse("GridUpgradeItems");
        
        this.createGridItems(upgradesGrid, this.shopData.upgrades);
    }

    private createGridItems(grid: Panel | null, data: CustomShopType): void {
        if (!grid) return;
        
        grid.RemoveAndDeleteChildren();

        const width = this.isLargeShop ? "42px" : "40px";

        Object.entries(data)
            .sort(([, a], [, b]) => a.index - b.index)
            .forEach(([name, { items }]) => {
                const row = $.CreatePanel("Panel", grid, "CustomShopItems_" + name, {
                    class: "ShopItemRowContainer"
                });
                row.style.marginTop = "0px";

                const header = $.CreatePanel("Label", row, "ShopItemsHeader", {
                    text: "#DOTA_SubShop_" + name
                });
                header.style.textShadow = "2px 2px 0px 2.0 black";

                const container = $.CreatePanel("Panel", row, "ShopItemsContainer");

                Object.entries(items)
                    .sort(([, a], [, b]) => a - b)
                    .forEach(([item]) => {
                        $.CreatePanel("DOTAShopItem", container, "", {
                            class: "MainShopItem",
                            style: objectToCSS({
                                "width": width,
                                "height": "width-percentage( 72.7% )",
                                "margin-top": "1px",
                                "margin-bottom": "1px",
                                "margin-right": "3px",
                                "margin-left": "2px"
                            }),
                            itemname: item
                        });
                    });
            });
    }
}

const customShop = new CustomShop();