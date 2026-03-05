#!/usr/bin/env python3
"""
Git history scrubber - removes sensitive mnemonic from git history
Uses git low-level commands to rewrite history
"""
import subprocess
import os
import tempfile
import shutil

MNEMONIC = "happy review hammer glad roof strong twice juice popular outside used catch"
REPLACEMENT = "REDACTED_MNEMONIC"

def run_cmd(cmd, capture=True):
    """Run a command and return output"""
    result = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
    return result.stdout.strip() if capture else result.returncode

def main():
    print("=" * 60)
    print("Git History Scrubber")
    print("=" * 60)
    
    # Get all commits
    commits = run_cmd("git rev-list --all").split("\n")
    print(f"Found {len(commits)} commits to check")
    
    # Find commits with the mnemonic
    result = run_cmd(f'git log --all -p -S "{MNEMONIC}" --format="%H"')
    if not result:
        print("No commits found containing the mnemonic!")
        return
    
    affected_commits = [c for c in result.split("\n") if c and len(c) == 40]
    print(f"Found {len(affected_commits)} commits containing the mnemonic")
    
    # Create temporary directory for the rewrite
    print("\nStarting history rewrite using git filter-branch...")
    
    # Write a script for sed-like replacement
    script_content = f'''
import sys
import os

mnemonic = "{MNEMONIC}"
replacement = "{REPLACEMENT}"

for root, dirs, files in os.walk("."):
    # Skip .git directory
    if ".git" in root:
        continue
    for f in files:
        filepath = os.path.join(root, f)
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as file:
                content = file.read()
            if mnemonic in content:
                content = content.replace(mnemonic, replacement)
                with open(filepath, "w", encoding="utf-8") as file:
                    file.write(content)
                print(f"Cleaned: {{filepath}}", file=sys.stderr)
        except:
            pass
'''
    
    # Write the filter script
    script_path = os.path.join(os.getcwd(), "_filter_script.py")
    with open(script_path, "w") as f:
        f.write(script_content)
    
    print(f"Created filter script at {script_path}")
    
    # Run git filter-branch with the Python script
    cmd = f'git filter-branch --force --tree-filter "python {script_path}" --prune-empty HEAD'
    print(f"\nRunning: {cmd}")
    print("This may take a while...")
    
    result = subprocess.run(cmd, shell=True)
    
    if result.returncode == 0:
        print("\n" + "=" * 60)
        print("SUCCESS! Git history has been rewritten.")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Verify the mnemonic is gone: git log --all -p -S 'happy review'")
        print("2. Force push to remote: git push origin --force --all")
        print("3. Delete the backup refs: git update-ref -d refs/original/refs/heads/master")
    else:
        print(f"\nFilter-branch failed with code {result.returncode}")
    
    # Cleanup
    if os.path.exists(script_path):
        os.remove(script_path)

if __name__ == "__main__":
    main()
