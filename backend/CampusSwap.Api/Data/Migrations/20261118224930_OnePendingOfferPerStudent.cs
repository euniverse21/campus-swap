using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CampusSwap.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class OnePendingOfferPerStudent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_SwapOffers_ListingId_OfferedById",
                table: "SwapOffers",
                columns: new[] { "ListingId", "OfferedById" },
                unique: true,
                filter: "\"Status\" = 'Pending'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SwapOffers_ListingId_OfferedById",
                table: "SwapOffers");
        }
    }
}
