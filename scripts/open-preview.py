#!/usr/bin/env python3
"""Open an extracted Alford Daily web build over local HTTP."""
import argparse
import functools
import http.server
import threading
import webbrowser
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path, help="Directory containing the staged index.html")
    parser.add_argument("--port", type=int, default=8765, help="Stable loopback port (default: 8765); changing it creates a separate browser history")
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error("Choose a port from 1024 through 65535")
    directory = args.directory.resolve()
    if not (directory / "index.html").is_file() or not (directory / "release.json").is_file():
        parser.error("Choose the web directory from the downloaded Alford Daily package")

    class Handler(http.server.SimpleHTTPRequestHandler):
        extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".mjs": "text/javascript"}

        def log_message(self, *_):
            pass

    handler = functools.partial(Handler, directory=str(directory))
    try:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    except OSError as error:
        parser.exit(1, f"Could not open 127.0.0.1:{args.port}: {error}.\n"
                    "If Alford Daily is already running, use that browser window or stop its terminal first. "
                    "A different --port uses separate browser saves. No existing process was stopped.\n")
    url = f"http://127.0.0.1:{server.server_port}/"
    print(f"Alford Daily is running at {url}", flush=True)
    print("Leave this terminal open while playing. Press Control-C to stop.", flush=True)
    print("Use this same address and port on later visits to retain browser-local progress.", flush=True)
    # Serve immediately so the browser cannot race an unstarted server.
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    webbrowser.open(url)
    try:
        thread.join()
    except KeyboardInterrupt:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
