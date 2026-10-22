"""Regression checks for misleading HTTP 200s and stale release content."""
import importlib.util
import threading
import tempfile
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

spec = importlib.util.spec_from_file_location("verify_nas", Path(__file__).with_name("verify-nas.py"))
verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verifier)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/redirect.mjs":
            self.send_response(302)
            self.send_header("Location", f"http://localhost:{self.server.server_port}/valid.mjs")
            self.end_headers()
            return
        self.send_response(200)
        self.send_header("Content-Type", "text/html" if self.path in {"/fallback.mjs", "/games/fixture/"} else "text/javascript")
        self.end_headers()
        self.wfile.write(b"export const release = 1;" if self.path != "/stale.mjs" else b"export const release = 0;")

    def log_message(self, *_):
        pass


class ServedReleaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def test_exact_module_passes(self):
        self.assertIsNone(verifier.check_asset(self.url, "valid.mjs", b"export const release = 1;"))

    def test_html_fallback_cannot_pass_as_a_module(self):
        self.assertIn("Content-Type", verifier.check_asset(self.url, "fallback.mjs", b"export const release = 1;"))

    def test_stale_deployment_fails_even_with_200_and_correct_mime(self):
        self.assertIn("differs", verifier.check_asset(self.url, "stale.mjs", b"export const release = 1;"))

    def test_matching_asset_on_another_origin_cannot_mask_a_redirect(self):
        self.assertIn("302", verifier.check_asset(self.url, "redirect.mjs", b"export const release = 1;"))

    def test_directory_launch_url_must_serve_its_own_game_document(self):
        self.assertIn("differs", verifier.check_asset(self.url, "games/fixture/", b"<h1>Game</h1>"))


class StaticBuildTests(unittest.TestCase):
    def test_static_build_checks_directory_routes_and_runtime_assets(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "games/example").mkdir(parents=True)
            (root / "index.html").write_bytes(b"Collection")
            (root / "games/example/index.html").write_bytes(b"Game")
            (root / "games/example/app.mjs").write_bytes(b"export {};")
            (root / "404.html").write_bytes(b"Missing")
            (root / "_headers").write_bytes(b"Server configuration")
            self.assertEqual(verifier.expected_static_assets(root), {
                "": b"Collection", "games/example/": b"Game",
                "games/example/app.mjs": b"export {};",
            })


if __name__ == "__main__":
    unittest.main()
