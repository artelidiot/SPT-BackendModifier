import { SkillTypes } from "@spt/models/enums/SkillTypes";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ILogger } from "@spt/models/spt/utils/ILogger";

export class BotHandler {

    public handle(logger: ILogger, database: IDatabaseTables): void {

        // Iterate over all bots and their associated data
        for (const [botType, botData] of Object.entries(database.bots.types)) {
            // Iterate over each bots skills
            for (const [commonSkill, skillData] of Object.entries(botData.skills.Common)) {
                // We're only interested in the BotSound skill
                if (commonSkill === SkillTypes.BOT_SOUND) {
                    // Create a function that adjusts elite values (5100) to 3000 without modifying non-elite values
                    const updateSkill = (value: number) => (value >= 5100 ? 3000 : value)
                    // Apply the function to the min and max values
                    skillData.min = updateSkill(skillData.min)
                    skillData.max = updateSkill(skillData.max)

                    logger.debug(`[backend-modifier] set progress for skill: '${commonSkill}' to '${skillData.min}', '${skillData.max}' for bot: '${botType}'`)
                }
            }
        }

        logger.info("[BackendModifier] Adjusted bot skills")
    }
}