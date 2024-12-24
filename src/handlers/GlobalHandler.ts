import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ILogger } from "@spt/models/spt/utils/ILogger";

export class GlobalHandler {

    public handle(logger: ILogger, database: IDatabaseTables): void {
        // Set the flea market to found-in-raid only
        database.globals.config.RagFair.isOnlyFoundInRaidAllowed = true
        logger.debug(`[backend-modifier] set 'isOnlyFoundInRaidAllowed' to: ${database.globals.config.RagFair.isOnlyFoundInRaidAllowed}`)
        logger.info("[BackendModifier] Set flea market to found-in-raid only")

        // Set the weapon stamina drain rate to match the range finder's stamina drain rate
        database.globals.config.Stamina.AimDrainRate = database.globals.config.Stamina.AimRangeFinderDrainRate
        logger.debug(`[backend-modifier] set 'AimDrainRate' to: ${database.globals.config.Stamina.AimDrainRate}`)
        logger.info("[BackendModifier] Adjusted aiming stamina drain rate")

        // Set the walking overweight limit to match the critical overweight limit
        // The 'x' value cannot be set higher than the 'y' value, otherwise you will lose stamina while walking even while underweight (EFT bug/quirk?)
        database.globals.config.Stamina.WalkOverweightLimits.x = database.globals.config.Stamina.WalkOverweightLimits.y
        logger.debug(`[backend-modifier] set 'WalkOverweightLimits.x' to: database.globals.config.Stamina.WalkOverweightLimits.x`)
        logger.info("[BackendModifier] Adjusted walking overweight limit")
    }
}