import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { ICoreConfig } from "@spt/models/spt/config/ICoreConfig";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { ConfigServer } from "@spt/servers/ConfigServer";

export class ConfigHandler {

    public handle(logger: ILogger, configServer: ConfigServer): void {
        // Get the server's SPT_Data\Server\configs\core.json configuration file
        const coreConfig: ICoreConfig = configServer.getConfig<ICoreConfig>(ConfigTypes.CORE)

        // Disable the Commando chat bot
        coreConfig.features.chatbotFeatures.commandoEnabled = false
        logger.debug(`[backend-modifier] set 'commandoEnabled' to: ${coreConfig.features.chatbotFeatures.commandoEnabled}`)
        coreConfig.features.chatbotFeatures.commandoFeatures.giveCommandEnabled = false
        logger.debug(`[backend-modifier] set 'commandoFeatures.giveCommandEnabled' to: ${coreConfig.features.chatbotFeatures.commandoFeatures.giveCommandEnabled}`)
        logger.info("[BackendModifier] Disabled the Commando chat bot")

        // Disable the SPT chat bot
        coreConfig.features.chatbotFeatures.sptFriendEnabled = false
        logger.debug(`[backend-modifier] set 'sptFriendEnabled' to: ${coreConfig.features.chatbotFeatures.sptFriendEnabled}`)
        coreConfig.features.chatbotFeatures.sptFriendGiftsEnabled = false
        logger.debug(`[backend-modifier] set 'sptFriendGiftsEnabled' to: ${coreConfig.features.chatbotFeatures.sptFriendGiftsEnabled}`)
        logger.info("[BackendModifier] Disabled the SPT chat bot")
    }
}