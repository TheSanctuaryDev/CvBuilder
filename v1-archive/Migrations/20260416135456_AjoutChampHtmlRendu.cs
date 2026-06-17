using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CvBuilderApp.Migrations
{
    /// <inheritdoc />
    public partial class AjoutChampHtmlRendu : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AiOptimizedExperience",
                table: "CVs");

            migrationBuilder.DropColumn(
                name: "AiOptimizedSkills",
                table: "CVs");

            migrationBuilder.DropColumn(
                name: "IsProcessingDone",
                table: "CVs");

            migrationBuilder.RenameColumn(
                name: "AiOptimizedSummary",
                table: "CVs",
                newName: "HtmlContent");

            migrationBuilder.AlterColumn<string>(
                name: "SelectedTemplate",
                table: "CVs",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "HtmlContent",
                table: "CVs",
                newName: "AiOptimizedSummary");

            migrationBuilder.AlterColumn<string>(
                name: "SelectedTemplate",
                table: "CVs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AiOptimizedExperience",
                table: "CVs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AiOptimizedSkills",
                table: "CVs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsProcessingDone",
                table: "CVs",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
