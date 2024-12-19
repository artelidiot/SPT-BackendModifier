import { DependencyContainer } from "tsyringe";

import { BaseClasses } from "@spt/models/enums/BaseClasses";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { ICoreConfig } from "@spt/models/spt/config/ICoreConfig";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { ItemHelper } from "@spt/helpers/ItemHelper";
import { SkillTypes } from "@spt/models/enums/SkillTypes";

class Mod implements IPreSptLoadMod, IPostDBLoadMod {

    public preSptLoad(container: DependencyContainer): void {
        // Get the server's logger
        const logger = container.resolve<ILogger>("WinstonLogger")

        // Get the server's configuration files
        const configServer = container.resolve<ConfigServer>("ConfigServer")
        // Get the server's SPT_Data\Server\configs\core.json configuration file
        const coreConfig: ICoreConfig = configServer.getConfig<ICoreConfig>(ConfigTypes.CORE)

        // Disable the Commando chat bot
        coreConfig.features.chatbotFeatures.commandoEnabled = false
        logger.debug("[backend-modifier] set commandoEnabled to: " + coreConfig.features.chatbotFeatures.commandoEnabled)
        coreConfig.features.chatbotFeatures.commandoFeatures.giveCommandEnabled = false
        logger.debug("[backend-modifier] set commandoFeatures.giveCommandEnabled to: " + coreConfig.features.chatbotFeatures.commandoFeatures.giveCommandEnabled)
        logger.info("[BackendModifier] Disabled the Commando chat bot")

        // Disable the SPT chat bot
        coreConfig.features.chatbotFeatures.sptFriendEnabled = false
        logger.debug("[backend-modifier] set sptFriendEnabled to: " + coreConfig.features.chatbotFeatures.sptFriendEnabled)
        coreConfig.features.chatbotFeatures.sptFriendGiftsEnabled = false
        logger.debug("[backend-modifier] set sptFriendGiftsEnabled to: " + coreConfig.features.chatbotFeatures.sptFriendGiftsEnabled)
        logger.info("[BackendModifier] Disabled the SPT chat bot")
    }

    public postDBLoad(container: DependencyContainer): void {
        // Get the server's logger
        const logger = container.resolve<ILogger>("WinstonLogger")

        // Get the server's database
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer")
        // Get all the in-memory json found in /assets/database
        const database: IDatabaseTables = databaseServer.getTables()

        // Set the flea market to found-in-raid only
        database.globals.config.RagFair.isOnlyFoundInRaidAllowed = true
        logger.debug("[backend-modifier] set isOnlyFoundInRaidAllowed to: " + database.globals.config.RagFair.isOnlyFoundInRaidAllowed)
        logger.info("[BackendModifier] Set flea market to found-in-raid only")

        // Set the weapon stamina drain rate to match the range finder's stamina drain rate
        database.globals.config.Stamina.AimDrainRate = database.globals.config.Stamina.AimRangeFinderDrainRate
        logger.debug("[backend-modifier] set AimDrainRate to: " + database.globals.config.Stamina.AimDrainRate)
        logger.info("[BackendModifier] Adjusted aiming stamina drain rate")

        // Set the walking overweight limit to match the critical overweight limit
        // The 'x' value cannot be set higher than the 'y' value, otherwise you will lose stamina while walking even while underweight (EFT bug/quirk?)
        database.globals.config.Stamina.WalkOverweightLimits.x = database.globals.config.Stamina.WalkOverweightLimits.y
        logger.debug("[backend-modifier] set WalkOverweightLimits.x to: " + database.globals.config.Stamina.WalkOverweightLimits.x)
        logger.info("[BackendModifier] Adjusted walking overweight limit")

        // Iterate over all bot types
        for (const botType in database.bots.types) {
            // Iterate over any skills present
            for (const commonSkill in database.bots.types[botType].skills.Common) {
                // Make sure the skill type is BotSound
                if (commonSkill != SkillTypes.BOT_SOUND) continue

                // Check if the minimum skill progress is elite level (5100)
                if (database.bots.types[botType].skills.Common[commonSkill].min >= 5100) {
                    // Set the minimum skill progress to 3000
                    database.bots.types[botType].skills.Common[commonSkill].min = 3000
                    logger.debug("[backend-modifier] set minimum BotSound skill progress to: " + database.bots.types[botType].skills.Common[commonSkill].min + " for botType: " + botType)
                }

                // Check if the maximum skill progress is elite level (5100)
                if (database.bots.types[botType].skills.Common[commonSkill].max >= 5100) {
                    // Set the maximum skill progress to 3000
                    database.bots.types[botType].skills.Common[commonSkill].max = 3000
                    logger.debug("[backend-modifier] set maximum BotSound skill progress to: " + database.bots.types[botType].skills.Common[commonSkill].max + " for botType: " + botType)
                }
            }
        }
        logger.info("[BackendModifier] Adjusted bot skills")

        // Iterate over every hideout area
        database.hideout.areas.forEach(area => {
            // Iterate over the area's stages
            for (const stage in area.stages) {
                // Just in case
                if (stage == "0" || stage == null) continue

                // Make sure the construction time for the area isn't instantaneous
                if (area.stages[stage].constructionTime == 0) continue

                // Divide the construction time by 7
                area.stages[stage].constructionTime = area.stages[stage].constructionTime / 7
                logger.debug("[backend-modifier] set constructionTime to: " + area.stages[stage].constructionTime + " in stage: " + stage + " for area: " + area._id)
            }
        })
        logger.info("[BackendModifier] Adjusted hideout area construction times")

        // Load the ItemHelper utility
        const itemHelper: ItemHelper = container.resolve<ItemHelper>("ItemHelper")
        // Obtain all items from the database as an array (rather than a keyed pair)
        const items = Object.values(database.templates.items)

        // Create an array of all iron sights in the game
        const ironSights = items.filter(item => itemHelper.isOfBaseclass(item._id, BaseClasses.IRON_SIGHT))
        // Iterate over each iron sight and set its ergonomics value to +1
        for (const ironSight of ironSights) {
            ironSight._props.Ergonomics = 1
            logger.debug("[backend-modifier] set ergonomics of item: " + ironSight._id + " to: " + ironSight._props.Ergonomics)
        }
        logger.info("[BackendModifier] Adjusted items")
    }
}

export const mod = new Mod();