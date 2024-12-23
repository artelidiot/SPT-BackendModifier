import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables"
import { ILogger } from "@spt/models/spt/utils/ILogger"

export class HideoutHandler {

    public handle(logger: ILogger, database: IDatabaseTables): void {
        // Iterate over every hideout area
        database.hideout.areas.forEach(area => {
            // Iterate over the area's stages
            for (const stage in area.stages) {
                // Just in case
                if (stage === "0" || stage == null) continue

                // Make sure the construction time for the area isn't instantaneous
                if (area.stages[stage].constructionTime === 0) continue

                // Divide the construction time by 7
                area.stages[stage].constructionTime = area.stages[stage].constructionTime / 7

                logger.debug("[backend-modifier] set constructionTime to: " + area.stages[stage].constructionTime + " in stage: " + stage + " for area: " + area._id)
            }
        })

        logger.info("[BackendModifier] Adjusted hideout area construction times")
    }
}