namespace CampusSwap.Api.Entities;

public class Item
{
    public int Id { get; set; }

    public int OwnerId { get; set; }
    public Student Owner { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ItemCategory Category { get; set; }
    public ItemCondition Condition { get; set; }
    public ItemStatus Status { get; set; } = ItemStatus.Available;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Concurrency token mapped to PostgreSQL's xmin system column
    public uint Version { get; set; }

    public ICollection<ItemPhoto> Photos { get; set; } = new List<ItemPhoto>();
}
