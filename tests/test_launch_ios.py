"""Regression tests for the Mac launcher. Uses real local Git repositories.
Apple tools are stubs: these tests do NOT prove Xcode compilation/device signing.
"""
from pathlib import Path
import os
import shutil
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'launch-ios.command'
URL = 'https://github.com/Jbapckfan/family-game-portal.git'

class LauncherTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.home = self.root / 'home'
        self.home.mkdir()
        self.bin = self.root / 'bin'
        self.bin.mkdir()
        self.env = os.environ.copy()
        self.env.update(HOME=str(self.home), PATH=str(self.bin)+':'+self.env['PATH'],
                        GIT_CONFIG_GLOBAL=str(self.root/'gitconfig'),
                        GIT_CONFIG_NOSYSTEM='1', GIT_TERMINAL_PROMPT='0')
        self.env.update(GIT_AUTHOR_NAME='Test', GIT_AUTHOR_EMAIL='test@example.invalid',
                        GIT_COMMITTER_NAME='Test', GIT_COMMITTER_EMAIL='test@example.invalid')
        self.stub('uname', 'echo Darwin')
        self.stub('xcode-select', 'echo /Applications/Xcode.app/Contents/Developer')
        self.stub('xcodebuild', 'echo "Xcode fixture"')
        self.stub('open', 'printf "%s\\n" "$@" > "$HOME/opened"')
        self.seed = self.root / 'seed'
        self.git('init','-b','main',str(self.seed))
        (self.seed/'ios/AlfordDaily.xcodeproj').mkdir(parents=True)
        (self.seed/'ios/AlfordDaily.xcodeproj/project.pbxproj').write_text('test fixture\n')
        (self.seed/'ios/scripts').mkdir()
        (self.seed/'ios/scripts/validate_project.py').write_text('print("project fixture checked")\n')
        (self.seed/'scripts').mkdir()
        (self.seed/'scripts/sync-ios-web.mjs').write_text('console.log("bundle fixture checked");\n')
        self.git('-C',str(self.seed),'add','.')
        self.git('-C',str(self.seed),'commit','-m','fixture')
        self.remote = self.root/'remote.git'
        self.git('clone','--bare',str(self.seed),str(self.remote))
        self.git('config','--global',f'url.{self.remote.as_uri()}.insteadOf',URL)
        self.target = self.home/'Projects'/'Alford Daily'

    def tearDown(self): self.tmp.cleanup()
    def stub(self, name, body):
        p=self.bin/name; p.write_text('#!/bin/sh\n'+body+'\n'); p.chmod(0o755)
    def git(self,*args):
        p=subprocess.run(['git',*args],env=self.env,text=True,capture_output=True)
        if p.returncode: self.fail(f'fixture git failed: {args}\n{p.stderr}')
        return p.stdout.strip()
    def clone(self):
        self.target.parent.mkdir(parents=True,exist_ok=True)
        self.git('clone','--branch','main',URL,str(self.target))
    def run_script(self, *args, ok=False):
        self.assertTrue(SCRIPT.is_file(), 'launcher implementation is missing')
        p=subprocess.run(['bash',str(SCRIPT),str(self.target),*args],env=self.env,text=True,capture_output=True)
        if ok: self.assertEqual(p.returncode,0,p.stdout+p.stderr)
        else: self.assertNotEqual(p.returncode,0,p.stdout+p.stderr)
        return p.stdout+p.stderr
    def assert_unopened(self): self.assertFalse((self.home/'opened').exists())

    def test_clones_private_repo_and_opens_exact_project_with_spaces(self):
        text=self.run_script(ok=True)
        self.assertTrue((self.target/'ios/AlfordDaily.xcodeproj').is_dir())
        self.assertIn(str(self.target/'ios/AlfordDaily.xcodeproj'),(self.home/'opened').read_text())
        self.assertIn('not signed',text.lower())
    def test_rejects_non_macos_before_cloning(self):
        self.stub('uname','echo Linux')
        self.assertIn('macOS',self.run_script()); self.assertFalse(self.target.exists()); self.assert_unopened()
    def test_rejects_unusable_xcode_before_cloning(self):
        self.stub('xcodebuild','exit 1')
        self.assertIn('Xcode',self.run_script()); self.assertFalse(self.target.exists()); self.assert_unopened()
    def test_rejects_non_git_folder_without_changing_it(self):
        self.target.mkdir(parents=True); (self.target/'keep').write_text('precious')
        self.run_script(); self.assertEqual((self.target/'keep').read_text(),'precious'); self.assert_unopened()
    def test_rejects_symlink_destination(self):
        self.target.parent.mkdir(parents=True); self.target.symlink_to(self.seed,target_is_directory=True)
        self.assertIn('symlink',self.run_script()); self.assert_unopened()
    def test_rejects_foreign_origin(self):
        self.clone(); self.git('-C',str(self.target),'remote','set-url','origin','https://example.invalid/other.git')
        self.assertIn('origin',self.run_script()); self.assert_unopened()
    def test_rejects_uncommitted_changes(self):
        self.clone(); p=self.target/'ios/AlfordDaily.xcodeproj/project.pbxproj'; p.write_text('local work')
        self.assertIn('local changes',self.run_script()); self.assertEqual(p.read_text(),'local work'); self.assert_unopened()
    def test_rejects_untracked_files(self):
        self.clone(); (self.target/'keep').write_text('not backed up')
        self.run_script(); self.assertEqual((self.target/'keep').read_text(),'not backed up'); self.assert_unopened()
    def test_rejects_non_main_branch(self):
        self.clone(); self.git('-C',str(self.target),'checkout','-b','my-work')
        self.assertIn('main',self.run_script()); self.assertEqual(self.git('-C',str(self.target),'branch','--show-current'),'my-work'); self.assert_unopened()
    def test_clean_clone_fast_forwards(self):
        self.clone(); (self.seed/'new.txt').write_text('release update')
        self.git('-C',str(self.seed),'add','.'); self.git('-C',str(self.seed),'commit','-m','new release')
        self.git('-C',str(self.seed),'push',str(self.remote),'main')
        self.run_script(ok=True); self.assertEqual((self.target/'new.txt').read_text(),'release update')
    def test_refuses_local_commits_not_on_remote(self):
        self.clone(); (self.target/'local.txt').write_text('my commit')
        self.git('-C',str(self.target),'add','.'); self.git('-C',str(self.target),'commit','-m','local change')
        before=self.git('-C',str(self.target),'rev-parse','HEAD')
        self.assertIn('local commits',self.run_script())
        self.assertEqual(before,self.git('-C',str(self.target),'rev-parse','HEAD')); self.assert_unopened()
    def test_validation_failure_prevents_opening(self):
        (self.seed/'ios/scripts/validate_project.py').write_text('raise SystemExit(1)\n')
        self.git('-C',str(self.seed),'add','.'); self.git('-C',str(self.seed),'commit','-m','bad fixture')
        self.git('-C',str(self.seed),'push',str(self.remote),'main')
        self.assertIn('validation',self.run_script().lower()); self.assert_unopened()
    def test_clone_failure_is_not_success(self):
        shutil.rmtree(self.remote)
        self.assertIn('GitHub',self.run_script()); self.assert_unopened()
    def test_rejects_nested_path_inside_another_checkout(self):
        self.clone(); self.target=self.target/'ios'
        self.assertIn('repository root',self.run_script()); self.assert_unopened()
    def test_rejects_extra_arguments_before_changes(self):
        self.assertIn('Usage',self.run_script('unexpected')); self.assertFalse(self.target.exists()); self.assert_unopened()

if __name__ == '__main__': unittest.main(verbosity=2)
