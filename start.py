#!/usr/bin/env python3
import subprocess
import sys

def main():
    try:
        print("Starting Docker Compose services...")
        result = subprocess.run(["docker", "compose", "up", "-d"], check=True)
        print("Services started successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error starting services: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()