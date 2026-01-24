using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Models.Spt.Mod;
using SPTarkov.Server.Core.Models.Utils;
using SPTarkov.Server.Core.Servers;
using SPTarkov.Server.Core.Services;

namespace BackendModifier;

public record ModMetadata : AbstractModMetadata
{

    public override string ModGuid { get; init; } = "me.artel.backendmodifier";
    public override string Name { get; init; } = "BackendModifier";
    public override string Author { get; init; } = "Artel";
    public override List<string>? Contributors { get; init; }
    public override SemanticVersioning.Version Version { get; init; } = new("1.0.0");
    public override SemanticVersioning.Range SptVersion { get; init; } = new("~4.0.0");
    public override List<string>? Incompatibilities { get; init; }
    public override Dictionary<string, SemanticVersioning.Range>? ModDependencies { get; init; }
    public override string? Url { get; init; } = "https://github.com/artelidiot/SPT-BackendModifier/";
    public override bool? IsBundleMod { get; init; } = false;
    public override string License { get; init; } = "MIT";
}

[Injectable(TypePriority = OnLoadOrder.PostDBModLoader + 1)]
public class ConfigModifier(ConfigServer configServer, ISptLogger<DatabaseModifier> logger) : IOnLoad
{

    private readonly CoreConfig _core = configServer.GetConfig<CoreConfig>();
    private readonly RagfairConfig _flea = configServer.GetConfig<RagfairConfig>();

    public Task OnLoad()
    {
        ModifyCore();
        ModifyFlea();

        return Task.CompletedTask;
    }

    private void ModifyCore()
    {
        // Collect the IDs of the bots we want to disable to a list
        var idsToRemove = _core.Features.ChatbotFeatures.Ids
            .Where(kvp => kvp.Key == "spt" || kvp.Key == "commando")
            .Select(kvp => kvp.Value)
            .ToList();

        // Iterate over said IDs and remove them
        foreach (var id in idsToRemove)
        {
            _core.Features.ChatbotFeatures.EnabledBots.Remove(id);
        }
    }

    private void ModifyFlea()
    {
        // Disable barter offers on the flea market
        _flea.Dynamic.Barter.ChancePercent = 0;

        // Disable pack offers on the flea market
        _flea.Dynamic.Pack.ChancePercent = 0;
    }
}

[Injectable(TypePriority = OnLoadOrder.PostDBModLoader + 1)]
public class DatabaseModifier(DatabaseService databaseService, ItemHelper itemHelper, ISptLogger<DatabaseModifier> logger) : IOnLoad
{

    public Task OnLoad()
    {
        ModifyBots();
        ModifyGlobals();
        ModifyHideout();
        ModifyItems();
        ModifyTemplates();

        return Task.CompletedTask;
    }

    private void ModifyBots()
    {
        var bots = databaseService.GetBots();

        const int MaxSkillProgress = 3000;

        // Iterate over the bot types
        foreach (var (_, botType) in bots.Types)
        {
            // Skip this bot if the type is null
            if (botType == null)
            {
                continue;
            }

            // Skip this bot if they don't have the BotSound skill
            // TODO: Modify BotReload as well?
            if (!botType.BotSkills.Common.TryGetValue(SkillTypes.BotSound.ToString(), out var skillData))
            {
                continue;
            }

            // Cap out the skill's minimum progress to 3000 (level 30)
            skillData.Min = Math.Min(skillData.Min, MaxSkillProgress);
            // Cap out the skill's maximum progress to 3000 (level 30)
            skillData.Max = Math.Min(skillData.Max, MaxSkillProgress);
        }
    }

    private void ModifyGlobals()
    {
        var globals = databaseService.GetGlobals();

        // Set the aiming drain rate to that of the range finder (50% slower)
        globals.Configuration.Stamina.AimDrainRate = globals.Configuration.Stamina.AimRangeFinderDrainRate;

        // Set the walking stamina drain weight limit to that of the critical weight limit
        globals.Configuration.Stamina.WalkOverweightLimits.X = globals.Configuration.Stamina.WalkOverweightLimits.Y;
    }

    private void ModifyHideout()
    {
        var hideout = databaseService.GetHideout();

        // Iterate over all hideout areas
        foreach (var area in hideout.Areas)
        {
            // Iterate over the stages (upgrades) for said area
            foreach (var (_, stage) in area.Stages ?? [])
            {
                // We don't need to do anything if the construction time is already instantaneous
                if (stage.ConstructionTime == 0)
                {
                    continue;
                }

                // Divide the construction time by 7
                stage.ConstructionTime /= 7;
            }
        }
    }

    private void ModifyItems()
    {
        var items = databaseService.GetItems();

        bool ItemHasSlots(MongoId id)
        {
            // Get the item from the database and check if it has any slots
            if (items.TryGetValue(id, out var item))
            {
                return item.Properties?.Slots?.Any() == true;
            }

            return false;
        }

        bool ShouldRemoveConflict(MongoId conflictingItemID, MongoId conflictingBaseClass, bool cosmeticOnly)
        {
            // The item isn't in the database, assume it's a modded item that hasn't been loaded yet and don't touch it
            if (!items.TryGetValue(conflictingItemID, out var template))
            {
                return false;
            }

            // Make sure the item matches the specified base class
            if (!itemHelper.IsOfBaseclass(conflictingItemID, conflictingBaseClass))
            {
                return false;
            }

            // Make sure the item has no slots if we're checking for cosmetics only
            if (cosmeticOnly)
            {
                return template.Properties?.Slots?.Any() != true;
            }

            return true;
        }

        // Iterate over all items
        foreach (var (id, item) in items)
        {
            // Make sure the item has properties
            var itemProperties = item.Properties;
            if (itemProperties == null)
            {
                continue;
            }

            // Normalize ergonomics to +1 for all iron sights
            if (itemHelper.IsOfBaseclass(id, BaseClasses.IRON_SIGHT))
            {
                itemProperties.Ergonomics = 1;
                continue;
            }

            // Remove conflicting ear pieces from all cosmetic headwear
            if (itemHelper.IsOfBaseclass(id, BaseClasses.HEADWEAR) && !ItemHasSlots(id))
            {
                itemProperties.ConflictingItems?.RemoveWhere(conflictingItem => ShouldRemoveConflict(conflictingItem, BaseClasses.HEADPHONES, false));
                continue;
            }

            // Remove conflicting cosmetic headwear from all ear pieces
            if (itemHelper.IsOfBaseclass(id, BaseClasses.HEADPHONES))
            {
                itemProperties.ConflictingItems?.RemoveWhere(conflictingItem => ShouldRemoveConflict(conflictingItem, BaseClasses.HEADWEAR, true));
                continue;
            }
        }
    }

    private void ModifyTemplates()
    {
        var templates = databaseService.GetTemplates();

        // Iterate over all quests
        foreach (var (_, quest) in templates.Quests)
        {
            // Iterate over the quest's conditions
            foreach (var condition in quest.Conditions.AvailableForStart ?? [])
            {
                // Make the quest available immediately
                condition.AvailableAfter = 0;
            }
        }
    }
}