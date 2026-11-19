using System.Threading.RateLimiting;
using CampusSwap.Api.Data;
using CampusSwap.Api.Features.Swaps;
using CampusSwap.Api.Features.Verification;
using CampusSwap.Api.Infrastructure.Email;
using CampusSwap.Api.Infrastructure.Security;
using CampusSwap.Api.Infrastructure.Storage;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Database (connection string comes from user-secrets locally, App Service settings on Azure)
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Connection string 'Default' not found.");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// CORS: allow the React frontend to call this API
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Student verification settings (allowed email domains, code expiry, session length)
builder.Services.Configure<StudentVerificationOptions>(
    builder.Configuration.GetSection(StudentVerificationOptions.SectionName));

// Email: real emails on Azure; printed to the terminal (+ .dev/emails.log) during development
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection(EmailOptions.SectionName));
if (!string.IsNullOrWhiteSpace(builder.Configuration["Email:ConnectionString"]))
    builder.Services.AddSingleton<IEmailSender, AcsEmailSender>();
else if (builder.Environment.IsDevelopment())
    builder.Services.AddScoped<IEmailSender, ConsoleEmailSender>();
else
    throw new InvalidOperationException(
        "Email:ConnectionString must be set outside Development, otherwise students never receive their codes.");

// Photo storage: Azure Blob Storage when configured (production), local "uploads" folder otherwise
var blobConnectionString = builder.Configuration["PhotoStorage:BlobConnectionString"];
var useBlobStorage = !string.IsNullOrWhiteSpace(blobConnectionString);
if (useBlobStorage)
    builder.Services.AddSingleton<IPhotoStorage>(new BlobPhotoStorage(
        blobConnectionString!,
        builder.Configuration["PhotoStorage:ContainerName"] ?? "photos"));
else
    builder.Services.AddSingleton<IPhotoStorage, LocalPhotoStorage>();
builder.Services.AddScoped<PhotoUploader>();

// Swap actions (accept, reject, withdraw, cancel) with row locking + transactions
builder.Services.AddScoped<SwapService>();

// Authentication: "Authorization: Bearer <session token>" identifies the student
builder.Services
    .AddAuthentication(StudentTokenAuthenticationHandler.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, StudentTokenAuthenticationHandler>(
        StudentTokenAuthenticationHandler.SchemeName, _ => { });
builder.Services.AddAuthorization();

// Rate limiting: stop anyone from spamming verification emails
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(RateLimitPolicies.VerificationCode, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(15),
                QueueLimit = 0,
            }));
});

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Apply pending database migrations at startup when enabled (turned on in the Azure settings)
if (app.Configuration.GetValue<bool>("Database:MigrateOnStartup"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Local development only: serve uploaded photos at /uploads/<file>
if (!useBlobStorage)
{
    var uploadsFolder = LocalPhotoStorage.GetFolderPath(app.Environment);
    Directory.CreateDirectory(uploadsFolder);
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(uploadsFolder),
        RequestPath = LocalPhotoStorage.RequestPath,
    });
}

app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Quick check that the API can reach the database
app.MapGet("/health/db", async (AppDbContext db) =>
    await db.Database.CanConnectAsync()
        ? Results.Ok(new { database = "connected" })
        : Results.Problem("Database connection failed"));

app.Run();
