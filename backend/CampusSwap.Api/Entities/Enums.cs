namespace CampusSwap.Api.Entities;

// What is being swapped. Starts at 1 so the C# default (0) is never mistaken for a real value.
public enum ExchangeType { Item = 1, Skill, Service, Experience }

// Category and condition apply to physical items only
public enum ItemCategory { Books, Clothes, Jewellery, Electronics, Household, Other, Furniture, Stationery }
public enum ItemCondition { New, LikeNew, Good, Fair }
public enum ItemStatus { Available, Reserved, Swapped }
public enum ListingStatus { Open, Reserved, Completed, Cancelled }
public enum OfferType { Item, Service }
public enum OfferStatus { Pending, Accepted, Rejected, Withdrawn, Completed }
