import { SkillTypes } from "@spt/models/enums/SkillTypes";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ILogger } from "@spt/models/spt/utils/ILogger";

export class BotHandler {

    public handle(logger: ILogger, database: IDatabaseTables): void {
        // Iterate over all bot types
        for (const botType in database.bots.types) {
            // Iterate over any skills present
            for (const commonSkill in database.bots.types[botType].skills.Common) {
                // Make sure the skill type is BotSound
                if (commonSkill !== SkillTypes.BOT_SOUND) continue

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
    }
}