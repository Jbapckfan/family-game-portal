#!/usr/bin/env python3
"""Portable structural validation; does not compile Swift or run an iOS simulator."""
from __future__ import annotations

import json
from pathlib import Path
import plistlib
import re
import struct
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
GAMES = {"counterpart", "shortlist", "second-sense", "sideways", "ringcount", "switchpath"}


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

    games_dir = ROOT / "Web/games"
    require({p.name for p in games_dir.iterdir() if p.is_dir()} == GAMES, "Bundle must contain exactly six launch games")
    count = 0
    for game in GAMES:
        folder = games_dir / game
        for name in ["index.html", "app.mjs", "engine.mjs", "puzzles.mjs", "shell.mjs", "styles.css"]:
            require((folder / name).is_file(), f"Missing runtime: {game}/{name}")
        for path in folder.rglob("*"):
            if path.is_file():
                require(not path.is_symlink(), "Bundled resource cannot be a symlink")
                count += 1
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
