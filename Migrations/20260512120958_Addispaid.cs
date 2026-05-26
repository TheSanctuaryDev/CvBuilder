using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CvBuilderApp.Migrations
{
    /// <inheritdoc />
    public partial class Addispaid : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPaid",
                table: "CVs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaidAt",
                table: "CVs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransactionId",
                table: "CVs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPaid",
                table: "CVs");

            migrationBuilder.DropColumn(
                name: "PaidAt",
                table: "CVs");

            migrationBuilder.DropColumn(
                name: "TransactionId",
                table: "CVs");
        }
    }
}
