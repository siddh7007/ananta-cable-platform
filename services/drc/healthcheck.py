import sys
import urllib.error
import urllib.request


def main() -> int:
    url = "http://localhost:8000/health"
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            return 0 if response.status == 200 else 1
    except urllib.error.URLError:
        return 1
    except Exception:
        return 1


if __name__ == "__main__":
    sys.exit(main())
