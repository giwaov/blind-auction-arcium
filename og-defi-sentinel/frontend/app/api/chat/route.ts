import { NextResponse } from "next/server";
import {
  chatCompletion,
  extractReply,
  extractToolCalls,
  type ChatMessage,
} from "../../lib/opengradient";
import { SYSTEM_PROMPT, TOOL_DEFS, executeTool } from "../../lib/tools";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages: userMessages } = (await req.json()) as {
      messages: ChatMessage[];
    };

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...userMessages,
    ];

    const toolResults: string[] = [];
    let finalReply = "";
    let txHash: string | undefined;

    // Agentic loop — up to 5 rounds of tool calling
    for (let round = 0; round < 5; round++) {
      const res = await chatCompletion(messages, { tools: TOOL_DEFS });
      txHash = res.x402_tx_hash ?? txHash;

      const toolCalls = extractToolCalls(res);
      const reply = extractReply(res);

      if (toolCalls.length === 0) {
        finalReply = reply;
        break;
      }

      // Add assistant message with tool calls
      messages.push({
        role: "assistant",
        content: reply ?? "",
      });

      // Execute each tool call
      for (const tc of toolCalls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {
          /* empty */
        }

        const result = executeTool(tc.function.name, args);
        toolResults.push(`[${tc.function.name}] ${result}`);

        messages.push({
          role: "tool",
          content: result,
          tool_call_id: tc.id,
        });
      }
    }

    return NextResponse.json({
      reply: finalReply,
      tools_used: toolResults,
      x402_tx_hash: txHash,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
