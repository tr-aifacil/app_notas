import OpenAI from "openai";
import { getRequiredEnv } from "@/lib/env";

export async function generateDischargeReport(snapshot: unknown) {
  const client = new OpenAI({ apiKey: getRequiredEnv("OPENAI_API_KEY") });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Redige um relatório clínico formal em português de Portugal, usando apenas os dados fornecidos no JSON. Não inventes nem inferes. Se faltar informação, escreve 'Não registado'. Não menciones que foste gerado por AI. Usa sempre o código do cliente para identificação e mantém o nome do paciente como placeholder '[NOME_INTERNO_APP]' no relatório."
      },
      {
        role: "user",
        content:
          "Usa este JSON (patient, episode, sessions, scales) e escreve o relatório com as 8 secções fixas, com títulos numerados 1 a 8.\n\n" +
          JSON.stringify(snapshot)
      }
    ]
  });

  return completion.choices[0]?.message?.content ?? "";
}
