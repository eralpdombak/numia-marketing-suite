#!/usr/bin/env python3
"""
Competitive Intelligence Monitoring CLI

Usage:
    python monitor.py scan           # Run single scan
    python monitor.py start          # Start continuous monitoring
    python monitor.py report         # View monitoring report
    python monitor.py alerts         # View recent alerts
"""

import sys
from intelligence.monitor_daemon import MonitoringDaemon
from intelligence.alerts.alert_system import AlertSystem


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    command = sys.argv[1]

    if command == "scan":
        # Run single scan
        daemon = MonitoringDaemon(interval_minutes=60)
        daemon.run_once()

    elif command == "start":
        # Start continuous monitoring
        interval = 60  # default 1 hour
        if len(sys.argv) > 2:
            interval = int(sys.argv[2])

        daemon = MonitoringDaemon(interval_minutes=interval)
        daemon.run_continuous()

    elif command == "report":
        # Generate monitoring report
        daemon = MonitoringDaemon()
        daemon.generate_report()

    elif command == "alerts":
        # View alerts
        alerts = AlertSystem()

        unacked = alerts.get_unacknowledged()
        if unacked:
            print(f"\n🚨 {len(unacked)} Unacknowledged Alerts:\n")
            for alert in unacked[:10]:
                emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "⚪"}.get(alert["priority"], "ℹ️")
                print(f"{emoji} [{alert['priority'].upper()}] {alert['title']}")
                print(f"   {alert['message']}")
                print(f"   {alert['timestamp']}\n")
        else:
            print("\n✅ No unacknowledged alerts\n")

        summary = alerts.summary()
        print(f"Alert Summary:")
        print(f"  Total: {summary['total']}")
        print(f"  Unacknowledged: {summary['unacknowledged']}")
        print(f"  By priority: {summary['by_priority']}")

    else:
        print(f"Unknown command: {command}")
        print(__doc__)


if __name__ == "__main__":
    main()
