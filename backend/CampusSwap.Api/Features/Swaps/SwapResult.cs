using Microsoft.AspNetCore.Mvc;

namespace CampusSwap.Api.Features.Swaps;

public enum SwapError
{
    None,
    NotFound,
    Forbidden,
    Conflict,
}

// Outcome of a swap action, without any HTTP details (so the service is easy to test)
public record SwapResult(SwapError Error, string? Message)
{
    public bool Succeeded => Error == SwapError.None;

    public static SwapResult Ok() => new(SwapError.None, null);
    public static SwapResult NotFound() => new(SwapError.NotFound, null);
    public static SwapResult Forbidden(string message) => new(SwapError.Forbidden, message);
    public static SwapResult Conflict(string message) => new(SwapError.Conflict, message);
}

public static class SwapResultExtensions
{
    // Turns a SwapResult into the matching HTTP response
    public static IActionResult ToActionResult(this ControllerBase controller, SwapResult result) => result.Error switch
    {
        SwapError.None => controller.NoContent(),
        SwapError.NotFound => controller.NotFound(),
        SwapError.Forbidden => controller.Problem(statusCode: StatusCodes.Status403Forbidden, title: result.Message),
        _ => controller.Problem(statusCode: StatusCodes.Status409Conflict, title: result.Message),
    };
}
