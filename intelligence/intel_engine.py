"""
Competitor Intelligence Engine
On-demand research and analysis system
"""

import os
import json
import yaml
from pathlib import Path
from datetime import datetime
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

class IntelligenceEngine:
    """Main intelligence query interface - ask questions, get answers"""

    def __init__(self):
        self.config_path = Path(__file__).parent / "config.yaml"
        with open(self.config_path) as f:
            self.config = yaml.safe_load(f)

        self.anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.data_dir = Path(__file__).parent / "data"
        self.data_dir.mkdir(exist_ok=True)

    def query(self, question, category="general"):
        """
        Ask any competitive intelligence question

        Args:
            question: Your question about competitors
            category: Type of intel (product, pricing, market, customer)

        Returns:
            Detailed intelligence report
        """
        print(f"🔍 Researching: {question}")

        # Load context about competitors
        context = self._build_context(category)

        # Generate intelligence report
        prompt = f"""You are a competitive intelligence analyst for Numia, a blockchain data analytics platform.

COMPETITOR CONTEXT:
{context}

NUMIA'S POSITIONING:
{json.dumps(self.config['numia'], indent=2)}

QUESTION:
{question}

Provide a detailed intelligence report that includes:
1. Direct answer to the question
2. Competitive implications for Numia
3. Recommended actions or responses
4. Any gaps in available data (what we'd need to research further)

Format: Clear sections with headers. Be specific and actionable."""

        response = self.anthropic.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )

        report = response.content[0].text

        # Save query and response
        self._save_query(question, report, category)

        return report

    def _build_context(self, category):
        """Build relevant context based on query category"""
        competitors = self.config['competitors']

        context_parts = []
        for key, comp in competitors.items():
            context_parts.append(f"""
{comp['name']}:
- Focus: {comp['focus']}
- Positioning: {comp['positioning']}
- Twitter: @{comp['social'].get('twitter', 'N/A')}
- GitHub: {', '.join(comp.get('github', ['None']))}
""")

        return "\n".join(context_parts)

    def _save_query(self, question, report, category):
        """Save intelligence query for future reference"""
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        query_file = self.data_dir / f"intel_{timestamp}.json"

        data = {
            "timestamp": timestamp,
            "question": question,
            "category": category,
            "report": report
        }

        with open(query_file, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"💾 Intelligence saved: {query_file}")

    def competitor_profile(self, competitor_name):
        """Get detailed profile of a specific competitor"""
        # Find competitor
        comp = None
        for key, c in self.config['competitors'].items():
            if competitor_name.lower() in c['name'].lower() or competitor_name.lower() in key:
                comp = c
                comp_key = key
                break

        if not comp:
            return f"Competitor '{competitor_name}' not found in database."

        # Generate detailed profile
        prompt = f"""Create a detailed competitive profile for {comp['name']} from Numia's perspective.

KNOWN INFO:
{json.dumps(comp, indent=2)}

NUMIA'S STRENGTHS:
{json.dumps(self.config['numia']['strengths'], indent=2)}

Provide:
1. Company Overview
2. Key Products/Features
3. Target Customers
4. Pricing Strategy (if known)
5. Strengths vs Numia
6. Weaknesses vs Numia
7. Head-to-head Comparison
8. Recommended Positioning Against Them

Be specific and actionable. Identify competitive angles."""

        response = self.anthropic.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    def feature_gap_analysis(self):
        """Analyze feature gaps between Numia and competitors"""
        prompt = f"""Analyze feature gaps between Numia and key competitors.

COMPETITORS:
{json.dumps(self.config['competitors'], indent=2)}

NUMIA STRENGTHS:
{json.dumps(self.config['numia']['strengths'], indent=2)}

NUMIA DIFFERENTIATORS:
{json.dumps(self.config['numia']['differentiators'], indent=2)}

Provide:
1. Features competitors have that Numia likely doesn't:
   - High-value features worth building
   - Low-value features (ignore)

2. Features Numia has that competitors don't:
   - Amplify these in marketing

3. Parity features (everyone has):
   - Table stakes, don't compete on these

4. Recommended roadmap priorities based on gaps

Format as actionable tables/lists."""

        response = self.anthropic.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    def pricing_analysis(self):
        """Analyze competitive pricing landscape"""
        prompt = f"""Analyze the competitive pricing landscape for blockchain analytics platforms.

COMPETITORS:
{json.dumps([c['name'] for c in self.config['competitors'].values()], indent=2)}

Based on typical SaaS pricing for analytics platforms, provide:

1. Estimated Pricing Tiers:
   - Free tier (if exists)
   - Starter/Pro/Enterprise estimates

2. Pricing Models:
   - Seat-based vs usage-based vs flat-rate
   - Query limits, data retention

3. Competitive Positioning:
   - Where should Numia price relative to these?
   - Premium, mid-market, or aggressive low-price?

4. Pricing Strategy Recommendations:
   - What would make Numia attractive vs competitors?
   - Free tier strategy?
   - Enterprise contract structure?

Note: We may not have exact pricing data. Make educated estimates based on typical SaaS analytics platform pricing."""

        response = self.anthropic.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    def generate_response_content(self, competitor_action):
        """Generate marketing response to a competitor action"""
        prompt = f"""A competitor just did this:
"{competitor_action}"

Generate a marketing response for Numia that:
1. Acknowledges the move (if relevant)
2. Positions Numia's alternative/advantage
3. Includes a clear CTA

NUMIA CONTEXT:
{json.dumps(self.config['numia'], indent=2)}

Provide:
- Twitter thread (5-7 tweets)
- LinkedIn post
- Blog post outline

Tone: Confident but not defensive. Focus on Numia's unique value."""

        response = self.anthropic.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    def predict_competitor_moves(self, competitor_name):
        """Predict likely next moves from a competitor"""
        comp = None
        for key, c in self.config['competitors'].items():
            if competitor_name.lower() in c['name'].lower() or competitor_name.lower() in key:
                comp = c
                break

        if not comp:
            return f"Competitor '{competitor_name}' not found."

        prompt = f"""Predict the next strategic moves for {comp['name']}.

CURRENT POSITIONING:
{json.dumps(comp, indent=2)}

Based on:
- Their current focus area
- Market trends in blockchain analytics
- Typical SaaS company playbooks
- Gaps in their offering

Predict:
1. Likely product features they'll build next
2. Market segments they'll target
3. Pricing/packaging changes
4. Partnership/acquisition targets
5. Marketing angles they'll use

For each prediction:
- Probability: High/Medium/Low
- Timeline: Near-term (0-3mo), Mid-term (3-12mo), Long-term (12mo+)
- Numia's response: How should we prepare?

Be specific and actionable."""

        response = self.anthropic.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=3500,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    def customer_intel(self, query_type="overview"):
        """Analyze customer intelligence"""
        prompt = f"""Analyze the customer landscape for blockchain analytics platforms.

COMPETITORS:
{json.dumps([c['name'] for c in self.config['competitors'].values()], indent=2)}

NUMIA TARGET CUSTOMERS:
{json.dumps(self.config['numia']['target_customers'], indent=2)}

Query: {query_type}

Provide:

1. Customer Segmentation:
   - Who uses each competitor?
   - Customer personas by competitor

2. Switching Analysis:
   - What makes customers switch providers?
   - Common pain points with each competitor

3. Numia's Ideal Customer Profile:
   - Who would choose Numia over alternatives?
   - What triggers would lead to Numia adoption?

4. Target Account Lists:
   - Types of companies to target
   - Where to find them
   - How to reach them

Be specific about customer profiles and targeting strategy."""

        response = self.anthropic.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    def daily_digest(self):
        """Generate a daily intelligence digest (simulated - no live data yet)"""
        prompt = f"""Generate a competitive intelligence digest for Numia.

COMPETITORS TO MONITOR:
{json.dumps([c['name'] for c in self.config['competitors'].values()], indent=2)}

NUMIA POSITIONING:
{json.dumps(self.config['numia'], indent=2)}

Create a simulated daily digest showing:

1. 🚨 HIGH PRIORITY ALERTS
   - Simulated important competitor moves

2. 📰 CONTENT PUBLISHED
   - Simulated competitor content with response opportunities

3. 💬 SOCIAL SIGNALS
   - Simulated relevant social media activity

4. 🏗️ PRODUCT INTEL
   - Simulated product updates

5. 📊 MARKET TRENDS
   - Simulated trend data

6. 💡 RECOMMENDED ACTIONS
   - What Numia should do based on intel

Format as a clean, actionable daily report. Make it realistic but note these are simulated examples."""

        response = self.anthropic.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text


def main():
    """Example usage"""
    intel = IntelligenceEngine()

    print("\n" + "="*60)
    print("NUMIA COMPETITIVE INTELLIGENCE ENGINE")
    print("="*60 + "\n")

    # Example queries
    examples = [
        ("competitor_profile", "dune"),
        ("feature_gap_analysis", None),
        ("pricing_analysis", None),
        ("predict_competitor_moves", "dune"),
        ("customer_intel", "overview"),
        ("daily_digest", None)
    ]

    print("Available commands:")
    for i, (cmd, arg) in enumerate(examples, 1):
        arg_str = f"('{arg}')" if arg else "()"
        print(f"{i}. intel.{cmd}{arg_str}")

    print("\nExample: intel.query('What are Dune's main weaknesses?')")


if __name__ == "__main__":
    main()
