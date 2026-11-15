using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurboDrive.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AssignedEmployeeId",
                table: "Customers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CampaignId",
                table: "Customers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CampaignName",
                table: "Customers",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastFollowUpAtUtc",
                table: "Customers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "Customers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Customers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_AssignedEmployeeId",
                table: "Customers",
                column: "AssignedEmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Customers_Employees_AssignedEmployeeId",
                table: "Customers",
                column: "AssignedEmployeeId",
                principalTable: "Employees",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Customers_Employees_AssignedEmployeeId",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_Customers_AssignedEmployeeId",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "AssignedEmployeeId",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "CampaignId",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "CampaignName",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "LastFollowUpAtUtc",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Customers");
        }
    }
}
