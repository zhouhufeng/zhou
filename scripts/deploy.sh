#!/usr/bin/env bash
# Build the site and publish it to zhou.genohub.org on the K3s node.
#
#   ./scripts/deploy.sh              build, upload, flip, verify
#   ./scripts/deploy.sh --no-build   publish the dist/ that is already there
#   ./scripts/deploy.sh --rollback   point `current` at the previous release
#   ./scripts/deploy.sh --list       show the releases on the node
#
# A deploy is: rsync a new release directory, then move the `current` symlink.
# nginx follows the symlink on the next request, so the switch is atomic and a
# rollback is the same move in reverse — no pod restart either way.
#
# Prerequisites (one time): kubectl apply -f deploy/k8s/linlab.yaml on the node,
# and a proxied Cloudflare A record zhou -> $ORIGIN_IP. See docs/DEPLOY.md.
set -euo pipefail

# The origin's address and SSH key stay out of this public repo: put them in
# .env.origin (git-ignored; copy .env.origin.example) or export them.
_env="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.env.origin"
# shellcheck disable=SC1090
[[ -f "$_env" ]] && source "$_env"
: "${ORIGIN_IP:?set ORIGIN_IP in .env.origin (see .env.origin.example)}"
ORIGIN_USER="${ORIGIN_USER:-ubuntu}"
: "${ORIGIN_KEY:?set ORIGIN_KEY in .env.origin (see .env.origin.example)}"
REMOTE_ROOT="${REMOTE_ROOT:-/srv/zhou}"
HOSTNAME_="${SITE_HOST:-zhou.genohub.org}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSH=(ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
         -o LogLevel=ERROR -o ConnectTimeout=20 -i "$ORIGIN_KEY" "$ORIGIN_USER@$ORIGIN_IP")

say() { printf '\033[1m==>\033[0m %s\n' "$*"; }
die() { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }

[[ -f "$ORIGIN_KEY" ]] || die "no SSH key at $ORIGIN_KEY (set ORIGIN_KEY)"

case "${1:-}" in
  --list)
    "${SSH[@]}" "ls -1 $REMOTE_ROOT/releases 2>/dev/null; echo; readlink -f $REMOTE_ROOT/current"
    exit 0
    ;;
  --rollback)
    say "Rolling back on $ORIGIN_IP"
    "${SSH[@]}" bash -s <<EOF
set -euo pipefail
cd "$REMOTE_ROOT"
current=\$(basename "\$(readlink -f current)")
previous=\$(ls -1 releases | grep -v "^\$current\$" | sort | tail -1)
[ -n "\$previous" ] || { echo "no previous release to roll back to" >&2; exit 1; }
ln -sfn "releases/\$previous" current.tmp
mv -Tf current.tmp current
echo "current -> \$previous"
EOF
    exit 0
    ;;
esac

if [[ "${1:-}" != "--no-build" ]]; then
  say "Building"
  ( cd "$ROOT" && npm run build )
fi
[[ -f "$ROOT/dist/index.html" ]] || die "dist/index.html missing — run the build first"

RELEASE="$(date -u +%Y%m%d-%H%M%S)"
say "Uploading release $RELEASE to $ORIGIN_USER@$ORIGIN_IP:$REMOTE_ROOT"

"${SSH[@]}" "sudo mkdir -p $REMOTE_ROOT/releases && sudo chown -R $ORIGIN_USER:$ORIGIN_USER $REMOTE_ROOT"

# --delete keeps a release directory identical to dist/, so a removed file does
# not linger and get served.
rsync -az --delete \
  -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -i $ORIGIN_KEY" \
  "$ROOT/dist/" "$ORIGIN_USER@$ORIGIN_IP:$REMOTE_ROOT/releases/$RELEASE/"

say "Flipping current -> releases/$RELEASE"
"${SSH[@]}" bash -s <<EOF
set -euo pipefail
cd "$REMOTE_ROOT"
# The symlink must be RELATIVE. nginx resolves it inside the container, where
# the release lives at /site/releases/... , not at $REMOTE_ROOT/releases/... —
# an absolute link here resolves to nothing and every request 404s.
ln -sfn "releases/$RELEASE" current.tmp
mv -Tf current.tmp current
chmod -R a+rX "releases/$RELEASE"
# Keep the last $KEEP_RELEASES releases so a rollback always has somewhere to go.
cd "$REMOTE_ROOT/releases" && ls -1 | sort | head -n -$KEEP_RELEASES | xargs -r rm -rf
EOF

say "Verifying at the origin (bypassing Cloudflare)"
origin_status=$("${SSH[@]}" "curl -s -o /dev/null -w '%{http_code}' -H 'Host: $HOSTNAME_' http://127.0.0.1/")
echo "    origin GET / -> $origin_status"
[[ "$origin_status" == "200" ]] || die "origin did not return 200 — check: kubectl -n web get pods,ingress"

say "Verifying through Cloudflare"
# A 200 here proves nothing on its own. The genohub.org zone has a wildcard
# record, so zhou.genohub.org resolves — and answers — even with no `zhou` record,
# just from a different origin. Same trap that made the hcloud record look done
# when it was not. So the gate is the page CONTENT, never the status code.
MARKER='Hufeng Zhou, PhD — Computational Biology'
if edge_body=$(curl -fsS --max-time 20 "https://$HOSTNAME_/" 2>/dev/null); then
  if grep -qF "$MARKER" <<<"$edge_body"; then
    echo "    https://$HOSTNAME_/ -> serving this site"
  else
    echo "    https://$HOSTNAME_/ answers, but it is NOT this site — that is the"
    echo "    zone wildcard, not a \`zhou\` record. Add the Cloudflare A record"
    echo "    (zhou -> $ORIGIN_IP, proxied). See docs/DEPLOY.md."
  fi
else
  echo "    https://$HOSTNAME_/ is not answering — add the Cloudflare A record"
  echo "    (zhou -> $ORIGIN_IP, proxied). See docs/DEPLOY.md."
fi

say "Done — release $RELEASE"
