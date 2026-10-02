#!/usr/bin/env bash
# Create (or correct) the Cloudflare DNS record for zhou.genohub.org.
#
#   CF_API_TOKEN=... ./scripts/cloudflare-dns.sh          # show what it would do
#   CF_API_TOKEN=... ./scripts/cloudflare-dns.sh --apply  # actually do it
#
# The token needs **Zone → DNS → Edit** on the genohub.org zone. An R2 / object
# storage token cannot do this no matter how it is scoped — R2 tokens carry
# storage permissions only, and their token id doubles as the S3 access key id,
# which is how you can tell one at a glance.
#
# Read the token from the environment or a file outside the repo. Never paste it
# into a command line: argv is visible to every process on the machine.
#
#   export CF_API_TOKEN=$(cat ~/.cloudflare-dns-token)
set -euo pipefail

ZONE="${CF_ZONE:-genohub.org}"
NAME="${CF_RECORD:-zhou.genohub.org}"
_env="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.env.origin"
# shellcheck disable=SC1090
[[ -f "$_env" ]] && source "$_env"
IP="${ORIGIN_IP:?set ORIGIN_IP in .env.origin (see .env.origin.example)}"
API="https://api.cloudflare.com/client/v4"

: "${CF_API_TOKEN:?set CF_API_TOKEN to a token with Zone:DNS:Edit on $ZONE}"

apply=false
[[ "${1:-}" == "--apply" ]] && apply=true

say()  { printf '\033[1m==>\033[0m %s\n' "$*"; }
die()  { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }

# Pull `success`, the first error message, and a jq-ish field out of a response
# without depending on jq being installed.
field() { python3 -c "import json,sys; d=json.load(sys.stdin); print(eval(sys.argv[1], {'d': d}) or '')" "$1"; }

cf() {
  local method="$1" path="$2" body="${3:-}"
  if [[ -n "$body" ]]; then
    curl -sS -X "$method" "$API$path" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" --data "$body"
  else
    curl -sS -X "$method" "$API$path" -H "Authorization: Bearer $CF_API_TOKEN"
  fi
}

say "Looking up the $ZONE zone"
zresp=$(cf GET "/zones?name=$ZONE")
if [[ "$(field "d['success']" <<<"$zresp")" != "True" ]]; then
  msg=$(field "d['errors'][0]['message'] if d.get('errors') else 'unknown error'" <<<"$zresp")
  case "$msg" in
    *"Cannot use the access token from location"*)
      die "the token is IP-restricted and this machine is not on its allowlist — $msg" ;;
    *)
      die "$msg" ;;
  esac
fi
zone_id=$(field "d['result'][0]['id'] if d['result'] else ''" <<<"$zresp")
[[ -n "$zone_id" ]] || die "no zone named $ZONE is visible to this token"
echo "    zone id: $zone_id"

say "Checking for an existing $NAME record"
rresp=$(cf GET "/zones/$zone_id/dns_records?name=$NAME&type=A")
rec_id=$(field "d['result'][0]['id'] if d.get('result') else ''" <<<"$rresp")
if [[ -n "$rec_id" ]]; then
  cur_ip=$(field "d['result'][0]['content']" <<<"$rresp")
  cur_px=$(field "d['result'][0]['proxied']" <<<"$rresp")
  echo "    exists: $NAME A $cur_ip proxied=$cur_px"
  if [[ "$cur_ip" == "$IP" && "$cur_px" == "True" ]]; then
    say "Already correct — nothing to do"
    exit 0
  fi
else
  echo "    none — the zone wildcard is what answers today"
fi

# Proxied is not optional. Traefik serves a self-signed certificate, so a
# grey-clouded record hands that straight to browsers and every visit fails on
# trust. Proxied, Cloudflare presents its own cert and tolerates the origin's.
payload=$(python3 -c "
import json, sys
print(json.dumps({'type': 'A', 'name': sys.argv[1], 'content': sys.argv[2],
                  'proxied': True, 'ttl': 1,
                  'comment': 'Hufeng Zhou homepage (zhou.genohub.org)'}))
" "$NAME" "$IP")

if ! $apply; then
  say "Dry run — would ${rec_id:+update}${rec_id:-create}: $NAME A $IP proxied"
  echo "    re-run with --apply"
  exit 0
fi

if [[ -n "$rec_id" ]]; then
  say "Updating $NAME -> $IP (proxied)"
  resp=$(cf PUT "/zones/$zone_id/dns_records/$rec_id" "$payload")
else
  say "Creating $NAME -> $IP (proxied)"
  resp=$(cf POST "/zones/$zone_id/dns_records" "$payload")
fi
[[ "$(field "d['success']" <<<"$resp")" == "True" ]] \
  || die "$(field "d['errors'][0]['message'] if d.get('errors') else resp" <<<"$resp")"

say "Verifying through Cloudflare (content, not status code)"
# The zone wildcard answers 200 for any hostname, so only the page itself proves
# the record is live and pointed at the right origin.
for i in 1 2 3 4 5; do
  if curl -fsS --max-time 20 "https://$NAME/" 2>/dev/null \
       | grep -qF 'Hufeng Zhou, PhD — Computational Biology'; then
    echo "    https://$NAME/ is serving this site"
    exit 0
  fi
  echo "    attempt $i: not this site yet, waiting 10s"
  sleep 10
done
die "record written, but https://$NAME/ still is not serving this site — check the origin"
