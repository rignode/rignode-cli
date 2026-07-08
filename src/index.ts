#!/usr/bin/env node
import * as https from "https";
import * as readline from "readline";

const BASE_URL = process.env.RIGNODE_API_URL ?? "https://rignode.xyz/api";

function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const data = body ? JSON.stringify(body) : undefined;
    const opts: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "rignode-cli/1.0.0",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(opts, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(raw) as T);
        } catch {
          reject(new Error("Invalid JSON response: " + raw));
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function fmt(label: string, value: string | number | boolean | null) {
  const val = value === null ? "N/A" : String(value);
  console.log(`  ${label.padEnd(22)} ${val}`);
}

const [, , cmd, ...args] = process.argv;

async function main() {
  switch (cmd) {
    case "register": {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const ask = (q: string) => new Promise<string>((r) => rl.question(q, r));
      const wallet  = args[0] ?? (await ask("Wallet address (base58): ")).trim();
      const gpu     = args[1] ?? (await ask("GPU model (e.g. RTX 4090): ")).trim();
      const vram    = parseInt(args[2] ?? (await ask("VRAM in GB: ")), 10);
      const region  = args[3] ?? (await ask("Region (us-east|us-west|eu-west|ap-southeast|sa-east): ")).trim();
      rl.close();
      const node = await request<Record<string, unknown>>("POST", "/nodes", {
        walletAddress: wallet,
        gpuModel: gpu,
        vram,
        region,
      });
      if ("error" in node) { console.error("Error:", node.error); process.exit(1); }
      console.log("\nNode registered successfully.");
      fmt("Node ID",       node.id as number);
      fmt("GPU",           node.gpuModel as string);
      fmt("VRAM",          (node.vram as number) + " GB");
      fmt("Region",        node.region as string);
      fmt("Status",        node.status as string);
      fmt("Trust Score",   node.trustScore as number);
      console.log('\nSave your Node ID. Run heartbeat with: rignode-cli heartbeat ' + node.id);
      break;
    }
    case "heartbeat": {
      const id = args[0];
      if (!id) { console.error("Usage: rignode-cli heartbeat <nodeId>"); process.exit(1); }
      const res = await request<Record<string, unknown>>("POST", `/nodes/${id}/heartbeat`);
      if ("error" in res) { console.error("Error:", res.error); process.exit(1); }
      console.log("Heartbeat sent. Last seen:", res.lastHeartbeat);
      break;
    }
    case "status": {
      const id = args[0];
      if (!id) { console.error("Usage: rignode-cli status <nodeId>"); process.exit(1); }
      const node = await request<Record<string, unknown>>("GET", `/nodes/${id}`);
      if ("error" in node) { console.error("Error:", node.error); process.exit(1); }
      console.log("\nNode Status");
      fmt("ID",            node.id as number);
      fmt("GPU",           node.gpuModel as string);
      fmt("VRAM",          (node.vram as number) + " GB");
      fmt("Region",        node.region as string);
      fmt("Status",        node.status as string);
      fmt("Trust Score",   node.trustScore as number);
      fmt("Tokens/sec",    node.tokensPerSec as number);
      fmt("Jobs Completed",node.jobsCompleted as number);
      fmt("Total Earned",  "$" + (node.totalEarningsUsdc as number).toFixed(4) + " USDC");
      fmt("Pending Payout","$" + (node.pendingPayoutUsdc as number).toFixed(4) + " USDC");
      break;
    }
    case "earnings": {
      const id = args[0];
      if (!id) { console.error("Usage: rignode-cli earnings <nodeId>"); process.exit(1); }
      const records = await request<Record<string, unknown>[]>("GET", `/nodes/${id}/earnings`);
      if (!Array.isArray(records)) { console.error("Error:", JSON.stringify(records)); process.exit(1); }
      if (records.length === 0) { console.log("No earnings records yet."); break; }
      console.log(`\nEarnings for Node ${id} (${records.length} payouts):\n`);
      records.forEach((r) => {
        const tx = r.txSignature
          ? `https://explorer.solana.com/tx/${r.txSignature}?cluster=mainnet`
          : "pending";
        console.log(`  ${r.createdAt}  $${(r.amountUsdc as number).toFixed(6)} USDC  ${tx}`);
      });
      break;
    }
    case "network": {
      const stats = await request<Record<string, unknown>>("GET", "/stats/network");
      console.log("\nRIGNODE Network Stats");
      fmt("Total Nodes",   stats.totalNodes as number);
      fmt("Active Nodes",  stats.activeNodes as number);
      fmt("Jobs Completed",stats.totalJobsCompleted as number);
      fmt("USDC Paid",     "$" + (stats.totalUsdcPaid as number).toFixed(4));
      fmt("Avg Trust",     (stats.avgTrustScore as number).toFixed(1));
      fmt("Top Models",    (stats.topModels as string[]).join(", "));
      break;
    }
    default:
      console.log(`
RIGNODE CLI v1.0.0
Decentralized GPU compute exchange on Solana

Usage:
  rignode-cli register [wallet] [gpu] [vram] [region]
  rignode-cli heartbeat <nodeId>
  rignode-cli status    <nodeId>
  rignode-cli earnings  <nodeId>
  rignode-cli network

Environment:
  RIGNODE_API_URL  Override API base (default: https://rignode.xyz/api)

Website:  https://rignode.xyz
Twitter:  https://x.com/Rignode
GitHub:   https://github.com/rignode
`);
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
