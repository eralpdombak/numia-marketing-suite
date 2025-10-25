# Examples & Reference

## Bad vs. Good Examples Across Scenarios

### Feature Announcement

❌ **Bad:**
"We're excited to announce that Numia now supports 15 additional chains, bringing our total coverage to 100+ networks with industry-leading performance and reliability."

✅ **Good:**
"Added 15 chains today. Same API, same reliability. No new docs to read. Just works."

### Blog Post Opening

❌ **Bad:**
"In today's rapidly evolving blockchain landscape, data infrastructure has become increasingly critical for developers building decentralized applications."

✅ **Good:**
"Your dashboard shows 1.3 ETH. Etherscan says 1.7 ETH. You've refreshed four times. This is the moment where you start questioning everything."

### Twitter Thread Hook

❌ **Bad:**
"🧵 Thread: 5 reasons why reliable blockchain data infrastructure is essential for modern dApp development"

✅ **Good:**
"Wild that we normalize infrastructure that makes you refresh 5 times to see if the number's real"

### LinkedIn Post Opening

❌ **Bad:**
"In the ever-growing blockchain data landscape, developers face numerous challenges when it comes to accessing reliable, real-time information."

✅ **Good:**
"You just spent 6 hours debugging. Turns out it wasn't your code. It was your data provider serving you stale information from 90 seconds ago."

### Email Subject Line

❌ **Bad:**
"Numia Newsletter - October 2024: Infrastructure Updates"

✅ **Good:**
"Your dashboard is lying to you"

### Documentation Intro

❌ **Bad:**
"Welcome to the Numia documentation. This comprehensive guide will help you leverage our robust infrastructure to build cutting-edge blockchain applications."

✅ **Good:**
"This guide shows you how to query 100+ chains with one API call. Takes about 5 minutes to get running."

---

## Example: Case Study/Blog Post Structure

**Title Format:** "How [Client] Achieved [Result] with Numia's [Product]"

**Structure:**
1. **The Challenge** - Specific problem with real numbers
2. **The Solution** - Why they chose Numia (3 key reasons with metrics)
3. **Technical Implementation** - Code examples, timeline
4. **Results After [Timeframe]** - Quantitative & qualitative metrics
5. **Key Learnings** - Takeaways for readers
6. **What's Next** - Future plans
7. **CTA** - Soft call-to-action

**Full Example:**

*How Arbitrum Achieved 99.99% Uptime with Numia's Infrastructure*

**The Challenge: Scaling Beyond 1M Daily Transactions**

When Arbitrum's transaction volume exploded 10x in Q3 2023, their in-house indexing infrastructure began showing cracks. Response times degraded from 100ms to over 2 seconds. Their team of 3 engineers spent 80% of their time maintaining infrastructure instead of building features.

"We were at a crossroads," explains Sarah Chen, Arbitrum's Head of Engineering. "Either hire 5 more engineers just for data infrastructure, or find a better solution."

**The Solution: Numia's Enterprise Data Layer**

After evaluating multiple providers, Arbitrum chose Numia for three key reasons:

1. Performance at Scale
   - Before: 2-second API response times during peak
   - After: Consistent 47ms p50 latency, even at 2M+ daily transactions
   - Result: 42x performance improvement

2. Cost Efficiency
   - In-house costs: $45k/month (engineers + infrastructure)
   - Numia costs: $5k/month enterprise plan
   - Savings: 89% reduction in total cost of ownership

3. Implementation Speed
   - Day 1: Initial API integration
   - Day 3: Custom endpoints deployed
   - Day 7: Full production migration
   - Total downtime: Zero

**The Technical Implementation**

```javascript
// Simple integration example
import { NumiaClient } from '@numia/sdk';

const client = new NumiaClient({
  apiKey: process.env.NUMIA_API_KEY,
  chain: 'arbitrum-one'
});

// Get real-time transaction data
const txData = await client.transactions.get({
  address: userAddress,
  limit: 100
});
```

The migration required just 200 lines of code changes across their entire codebase.

**Results After 6 Months**

*Quantitative Metrics*
- Uptime: 99.99% (vs 97.2% with in-house)
- API Calls: 850M monthly, zero rate limits hit
- Response Time: 47ms p50, 134ms p99
- Cost Savings: $240,000 annualized

*Qualitative Benefits*
- Engineering team refocused on core product
- Launched 3 new features in Q4 (vs 1 in Q3)
- Developer NPS increased from 42 to 78
- Zero infrastructure-related incidents

**Key Learnings**

1. Don't underestimate hidden costs: Factor in engineering time, not just servers
2. Performance matters for UX: Every 100ms delay costs users
3. Buy vs build: Core competency should drive decisions

**What's Next**

Arbitrum is now leveraging Numia Engage to understand user behavior patterns and optimize their growth strategies. Early results show 35% better user retention through data-driven improvements.

---

*Ready to scale your blockchain infrastructure? Get started with Numia or schedule a demo with our team.*

---

## Example: High-Performing Twitter Thread

**Performance:** 890 likes, 234 retweets, 67 comments, 8.2% engagement rate

**Why it worked:**
- Started with a problem readers face (bot vs. real user metrics)
- Gave actionable insights in each tweet
- Used specific data (23%, 61%, 16% segmentation)
- Included a real case study (@cosmoshub)
- Showed results (3x retention, 50% lower CAC)
- Soft CTA at the end (not pushy)

**Thread Structure:**

1/ Your chain produced 1M transactions yesterday.

But how many were genuine users vs. bots? 🤔

Here's how smart L1s are using onchain analytics to identify real adoption:

2/ First, segment by wallet age.

New wallets (<30 days): 23%
Active wallets (30-365 days): 61%
Veteran wallets (>365 days): 16%

Real growth comes from converting new → active.

3/ Next, analyze transaction patterns.

Genuine users:
- Irregular timing
- Varied amounts
- Multiple protocols

Bots:
- Fixed intervals
- Round numbers
- Single protocol

4/ The money insight: Cross-reference with gas patterns.

Real users optimize gas (wait for lower fees).
Bots don't care (programmed to execute).

This alone filters out 40% of "activity."

5/ Case study: @cosmoshub discovered 67% of their "users" were actually arbitrage bots.

After filtering these out, they could finally see genuine adoption patterns and optimize accordingly.

6/ The result?
- 3x better user retention
- 50% lower CAC
- Actually useful metrics

All from understanding WHO is using your chain, not just counting transactions.

7/ At Numia, we've indexed 5B+ transactions across 100+ chains.

The pattern is consistent: chains that measure genuine activity grow 4x faster than those chasing vanity metrics.

8/ Want to see your chain's real adoption metrics?

We can set up a custom dashboard in 3 days.
No infrastructure needed.
Works with your existing setup.

DM me or check numia.xyz

[End thread]

---

## Example: Technical Whitepaper Excerpt

**Format:** Enterprise-grade technical documentation
**Audience:** Technical decision-makers, CTOs, engineering leads
**Tone:** Professional, data-driven, precise

**Why it works:**
- Executive summary upfront (busy execs read this first)
- Clear problem statement with specific numbers (100TB daily, $50-100k monthly)
- Structured sections with hierarchy (1.1, 1.2, 2.1, etc.)
- Visual architecture diagram (ASCII art for clarity)
- Compares alternatives objectively (self-hosted, decentralized, generic APIs)
- Leads with benefits, then dives into technical details

**Structure:**

---

**Numia Technical Architecture: A New Paradigm for Blockchain Data Infrastructure**

**Executive Summary**

This whitepaper presents Numia's revolutionary approach to blockchain data infrastructure, demonstrating how our architecture achieves sub-200ms query performance while indexing 100+ blockchains in real-time. Through innovative data pipeline design and intelligent caching strategies, Numia reduces infrastructure costs by 90% compared to traditional solutions while maintaining 99.99% uptime.

**1. Introduction**

**1.1 The Challenge of Multi-Chain Data**

The blockchain ecosystem has evolved from a single-chain world to a complex multi-chain universe. As of 2024, there are over 200 active Layer-1 blockchains and 50+ Layer-2 solutions, each generating millions of transactions daily. This explosion of chains creates unprecedented challenges:

- Data Fragmentation: Each chain has unique data structures, consensus mechanisms, and APIs
- Scale Requirements: Combined transaction volume exceeds 100TB daily
- Latency Demands: Modern dApps require sub-second response times
- Cost Pressures: Traditional indexing solutions cost $50-100k monthly per chain

**1.2 Current Solutions Fall Short**

Existing approaches to blockchain data infrastructure suffer from fundamental limitations:

*Self-Hosted Nodes:*
- Require dedicated DevOps teams
- Cost $20-50k monthly per chain
- Suffer from frequent sync issues
- Cannot handle cross-chain queries

*Decentralized Indexing Protocols:*
- High latency (2-5 seconds)
- Complex deployment processes
- Limited chain support
- Inconsistent data availability

*Generic API Providers:*
- One-size-fits-all approach
- Aggressive rate limiting
- Missing chain-specific features
- No custom endpoint support

**2. The Numia Architecture**

**2.1 Core Design Principles**

Numia's architecture is built on five foundational principles:

1. Chain-Native Indexing: Custom parsers for each blockchain's unique characteristics
2. Horizontal Scalability: Distributed processing across multiple regions
3. Intelligent Caching: Multi-tier cache strategy with predictive pre-warming
4. Real-Time Processing: Event-driven architecture with <1 second indexing latency
5. Unified Interface: Single API surface for all supported chains

**2.2 Technical Architecture Overview**

```
┌─────────────────────────────────────────────────┐
│                 Load Balancer                    │
│            (Global Traffic Manager)              │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐            ┌────────▼────────┐
│   API Gateway  │            │   API Gateway   │
│   (Region A)   │            │   (Region B)    │
└───────┬────────┘            └────────┬────────┘
        │                               │
┌───────▼────────────────────────────────▼────────┐
│            Distributed Query Engine              │
│         (PostgreSQL + TimescaleDB)               │
└───────────────────┬──────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────┐
│           Multi-Chain Indexing Layer             │
├──────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │Ethereum  │  │ Cosmos   │  │ Solana   │ ...  │
│  │ Indexer  │  │ Indexer  │  │ Indexer  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└──────────────────────────────────────────────────┘
```

---

**Whitepaper Best Practices:**
- Use numbered sections for easy reference (1.1, 1.2, 2.1)
- Include executive summary (decision-makers read this first)
- Visual diagrams when possible (architecture, flow charts)
- Compare alternatives objectively (builds trust)
- Data-heavy with sources (credibility)
- Professional but not overly academic
- Clear problem → solution structure