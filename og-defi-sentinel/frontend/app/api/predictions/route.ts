import { NextResponse } from "next/server";
import { chatCompletion, extractReply } from "../../lib/opengradient";

export const maxDuration = 30;

export async function GET() {
  try {
    const res = await chatCompletion([
      {
        role: "system",
        content:
          "You are a DeFi market analyst. Provide structured predictions in JSON format.",
      },
      {
        role: "user",
        content: `Analyze the following on-chain ML workflow contracts on OpenGradient (chain 10744) and provide market predictions:

1. ETH 1h Volatility Model: 0xD5629A5b95dde11e4B5772B5Ad8a13B933e33845
2. SUI 30min Return Model: 0xD85BA71f5701dc4C5BDf9780189Db49C6F3708D2
3. SUI 6h Return Model: 0x3C2E4DbD653Bd30F1333d456480c1b7aB122e946

For each model, provide:
- A brief market outlook
- Confidence level (high/medium/low)
- Key factors driving the prediction
- Recommended action

Format your response as a JSON array with objects containing: model, asset, timeframe, outlook, confidence, factors (array), action.`,
      },
    ]);

    const reply = extractReply(res);

    // Try to extract JSON from the reply
    let predictions;
    try {
      const jsonMatch = reply.match(/\[[\s\S]*\]/);
      predictions = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      predictions = null;
    }

    return NextResponse.json({
      predictions: predictions ?? [
        {
          model: "ETH-1h",
          asset: "ETH",
          timeframe: "1h",
          outlook: reply.slice(0, 200),
          confidence: "medium",
          factors: ["On-chain ML analysis"],
          action: "Monitor",
        },
      ],
      raw: reply,
      x402_tx_hash: res.x402_tx_hash,
      source: "OpenGradient TEE-verified inference",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
