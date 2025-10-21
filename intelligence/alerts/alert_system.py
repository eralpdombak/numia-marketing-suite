"""
Alert System
Sends notifications when competitive intelligence events occur
"""

import json
from datetime import datetime
from pathlib import Path


class AlertSystem:
    """Handle alerts and notifications"""

    def __init__(self):
        self.alerts_dir = Path(__file__).parent.parent / "data" / "alerts"
        self.alerts_dir.mkdir(parents=True, exist_ok=True)

    def create_alert(self, priority, source, title, message, data=None):
        """
        Create an alert

        Args:
            priority: 'critical', 'high', 'medium', 'low'
            source: 'rss', 'twitter', 'github', 'pricing', etc.
            title: Alert title
            message: Alert message
            data: Optional dict with additional data
        """
        alert = {
            "id": self._generate_id(),
            "timestamp": datetime.now().isoformat(),
            "priority": priority,
            "source": source,
            "title": title,
            "message": message,
            "data": data or {},
            "acknowledged": False
        }

        # Save alert
        self._save_alert(alert)

        # Send notification
        self._send_notification(alert)

        return alert

    def _generate_id(self):
        """Generate unique alert ID"""
        import hashlib
        unique_str = datetime.now().isoformat()
        return hashlib.md5(unique_str.encode()).hexdigest()[:8]

    def _save_alert(self, alert):
        """Save alert to disk"""
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"{alert['priority']}_{alert['source']}_{timestamp}.json"

        filepath = self.alerts_dir / filename
        with open(filepath, 'w') as f:
            json.dump(alert, f, indent=2)

    def _send_notification(self, alert):
        """Send notification (file-based for now)"""
        # For now, write to a notifications file
        # In future, can integrate with Slack, email, etc.

        notifications_file = self.alerts_dir / "notifications.txt"

        priority_emoji = {
            "critical": "🔴",
            "high": "🟠",
            "medium": "🟡",
            "low": "⚪"
        }

        emoji = priority_emoji.get(alert["priority"], "ℹ️")

        notification = f"""
{emoji} [{alert['priority'].upper()}] {alert['title']}
Source: {alert['source']}
Time: {alert['timestamp']}
{alert['message']}
{'='*60}
"""

        with open(notifications_file, 'a') as f:
            f.write(notification)

        print(f"\n{emoji} ALERT: {alert['title']}")

    def get_recent_alerts(self, limit=10):
        """Get recent alerts"""
        alert_files = sorted(self.alerts_dir.glob("*.json"), reverse=True)[:limit]

        alerts = []
        for filepath in alert_files:
            with open(filepath, 'r') as f:
                alerts.append(json.load(f))

        return alerts

    def get_unacknowledged(self):
        """Get unacknowledged alerts"""
        alert_files = self.alerts_dir.glob("*.json")

        unacked = []
        for filepath in alert_files:
            with open(filepath, 'r') as f:
                alert = json.load(f)
                if not alert.get("acknowledged", False):
                    unacked.append(alert)

        return sorted(unacked, key=lambda x: x["timestamp"], reverse=True)

    def acknowledge_alert(self, alert_id):
        """Mark alert as acknowledged"""
        alert_files = self.alerts_dir.glob("*.json")

        for filepath in alert_files:
            with open(filepath, 'r') as f:
                alert = json.load(f)

            if alert["id"] == alert_id:
                alert["acknowledged"] = True
                alert["acknowledged_at"] = datetime.now().isoformat()

                with open(filepath, 'w') as f:
                    json.dump(alert, f, indent=2)

                print(f"✅ Alert {alert_id} acknowledged")
                return True

        print(f"⚠️  Alert {alert_id} not found")
        return False

    def summary(self):
        """Get alert summary"""
        all_alerts = self.get_recent_alerts(limit=100)

        summary = {
            "total": len(all_alerts),
            "by_priority": {},
            "by_source": {},
            "unacknowledged": len(self.get_unacknowledged())
        }

        for alert in all_alerts:
            # Count by priority
            priority = alert["priority"]
            summary["by_priority"][priority] = summary["by_priority"].get(priority, 0) + 1

            # Count by source
            source = alert["source"]
            summary["by_source"][source] = summary["by_source"].get(source, 0) + 1

        return summary


# Integration helpers

def alert_new_content(source, competitor, items):
    """Create alert for new competitor content"""
    alerts = AlertSystem()

    title = f"New {source} content from {competitor}"
    message = f"{len(items)} new item(s) detected from {competitor}"

    priority = "high" if len(items) >= 3 else "medium"

    return alerts.create_alert(
        priority=priority,
        source=source,
        title=title,
        message=message,
        data={"competitor": competitor, "count": len(items), "items": items}
    )


def alert_pricing_change(competitor):
    """Create alert for pricing change"""
    alerts = AlertSystem()

    title = f"Pricing change detected: {competitor}"
    message = f"{competitor} pricing page has changed"

    return alerts.create_alert(
        priority="critical",
        source="pricing",
        title=title,
        message=message,
        data={"competitor": competitor}
    )


def alert_github_release(repo, release_info):
    """Create alert for new GitHub release"""
    alerts = AlertSystem()

    title = f"New release: {repo}"
    message = f"Version {release_info.get('name', 'unknown')} released"

    return alerts.create_alert(
        priority="medium",
        source="github",
        title=title,
        message=message,
        data={"repo": repo, "release": release_info}
    )


def main():
    """Test alert system"""
    alerts = AlertSystem()

    print("Alert System")
    print("=" * 60)

    # Create test alert
    alert = alerts.create_alert(
        priority="high",
        source="test",
        title="Test Alert",
        message="This is a test alert",
        data={"foo": "bar"}
    )

    print(f"\nCreated alert: {alert['id']}")

    # Get summary
    summary = alerts.summary()
    print(f"\nAlert Summary:")
    print(f"  Total: {summary['total']}")
    print(f"  Unacknowledged: {summary['unacknowledged']}")


if __name__ == "__main__":
    main()
