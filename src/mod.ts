import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { SkillTypes } from "@spt/models/enums/SkillTypes";

class Mod implements IPostDBLoadMod {

    public postDBLoad(container: DependencyContainer): void {
        // get database from server
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer")

        // Get all the in-memory json found in /assets/database
        const tables: IDatabaseTables = databaseServer.getTables()

        // get the logger from the server container
        const logger = container.resolve<ILogger>("WinstonLogger")

        // Set the walking overweight limit to match the obese limit, plus one
        tables.globals.config.Stamina.WalkOverweightLimits.x = tables.globals.config.Stamina.WalkOverweightLimits.y + 1
        logger.info("Adjusted walking overweight limit")

        // Set the aim drain rate to match that of the range finder's
        tables.globals.config.Stamina.AimDrainRate = tables.globals.config.Stamina.AimRangeFinderDrainRate
        logger.info("Adjusted aiming stamina drain rate")

        // Iterate over all bot types
        for (const botType in tables.bots.types) {
            // Iterate over any skills present
            for (const commonSkill in tables.bots.types[botType].skills.Common) {
                // Make sure the skill type is BotSound
                if (commonSkill != SkillTypes.BOT_SOUND) continue

                // Create a quick variable to clean up the code
                const botSoundSkill = tables.bots.types[botType].skills.Common[commonSkill];

                // Check if the minimum skill progress is elite level (5100)
                if (botSoundSkill.min >= 5100) {
                    // Set the minimum skill progress to 3000
                    botSoundSkill.min = 3000
                    logger.debug("set minimum BotSound skill progress to: " + 3000 + " for botType: " + botType)
                }

                // Check if the maximum skill progress is elite level (5100)
                if (botSoundSkill.max >= 5100) {
                    // Set the maximum skill progress to 3000
                    botSoundSkill.max = 5100
                    logger.debug("set maximum BotSound skill progress to: " + 3000 + " for botType: " + botType)
                }
            }
        }
        logger.info("Adjusted bot skills")

        // Iterate over every hideout area
        tables.hideout.areas.forEach(area => {
            // Iterate over the area's stages
            for (const stage in area.stages) {
                // Just in case
                if (stage == "0" || stage == null) continue

                // Make sure the construction time for the area isn't instantaneous
                if (area.stages[stage].constructionTime == 0) continue

                // Divide the construction time by 7
                area.stages[stage].constructionTime = area.stages[stage].constructionTime / 7
                logger.debug("set constructionTime to: " + area.stages[stage].constructionTime + " in stage: " + stage + " for area: " + area._id)
            }
        })
        logger.info("Adjusted hideout area construction times")
    }
}

export const mod = new Mod();