# Deploying zhou.genohub.org

The site is static. It is built locally, rsynced to the origin node, and
served by an nginx pod behind the K3s Traefik ingress — the same pattern as
`lin.genohub.org`, in the same `web` namespace.

```
  you            Cloudflare              origin node (ORIGIN_IP)
  ───            ──────────              ───────────────────────
  npm run build
  rsync dist/ ──────────────────────────► /srv/zhou/releases/<ts>/
                                          /srv/zhou/current ─────┐
  browser ─► zhou.genohub.org ─► Traefik ──► Service ──► nginx ──┘
             (proxied, Full TLS)   :443       :80        :8080
```

## One-time setup

### 1. Cloudflare DNS

Scripted, with a token that has **Zone → DNS → Edit** on `genohub.org`:

```bash
export CF_API_TOKEN=$(cat ~/.cloudflare-dns-token)   # never paste it into argv
./scripts/cloudflare-dns.sh            # dry run — says what it would change
./scripts/cloudflare-dns.sh --apply    # create/fix the record, then verify
```

Or by hand, in the **genohub.org** zone → **DNS → Records → Add record**:

| Field | Value |
|---|---|
| Type | `A` |
| Name | `zhou` |
| IPv4 | the origin IP (`ORIGIN_IP` in `.env.origin`) |
| Proxy status | **Proxied** (orange cloud) |
| TTL | Auto |

Keep it proxied. Traefik serves a **self-signed** certificate, so a grey-clouded
record hands that certificate straight to browsers and every visit throws a
trust error. Proxied, Cloudflare presents its own valid certificate.

> **The zone wildcard makes this look done before it is.** `*.genohub.org`
> points at a parking page, so `zhou.genohub.org` resolves *and returns HTTP 200*
> with no `zhou` record at all. A status code cannot tell that apart from
> success — **the gate is the page content**, which is what both scripts check.
> Cloudflare will also have cached that parking page for up to an hour, so purge
> the URLs after creating the record (`cloudflare-dns.sh` handles the check; the
> purge is a dashboard action or an API call).

### 2. Cluster objects

```bash
kubectl apply -f deploy/k8s/zhou.yaml
kubectl -n web rollout status deploy/zhou
```

There is no `Namespace` object — `web` already exists, created for
`lin.genohub.org`. The pod stays unready until `/srv/zhou/current` exists, so
run the first deploy straight after; that is expected, not a failure.

`current` must be a **relative** symlink (`releases/<ts>`). nginx resolves it
inside the container, where the release sits at `/site/releases/<ts>`; an
absolute link points at a node path that does not exist there, and every request
404s while the pod still reports ready. `scripts/deploy.sh` gets this right.

## Deploying

```bash
./scripts/deploy.sh              # build, upload, flip the symlink, verify
./scripts/deploy.sh --no-build   # publish the dist/ already on disk
./scripts/deploy.sh --list       # what is on the node, and what is live
./scripts/deploy.sh --rollback   # point current/ back at the previous release
```

Overrides: `ORIGIN_IP`, `ORIGIN_USER`, `ORIGIN_KEY`, `REMOTE_ROOT`, `SITE_HOST`,
`KEEP_RELEASES`.

## Verifying

```bash
# origin, bypassing Cloudflare entirely
ssh -i "$ORIGIN_KEY" "$ORIGIN_USER@$ORIGIN_IP" \
  "curl -s -H 'Host: zhou.genohub.org' http://127.0.0.1/ | grep -o '<title>[^<]*'"

# through Cloudflare — content, not status code
curl -s https://zhou.genohub.org/ | grep -o '<title>[^<]*'

# client-side routing: an unknown path must return the app with a 200
curl -sI https://zhou.genohub.org/research/favor | head -1
curl -s  https://zhou.genohub.org/sitemap.xml | head -3
```

## Troubleshooting

| Symptom | Where to look |
|---|---|
| Pod never ready | `/srv/zhou/current` missing — run a deploy |
| Every path 404s, pod ready | `current` is an absolute symlink; re-deploy |
| 404 from Traefik | `kubectl -n web get ingress zhou` — host must match |
| 502 through Cloudflare | `kubectl -n web get pods,endpoints` |
| Parking page / ads | No `zhou` record yet, or Cloudflare cached it — purge |
| Certificate warning | The record is grey-clouded; set it to Proxied |

## Neighbours on this node

`web` namespace: `lin` (lin.genohub.org), `zhou` (this).
`favor` namespace: `api-v2`, `hcloud`, `higlass`, `higlass-favor`.
Nothing here touches the FAVOR stack.
