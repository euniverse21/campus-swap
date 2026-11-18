using CampusSwap.Api.Data;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace CampusSwap.Tests;

// Starts a throw-away PostgreSQL in Docker once for all database tests,
// and applies the real migrations — so filtered indexes and row locks behave exactly like production.
public class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:17")
        .Build();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();
        await using var db = CreateContext();
        await db.Database.MigrateAsync();
    }

    public async Task DisposeAsync() => await _container.DisposeAsync();

    // Each call returns a new, independent connection (like two different web requests)
    public AppDbContext CreateContext()
        => new(new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_container.GetConnectionString())
            .Options);
}

[CollectionDefinition("Postgres")]
public class PostgresCollection : ICollectionFixture<PostgresFixture>;
