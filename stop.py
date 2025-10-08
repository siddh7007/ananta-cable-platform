#!/usr/bin/env python3
import subprocess
import sys

def main():
    try:
        print("Stopping Docker Compose services...")
        result = subprocess.run(["docker", "compose", "down"], check=True)
        print("Services stopped successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error stopping services: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()