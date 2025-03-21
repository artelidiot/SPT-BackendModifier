import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { ICoreConfig } from "@spt/models/spt/config/ICoreConfig";
import { IRagfairConfig } from "@spt/models/spt/config/IRagfairConfig";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { ConfigServer } from "@spt/servers/ConfigServer";

export class ConfigHandler {

    public handle(logger: ILogger, configServer: ConfigServer): void {
        // Get the server's SPT_Data\Server\configs\core.json configuration file
        const coreConfig: ICoreConfig = configServer.getConfig<ICoreConfig>(ConfigTypes.CORE)
        // Get the server's SPT_Data\Server\configs\ragfair.json configuration file
        const fleaConfig: IRagfairConfig = configServer.getConfig<IRagfairConfig>(ConfigTypes.RAGFAIR)

        // Disable the Commando chat bot's give command
        coreConfig.features.chatbotFeatures.commandoFeatures.giveCommandEnabled = false
        logger.debug(`[backend-modifier] set 'commandoFeatures.giveCommandEnabled' to: ${coreConfig.features.chatbotFeatures.commandoFeatures.giveCommandEnabled}`)
        // Disable the SPT chat bot's gifts
        coreConfig.features.chatbotFeatures.sptFriendGiftsEnabled = false
        logger.debug(`[backend-modifier] set 'sptFriendGiftsEnabled' to: ${coreConfig.features.chatbotFeatures.sptFriendGiftsEnabled}`)

        // Iterate over the chat bot definitions
        for (const [label, id] of Object.entries(coreConfig.features.chatbotFeatures.ids)) {
            // Make sure the chat bot is the one we want
            if (label === "spt" || label === "commando") {
                // Set its enabled status to false
                coreConfig.features.chatbotFeatures.enabledBots[id] = false
                logger.debug(`[backend-modifier] disabled chat bot: '${label}'`)
            }
        }

        logger.info("[BackendModifier] Disabled the SPT and Commando chat bots")

        // Disable barter offers on the flea market
        fleaConfig.dynamic.barter.chancePercent = 0
        logger.debug(`[backend-modifier] set 'barter.chancePercent' to: ${fleaConfig.dynamic.barter.chancePercent}`)
        // Disable pack offers on the flea market
        fleaConfig.dynamic.pack.chancePercent = 0
        logger.debug(`[backend-modifier] set 'pack.chancePercent' to: ${fleaConfig.dynamic.pack.chancePercent}`)

        logger.info("[BackendModifier] Disabled flea market barters and packs")
    }
}