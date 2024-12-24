import { ItemHelper } from "@spt/helpers/ItemHelper";
import { BaseClasses } from "@spt/models/enums/BaseClasses";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { container } from "tsyringe";

export class ItemHandler {

    public handle(logger: ILogger, database: IDatabaseTables): void {
        // Load the ItemHelper utility
        const itemHelper: ItemHelper = container.resolve<ItemHelper>("ItemHelper")
        // Create an array of all item IDs from the database
        const items = Object.values(database.templates.items)

        // Function to remove conflicting items from an item
        const removeConflictingItems = (item: any, itemParent: string, conditional: (item: any) => boolean = () => true) => {
            // Create a string array of conflicting items to be removed
            const conflictingItemsToRemove: string[] = []
            // Iterate over the conflicting items
            for (const conflictItem of item._props.ConflictingItems) {
                // Create a variable of the conflicting item's template
                const conflictingItem = itemHelper.getItem(conflictItem)[1]
                // Check if the conflicting item's parent matches and the conditional function is true
                if (conflictingItem._parent === itemParent && conditional(conflictingItem)) {
                    // Add the item to the removal list
                    conflictingItemsToRemove.push(conflictItem)

                    logger.debug(`[backend-modifier] removing item: '${conflictingItem._name}' from conflict list of item: '${item._name}'`)
                }
            }
            // Update the item's conflict list
            item._props.ConflictingItems = item._props.ConflictingItems.filter((item: string) => !conflictingItemsToRemove.includes(item))
        }

        // Iterate over every item present in the database
        for (const item of items) {
            // Check if the item is an iron sight
            if (itemHelper.isOfBaseclass(item._id, BaseClasses.IRON_SIGHT)) {
                // Normalize the ergonomics for each iron sight to +1
                item._props.Ergonomics = 1

                logger.debug(`[backend-modifier] set ergonomics of item: '${item._name}' to: '${item._props.Ergonomics}'`)
            }

            // Check if the item is headwear
            if (itemHelper.isOfBaseclass(item._id, BaseClasses.HEADWEAR)) {
                // Make sure the headwear doesn't have armor slots and has conflicting items
                if (item._props.Slots.length === 0 && item._props.ConflictingItems.length > 0) {
                    // Remove conflicting earpieces from the headwear
                    removeConflictingItems(item, BaseClasses.HEADPHONES)
                }
            }

            // Check if the item is an earpiece
            if (itemHelper.isOfBaseclass(item._id, BaseClasses.HEADPHONES)) {
                // Make sure the earpiece has conflicting items
                if (item._props.ConflictingItems.length > 0) {
                    // Remove conflicting headwear (that has no armor slots) from the earpiece
                    removeConflictingItems(item, BaseClasses.HEADWEAR, headwear => headwear._props.Slots.length === 0)
                }
            }
        }

        logger.info("[BackendModifier] Adjusted items")
    }
}