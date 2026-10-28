# Publish Alford Daily on the NAS and the studio domain

**Historical environment record.** For the October 28 candidate, start with [the current private-playtest plan](PRIVATE-PLAYTEST-2026-10-28.md). The two documented NAS routes conflict and were unreachable; do not run these old deployment commands without re-verifying the actual target. The existing Site remains owner-private and no deployment is authorized by the current task.

Verified environment and deployment choices, October 22, 2026.

## Yes, the studio domain can host or link to the games

`https://www.cursedtoasterstudios.com` responded successfully during this review. Its public `www` CNAME points to `custom-domains.chatgpt.site`, and the domain uses Porkbun nameservers. The authenticated Sites account confirms that both the apex and `www` hostnames have active HTTPS bindings to the public **Cursed Toaster Studios** Site, version 7 at inspection time.

The studio Site ID is `appgprj_6ac5d1526b7c8191899fe361c8d70d91`. The separate Alford Daily Site ID is `appgprj_6ad77f0216348191a061da38c4a431c4`, with the existing address `https://alford-daily.jbapckfan.chatgpt.site`. That game Site was still owner-private when inspected. A private preview URL is not yet a friends-testing link.

**Recommended destination:** `https://play.cursedtoasterstudios.com/`, served by the standalone Alford Daily build. This is a proposed hostname, not a claim that it is live. Add a product card/link from the studio homepage after the games are published. Keep Alford Daily's source and deployment separate from the studio's source.

You can also place the build at `https://www.cursedtoasterstudios.com/alford-daily/` inside the existing studio Site. The package uses relative runtime paths and supports a prefix, but that option requires editing and deploying the studio source and testing all routes at that prefix. A subdomain is easier to maintain independently. Do not replace the studio homepage with the game hub.

## Choose the hosting route

| Route | Best use | What must be configured |
| --- | --- | --- |
| Existing Alford Daily Site + `play` custom domain | Fastest route with the hosting already in this account | Update the Site from this tested source, set the intended friends audience, attach the hostname, and add the returned DNS/verification records at Porkbun. |
| Cloudflare Pages + `play` subdomain | Straightforward deployment from a Mac terminal | Publish only the staged `web/` directory; register the custom domain in Pages; add its exact CNAME at Porkbun. |
| Dedicated NAS game container + public tunnel | Test the NAS-hosted build remotely | Deploy the isolated static build, configure a tunnel to that game service, arrange its hostname/DNS and verify from outside the home network. |
| Existing family portal on NAS port 8080 | Local household testing | Fast-forward the existing repo and recreate/verify its `game-portal` service. |

For a public commercial release, managed static hosting avoids relying on home power, Internet and NAS availability. That is an architectural recommendation for this static application, not a claim that the NAS cannot host it.

## What is currently blocked

The connected Desktop Commander device `MacBook-Pro-5.local` was offline in the latest check. The cloud workspace cannot directly verify the private NAS at `192.168.1.155`; its direct request reached a gateway response. This does not prove the NAS itself is down. No NAS container update, public tunnel, router change or studio DNS change has been performed by this handoff.

The exact NAS target from the existing project is:

- SSH: `Jbapckfan@192.168.1.155`
- Checkout: `/volume1/docker/family-game-portal`
- Existing Compose service: `game-portal`
- Household collection: `http://192.168.1.155:8080/games/daily/`

Run the supplied Codex prompt on the Mac while it is on the home network, or reconnect that Mac to the authorized remote-computer tool. Use the Mac's existing SSH authentication. Do not put a NAS password or API token into the prompt or repository.

## 1. Update the existing NAS portal

Use a clean, current Mac checkout of `Jbapckfan/family-game-portal`. Read the full verified SHA from the handoff's `RELEASE-COMMIT.txt` or the release commit URL. A source commit is not a live deployment.

From the source checkout, replace `VERIFIED_COMMIT_SHA` with that exact 40-character SHA:

```bash
ssh Jbapckfan@192.168.1.155 \
  'cd /volume1/docker/family-game-portal && bash -s -- VERIFIED_COMMIT_SHA' \
  < scripts/deploy-nas.sh
```

The helper checks repository origin, branch, local changes, Docker, Python, fast-forward ancestry and the target's 32-game inventory. It recreates only `game-portal`, then verifies exact served bytes and MIME types for the expected game assets and launch URLs. It does not reset, stash or discard local work. If verification fails, it reports the previous revision and leaves the failure visible; it does not claim success.

After success, open the household collection URL above from a second device on Wi-Fi. For a controlled rollback, inspect the saved previous revision and any subsequent changes first; restore the selected version deliberately and rerun the verifier. Do not use a blind hard reset.

## 2. Prepare the dedicated public build

The downloadable package already contains a `web/` directory ready for static hosting. If you have changed source, regenerate it from the repository root:

```bash
node scripts/sync-ios-web.mjs
node scripts/sync-ios-web.mjs --check
node scripts/puzzle-inventory.mjs
node scripts/stage-site.mjs /ABSOLUTE/PATH/TO/alford-web
```

The output directory must be new or empty. Stage each release into a fresh versioned directory, verify it, then switch the deployment to that directory. The staging script never cleans an occupied directory. It checks canonical-source parity and copies only the 32 catalog games, the two required runtimes and the collection hub. It excludes unrelated portal games, source generators, tests and private project files. It also includes `release.json`, the prepared-count inventory. A real missing module should return 404; never enable a universal homepage fallback for this build.

To test an extracted package locally without ES-module problems from `file://`, run its `Open-Alford-Daily.command` on a Mac with Python 3, or:

```bash
python3 source/scripts/open-preview.py web
```

The local launcher serves only the web build at the stable loopback address `http://127.0.0.1:8765/`. Keep its terminal window open while playing and reuse the same address, port and browser to keep local saves. If the port is occupied, the launcher reports the problem without stopping another process or silently choosing a new origin. A loopback URL is for that computer; it is not the friends link.

## 3. Serve only Alford Daily on the NAS

Do not point a new public tunnel at the existing whole-portal service merely because it is already running. The supplied dedicated Compose file mounts only the staged web output. It has no NAS administration mount, directory listing, or homepage fallback.

Create a dedicated deployment area such as `/volume1/docker/alford-daily-beta`, with `config/` and `releases/<verified-sha>/web/`. Inspect any existing directory first. Transfer the package's `web/` directory into a new release directory, and copy `deploy/Caddyfile.beta` and `deploy/nas-beta.compose.yml` into `config/`. Keep the previous release directory for a reversible deployment.

On the NAS, set the verified build directory and the desired listening address, then validate and start the dedicated service:

```bash
export ALFORD_WEB_ROOT=/volume1/docker/alford-daily-beta/releases/VERIFIED_COMMIT_SHA/web
export ALFORD_BIND_ADDRESS=192.168.1.155
export ALFORD_BETA_PORT=8082
docker compose --project-name alford-daily-beta \
  -f /volume1/docker/alford-daily-beta/config/nas-beta.compose.yml config --quiet
docker compose --project-name alford-daily-beta \
  -f /volume1/docker/alford-daily-beta/config/nas-beta.compose.yml up -d
```

The example binds to the known NAS LAN interface so another home device or a tunnel connector can reach it. If the connector runs directly on the NAS and LAN access is unnecessary, retain the template's loopback default instead. Verify that port 8082 is unused before starting. The Caddy container listens internally on port 8080; Docker publishes it as port 8082.

Verify the dedicated endpoint from the Mac, using the local staged build as the byte-for-byte reference:

```bash
python3 scripts/verify-nas.py http://192.168.1.155:8082 \
  --static-directory /ABSOLUTE/PATH/TO/alford-web
```

The supplied Compose/Caddy configuration is prepared source. It has not yet been executed against this NAS, so successful Docker startup and HTTP verification remain required deployment gates. Pin and record the tested container-image digest when promoting a public production release.

## 4. Connect a NAS beta to a public hostname

Cloudflare Tunnel can map a public hostname to a local HTTP service using an outbound connection; friends then use a normal HTTPS URL without installing a VPN. The public application becomes accessible to anyone who can reach it unless an access policy is added. [Tunnel overview](https://developers.cloudflare.com/tunnel/) · [Published applications](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/)

For the usual Cloudflare-managed-domain setup, the domain must be added to Cloudflare before publishing its tunnel route. The current domain uses Porkbun DNS, so this route may require moving authoritative DNS or choosing an appropriate supported configuration. Preserve every existing web, verification and email record if that migration is chosen. A lone Porkbun CNAME is not a substitute for establishing the required Cloudflare zone/tunnel configuration. [Setup requirements](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/)

After a tunnel is created in the user's account, configure a published application:

| Setting | Value for the dedicated NAS beta |
| --- | --- |
| Public hostname | `play.cursedtoasterstudios.com` or a separately chosen beta hostname |
| Service type | HTTP |
| Service URL when connector can reach NAS LAN | `http://192.168.1.155:8082` |
| Service URL for a connector sharing the Compose network | The `alford-beta` service on container port 8080 |
| Exposure | Game application only |

Use the current dashboard's installation command for the selected NAS/Docker architecture. Store the tunnel credential outside Git and shell history; do not include it in this package. Do not publish the NAS administration UI or SSH service, and do not add router port forwarding for this tunnel route. [Current tunnel setup](https://developers.cloudflare.com/tunnel/get-started/)

For an invitation-only beta, configure Access with an explicit friend email allowlist and one-time PIN login. OTP alone is not an allowlist. The game build itself does not provide a friend-account system. [One-time PIN](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/) · [Policy examples](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/common-policies/)

## 5. Simpler terminal alternative: static hosting with Porkbun DNS

Cloudflare Pages supports a custom subdomain while leaving nameservers at the current provider. Register `play.cursedtoasterstudios.com` in the Pages project first, then add the exact CNAME it requests at Porkbun. Do not change the apex or `www` records serving the existing studio site. [Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/) · [Porkbun DNS instructions](https://kb.porkbun.com/article/231-how-to-add-dns-records-on-porkbun)

For a direct-upload project, authenticate with the user's Cloudflare account, inspect existing projects before creating one, then publish the staged directory. Example commands, to be run by Codex on the Mac after source verification:

```bash
npx wrangler login
npx wrangler pages project list
# Create alford-daily-beta only if it does not already exist.
npx wrangler pages project create alford-daily-beta --production-branch main
cp deploy/pages-headers.txt /ABSOLUTE/PATH/TO/alford-web/_headers
npx wrangler pages deploy /ABSOLUTE/PATH/TO/alford-web \
  --project-name alford-daily-beta --branch main
```

Use the actual returned deployment hostname, which may differ if the project name is unavailable. Direct-upload and Git-integrated projects have different creation workflows; choose deliberately rather than assuming they can be switched later. [Direct Upload documentation](https://developers.cloudflare.com/pages/get-started/direct-upload/)

The `_headers` file marks the beta as noindex. That is a search-engine instruction, not authentication. For the existing Sites route, use its own access controls and returned custom-domain verification records; do not invent a TXT value or reuse the studio Site's verification record for the game Site.

## Final verification before sharing

Run the exact-content verifier against the chosen HTTPS base URL with `--static-directory`. It accepts a collection beneath a URL prefix as well as a subdomain root. It checks canonical directory launch routes so hosts that redirect `/index.html` do not produce false failures.

Then open the public URL on a phone using cellular data. Confirm the collection, at least one full game, Practice, reload/resume, a second game using each shared runtime, and the return-home link. Check the live console for missing modules. For an Access-protected beta, verify through an authenticated browser session; the unauthenticated command-line verifier should fail at the login boundary, and must not be called a passing game check.

Only after those checks should the live URL be sent to friends. Use one stable hostname for the cohort. The included tester guide explains local saves, the Central-time daily rollover and how to report a game/puzzle-specific problem.
