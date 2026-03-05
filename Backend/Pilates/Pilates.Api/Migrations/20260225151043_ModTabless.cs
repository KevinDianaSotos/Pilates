using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pilates.Api.Migrations
{
    /// <inheritdoc />
    public partial class ModTabless : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Price",
                table: "Bookings");

            migrationBuilder.AddColumn<Guid>(
                name: "UserId1",
                table: "Bookings",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_UserId1",
                table: "Bookings",
                column: "UserId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Users_UserId1",
                table: "Bookings",
                column: "UserId1",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Users_UserId1",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_UserId1",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "UserId1",
                table: "Bookings");

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
