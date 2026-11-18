using CampusSwap.Api.Features.Verification;
using CampusSwap.Api.Infrastructure.Security;

namespace CampusSwap.Tests;

public class EmailDomainPolicyTests
{
    private static readonly string[] Domains = ["flinders.edu.au"];

    [Theory]
    [InlineData("kim0123@flinders.edu.au", true)]
    [InlineData("KIM0123@Flinders.edu.au", true)]
    [InlineData("someone@student.flinders.edu.au", true)]
    [InlineData("someone@gmail.com", false)]
    [InlineData("someone@flinders.edu.au.evil.com", false)]
    [InlineData("someone@notflinders.edu.au", false)]
    [InlineData("not-an-email", false)]
    [InlineData("Eulia <kim0123@flinders.edu.au>", false)]
    public void IsAllowed_AcceptsOnlyUniversityAddresses(string email, bool expected)
    {
        Assert.Equal(expected, EmailDomainPolicy.IsAllowed(email, Domains));
    }
}

public class SecurityTokensTests
{
    [Fact]
    public void GenerateVerificationCode_IsAlwaysSixDigits()
    {
        for (var i = 0; i < 1000; i++)
        {
            Assert.Matches(@"^\d{6}$", SecurityTokens.GenerateVerificationCode());
        }
    }

    [Fact]
    public void GenerateSessionToken_IsUnique()
    {
        var tokens = Enumerable.Range(0, 1000)
            .Select(_ => SecurityTokens.GenerateSessionToken())
            .ToHashSet();

        Assert.Equal(1000, tokens.Count);
    }

    [Fact]
    public void HashMatches_OnlyForTheOriginalValue()
    {
        var hash = SecurityTokens.Hash("123456");

        Assert.Equal(64, hash.Length);
        Assert.True(SecurityTokens.HashMatches("123456", hash));
        Assert.False(SecurityTokens.HashMatches("654321", hash));
    }
}
