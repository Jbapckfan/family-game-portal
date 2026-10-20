#!/usr/bin/env python3
"""Generate the dependency-free Xcode project. --check never writes files."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "AlfordDaily.xcodeproj"


def identifier(name: str) -> str:
    return hashlib.sha256(("alford-daily:" + name).encode()).hexdigest()[:24].upper()


def render(value, level=0) -> str:
    indent = "\t" * level
    if isinstance(value, dict):
        return "{\n" + "".join(f"{indent}\t{json.dumps(str(k))} = {render(v, level + 1)};\n" for k, v in value.items()) + indent + "}"
    if isinstance(value, list):
        return "(\n" + "".join(f"{indent}\t{render(v, level + 1)},\n" for v in value) + indent + ")"
    if isinstance(value, int):
        return str(value)
    return json.dumps(str(value), ensure_ascii=False)


def project_text() -> str:
    objects = {}

    def add(key, isa, **properties):
        uid = identifier(key)
        objects[uid] = {"isa": isa, **properties}
        return uid

    def file_ref(path, file_type, name=None):
        return add("file:" + path, "PBXFileReference", lastKnownFileType=file_type,
                   name=name or Path(path).name, path=path, sourceTree="SOURCE_ROOT")

    app_sources = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / "AlfordDaily").rglob("*.swift"))
    test_sources = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / "AlfordDailyTests").glob("*.swift"))
    source_refs, test_refs, app_builds, test_builds = [], [], [], []
    for paths, refs, builds in [(app_sources, source_refs, app_builds), (test_sources, test_refs, test_builds)]:
        for path in paths:
            ref = file_ref(path, "sourcecode.swift")
            refs.append(ref)
            builds.append(add("build:" + path, "PBXBuildFile", fileRef=ref))

    resource_refs, resource_builds = [], []
    for path, kind in [("AlfordDaily/Resources/Assets.xcassets", "folder.assetcatalog"),
                       ("AlfordDaily/Resources/PrivacyInfo.xcprivacy", "text.xml"), ("Web", "folder")]:
        ref = file_ref(path, kind)
        resource_refs.append(ref)
        resource_builds.append(add("build:" + path, "PBXBuildFile", fileRef=ref))
    info = file_ref("AlfordDaily/Resources/Info.plist", "text.plist.xml")
    storekit = file_ref("Config/LocalPurchases.storekit", "text")
    app_product = add("product:app", "PBXFileReference", explicitFileType="wrapper.application", includeInIndex=0,
                      path="AlfordDaily.app", sourceTree="BUILT_PRODUCTS_DIR")
    test_product = add("product:tests", "PBXFileReference", explicitFileType="wrapper.cfbundle", includeInIndex=0,
                       path="AlfordDailyTests.xctest", sourceTree="BUILT_PRODUCTS_DIR")
    sources_group = add("group:sources", "PBXGroup", name="AlfordDaily", children=source_refs, sourceTree="<group>")
    tests_group = add("group:tests", "PBXGroup", name="AlfordDailyTests", children=test_refs, sourceTree="<group>")
    resources_group = add("group:resources", "PBXGroup", name="Resources", children=[*resource_refs, info, storekit], sourceTree="<group>")
    products_group = add("group:products", "PBXGroup", name="Products", children=[app_product, test_product], sourceTree="<group>")
    main_group = add("group:main", "PBXGroup", children=[sources_group, tests_group, resources_group, products_group], sourceTree="<group>")

    phases = {}
    for target, sources, resources in [("app", app_builds, resource_builds), ("tests", test_builds, [])]:
        phases[target] = []
        for kind, files in [("Sources", sources), ("Frameworks", []), ("Resources", resources)]:
            phases[target].append(add(f"phase:{target}:{kind}", f"PBX{kind}BuildPhase", buildActionMask=2147483647,
                                      files=files, runOnlyForDeploymentPostprocessing=0))

    shared = {
        "ALWAYS_SEARCH_USER_PATHS": "NO", "CLANG_ENABLE_MODULES": "YES", "CLANG_ENABLE_OBJC_ARC": "YES",
        "CLANG_WARN_DOCUMENTATION_COMMENTS": "YES", "CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER": "YES",
        "ENABLE_STRICT_OBJC_MSGSEND": "YES", "GCC_C_LANGUAGE_STANDARD": "gnu17", "GCC_NO_COMMON_BLOCKS": "YES",
        "IPHONEOS_DEPLOYMENT_TARGET": "17.0", "SDKROOT": "iphoneos", "SWIFT_VERSION": "5.0",
        "SWIFT_STRICT_CONCURRENCY": "targeted", "SUPPORTED_PLATFORMS": "iphoneos iphonesimulator",
    }
    app_settings = {
        "ASSETCATALOG_COMPILER_APPICON_NAME": "AppIcon", "ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME": "AccentColor",
        "CODE_SIGN_STYLE": "Automatic", "CURRENT_PROJECT_VERSION": "1", "DEVELOPMENT_TEAM": "",
        "GENERATE_INFOPLIST_FILE": "NO", "INFOPLIST_FILE": "AlfordDaily/Resources/Info.plist",
        "LD_RUNPATH_SEARCH_PATHS": ["$(inherited)", "@executable_path/Frameworks"], "MARKETING_VERSION": "1.0",
        "PRODUCT_BUNDLE_IDENTIFIER": "com.alfordfamily.daily", "PRODUCT_NAME": "$(TARGET_NAME)",
        "SUPPORTS_MACCATALYST": "NO", "TARGETED_DEVICE_FAMILY": "1,2", "ENABLE_PREVIEWS": "YES",
    }
    test_settings = {
        "BUNDLE_LOADER": "$(TEST_HOST)", "CODE_SIGN_STYLE": "Automatic", "DEVELOPMENT_TEAM": "",
        "GENERATE_INFOPLIST_FILE": "YES", "LD_RUNPATH_SEARCH_PATHS": ["$(inherited)", "@executable_path/Frameworks", "@loader_path/Frameworks"],
        "PRODUCT_BUNDLE_IDENTIFIER": "com.alfordfamily.daily.tests", "PRODUCT_NAME": "$(TARGET_NAME)",
        "TARGETED_DEVICE_FAMILY": "1,2", "TEST_HOST": "$(BUILT_PRODUCTS_DIR)/AlfordDaily.app/$(BUNDLE_EXECUTABLE_FOLDER_PATH)/AlfordDaily",
    }
    config_lists = {}
    for scope, settings in [("project", shared), ("app", app_settings), ("tests", test_settings)]:
        configurations = []
        for name in ["Debug", "Release"]:
            current = dict(settings)
            if scope == "project":
                if name == "Debug":
                    current.update({"DEBUG_INFORMATION_FORMAT": "dwarf", "ENABLE_TESTABILITY": "YES", "GCC_OPTIMIZATION_LEVEL": "0",
                                    "GCC_PREPROCESSOR_DEFINITIONS": ["DEBUG=1", "$(inherited)"], "ONLY_ACTIVE_ARCH": "YES",
                                    "SWIFT_ACTIVE_COMPILATION_CONDITIONS": "$(inherited) DEBUG", "SWIFT_OPTIMIZATION_LEVEL": "-Onone"})
                else:
                    current.update({"DEBUG_INFORMATION_FORMAT": "dwarf-with-dsym", "ENABLE_NS_ASSERTIONS": "NO",
                                    "SWIFT_COMPILATION_MODE": "wholemodule", "SWIFT_OPTIMIZATION_LEVEL": "-O", "VALIDATE_PRODUCT": "YES"})
            configurations.append(add(f"config:{scope}:{name}", "XCBuildConfiguration", buildSettings=current, name=name))
        config_lists[scope] = add("configlist:" + scope, "XCConfigurationList", buildConfigurations=configurations,
                                 defaultConfigurationIsVisible=0, defaultConfigurationName="Release")

    proxy = add("proxy:app", "PBXContainerItemProxy", containerPortal=identifier("project"), proxyType=1,
                remoteGlobalIDString=identifier("target:app"), remoteInfo="AlfordDaily")
    dependency = add("dependency:app", "PBXTargetDependency", target=identifier("target:app"), targetProxy=proxy)
    app_target = add("target:app", "PBXNativeTarget", buildConfigurationList=config_lists["app"], buildPhases=phases["app"],
                     buildRules=[], dependencies=[], name="AlfordDaily", productName="AlfordDaily", productReference=app_product,
                     productType="com.apple.product-type.application")
    test_target = add("target:tests", "PBXNativeTarget", buildConfigurationList=config_lists["tests"], buildPhases=phases["tests"],
                      buildRules=[], dependencies=[dependency], name="AlfordDailyTests", productName="AlfordDailyTests",
                      productReference=test_product, productType="com.apple.product-type.bundle.unit-test")
    project = add("project", "PBXProject", attributes={"BuildIndependentTargetsInParallel": "YES", "LastUpgradeCheck": "1600",
                  "TargetAttributes": {app_target: {"CreatedOnToolsVersion": "16.0"},
                                       test_target: {"CreatedOnToolsVersion": "16.0", "TestTargetID": app_target}}},
                  buildConfigurationList=config_lists["project"], compatibilityVersion="Xcode 14.0", developmentRegion="en",
                  hasScannedForEncodings=0, knownRegions=["en", "Base"], mainGroup=main_group, productRefGroup=products_group,
                  projectDirPath="", projectRoot="", targets=[app_target, test_target])
    document = {"archiveVersion": 1, "classes": {}, "objectVersion": 56, "objects": objects, "rootObject": project}
    return "// !$*UTF8*$!\n" + render(document) + "\n"


def scheme_text(local_storekit=False) -> str:
    root = ET.Element("Scheme", LastUpgradeVersion="1600", version="1.3")

    def reference(parent, target):
        name = "AlfordDaily" if target == "app" else "AlfordDailyTests"
        ET.SubElement(parent, "BuildableReference", BuildableIdentifier="primary", BlueprintIdentifier=identifier("target:" + target),
                      BuildableName=name + (".app" if target == "app" else ".xctest"), BlueprintName=name,
                      ReferencedContainer="container:AlfordDaily.xcodeproj")

    build = ET.SubElement(root, "BuildAction", parallelizeBuildables="YES", buildImplicitDependencies="YES")
    entries = ET.SubElement(build, "BuildActionEntries")
    for target in ["app", "tests"]:
        entry = ET.SubElement(entries, "BuildActionEntry", buildForTesting="YES", buildForRunning="YES" if target == "app" else "NO",
                              buildForProfiling="YES" if target == "app" else "NO", buildForArchiving="YES" if target == "app" else "NO",
                              buildForAnalyzing="YES")
        reference(entry, target)
    test = ET.SubElement(root, "TestAction", buildConfiguration="Debug", selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB",
                         selectedLauncherIdentifier="Xcode.DebuggerFoundation.Launcher.LLDB", shouldUseLaunchSchemeArgsEnv="NO")
    testables = ET.SubElement(test, "Testables")
    testable = ET.SubElement(testables, "TestableReference", skipped="NO", parallelizable="NO")
    reference(testable, "tests")
    launch = ET.SubElement(root, "LaunchAction", buildConfiguration="Debug", selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB",
                           selectedLauncherIdentifier="Xcode.DebuggerFoundation.Launcher.LLDB", launchStyle="0", useCustomWorkingDirectory="NO",
                           ignoresPersistentStateOnLaunch="NO", debugDocumentVersioning="YES", debugServiceExtension="internal", allowLocationSimulation="YES")
    runnable = ET.SubElement(launch, "BuildableProductRunnable", runnableDebuggingMode="0")
    reference(runnable, "app")
    if local_storekit:
        arguments = ET.SubElement(launch, "CommandLineArguments")
        ET.SubElement(arguments, "CommandLineArgument", argument="-StoreKitTesting", isEnabled="YES")
        ET.SubElement(launch, "StoreKitConfigurationFileReference", identifier="../../Config/LocalPurchases.storekit")
    profile = ET.SubElement(root, "ProfileAction", buildConfiguration="Release", shouldUseLaunchSchemeArgsEnv="YES", savedToolIdentifier="",
                            useCustomWorkingDirectory="NO", debugDocumentVersioning="YES")
    reference(ET.SubElement(profile, "BuildableProductRunnable", runnableDebuggingMode="0"), "app")
    ET.SubElement(root, "AnalyzeAction", buildConfiguration="Debug")
    ET.SubElement(root, "ArchiveAction", buildConfiguration="Release", revealArchiveInOrganizer="YES")
    ET.indent(root, space="   ")
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="unicode") + "\n"


def outputs():
    return {
        PROJECT / "project.pbxproj": project_text(),
        PROJECT / "xcshareddata/xcschemes/AlfordDaily.xcscheme": scheme_text(),
        PROJECT / "xcshareddata/xcschemes/AlfordDaily-StoreKit.xcscheme": scheme_text(True),
        PROJECT / "project.xcworkspace/contents.xcworkspacedata": '<?xml version="1.0" encoding="UTF-8"?>\n<Workspace version="1.0"><FileRef location="self:"/></Workspace>\n',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if checked-in project differs from generated source inventory")
    args = parser.parse_args()
    stale = []
    for path, text in outputs().items():
        if args.check:
            if not path.exists() or path.read_text() != text:
                stale.append(str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text)
    if stale:
        print("Out-of-date project files:\n" + "\n".join(stale), file=sys.stderr)
        return 1
    print("Xcode project matches source inventory." if args.check else "Generated AlfordDaily.xcodeproj and two shared schemes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
