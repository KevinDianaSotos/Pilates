using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pilates.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificacionesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Notificaciones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Tipo = table.Column<string>(type: "text", nullable: false),
                    Mensaje = table.Column<string>(type: "text", nullable: false),
                    ReferenciaId = table.Column<string>(type: "text", nullable: true),
                    Leida = table.Column<bool>(type: "boolean", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaLectura = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RolDestino = table.Column<string>(type: "text", nullable: false, defaultValue: "Admin"),
                    Datos = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notificaciones", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notificaciones_FechaCreacion",
                table: "Notificaciones",
                column: "FechaCreacion");

            migrationBuilder.CreateIndex(
                name: "IX_Notificaciones_Leida_RolDestino",
                table: "Notificaciones",
                columns: new[] { "Leida", "RolDestino" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Notificaciones");
        }
    }
}
