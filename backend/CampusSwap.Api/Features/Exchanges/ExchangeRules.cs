using CampusSwap.Api.Entities;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace CampusSwap.Api.Features.Exchanges;

// Rules shared by listings and offers for the four kinds of exchange
public static class ExchangeRules
{
    // Physical items need photos; for skills, services and experiences they are optional
    public static int MinPhotos(ExchangeType type) => type == ExchangeType.Item ? 1 : 0;

    // Physical items need a category and a condition. Adds errors to modelState when they are missing.
    public static void ValidateDetails(
        ExchangeType type, ItemCategory? category, ItemCondition? condition, ModelStateDictionary modelState)
    {
        if (type != ExchangeType.Item)
            return;

        if (category is null)
            modelState.AddModelError("Category", "Please choose a category.");
        if (condition is null)
            modelState.AddModelError("Condition", "Please choose the condition.");
    }

    // Category and condition are kept for physical items only
    public static (ItemCategory? Category, ItemCondition? Condition) DetailsFor(
        ExchangeType type, ItemCategory? category, ItemCondition? condition)
        => type == ExchangeType.Item ? (category, condition) : (null, null);
}
