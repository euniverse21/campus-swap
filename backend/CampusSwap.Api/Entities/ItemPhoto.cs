namespace CampusSwap.Api.Entities;

public class ItemPhoto
{
    public int Id { get; set; }

    public int ItemId { get; set; }
    public Item Item { get; set; } = null!;

    public string Url { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
