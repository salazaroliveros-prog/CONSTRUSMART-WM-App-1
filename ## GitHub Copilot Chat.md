## GitHub Copilot Chat

- Extension: 0.49.0 (prod)
- VS Code: 1.121.0 (f6cfa2ea2403534de03f069bdf160d06451ed282)
- OS: win32 10.0.26200 x64
- GitHub Account: Signed Out

## Network

User Settings:
```json
  "http.systemCertificatesNode": true,
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Environment Variables:
- NO_PROXY=

Connecting to https://api.github.com:
- DNS ipv4 Lookup: 140.82.112.5 (59 ms)
- DNS ipv6 Lookup: Error (16 ms): getaddrinfo ENOTFOUND api.github.com
- Proxy URL: None (1 ms)
- Electron fetch (configured): HTTP 200 (1206 ms)
- Node.js https: HTTP 200 (1535 ms)
- Node.js fetch: HTTP 200 (1544 ms)

Connecting to https://api.githubcopilot.com/_ping:
- DNS ipv4 Lookup: 140.82.112.21 (24 ms)
- DNS ipv6 Lookup: Error (130 ms): getaddrinfo ENOTFOUND api.githubcopilot.com
- Proxy URL: None (1 ms)
- Electron fetch (configured): HTTP 200 (1604 ms)
- Node.js https: HTTP 200 (1503 ms)
- Node.js fetch: HTTP 200 (628 ms)

Connecting to https://copilot-proxy.githubusercontent.com/_ping:
- DNS ipv4 Lookup: 4.249.131.160 (19 ms)
- DNS ipv6 Lookup: Error (24 ms): getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
- Proxy URL: None (7 ms)
- Electron fetch (configured): HTTP 200 (1698 ms)
- Node.js https: HTTP 200 (1066 ms)
- Node.js fetch: HTTP 200 (409 ms)

Connecting to https://mobile.events.data.microsoft.com: HTTP 404 (456 ms)
Connecting to https://dc.services.visualstudio.com: HTTP 404 (2311 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (6000 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (267 ms)
Connecting to https://default.exp-tas.com: HTTP 400 (1826 ms)

Number of system certificates: 133

## Documentation

In corporate networks: [Troubleshooting firewall settings for GitHub Copilot](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot).