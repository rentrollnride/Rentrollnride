---
name: GitHub source snapshots
description: Source migration via GitHub connector when Git shell credentials fail
---

An authorized GitHub connector can write through the GitHub REST Git Data API even when the shell's Git credential helper rejects an HTTPS push. An empty GitHub repository first needs an initial file committed through the Contents API; Git blob creation against a truly empty repository fails. Git Data API tree/commit/ref operations can then upload the tracked source as a verified snapshot.

**Why:** A source snapshot is not a Git pack push. It can contain all tracked files while the local branch and the new remote branch have unrelated commit ancestry; treating the local branch as already synchronized will make later normal pushes fail or require reconciliation.

**How to apply:** Check the destination branch and compare file trees before claiming a successful upload. Explain when only the source snapshot, not prior commit history, was transferred. Before the next push from the local checkout, fix Git authentication and reconcile the branch histories without force-pushing or discarding work. Keep runtime secrets and database exports separate from the repository.

The GitHub source snapshot may use LF while the local checkout uses CRLF. Compare normalized line endings before concluding the two versions contain different code.

**Why:** Raw file comparisons disagreed across every touched source file although normalized content matched; treating this as a real divergence would have blocked a safe incremental commit.

**How to apply:** Normalize CRLF to LF for comparison and GitHub API uploads, then commit against the live remote branch head without force-updating it.