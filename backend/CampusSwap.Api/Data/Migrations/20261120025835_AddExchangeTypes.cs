using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CampusSwap.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExchangeTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Condition",
                table: "Items",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<string>(
                name: "Category",
                table: "Items",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Items",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Item");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Items_PhysicalItemDetails",
                table: "Items",
                sql: "\"Type\" <> 'Item' OR (\"Category\" IS NOT NULL AND \"Condition\" IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Items_PhysicalItemDetails",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Items");

            migrationBuilder.AlterColumn<string>(
                name: "Condition",
                table: "Items",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Category",
                table: "Items",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);
        }
    }
}
