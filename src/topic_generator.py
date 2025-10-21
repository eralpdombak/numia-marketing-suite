import os
import time
from anthropic import Anthropic, APIConnectionError
from pathlib import Path
from datetime import datetime

class TopicGenerator:
    """Generates relevant topics and researches them autonomously"""

    def __init__(self):
        self.anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.brand = Path("memory/numia_brand.md").read_text() if Path("memory/numia_brand.md").exists() else ""

    def generate_topic(self, content_type="blog", industry_focus="blockchain data infrastructure"):
        """
        Generate a timely, relevant topic based on industry trends

        Args:
            content_type: Type of content (blog, linkedin, thread, etc.)
            industry_focus: Industry/domain to focus on

        Returns:
            str: A compelling topic for content generation
        """
        prompt = f"""You are a content strategist for Numia, a blockchain data infrastructure company.

Generate ONE highly specific, timely topic for a {content_type} about {industry_focus}.

Requirements:
- Must address a real pain point developers face RIGHT NOW
- Should be something people are actively searching for or discussing
- Avoid generic topics like "Introduction to X" or "Top 10 Y"
- Focus on specific problems, not broad concepts
- Should have a clear angle or hook

Examples of GOOD topics:
- "Why your RPC provider is costing you $10k/month (and what to do about it)"
- "The 3 data consistency bugs every multi-chain app has (and doesn't know about)"
- "How to debug blockchain data lag in production"

Examples of BAD topics:
- "Understanding blockchain data"
- "Introduction to RPC nodes"
- "The future of Web3"

Context about Numia:
{self.brand[:1000] if self.brand else "Blockchain data infrastructure company focusing on consistency across 100+ chains"}

Output ONLY the topic, nothing else."""

        # Retry logic with exponential backoff
        max_retries = 3
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                response = self.anthropic.messages.create(
                    model="claude-sonnet-4-5-20250929",
                    max_tokens=200,
                    messages=[{"role": "user", "content": prompt}]
                )
                break
            except APIConnectionError as e:
                if attempt < max_retries - 1:
                    print(f"⚠️  Connection error (attempt {attempt + 1}/{max_retries}). Retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    print(f"❌ Topic generation failed after {max_retries} attempts")
                    raise

        topic = response.content[0].text.strip()
        # Remove quotes if present
        topic = topic.strip('"\'')
        return topic

    def research_topic(self, topic):
        """
        Research and gather facts, data, and insights about a topic

        Args:
            topic: The topic to research

        Returns:
            dict: Research findings with structure, facts, data points, examples
        """
        prompt = f"""Research: "{topic}"

Provide JSON with:
- facts: 3 specific statistics/data points
- problems: 3 specific developer problems
- examples: 2 real-world scenarios
- technical_details: Key technical aspects
- industry_context: Current state/what's wrong
- contrarian_angle: Non-obvious insight

Be SPECIFIC. Use real technologies, chains, numbers. Output valid JSON only."""

        # Retry logic with exponential backoff
        max_retries = 3
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                response = self.anthropic.messages.create(
                    model="claude-sonnet-4-5-20250929",
                    max_tokens=1000,
                    messages=[{"role": "user", "content": prompt}]
                )
                break
            except APIConnectionError as e:
                if attempt < max_retries - 1:
                    print(f"⚠️  Connection error (attempt {attempt + 1}/{max_retries}). Retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    print(f"❌ Research failed after {max_retries} attempts")
                    raise

        research_text = response.content[0].text.strip()

        # Extract JSON from response
        import json
        try:
            # Try to parse as JSON
            if research_text.startswith('```'):
                # Remove markdown code blocks
                research_text = research_text.split('```')[1]
                if research_text.startswith('json'):
                    research_text = research_text[4:]

            research = json.loads(research_text.strip())
        except json.JSONDecodeError:
            # Fallback: return raw text
            research = {
                "raw_research": research_text,
                "facts": ["Research data gathered"],
                "problems": ["Analysis completed"],
                "examples": ["See research notes"]
            }

        return research

    def create_enhanced_prompt(self, base_topic, research, content_type="blog"):
        """
        Create an enhanced prompt with research findings

        Args:
            base_topic: The topic to write about
            research: Research data dict
            content_type: Type of content

        Returns:
            str: Enhanced topic with research context
        """
        # Format research findings into a brief
        facts_str = "\n".join([f"- {fact}" for fact in research.get("facts", [])])
        problems_str = "\n".join([f"- {prob}" for prob in research.get("problems", [])])
        examples_str = "\n".join([f"- {ex}" for ex in research.get("examples", [])])

        research_brief = f"""
RESEARCH BRIEF:

Key Data Points:
{facts_str}

Problems to Address:
{problems_str}

Real-World Scenarios:
{examples_str}

Industry Context: {research.get("industry_context", "Current state of blockchain data infrastructure")}

Contrarian Angle: {research.get("contrarian_angle", "Challenge conventional thinking")}

Technical Focus: {research.get("technical_details", "Technical implementation details")}
"""

        return base_topic, research_brief

    def generate_topic_with_research(self, content_type="blog"):
        """
        Full autonomous workflow: generate topic, research it, return enhanced prompt

        Returns:
            tuple: (topic, research_brief)
        """
        print("🧠 Generating relevant topic...")
        topic = self.generate_topic(content_type)
        print(f"📋 Topic: {topic}")

        print("🔍 Researching topic and gathering insights...")
        research = self.research_topic(topic)

        print("✅ Research complete")
        topic, research_brief = self.create_enhanced_prompt(topic, research, content_type)

        return topic, research_brief
