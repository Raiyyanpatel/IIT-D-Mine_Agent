import requests
from bs4 import BeautifulSoup

try:
    from dateutil import parser
except ImportError:
    parser = None

# Primary + fallback RSS sources
RSS_SOURCES = [
    "https://www.mining.com/feed/",  # often blocked by Cloudflare
    "https://webcache.googleusercontent.com/search?q=cache:https://www.mining.com/feed/",  # Google cache
    "https://www.miningweekly.com/page/rss",  # reliable alternative
    "https://www.mining-technology.com/feed/",  # another reliable feed
]

# Proper spoofed headers to bypass Cloudflare
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Cache-Control": "no-cache",
}


def fetch_dgms_updates(limit: int = 5):
    for src in RSS_SOURCES:
        try:
            response = requests.get(src, headers=HEADERS, timeout=10)
            response.raise_for_status()

            try:
                soup = BeautifulSoup(response.text, "xml")
            except Exception:  # noqa: BLE001
                soup = BeautifulSoup(response.text, "html.parser")
            items = soup.find_all("item")

            if not items:
                continue  # try next source

            updates = []
            for item in items[:limit]:
                title = item.title.text.strip() if item.title else "Untitled"
                link = item.link.text.strip() if item.link else ""
                pub_date = item.pubDate.text if item.pubDate else "Unknown"

                # Parse date safely
                try:
                    pub_date = parser.parse(pub_date).date().isoformat()
                except Exception:  # noqa: BLE001, S110
                    pass

                updates.append({"title": title, "link": link, "published": pub_date})

            if updates:
                return updates

        except Exception as e:  # noqa: BLE001
            print(f"⚠️ RSS source failed ({src}): {e}")
            continue

    # Final fallback if nothing works
    return [{"title": "No updates available", "link": "", "published": ""}]
