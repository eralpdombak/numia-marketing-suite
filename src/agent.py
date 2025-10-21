import os
import json
import time
from datetime import datetime
from pathlib import Path
from anthropic import Anthropic, APIConnectionError
from dotenv import load_dotenv
from content_tracker import ContentTracker
from concurrent.futures import ThreadPoolExecutor, as_completed

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

    def _get_guidelines(self, content_type, perspective=None):
        """Get combined brand, content-specific, and perspective guidelines (cached)"""
        cache_key = f"{content_type}_{perspective or 'default'}"

        # Check cache first
        if cache_key in self._guidelines_cache:
            return self._guidelines_cache[cache_key]

        # Build combined guidelines
        guidelines = self.brand
        if content_type in self.guidelines:
            guidelines += f"\n\n{self.guidelines[content_type]}"
        if perspective and perspective in self.perspectives:
            guidelines += f"\n\n## PERSPECTIVE INSTRUCTIONS\n{self.perspectives[perspective]}"

        # Cache and return
        self._guidelines_cache[cache_key] = guidelines
        return guidelines

    def get_available_perspectives(self):
        """Get list of available perspective names"""
        return list(self.perspectives.keys())

    def _generate_content(self, content_type, topic, prompt_template, output_dir, max_tokens=2000, file_ext="txt", perspective=None, research_brief=None):
        """Generic content generation method to reduce code duplication"""
        perspective_label = f" [{perspective}]" if perspective else ""
        print(f"🤖 Generating {content_type}{perspective_label}: {topic}")

        guidelines = self._get_guidelines(content_type, perspective)

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
        perspective_suffix = f"_{perspective}" if perspective else ""
        path = Path(f"output/{output_dir}/{date}_{name}{perspective_suffix}.{file_ext}")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)

        # Track generated content
        word_count = len(content.split())
        self.tracker.track(topic, content_type, str(path), word_count, perspective)

        print(f"✅ Saved: {path}")
        return content, str(path)

    def _generate_single_perspective(self, content_type, topic, prompt_template, output_dir, max_tokens, file_ext, perspective):
        """Helper method to generate content for a single perspective (thread-safe)"""
        if perspective not in self.perspectives:
            print(f"⚠️  Warning: Perspective '{perspective}' not found. Skipping.")
            return None

        content, path = self._generate_content(
            content_type, topic, prompt_template, output_dir,
            max_tokens, file_ext, perspective
        )

        return {
            "perspective": perspective,
            "path": path,
            "word_count": len(content.split()),
            "content": content
        }

    def _generate_with_perspectives(self, content_type, topic, prompt_template, output_dir, perspectives, max_tokens=2000, file_ext="txt"):
        """Generate content from multiple perspectives in parallel"""
        outputs = []

        # Validate perspectives first
        valid_perspectives = [p for p in perspectives if p in self.perspectives]
        if len(valid_perspectives) < len(perspectives):
            invalid = set(perspectives) - set(valid_perspectives)
            for p in invalid:
                print(f"⚠️  Warning: Perspective '{p}' not found. Skipping.")

        if not valid_perspectives:
            return outputs

        # Generate all perspectives in parallel
        print(f"⚡ Generating {len(valid_perspectives)} perspectives in parallel...")

        with ThreadPoolExecutor(max_workers=len(valid_perspectives)) as executor:
            # Submit all generation tasks
            future_to_perspective = {
                executor.submit(
                    self._generate_single_perspective,
                    content_type, topic, prompt_template, output_dir,
                    max_tokens, file_ext, perspective
                ): perspective
                for perspective in valid_perspectives
            }

            # Collect results as they complete
            for future in as_completed(future_to_perspective):
                perspective = future_to_perspective[future]
                try:
                    result = future.result()
                    if result:
                        outputs.append(result)
                except Exception as e:
                    print(f"❌ Error generating {perspective} perspective: {str(e)}")
                    continue

        return outputs
    
    def generate_blog_post(self, topic, research_brief=None):
        if research_brief:
            prompt = "Write a 1500 word technical blog post about {topic}.\n\nRESEARCH CONTEXT:\n{research}\n\nGuidelines:\n{guidelines}\n\nFormat: Use markdown with # title and ## headers. Include SEO meta description and keywords at the end.\n\nIMPORTANT: Use the research data to add specific facts, numbers, and examples throughout."
        else:
            prompt = "Write a 1500 word technical blog post about {topic}.\n\nGuidelines:\n{guidelines}\n\nFormat: Use markdown with # title and ## headers. Include SEO meta description and keywords at the end."
        return self._generate_content("blog", topic, prompt, "blogs", max_tokens=4000, file_ext="md", research_brief=research_brief)
    
    def generate_thread(self, topic, num=10):
        prompt = f"Create a {num} tweet thread about {{topic}}.\n\nGuidelines:\n{{guidelines}}\n\nFormat: 1/ 2/ 3/ etc. <280 chars each. Hook first. CTA last."
        return self._generate_content("twitter", topic, prompt, "threads", max_tokens=2000)
    
    def generate_newsletter(self, topic):
        prompt = "Write an email newsletter about {topic}.\n\nGuidelines:\n{guidelines}\n\nFormat: PLAIN TEXT. Catchy subject line, intro, 3-4 sections with **headers**, CTA. 800-1000 words. No HTML."
        return self._generate_content("newsletter", topic, prompt, "newsletters", max_tokens=3000)

    def generate_linkedin_post(self, topic):
        prompt = "Write a LinkedIn post about {topic}.\n\nGuidelines:\n{guidelines}"
        return self._generate_content("linkedin", topic, prompt, "linkedin", max_tokens=1500)

    def generate_short_video_script(self, topic):
        prompt = "Write a 60-sec video script about {topic} (TikTok/Reels/Shorts).\n\nGuidelines:\n{guidelines}\n\nFormat: [VISUAL] [AUDIO] cues. Hook (3 sec), 3 key points, CTA. Conversational. Fast-paced."
        return self._generate_content("short-video", topic, prompt, "short_videos", max_tokens=2000, file_ext="md")

    def generate_demo_video_script(self, topic):
        prompt = "Write a 3-5 min demo video script about {topic}.\n\nGuidelines:\n{guidelines}\n\nFormat: [INTRO] [PROBLEM] [SOLUTION] [DEMO] [FEATURES] [BENEFITS] [CTA]. Include screen cues, voiceover, timestamps. Clear and educational."
        return self._generate_content("demo-video", topic, prompt, "demo_videos", max_tokens=3500, file_ext="md")

    # Multi-perspective generation methods
    def generate_blog_post_with_perspectives(self, topic, perspectives):
        """Generate blog posts from multiple perspectives"""
        prompt = "Write a 1500 word technical blog post about {topic}. Brand guidelines: {guidelines}. Use markdown with # title and ## headers. Include SEO meta description and keywords at the end."
        return self._generate_with_perspectives("blog", topic, prompt, "blogs", perspectives, max_tokens=4000, file_ext="md")

    def generate_thread_with_perspectives(self, topic, perspectives, num=10):
        """Generate Twitter threads from multiple perspectives"""
        prompt = f"Create a {num} tweet Twitter thread about {{topic}}. Brand guidelines: {{guidelines}}. Format: 1/ 2/ 3/ etc. Each tweet must be under 280 characters. Start with a hook. End with a CTA."
        return self._generate_with_perspectives("twitter", topic, prompt, "threads", perspectives, max_tokens=2000)

    def generate_newsletter_with_perspectives(self, topic, perspectives):
        """Generate newsletters from multiple perspectives"""
        prompt = "Write an email newsletter about {topic}. Brand guidelines: {guidelines}. Include: catchy subject line, brief intro, 3-4 key sections with headers, CTA at the end. Format as PLAIN TEXT ready to copy/paste into an email. Use simple formatting: Subject line at top, blank lines between sections, bold headers using **text**. NO HTML tags, NO special characters. Length: 800-1000 words."
        return self._generate_with_perspectives("newsletter", topic, prompt, "newsletters", perspectives, max_tokens=3000)

    def generate_linkedin_post_with_perspectives(self, topic, perspectives):
        """Generate LinkedIn posts from multiple perspectives"""
        prompt = "Write a LinkedIn post about {topic}. Brand guidelines: {guidelines}."
        return self._generate_with_perspectives("linkedin", topic, prompt, "linkedin", perspectives, max_tokens=1500)

    def generate_short_video_script_with_perspectives(self, topic, perspectives):
        """Generate short video scripts from multiple perspectives"""
        prompt = "Write a 60-second short-form video script about {topic} (for TikTok/Reels/Shorts). Brand guidelines: {guidelines}. Format: [VISUAL] and [AUDIO] cues. Include: attention-grabbing hook (first 3 seconds), main content with 3 key points, strong CTA. Write conversational dialogue. Add on-screen text suggestions. Keep it fast-paced and engaging."
        return self._generate_with_perspectives("short-video", topic, prompt, "short_videos", perspectives, max_tokens=2000, file_ext="md")

    def generate_demo_video_script_with_perspectives(self, topic, perspectives):
        """Generate demo video scripts from multiple perspectives"""
        prompt = "Write a 3-5 minute product demo video script about {topic}. Brand guidelines: {guidelines}. Format with sections: [INTRO], [PROBLEM], [SOLUTION], [DEMO WALKTHROUGH], [KEY FEATURES], [BENEFITS], [CTA]. Include: screen recording cues, voiceover script, on-screen text, timestamps. Make it clear, educational, and professional. Highlight specific features and use cases."
        return self._generate_with_perspectives("demo-video", topic, prompt, "demo_videos", perspectives, max_tokens=3500, file_ext="md")
