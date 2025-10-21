#!/usr/bin/env python3
"""
Numia Competitive Intelligence CLI

Usage:
    python intel.py query "What are Dune's weaknesses?"
    python intel.py profile dune
    python intel.py gaps
    python intel.py pricing
    python intel.py predict dune
    python intel.py customers
    python intel.py digest
    python intel.py github duneanalytics/spellbook
"""

import sys
from intelligence.intel_engine import IntelligenceEngine
from intelligence.scrapers.github_monitor import GitHubMonitor


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    command = sys.argv[1]
    intel = IntelligenceEngine()

    # Route commands
    if command == "query":
        if len(sys.argv) < 3:
            print("Usage: python intel.py query \"your question\"")
            return
        question = " ".join(sys.argv[2:])
        print(intel.query(question))

    elif command == "profile":
        if len(sys.argv) < 3:
            print("Usage: python intel.py profile <competitor_name>")
            return
        competitor = sys.argv[2]
        print(intel.competitor_profile(competitor))

    elif command == "gaps":
        print(intel.feature_gap_analysis())

    elif command == "pricing":
        print(intel.pricing_analysis())

    elif command == "predict":
        if len(sys.argv) < 3:
            print("Usage: python intel.py predict <competitor_name>")
            return
        competitor = sys.argv[2]
        print(intel.predict_competitor_moves(competitor))

    elif command == "customers":
        print(intel.customer_intel())

    elif command == "digest":
        print(intel.daily_digest())

    elif command == "respond":
        if len(sys.argv) < 3:
            print("Usage: python intel.py respond \"competitor action\"")
            return
        action = " ".join(sys.argv[2:])
        print(intel.generate_response_content(action))

    elif command == "github":
        if len(sys.argv) < 3:
            print("Usage: python intel.py github <owner/repo>")
            return
        repo = sys.argv[2]
        monitor = GitHubMonitor()
        analysis = monitor.analyze_repo(repo)
        print(json.dumps(analysis, indent=2))

    else:
        print(f"Unknown command: {command}")
        print(__doc__)


if __name__ == "__main__":
    import json
    main()
