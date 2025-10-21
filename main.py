#!/usr/bin/env python3
import sys
import argparse
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "src"))
from agent import ContentAgent
from topic_generator import TopicGenerator

def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd")

    # Define available commands with their descriptions
    commands = {
        "blog": "blog post",
        "thread": "thread",
        "newsletter": "newsletter",
        "linkedin": "LinkedIn post",
        "short-video": "short video script",
        "demo-video": "demo video script"
    }

    # Create subparsers for each command with consistent arguments
    for cmd, desc in commands.items():
        subparser = sub.add_parser(cmd)
        subparser.add_argument("topic", nargs='?', default=None, help=f"Topic for the {desc}")
        subparser.add_argument("--perspectives", type=str, help="Comma-separated list of perspectives (e.g., investor,crypto-expert,developer)")

    args = parser.parse_args()
    if not args.cmd:
        parser.print_help()
        return

    # Handle topic input
    topic = args.topic
    auto_generated = False

    if not topic:
        # Auto-generate topic if none provided
        print("💡 No topic provided. Generating topic automatically...\n")
        auto_generated = True

    print("🚀 Starting...\n")
    agent = ContentAgent()

    # Generate topic autonomously if needed
    research_brief = None
    if auto_generated:
        topic_gen = TopicGenerator()
        topic, research_brief = topic_gen.generate_topic_with_research(args.cmd)
        print(f"\n🎯 Generated Topic: {topic}\n")

    # Parse perspectives if provided
    perspectives = None
    if args.perspectives:
        perspectives = [p.strip() for p in args.perspectives.split(",")]
        available = agent.get_available_perspectives()

        # Validate perspectives
        invalid = [p for p in perspectives if p not in available]
        if invalid:
            print(f"❌ Invalid perspective(s): {', '.join(invalid)}")
            print(f"✅ Available perspectives: {', '.join(available)}")
            return

        print(f"🎭 Using perspectives: {', '.join(perspectives)}\n")

    # Map commands to their generation methods
    command_methods = {
        "blog": agent.generate_blog_post,
        "thread": agent.generate_thread,
        "newsletter": agent.generate_newsletter,
        "linkedin": agent.generate_linkedin_post,
        "short-video": agent.generate_short_video_script,
        "demo-video": agent.generate_demo_video_script
    }

    # Map commands to their multi-perspective generation methods
    perspective_methods = {
        "blog": agent.generate_blog_post_with_perspectives,
        "thread": agent.generate_thread_with_perspectives,
        "newsletter": agent.generate_newsletter_with_perspectives,
        "linkedin": agent.generate_linkedin_post_with_perspectives,
        "short-video": agent.generate_short_video_script_with_perspectives,
        "demo-video": agent.generate_demo_video_script_with_perspectives
    }

    # Execute the appropriate generation method
    if args.cmd in command_methods:
        if perspectives:
            # Multi-perspective generation
            outputs = perspective_methods[args.cmd](topic, perspectives)

            # Show summary
            print(f"\n📊 Generated {len(outputs)} versions:")
            for output in outputs:
                print(f"   [{output['perspective']}] {output['word_count']} words → {output['path']}")
        else:
            # Single generation
            # Pass research_brief if auto-generated (only blog supports this for now)
            if research_brief and args.cmd == "blog":
                content, path = agent.generate_blog_post(topic, research_brief)
            else:
                content, path = command_methods[args.cmd](topic)

            # Show word count for all content types except thread
            if args.cmd != "thread":
                print(f"📊 {len(content.split())} words")

    print("\n✨ Done!")

if __name__ == "__main__":
    main()
