using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pilates.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "RolDestino",
                table: "Notificaciones",
                type: "text",
                nullable: true,
                defaultValue: "Admin",
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "Admin");

            migrationBuilder.AddColumn<Guid>(
                name: "UsuarioId",
                table: "Notificaciones",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Notificaciones");

            migrationBuilder.AlterColumn<string>(
                name: "RolDestino",
                table: "Notificaciones",
                type: "text",
                nullable: false,
                defaultValue: "Admin",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true,
                oldDefaultValue: "Admin");
        }
    }
}
