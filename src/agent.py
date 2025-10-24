import os
import json
import time
from datetime import datetime
from pathlib import Path
from anthropic import Anthropic, APIConnectionError
from dotenv import load_dotenv
from content_tracker import ContentTracker

load_dotenv()

class ContentAgent:
    def __init__(self):
        self.anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.brand = Path("memory/numia_brand.md").read_text()
        self.tracker = ContentTracker()

        # Load all post-specific guidelines
        self.guidelines = {}
        guidelines_dir = Path("memory/post-guidelines")
        if guidelines_dir.exists():
            for guideline_file in guidelines_dir.glob("*.md"):
                content_type = guideline_file.stem.replace("-guidelines", "")
                self.guidelines[content_type] = guideline_file.read_text()

        # Load all perspective guidelines
        self.perspectives = {}
        perspectives_dir = Path("memory/perspectives")
        if perspectives_dir.exists():
            for perspective_file in perspectives_dir.glob("*.md"):
                perspective_name = perspective_file.stem
                self.perspectives[perspective_name] = perspective_file.read_text()

        # Cache for combined guidelines (performance optimization)
        self._guidelines_cache = {}

    def _get_guidelines(self, content_type, perspectives=None):
        """Get combined brand, content-specific, and perspective guidelines (cached)"""
        # Handle both single perspective (string) and multiple perspectives (list)
        if perspectives:
            if isinstance(perspectives, str):
                perspectives = [perspectives]
            cache_key = f"{content_type}_{'_'.join(sorted(perspectives))}"
        else:
            cache_key = f"{content_type}_default"

        # Check cache first
        if cache_key in self._guidelines_cache:
            return self._guidelines_cache[cache_key]

        # Build combined guidelines
        guidelines = self.brand
        if content_type in self.guidelines:
            guidelines += f"\n\n{self.guidelines[content_type]}"

        # Add all perspectives as combined context
        if perspectives:
            guidelines += f"\n\n## PERSPECTIVE INSTRUCTIONS\nIncorporate insights from these perspectives:\n"
            for perspective in perspectives:
                if perspective in self.perspectives:
                    guidelines += f"\n### {perspective.upper()} PERSPECTIVE:\n{self.perspectives[perspective]}\n"

        # Cache and return
        self._guidelines_cache[cache_key] = guidelines
        return guidelines

    def get_available_perspectives(self):
        """Get list of available perspective names"""
        return list(self.perspectives.keys())

    def _generate_content(self, content_type, topic, prompt_template, output_dir, max_tokens=2000, file_ext="txt", perspectives=None, research_brief=None):
        """Generic content generation method to reduce code duplication"""
        perspective_label = f" [with {', '.join(perspectives)} perspectives]" if perspectives else ""
        print(f"🤖 Generating {content_type}{perspective_label}: {topic}")

        guidelines = self._get_guidelines(content_type, perspectives)

        # Add research brief if provided (for auto-generated topics)
        if research_brief:
            prompt = prompt_template.format(topic=topic, guidelines=guidelines, research=research_brief)
        else:
            prompt = prompt_template.format(topic=topic, guidelines=guidelines)

        # Retry logic with exponential backoff
        max_retries = 3
        retry_delay = 2  # Start with 2 seconds

        for attempt in range(max_retries):
            try:
                response = self.anthropic.messages.create(
                    model="claude-sonnet-4-5-20250929",
                    max_tokens=max_tokens,
                    messages=[{"role": "user", "content": prompt}]
                )
                break  # Success, exit retry loop
            except APIConnectionError as e:
                if attempt < max_retries - 1:
                    print(f"⚠️  Connection error (attempt {attempt + 1}/{max_retries}). Retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    print(f"❌ Failed after {max_retries} attempts")
                    raise

        content = response.content[0].text
        name = topic.replace(" ", "_").lower()[:50]
        date = datetime.now().strftime("%Y-%m-%d")
        path = Path(f"output/{output_dir}/{date}_{name}.{file_ext}")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)

        # Track generated content
        word_count = len(content.split())
        perspective_str = ','.join(perspectives) if perspectives else None
        self.tracker.track(topic, content_type, str(path), word_count, perspective_str)

        print(f"✅ Saved: {path}")
        return content, str(path)

    def generate_blog_post(self, topic, research_brief=None, perspectives=None):
        if research_brief:
            prompt = "Write a technical blog post about {topic}.\n\nRESEARCH CONTEXT:\n{research}\n\nGuidelines:\n{guidelines}\n\nFormat: Use markdown with # title and ## headers. Include SEO meta description and keywords at the end.\n\nIMPORTANT: Use the research data to add specific facts, numbers, and examples throughout. Make the length natural based on topic depth (typically 1200-2000 words)."
        else:
            prompt = "Write a technical blog post about {topic}.\n\nGuidelines:\n{guidelines}\n\nFormat: Use markdown with # title and ## headers. Include SEO meta description and keywords at the end.\n\nIMPORTANT: Make the length natural based on topic depth (typically 1200-2000 words). Don't artificially pad or cut content."
        return self._generate_content("blog", topic, prompt, "blogs", max_tokens=4000, file_ext="md", perspectives=perspectives, research_brief=research_brief)

    def generate_thread(self, topic, perspectives=None):
        prompt = "Create a Twitter thread about {topic}.\n\nGuidelines:\n{guidelines}\n\nFormat: 1/ 2/ 3/ etc. <280 chars each. Hook first. CTA last.\n\nIMPORTANT: Make the thread length natural based on the topic complexity (anywhere from 5-15 tweets). Don't force it to be a specific length."
        return self._generate_content("twitter", topic, prompt, "threads", max_tokens=2000, perspectives=perspectives)

    def generate_newsletter(self, topic, perspectives=None):
        prompt = "Write an email newsletter about {topic}.\n\nGuidelines:\n{guidelines}\n\nFormat: PLAIN TEXT. Catchy subject line, intro, 3-4 sections with **headers**, CTA. No HTML.\n\nIMPORTANT: Make the length natural (typically 400-1000 words based on topic). Keep it concise but complete."
        return self._generate_content("newsletter", topic, prompt, "newsletters", max_tokens=3000, perspectives=perspectives)

    def generate_linkedin_post(self, topic, perspectives=None):
        prompt = "Write a LinkedIn post about {topic}.\n\nGuidelines:\n{guidelines}\n\nIMPORTANT: Make the length natural based on the topic (anywhere from 80-200 words). Don't force it to be exactly 100-120 words."
        return self._generate_content("linkedin", topic, prompt, "linkedin", max_tokens=1500, perspectives=perspectives)
