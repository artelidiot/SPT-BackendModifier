import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod"
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod"
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables"
import { ILogger } from "@spt/models/spt/utils/ILogger"
import { ConfigServer } from "@spt/servers/ConfigServer"
import { DatabaseServer } from "@spt/servers/DatabaseServer"
import { DependencyContainer } from "tsyringe"
import { BotHandler } from "./handlers/BotHandler"
import { ConfigHandler } from "./handlers/ConfigHandler"
import { GlobalHandler } from "./handlers/GlobalHandler"
import { HideoutHandler } from "./handlers/HideoutHandler"
import { ItemHandler } from "./handlers/ItemHandler"

class Mod implements IPreSptLoadMod, IPostDBLoadMod {

    public preSptLoad(container: DependencyContainer): void {
        // Get the server's logger
        const logger = container.resolve<ILogger>("WinstonLogger")

        // Get the server's configuration files
        const configServer = container.resolve<ConfigServer>("ConfigServer")

        const configHandler = new ConfigHandler()
        configHandler.handle(logger, configServer)
    }

    public postDBLoad(container: DependencyContainer): void {
        // Get the server's logger
        const logger = container.resolve<ILogger>("WinstonLogger")

        // Get the server's database
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer")
        // Get all the in-memory json found in /assets/database
        const database: IDatabaseTables = databaseServer.getTables()

        const globalHandler = new GlobalHandler()
        globalHandler.handle(logger, database)

        const botHandler = new BotHandler()
        botHandler.handle(logger, database)

        const hideoutHandler = new HideoutHandler()
        hideoutHandler.handle(logger, database)

        const itemHandler = new ItemHandler()
        itemHandler.handle(logger, database)
    }
}

export const mod = new Mod();