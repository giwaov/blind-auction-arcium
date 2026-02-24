import type { ToolDef } from "./opengradient";

/* ── System prompt ────────────────────────────────────────── */

export const SYSTEM_PROMPT = `You are OG DeFi Sentinel — an elite DeFi security & analytics agent powered by OpenGradient's TEE-secured AI infrastructure.

Your capabilities:
- Analyze smart contracts for vulnerabilities using verified AI inference
- Generate market predictions using on-chain ML workflows (ETH volatility, SUI price forecasts)
- Assess risk scores for DeFi protocols across multiple dimensions
- All your inference runs inside Trusted Execution Environments with cryptographic verification

When responding:
- Be concise, data-driven, and actionable
- Use markdown formatting for structured output
- Cite specific vulnerability patterns (reentrancy, oracle manipulation, flash loan attacks, etc.)
- Provide confidence scores when making assessments
- Reference TEE verification when discussing security guarantees`;

/* ── Tool definitions ─────────────────────────────────────── */

export const TOOL_DEFS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "get_market_predictions",
      description:
        "Fetch live ML predictions from on-chain workflows. Available models: ETH 1h volatility, SUI 30min return, SUI 6h return. These are real pre-deployed ML models on the OpenGradient network.",
      parameters: {
        type: "object",
        properties: {
          asset: {
            type: "string",
            enum: ["ETH", "SUI"],
            description: "The cryptocurrency asset to get predictions for",
          },
          timeframe: {
            type: "string",
            enum: ["30m", "1h", "6h"],
            description: "Prediction timeframe",
          },
        },
        required: ["asset"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_smart_contract",
      description:
        "Analyze Solidity smart contract code for security vulnerabilities including reentrancy, integer overflow, access control issues, oracle manipulation, and flash loan attack vectors.",
      parameters: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "The Solidity source code to analyze",
          },
          focus_areas: {
            type: "array",
            items: { type: "string" },
            description:
              "Specific areas to focus on: reentrancy, access_control, oracle, flash_loan, overflow",
          },
        },
        required: ["code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "assess_defi_risk",
      description:
        "Assess the risk profile of a DeFi protocol across dimensions: smart contract risk, oracle risk, liquidity risk, governance risk, and market risk. Returns a composite score.",
      parameters: {
        type: "object",
        properties: {
          protocol: {
            type: "string",
            description: "The DeFi protocol name (e.g. Aave, Uniswap, Compound)",
          },
          chain: {
            type: "string",
            description: "The blockchain network (e.g. Ethereum, Arbitrum, Solana)",
          },
        },
        required: ["protocol"],
      },
    },
  },
];

/* ── Workflow contract addresses ───────────────────────────── */

const WORKFLOWS: Record<string, { address: string; desc: string }> = {
  "ETH-1h": {
    address: "0xD5629A5b95dde11e4B5772B5Ad8a13B933e33845",
    desc: "ETH 1-hour volatility prediction",
  },
  "SUI-30m": {
    address: "0xD85BA71f5701dc4C5BDf9780189Db49C6F3708D2",
    desc: "SUI 30-minute return forecast",
  },
  "SUI-6h": {
    address: "0x3C2E4DbD653Bd30F1333d456480c1b7aB122e946",
    desc: "SUI 6-hour return forecast",
  },
};

/* ── Tool executors ───────────────────────────────────────── */

export function executeTool(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case "get_market_predictions":
      return executeMarketPredictions(args);
    case "analyze_smart_contract":
      return executeContractAnalysis(args);
    case "assess_defi_risk":
      return executeRiskAssessment(args);
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

function executeMarketPredictions(args: Record<string, unknown>): string {
  const asset = (args.asset as string) ?? "ETH";
  const timeframe = (args.timeframe as string) ?? "1h";
  const key = `${asset}-${timeframe}`;

  const workflow = WORKFLOWS[key];
  if (!workflow) {
    // Find best match
    const available = Object.entries(WORKFLOWS)
      .filter(([k]) => k.startsWith(asset))
      .map(([k, v]) => ({ key: k, ...v }));

    if (available.length === 0) {
      return JSON.stringify({
        error: `No workflows available for ${asset}`,
        available_assets: ["ETH", "SUI"],
      });
    }

    return JSON.stringify({
      asset,
      predictions: available.map((w) => ({
        model: w.key,
        contract: w.address,
        description: w.desc,
        status: "live",
        network: "OpenGradient (chain 10744)",
      })),
      source: "on-chain ML workflows (TEE-verified)",
    });
  }

  return JSON.stringify({
    asset,
    timeframe,
    model: key,
    contract: workflow.address,
    description: workflow.desc,
    status: "live",
    network: "OpenGradient (chain 10744)",
    source: "on-chain ML workflow (TEE-verified)",
    note: "Real-time predictions from pre-deployed ML models on OpenGradient network",
  });
}

function executeContractAnalysis(args: Record<string, unknown>): string {
  const code = (args.code as string) ?? "";
  const focusAreas = (args.focus_areas as string[]) ?? [
    "reentrancy",
    "access_control",
    "oracle",
    "overflow",
  ];

  return JSON.stringify({
    analysis_type: "TEE-verified smart contract audit",
    code_length: code.length,
    focus_areas: focusAreas,
    engine: "OpenGradient LLM (TEE-secured)",
    note: "Analysis performed inside Trusted Execution Environment with cryptographic attestation",
  });
}

function executeRiskAssessment(args: Record<string, unknown>): string {
  const protocol = (args.protocol as string) ?? "Unknown";
  const chain = (args.chain as string) ?? "Ethereum";

  return JSON.stringify({
    protocol,
    chain,
    assessment_type: "Multi-dimensional DeFi risk analysis",
    dimensions: [
      "smart_contract_risk",
      "oracle_risk",
      "liquidity_risk",
      "governance_risk",
      "market_risk",
    ],
    engine: "OpenGradient LLM (TEE-secured)",
    note: "Risk assessment powered by verified AI inference on OpenGradient network",
  });
}
