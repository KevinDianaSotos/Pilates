using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pilates.Api.Migrations
{
    /// <inheritdoc />
    public partial class Addothercolumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pagos_Tarifas_TarifaId",
                table: "Pagos");

            migrationBuilder.DropIndex(
                name: "IX_Pagos_TarifaId",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "Completado",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "TarifaId",
                table: "Pagos");

            migrationBuilder.RenameColumn(
                name: "Fecha",
                table: "Pagos",
                newName: "FechaProximoPago");

            migrationBuilder.AddColumn<string>(
                name: "EstadoPago",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaProximoPago",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaUltimoPago",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Pagos",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Estado",
                table: "Pagos",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaPago",
                table: "Pagos",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "MetodoPago",
                table: "Pagos",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Notas",
                table: "Pagos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Periodo",
                table: "Pagos",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Referencia",
                table: "Pagos",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EstadoPago",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "FechaProximoPago",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "FechaUltimoPago",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "Estado",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "FechaPago",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "MetodoPago",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "Notas",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "Periodo",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "Referencia",
                table: "Pagos");

            migrationBuilder.RenameColumn(
                name: "FechaProximoPago",
                table: "Pagos",
                newName: "Fecha");

            migrationBuilder.AddColumn<bool>(
                name: "Completado",
                table: "Pagos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TarifaId",
                table: "Pagos",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Pagos_TarifaId",
                table: "Pagos",
                column: "TarifaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pagos_Tarifas_TarifaId",
                table: "Pagos",
                column: "TarifaId",
                principalTable: "Tarifas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
