import { NextResponse } from "next/server";
import { chatCompletion, extractReply } from "../../lib/opengradient";

export const maxDuration = 45;

export async function POST(req: Request) {
  try {
    const { code } = (await req.json()) as { code: string };

    if (!code?.trim()) {
      return NextResponse.json(
        { error: "No Solidity code provided" },
        { status: 400 }
      );
    }

    const res = await chatCompletion([
      {
        role: "system",
        content: `You are an expert smart contract auditor performing TEE-verified security analysis. Analyze the provided Solidity code thoroughly.

Return your analysis as a JSON object with this structure:
{
  "summary": "Brief overview of the contract",
  "risk_level": "critical|high|medium|low",
  "findings": [
    {
      "severity": "critical|high|medium|low|info",
      "title": "Finding title",
      "description": "Detailed description",
      "location": "Function or line reference",
      "recommendation": "How to fix"
    }
  ],
  "gas_optimizations": ["suggestion1", "suggestion2"],
  "overall_score": 0-100
}`,
      },
      {
        role: "user",
        content: `Audit this Solidity smart contract:\n\n\`\`\`solidity\n${code}\n\`\`\``,
      },
    ]);

    const reply = extractReply(res);

    let audit;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      audit = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      audit = null;
    }

    return NextResponse.json({
      audit: audit ?? {
        summary: reply.slice(0, 500),
        risk_level: "medium",
        findings: [],
        gas_optimizations: [],
        overall_score: 50,
      },
      raw: reply,
      x402_tx_hash: res.x402_tx_hash,
      verified_by: "OpenGradient TEE",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
