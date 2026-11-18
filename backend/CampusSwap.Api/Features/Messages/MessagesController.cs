using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using CampusSwap.Api.Data;
using CampusSwap.Api.Entities;
using CampusSwap.Api.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Api.Features.Messages;

public record SendMessageRequest([Required, MaxLength(2000)] string Body);

public record ChatMessageDto(
    int Id,
    int SenderId,
    string SenderName,
    string Body,
    DateTime SentAt,
    bool IsMine);

// Chat between the listing owner and the student whose offer was accepted.
// Nobody else can read or write these messages.
[ApiController]
[Authorize]
[Route("api/offers/{offerId:int}/messages")]
public class MessagesController(AppDbContext db) : ControllerBase
{
    // afterId lets the browser ask only for new messages ("anything newer than #42?")
    [HttpGet]
    public async Task<ActionResult<List<ChatMessageDto>>> Get(
        int offerId, [FromQuery] int afterId = 0, CancellationToken ct = default)
    {
        var studentId = User.GetStudentId();

        var access = await GetAccessAsync(offerId, studentId, ct);
        if (access is null)
            return NotFound();
        if (!access.IsParticipant)
            return Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Only the two students in this swap can read these messages.");

        return await db.ChatMessages
            .AsNoTracking()
            .Where(m => m.OfferId == offerId && m.Id > afterId)
            .OrderBy(m => m.Id)
            .Select(m => new ChatMessageDto(
                m.Id,
                m.SenderId,
                m.Sender.DisplayName,
                m.Body,
                m.SentAt,
                m.SenderId == studentId))
            .ToListAsync(ct);
    }

    [HttpPost]
    public async Task<ActionResult<ChatMessageDto>> Send(int offerId, SendMessageRequest request, CancellationToken ct)
    {
        var studentId = User.GetStudentId();

        var access = await GetAccessAsync(offerId, studentId, ct);
        if (access is null)
            return NotFound();
        if (!access.IsParticipant)
            return Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Only the two students in this swap can send messages.");
        if (access.Status is not (OfferStatus.Accepted or OfferStatus.Completed))
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "You can message each other only while the swap is active.");

        var body = request.Body.Trim();
        if (body.Length == 0)
        {
            ModelState.AddModelError(nameof(request.Body), "Please write a message.");
            return ValidationProblem(ModelState);
        }

        var message = new ChatMessage { OfferId = offerId, SenderId = studentId, Body = body };
        db.ChatMessages.Add(message);
        await db.SaveChangesAsync(ct);

        var senderName = User.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
        return new ChatMessageDto(message.Id, studentId, senderName, message.Body, message.SentAt, IsMine: true);
    }

    private record OfferAccess(OfferStatus Status, bool IsParticipant);

    private Task<OfferAccess?> GetAccessAsync(int offerId, int studentId, CancellationToken ct)
        => db.SwapOffers
            .AsNoTracking()
            .Where(o => o.Id == offerId)
            .Select(o => new OfferAccess(o.Status, o.OfferedById == studentId || o.Listing.OwnerId == studentId))
            .FirstOrDefaultAsync(ct);
}
