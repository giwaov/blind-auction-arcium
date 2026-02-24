import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ExactEvmScheme, registerExactEvmScheme } from "@x402/evm/exact/client";
import { ExactEvmSchemeV1 } from "@x402/evm/exact/v1/client";
import { EVM_NETWORK_CHAIN_ID_MAP } from "@x402/evm/v1";
import { privateKeyToAccount } from "viem/accounts";

// Patch: add OpenGradient's og-evm network to the x402 SDK's chain ID map
// so that EIP-712 signing uses the correct chainId (10744)
(EVM_NETWORK_CHAIN_ID_MAP as Record<string, number>)["og-evm"] = 10744;

const OG_GATEWAY = "https://llmogevm.opengradient.ai";

/* ── types ───────────────────────────────────────────────── */

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ToolDef {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }[];
  model: string;
  x402_tx_hash?: string;
}

export interface CompletionResponse {
  id: string;
  choices: { text: string; finish_reason: string }[];
  model: string;
  x402_tx_hash?: string;
}

export type SettlementMode =
  | "SETTLE_INDIVIDUAL"
  | "SETTLE_INDIVIDUAL_WITH_METADATA"
  | "SETTLE_BATCH";

/* ── x402 client singleton ────────────────────────────────── */

let _x402Fetch: typeof fetch | null = null;

function getX402Fetch(): typeof fetch {
  if (_x402Fetch) return _x402Fetch;

  const rawKey = process.env.OG_PRIVATE_KEY?.trim();
  if (!rawKey) {
    throw new Error("OG_PRIVATE_KEY environment variable is required");
  }

  const privateKey = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  const client = new x402Client();

  // Use the SDK's registerExactEvmScheme helper which:
  // - Registers v2 with "eip155:*" wildcard (matches any eip155 network)
  // - Registers v1 for all known networks in EVM_NETWORK_CHAIN_ID_MAP
  registerExactEvmScheme(client, {
    signer: account,
  });

  // Also explicitly register v1 for "og-evm" since we just added it to the map
  client.registerV1("og-evm", new ExactEvmSchemeV1(account));

  _x402Fetch = wrapFetchWithPayment(fetch, client);
  return _x402Fetch;
}

/* ── API calls ─────────────────────────────────────────────── */

export async function chatCompletion(
  messages: ChatMessage[],
  options: {
    model?: string;
    tools?: ToolDef[];
    temperature?: number;
    max_tokens?: number;
    settlement_mode?: SettlementMode;
  } = {}
): Promise<ChatResponse> {
  const x402Fetch = getX402Fetch();

  const body: Record<string, unknown> = {
    model: options.model ?? "meta-llama/Llama-3.3-70B-Instruct",
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2048,
  };

  if (options.tools?.length) {
    body.tools = options.tools;
    body.tool_choice = "auto";
  }

  if (options.settlement_mode) {
    body.settlement_mode = options.settlement_mode;
  }

  const res = await x402Fetch(`${OG_GATEWAY}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenGradient chat error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const txHash = res.headers.get("x-402-tx-hash");
  if (txHash) data.x402_tx_hash = txHash;
  return data as ChatResponse;
}

export async function textCompletion(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<CompletionResponse> {
  const x402Fetch = getX402Fetch();

  const res = await x402Fetch(`${OG_GATEWAY}/v1/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: options.model ?? "meta-llama/Llama-3.3-70B-Instruct",
      prompt,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1024,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenGradient completion error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const txHash = res.headers.get("x-402-tx-hash");
  if (txHash) data.x402_tx_hash = txHash;
  return data as CompletionResponse;
}

/* ── helpers ─────────────────────────────────────────────── */

export function extractReply(res: ChatResponse): string {
  return res.choices?.[0]?.message?.content ?? "";
}

export function extractToolCalls(res: ChatResponse): ToolCall[] {
  return res.choices?.[0]?.message?.tool_calls ?? [];
}

export function extractCompletionText(res: CompletionResponse): string {
  return res.choices?.[0]?.text ?? "";
}
