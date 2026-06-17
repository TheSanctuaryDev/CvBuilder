using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CvBuilderApp.Migrations
{
    /// <inheritdoc />
    public partial class AddInterestsField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Interests",
                table: "CVs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Interests",
                table: "CVs");
        }
    }
}
