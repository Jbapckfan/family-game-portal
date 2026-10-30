#!/usr/bin/env python3
"""Portable structural validation; does not compile Swift or run an iOS simulator."""
from __future__ import annotations

import json
from html.parser import HTMLParser
from pathlib import Path
import posixpath
import plistlib
import re
import struct
import subprocess
import sys
import xml.etree.ElementTree as ET
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL_GAMES = {"counterpart", "shortlist", "second-sense", "sideways", "ringcount", "switchpath"}
CLASSIC_GAMES = {"tradeoff", "inbetween"}
KIMI_GAMES = {"kimi-cairn", "kimi-morph", "kimi-tangle", "kimi-hunch", "kimi-circuit", "kimi-quartet"}
DEEPSEEK_GAMES = {"deepseek-twin-hive", "deepseek-spare", "deepseek-rung", "deepseek-cipher", "deepseek-trail", "deepseek-split"}
QWEN_GAMES = {"qwen-quadra", "qwen-logic-lattice", "qwen-syntax-siege", "qwen-memory-maze", "qwen-pattern-prism", "qwen-territory-tactics"}
CLAUDE_GAMES = {"claude-dovetail", "claude-splice", "claude-sprout", "claude-tangle", "claude-keystone", "claude-tumbler"}
SHARED_MODULE_GAMES = DEEPSEEK_GAMES | QWEN_GAMES | CLAUDE_GAMES
BONUS_GAMES = {"nested-tic-tac-toe"}
BONUS_FILES = {"index.html", "app.mjs", "engine.mjs", "ai.mjs", "styles.css", "icon.svg"}
GAMES = ORIGINAL_GAMES | CLASSIC_GAMES | KIMI_GAMES | SHARED_MODULE_GAMES | BONUS_GAMES
BUNDLE_DIRECTORIES = GAMES | {"kimi-runtime", "deepseek-runtime"}
SHARED_GAME_REQUIRED_FILES = {"index.html", "app.mjs", "engine.mjs", "puzzles.mjs"}
SHARED_GAME_OPTIONAL_FILES = {"styles.css", "icon.svg"}
DEEPSEEK_SHARED_FILES = {"core.mjs", "common.mjs", "daily-rotations.mjs", "practice-calendar.mjs", "styles.css"}
RUNTIME_FILES = {"index.html", "app.mjs", "engine.mjs", "puzzles.mjs", "shell.mjs", "styles.css", "icon.svg", "manifest.webmanifest"}
# Keep these extensions aligned with BundleResourceResolver.swift and the sync script.
ASSET_EXTENSIONS = {"js", "mjs", "css", "json", "txt", "svg", "png", "jpg", "jpeg", "webp", "gif", "ico", "avif", "woff", "woff2", "ttf", "otf"}
FONT_EXTENSIONS = {"woff", "woff2", "ttf", "otf", "txt"}


class OpenStepParser:
    """Small independent parser for generated pbxproj dictionaries and arrays."""
    def __init__(self, text):
        token = re.compile(r'\s+|//[^\n]*|/\*.*?\*/|"(?:\\.|[^"\\])*"|[{}()=;,]|[^\s{}()=;,]+', re.S)
        self.tokens = [m.group() for m in token.finditer(text)
                       if not m.group().isspace() and not m.group().startswith(("//", "/*"))]
        self.index = 0

    def take(self, expected=None):
        if self.index >= len(self.tokens):
            raise ValueError("Unexpected end of pbxproj")
        token = self.tokens[self.index]
        self.index += 1
        if expected is not None and token != expected:
            raise ValueError(f"Expected {expected}, found {token}")
        return token

    def value(self):
        token = self.take()
        if token == "{":
            result = {}
            while self.tokens[self.index] != "}":
                key = self.value()
                self.take("=")
                result[key] = self.value()
                self.take(";")
            self.take("}")
            return result
        if token == "(":
            result = []
            while self.tokens[self.index] != ")":
                result.append(self.value())
                self.take(",")
            self.take(")")
            return result
        if token.startswith('"'):
            return json.loads(token)
        return int(token) if token.isdecimal() else token

    def parse(self):
        document = self.value()
        if self.index != len(self.tokens):
            raise ValueError("Trailing project tokens")
        return document


def require(condition, message):
    if not condition:
        raise ValueError(message)


def bundle_inventory(folder):
    files, directories = set(), set()

    def visit(directory):
        require(not directory.is_symlink(), "Bundled directory cannot be a symlink: " + str(directory))
        for path in directory.iterdir():
            require(not path.is_symlink(), "Bundled resource cannot be a symlink: " + str(path))
            require(not path.name.startswith("."), "Hidden bundle path: " + str(path))
            relative = path.relative_to(folder).as_posix()
            if path.is_dir():
                directories.add(relative)
                visit(path)
            else:
                require(path.is_file(), "Unsupported bundled resource: " + str(path))
                files.add(relative)
    visit(folder)
    return files, directories


class KimiDocumentReferences(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []
        self.scripts = []

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if tag == "script" and attributes.get("src"):
            self.references.append(attributes["src"])
            self.scripts.append(attributes["src"])
        if tag == "link" and attributes.get("href") and set(attributes.get("rel", "").split()) & {"stylesheet", "modulepreload", "preload", "icon"}:
            self.references.append(attributes["href"])
        if tag in {"img", "source"} and attributes.get("src"):
            self.references.append(attributes["src"])


def validate_kimi_references(games_dir, files):
    def check(reference, origin, allow_data=False):
        parsed = urlsplit(reference)
        if allow_data and parsed.scheme == "data":
            return
        require(not parsed.scheme and not parsed.netloc, f"Kimi resource must be local: {origin}: {reference}")
        path = unquote(parsed.path)
        require(path and not any(character in path for character in ["\\", "\0", "%"]), f"Invalid Kimi resource reference: {origin}: {reference}")
        if path.startswith("/"):
            require(path.startswith("/games/"), f"Unexpected absolute Kimi resource: {reference}")
            target = posixpath.normpath(path.removeprefix("/games/"))
        else:
            target = posixpath.normpath(posixpath.join(posixpath.dirname(origin), path))
        owner = origin.split("/")[0]
        own_icon = owner in KIMI_GAMES and origin == f"{owner}/index.html" and target == f"{owner}/icon.svg"
        require(own_icon or target.startswith(("kimi-runtime/assets/", "kimi-runtime/fonts/")), f"Kimi resource is outside its shared runtime: {origin}: {reference}")
        require(target in files, f"Missing Kimi resource: {origin}: {reference}")

    for game in sorted(KIMI_GAMES):
        origin = f"{game}/index.html"
        parser = KimiDocumentReferences()
        parser.feed((games_dir / origin).read_text())
        require(parser.scripts, "Missing Kimi application script: " + origin)
        for reference in parser.references:
            check(reference, origin)
    for origin in sorted(files):
        if not origin.startswith("kimi-runtime/"):
            continue
        if origin.endswith(".css"):
            text = (games_dir / origin).read_text()
            for match in re.finditer(r'''url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)''', text):
                check(next(value for value in match.groups() if value is not None), origin, allow_data=True)
            for match in re.finditer(r'''@import\s+["']([^"']+)["']''', text):
                check(match.group(1), origin)
        elif origin.endswith((".js", ".mjs")):
            # Literal compiled module imports are checkable without executing JavaScript.
            text = (games_dir / origin).read_text()
            for match in re.finditer(r'''(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["']((?:\.{1,2}/|/)[^"']+)["']''', text):
                check(match.group(1), origin)


def literal_module_references(text):
    """Find literal dependencies without treating dictionary strings as syntax."""
    token_pattern = re.compile(r'''
        (?P<comment>//[^\r\n]*|/\*.*?\*/)
        |(?P<string>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')
        |(?P<word>[A-Za-z_$][\w$]*)
        |(?P<punct>[^\s])
    ''', re.S | re.X)
    tokens = [(match.lastgroup, match.group()[1:-1] if match.lastgroup == "string" else match.group())
              for match in token_pattern.finditer(text) if match.lastgroup != "comment"]

    def at(index):
        return tokens[index] if 0 <= index < len(tokens) else (None, None)

    for index, token in enumerate(tokens):
        if token not in {("word", "import"), ("word", "export")} or at(index - 1) == ("punct", "."):
            continue
        cursor = index + 1
        if token == ("word", "import"):
            if at(cursor)[0] == "string":
                yield at(cursor)[1]  # Side-effect import.
                continue
            if at(cursor) == ("punct", "("):
                if at(cursor + 1)[0] == "string":
                    yield at(cursor + 1)[1]  # Literal dynamic import.
                continue
            if at(cursor)[0] == "word":
                cursor += 1  # Optional default import binding.
                if at(cursor) == ("punct", ","):
                    cursor += 1
        elif at(cursor) not in {("punct", "{"), ("punct", "*")}:
            continue  # Exported declarations and their data are not dependencies.

        if at(cursor) == ("punct", "*"):
            cursor += 1
            if at(cursor) == ("word", "as"):
                cursor += 2
        elif at(cursor) == ("punct", "{"):
            cursor += 1
            while at(cursor) not in {("punct", "}"), (None, None)}:
                cursor += 1
            cursor += 1
        if at(cursor) == ("word", "from") and at(cursor + 1)[0] == "string":
            yield at(cursor + 1)[1]


def validate_shared_module_references(games_dir, files):
    shared = {f"deepseek-runtime/{name}" for name in DEEPSEEK_SHARED_FILES}

    def check(reference, origin, allow_data=False):
        parsed = urlsplit(reference)
        if allow_data and parsed.scheme == "data":
            return
        require(not parsed.scheme and not parsed.netloc, f"Game module resource must be local: {origin}: {reference}")
        path = unquote(parsed.path)
        require(path and not any(character in path for character in ["\\", "\0", "%"]), f"Invalid game module resource: {origin}: {reference}")
        if path.startswith("/"):
            require(path.startswith("/games/"), f"Unexpected absolute game module resource: {reference}")
            target = posixpath.normpath(path.removeprefix("/games/"))
        else:
            target = posixpath.normpath(posixpath.join(posixpath.dirname(origin), path))
        owner = origin.split("/")[0]
        own_files = {f"{owner}/{name}" for name in SHARED_GAME_REQUIRED_FILES | SHARED_GAME_OPTIONAL_FILES} if owner in SHARED_MODULE_GAMES else set()
        if owner in BONUS_GAMES:
            own_files = {f"{owner}/{name}" for name in BONUS_FILES}
        require(target in (own_files if owner in BONUS_GAMES else shared | own_files), f"Game module resource is outside its runtime: {origin}: {reference}")
        require(target in files, f"Missing game module resource: {origin}: {reference}")

    for game in sorted(SHARED_MODULE_GAMES | BONUS_GAMES):
        origin = f"{game}/index.html"
        parser = KimiDocumentReferences()
        parser.feed((games_dir / origin).read_text())
        require(parser.scripts, "Missing game application script: " + origin)
        for reference in parser.references:
            check(reference, origin)
    for origin in sorted(files):
        if origin.split("/")[0] not in SHARED_MODULE_GAMES | BONUS_GAMES | {"deepseek-runtime"}:
            continue
        text = (games_dir / origin).read_text()
        if origin.endswith(".css"):
            for match in re.finditer(r'''url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)''', text):
                check(next(value for value in match.groups() if value is not None), origin, allow_data=True)
            for match in re.finditer(r'''@import\s+["']([^"']+)["']''', text):
                check(match.group(1), origin)
        elif origin.endswith(".mjs"):
            # Validate literal static, re-export, side-effect, and dynamic imports.
            for reference in literal_module_references(text):
                check(reference, origin)


def validate_web_bundle(games_dir):
    games_dir = Path(games_dir)
    for ancestor in [games_dir, games_dir.parent, games_dir.parent.parent]:
        require(not ancestor.is_symlink(), "Bundled directory cannot be a symlink: " + str(ancestor))
    entries = list(games_dir.iterdir())
    require(all(path.is_dir() and not path.is_symlink() for path in entries), "Every bundle root must be a real directory")
    require({path.name for path in entries} == BUNDLE_DIRECTORIES, "Bundle must contain32 daily games, one bonus and both shared runtimes")
    all_files = set()
    for game in sorted(BUNDLE_DIRECTORIES):
        files, directories = bundle_inventory(games_dir / game)
        if game in KIMI_GAMES:
            require("index.html" in files and files <= {"index.html", "icon.svg"} and not directories, f"Kimi entry must contain index.html and only an optional icon.svg: {game}")
        elif game == "kimi-runtime":
            require(all(path.split("/")[0] in {"assets", "fonts"} for path in directories), "Unexpected shared Kimi runtime directory")
            require(any(path.startswith("assets/") for path in files), "Missing compiled Kimi assets")
            for path in files:
                parts = path.split("/")
                allowed = ASSET_EXTENSIONS if parts[0] == "assets" else FONT_EXTENSIONS if parts[0] == "fonts" else set()
                require(len(parts) >= 2 and Path(path).suffix.lower().removeprefix(".") in allowed, "Unexpected shared Kimi runtime file: " + path)
        elif game == "deepseek-runtime":
            require(files == DEEPSEEK_SHARED_FILES and not directories, "Shared module runtime must contain only the approved runtime modules and stylesheet")
        elif game in BONUS_GAMES:
            require(files == BONUS_FILES and not directories, "Unexpected bonus runtime file: " + game)
        elif game in SHARED_MODULE_GAMES:
            require(SHARED_GAME_REQUIRED_FILES <= files, f"Missing runtime files for {game}: {sorted(SHARED_GAME_REQUIRED_FILES - files)}")
            require(files <= SHARED_GAME_REQUIRED_FILES | SHARED_GAME_OPTIONAL_FILES and not directories, "Unexpected game runtime file: " + game)
        else:
            runtime = RUNTIME_FILES - ({"shell.mjs"} if game in CLASSIC_GAMES else set())
            if game == "ringcount":
                runtime = runtime | {"share-card.mjs"}
            require(runtime <= files, f"Missing runtime files for {game}: {sorted(runtime - files)}")
            fonts = {path for path in files if path.startswith("fonts/")}
            require(fonts, "Missing bundled fonts and licenses: " + game)
            require(files == runtime | fonts, "Unexpected runtime file: " + game)
            require(all(path == "fonts" or path.startswith("fonts/") for path in directories), "Unexpected runtime directory: " + game)
            require(all(Path(path).suffix.lower().removeprefix(".") in FONT_EXTENSIONS for path in fonts), "Unexpected font resource: " + game)
        all_files.update(f"{game}/{path}" for path in files)
    validate_kimi_references(games_dir, all_files)
    validate_shared_module_references(games_dir, all_files)
    return len(all_files)


def main():
    subprocess.run([sys.executable, str(ROOT / "scripts/generate_project.py"), "--check"], check=True)
    document = OpenStepParser((ROOT / "AlfordDaily.xcodeproj/project.pbxproj").read_text()).parse()
    objects = document["objects"]
    require(objects[document["rootObject"]]["isa"] == "PBXProject", "Root is not a PBXProject")

    def walk(value):
        if isinstance(value, dict):
            for item in value.values(): walk(item)
        elif isinstance(value, list):
            for item in value: walk(item)
        elif isinstance(value, str) and re.fullmatch(r"[A-F0-9]{24}", value):
            require(value in objects, "Dangling object reference: " + value)
    walk(document)
    files = {obj["path"]: obj for obj in objects.values() if obj["isa"] == "PBXFileReference" and obj["sourceTree"] == "SOURCE_ROOT"}
    for path in files:
        require((ROOT / path).exists(), "Missing project file: " + path)
    swift = {p.relative_to(ROOT).as_posix() for folder in ["AlfordDaily", "AlfordDailyTests"] for p in (ROOT / folder).rglob("*.swift")}
    require(swift == {path for path in files if path.endswith(".swift")}, "Swift source inventory differs from project references")
    build_file_ids = [ref for obj in objects.values() if obj["isa"] == "PBXSourcesBuildPhase" for ref in obj["files"]]
    built_sources = [objects[objects[ref]["fileRef"]]["path"] for ref in build_file_ids]
    require(set(built_sources) == swift and len(built_sources) == len(swift), "Each Swift source must appear in exactly one Sources phase")

    targets = {obj["name"]: obj for obj in objects.values() if obj["isa"] == "PBXNativeTarget"}
    require(set(targets) == {"AlfordDaily", "AlfordDailyTests"}, "Expected app and XCTest targets")
    app_resources = [objects[objects[file]["fileRef"]]["path"] for phase in targets["AlfordDaily"]["buildPhases"]
                     if objects[phase]["isa"] == "PBXResourcesBuildPhase" for file in objects[phase]["files"]]
    require("Web" in app_resources and files["Web"]["lastKnownFileType"] == "folder", "Web must be a copied folder resource")
    require("AlfordDaily/Resources/PrivacyInfo.xcprivacy" in app_resources, "Missing bundled privacy manifest")
    require("AlfordDaily/Resources/Info.plist" not in app_resources, "Info.plist must not be copied as a resource")
    project = objects[document["rootObject"]]
    for config in objects[project["buildConfigurationList"]]["buildConfigurations"]:
        settings = objects[config]["buildSettings"]
        require(settings["SWIFT_VERSION"] == "5.0" and settings["IPHONEOS_DEPLOYMENT_TARGET"] == "17.0", "Unexpected language/deployment mode")

    for name in ["AlfordDaily", "AlfordDaily-StoreKit"]:
        tree = ET.parse(ROOT / f"AlfordDaily.xcodeproj/xcshareddata/xcschemes/{name}.xcscheme")
        for ref in tree.findall(".//BuildableReference"):
            require(ref.attrib["BlueprintIdentifier"] in objects, "Scheme refers to missing target")
        tests = tree.findall("./TestAction/Testables/TestableReference/BuildableReference")
        require(len(tests) == 1 and tests[0].attrib["BlueprintName"] == "AlfordDailyTests", "Shared scheme must run XCTest target")
        flag = tree.find("./LaunchAction/CommandLineArguments/CommandLineArgument")
        configuration = tree.find("./LaunchAction/StoreKitConfigurationFileReference")
        if name == "AlfordDaily":
            require(flag is None and configuration is None, "Normal scheme must not enable commerce")
        else:
            require(flag is not None and flag.attrib["argument"] == "-StoreKitTesting", "Local commerce needs an explicit debug flag")
            require(configuration is not None, "Local commerce scheme needs a StoreKit configuration")

    with (ROOT / "AlfordDaily/Resources/Info.plist").open("rb") as handle:
        info = plistlib.load(handle)
    require(info["CFBundleDisplayName"] == "Alford Daily", "Unexpected display name")
    require("NSAppTransportSecurity" not in info, "Offline host should not add network security exceptions")
    with (ROOT / "AlfordDaily/Resources/PrivacyInfo.xcprivacy").open("rb") as handle:
        privacy = plistlib.load(handle)
    require(privacy["NSPrivacyTracking"] is False and privacy["NSPrivacyCollectedDataTypes"] == [], "Unexpected tracking/collection declaration")
    require(privacy["NSPrivacyAccessedAPITypes"] == [{"NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults", "NSPrivacyAccessedAPITypeReasons": ["CA92.1"]}], "Unexpected required-reason API declaration")
    product = json.loads((ROOT / "Config/LocalPurchases.storekit").read_text())["products"]
    require(len(product) == 1 and product[0]["productID"].endswith(".localtest") and product[0]["type"] == "NonConsumable", "Unexpected local StoreKit product")
    png = (ROOT / "AlfordDaily/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png").read_bytes()
    require(png[:8] == b"\x89PNG\r\n\x1a\n" and struct.unpack(">II", png[16:24]) == (1024, 1024), "App icon must be a 1024 px PNG")
    require(png[25] == 2, "App icon must be opaque RGB")
    for content in (ROOT / "AlfordDaily/Resources/Assets.xcassets").rglob("Contents.json"):
        json.loads(content.read_text())

    count = validate_web_bundle(ROOT / "Web/games")
    test_count = sum(len(re.findall(r"\bfunc test\w+\s*\(", p.read_text())) for p in (ROOT / "AlfordDailyTests").glob("*.swift"))
    print(f"Validated project graph: {len(swift)} Swift files, 2 targets, 2 shared schemes, {test_count} XCTest methods, {count} bundled runtime files.")
    print("Structural checks passed. Swift compilation and WebKit/XCTest execution still require Xcode on macOS.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as error:
        print(f"Validation failed: {error}", file=sys.stderr)
        raise SystemExit(1)
