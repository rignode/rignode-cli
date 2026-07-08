# rignode-cli

Official CLI for the [RIGNODE](https://rignode.xyz) decentralized compute exchange. Register your GPU node, send heartbeats, check earnings, and monitor the network from your terminal.

## Installation

```bash
npm install -g @rignode/cli
```

Or run without installing:

```bash
npx @rignode/cli network
```

## Commands

### Register a Node

Register your GPU and start earning USDC:

```bash
rignode-cli register
```

You will be prompted for:
- Solana wallet address (base58, receive-only)
- GPU model (e.g. RTX 4090, A100 80G)
- VRAM in GB
- Region (us-east, us-west, eu-west, ap-southeast, sa-east)

Or pass all arguments inline:

```bash
rignode-cli register <wallet> "RTX 4090" 24 us-east
```

Save the Node ID returned. You need it for all subsequent commands.

### Send a Heartbeat

Keep your node marked as online:

```bash
rignode-cli heartbeat <nodeId>
```

Run this every 1 to 2 minutes (e.g. via cron or a loop script) to maintain online status. Nodes not seen for 5 minutes are automatically marked offline.

### Check Node Status

```bash
rignode-cli status <nodeId>
```

Shows GPU model, status, trust score, tokens per second, jobs completed, and total USDC earned.

### View Earnings

```bash
rignode-cli earnings <nodeId>
```

Lists all payout records with amounts and Solana transaction links for on-chain verification.

### Network Stats

```bash
rignode-cli network
```

Shows live stats: total nodes, active nodes, jobs completed, total USDC paid, and top models.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `RIGNODE_API_URL` | `https://rignode.xyz/api` | Override the API base URL |

## Automation Example

Keep heartbeats running in a shell loop:

```bash
NODE_ID=42
while true; do
  rignode-cli heartbeat $NODE_ID
  sleep 90
done
```

## Economics

- Node operators earn **80% of each job fee** in USDC
- Protocol keeps 20% for infrastructure
- Payments are on-chain SPL USDC transfers on Solana mainnet
- Verify any payout at [explorer.solana.com](https://explorer.solana.com)

## Model Pricing

| Model | Price per 1K output tokens |
|---|---|
| llama3-8b-q4 | $0.0004 USDC |
| llama3-70b-q4 | $0.0016 USDC |
| mistral-7b-q4 | $0.0003 USDC |
| qwen2-7b-q4 | $0.0003 USDC |
| whisper-large-v3 | $0.0006 USDC |

## Links

- Website: [rignode.xyz](https://rignode.xyz)
- Twitter: [@Rignode](https://x.com/Rignode)
- GitHub: [github.com/rignode](https://github.com/rignode)
- SDK: [rignode/rignode-sdk](https://github.com/rignode/rignode-sdk)

## License

MIT
