using CampusSwap.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Student> Students => Set<Student>();
    public DbSet<EmailVerification> EmailVerifications => Set<EmailVerification>();
    public DbSet<StudentSession> StudentSessions => Set<StudentSession>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<ItemPhoto> ItemPhotos => Set<ItemPhoto>();
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<SwapOffer> SwapOffers => Set<SwapOffer>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<Student>(e =>
        {
            e.Property(s => s.Email).HasMaxLength(254);
            e.Property(s => s.DisplayName).HasMaxLength(50);
            e.HasIndex(s => s.Email).IsUnique();   // one account per university email
        });

        builder.Entity<EmailVerification>(e =>
        {
            e.Property(v => v.Email).HasMaxLength(254);
            e.Property(v => v.CodeHash).HasMaxLength(64);
            e.HasIndex(v => new { v.Email, v.CreatedAt });   // fast lookup of the latest code
        });

        builder.Entity<StudentSession>(e =>
        {
            e.Property(s => s.TokenHash).HasMaxLength(64);
            e.HasIndex(s => s.TokenHash).IsUnique();

            e.HasOne(s => s.Student)
             .WithMany()
             .HasForeignKey(s => s.StudentId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Item>(e =>
        {
            e.Property(i => i.Name).HasMaxLength(100);
            e.Property(i => i.Description).HasMaxLength(2000);
            e.Property(i => i.Category).HasConversion<string>().HasMaxLength(20);
            e.Property(i => i.Condition).HasConversion<string>().HasMaxLength(20);
            e.Property(i => i.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(i => i.Version).IsRowVersion();

            e.HasOne(i => i.Owner)
             .WithMany(s => s.Items)
             .HasForeignKey(i => i.OwnerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<ItemPhoto>(e =>
        {
            e.Property(p => p.Url).HasMaxLength(500);

            e.HasOne(p => p.Item)
             .WithMany(i => i.Photos)
             .HasForeignKey(p => p.ItemId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Listing>(e =>
        {
            e.Property(l => l.WantedDescription).HasMaxLength(500);
            e.Property(l => l.MeetingLocation).HasMaxLength(200);
            e.Property(l => l.Status).HasConversion<string>().HasMaxLength(20);

            e.HasOne(l => l.Item)
             .WithMany()
             .HasForeignKey(l => l.ItemId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(l => l.Owner)
             .WithMany()
             .HasForeignKey(l => l.OwnerId)
             .OnDelete(DeleteBehavior.Restrict);

            // Business rule: an item can have only one active listing
            e.HasIndex(l => l.ItemId)
             .IsUnique()
             .HasFilter("\"Status\" IN ('Open', 'Reserved')");
        });

        builder.Entity<SwapOffer>(e =>
        {
            e.Property(o => o.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(o => o.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(o => o.Message).HasMaxLength(1000);

            e.HasOne(o => o.Listing)
             .WithMany(l => l.Offers)
             .HasForeignKey(o => o.ListingId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(o => o.OfferedBy)
             .WithMany()
             .HasForeignKey(o => o.OfferedById)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(o => o.OfferedItem)
             .WithMany()
             .HasForeignKey(o => o.OfferedItemId)
             .OnDelete(DeleteBehavior.Restrict);

            // Business rule: a listing can have only one accepted (or completed) offer
            e.HasIndex(o => o.ListingId)
             .IsUnique()
             .HasFilter("\"Status\" IN ('Accepted', 'Completed')");
        });

        builder.Entity<ChatMessage>(e =>
        {
            e.Property(m => m.Body).HasMaxLength(2000);

            e.HasOne(m => m.Offer)
             .WithMany(o => o.Messages)
             .HasForeignKey(m => m.OfferId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(m => m.Sender)
             .WithMany()
             .HasForeignKey(m => m.SenderId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
