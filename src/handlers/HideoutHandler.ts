import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ILogger } from "@spt/models/spt/utils/ILogger";

export class HideoutHandler {

    public handle(logger: ILogger, database: IDatabaseTables): void {

        // Iterate over every hideout area
        for (const area of database.hideout.areas) {
            // Iterate over the stages in said area
            for (const [stage, stageData] of Object.entries(area.stages)) {
                // Ensure the stage is valid and the construction time is not instantaneous
                if (stage === "0" || stageData?.constructionTime === 0) continue
                // Finally, divide the construction time by 7
                stageData.constructionTime /= 7

                logger.debug(`[backend-modifier] set 'constructionTime' to: '${stageData.constructionTime}' in stage: '${stage}' for area: '${area._id}'`)
            }
        }

        logger.info("[BackendModifier] Adjusted hideout area construction times")
    }
}