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

        // Create an array of all iron sights
        const _ironSight = items.filter(item => itemHelper.isOfBaseclass(item._id, BaseClasses.IRON_SIGHT))
        // Iterate over every iron sight
        for (const ironSight of _ironSight) {
            // Normalize each iron sight to give +1 ergo
            ironSight._props.Ergonomics = 1

            logger.debug("[backend-modifier] set Ergonomics of item: " + ironSight._name + " to: " + ironSight._props.Ergonomics)
        }

        // Create an array of all headwear
        const _headwear = items.filter(item => itemHelper.isOfBaseclass(item._id, BaseClasses.HEADWEAR))
        // Iterate over every piece of headwear
        for (const headwear of _headwear) {
            // Quick and dirty check to differentiate helmets and hats (we only want the hats)
            if (headwear._props.Slots.length !== 0) continue
            // Save some time if the headwear doesn't have any conflicts
            if (headwear._props.ConflictingItems.length === 0) continue

            // Create a new array to hold items we're removing from the conflict list
            const conflictingItemsToRemove: string[] = []
            // Speaking of those conflicts, iterate over them
            for (const conflictItem of headwear._props.ConflictingItems) {
                // Create a variable of an item template for each conflicting item
                const earpiece = itemHelper.getItem(conflictItem)[1]

                // Make sure the conflicting item is an earpiece
                if (earpiece._parent === BaseClasses.HEADPHONES) {
                    // Add the conflicting item to the list of items to remove
                    conflictingItemsToRemove.push(conflictItem)
                }
            }

            // Update the array, filtering out the removed items
            headwear._props.ConflictingItems = headwear._props.ConflictingItems.filter(item => !conflictingItemsToRemove.includes(item))
        }

        // Create an array of all earpieces
        const _earpieces = items.filter(item => itemHelper.isOfBaseclass(item._id, BaseClasses.HEADPHONES))
        // Iterate over every earpiece
        for (const earpiece of _earpieces) {
            // Save some time if the earpiece doesn't have any conflicts
            if (earpiece._props.ConflictingItems.length === 0) continue

            // Create a new array to hold items we're removing from the conflict list
            const conflictingItemsToRemove: string[] = []
            // Speaking of those conflicts, iterate over them
            for (const conflictingItem of earpiece._props.ConflictingItems) {
                // Create a variable of an item template for each conflicting item
                const headwear = itemHelper.getItem(conflictingItem)[1]

                // Make sure the conflicting item is headwear
                if (headwear._parent !== BaseClasses.HEADWEAR) continue
                // Quick and dirty check to differentiate helmets and hats (we only want the hats)
                if (headwear._props.Slots.length !== 0) continue

                // Add the conflicting item to the list of items to remove
                conflictingItemsToRemove.push(conflictingItem)
            }

            // Update the array, filtering out the removed items
            earpiece._props.ConflictingItems = earpiece._props.ConflictingItems.filter(item => !conflictingItemsToRemove.includes(item))
        }

        logger.info("[BackendModifier] Adjusted items")
    }
}