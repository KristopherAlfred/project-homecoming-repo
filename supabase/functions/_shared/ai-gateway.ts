import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";

/** AI SDK provider wired to the Lovable AI Gateway. */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}
