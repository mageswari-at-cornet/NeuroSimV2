import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const apiKey = process.env.GROK_API_KEY;
if (!apiKey) {
    console.warn("GROK_API_KEY not found in environment variables. AI features will fail.");
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export class LLMService {
    /**
     * Helper function to call Groq API
     */
    private static async callGroq(messages: { role: string; content: string }[], temperature: number = 0.7, retries = 3): Promise<string> {
        if (!apiKey) {
            throw new Error("GROK_API_KEY is not configured");
        }

        let lastError: any;

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(GROQ_API_URL, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "User-Agent": "NeuroSim-API/1.0"
                    },
                    body: JSON.stringify({
                        model: MODEL,
                        messages: messages,
                        temperature: temperature,
                        max_tokens: 1024
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    // Don't retry client errors (4xx) unless it's 429 (Rate Limit)
                    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                        throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`);
                    }
                    throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`);
                }

                const data: any = await response.json();
                return data.choices[0]?.message?.content || "";
            } catch (error) {
                console.warn(`Attempt ${i + 1} failed:`, error instanceof Error ? error.message : error);
                lastError = error;
                // Wait before retrying (exponential backoff: 500ms, 1000ms, 2000ms)
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, i)));
                }
            }
        }

        throw lastError;
    }

    /**
     * Generates a patient-friendly explanation of the clinical situation.
     */
    static async explainToFamily(data: any): Promise<string> {
        const { phenotype, currentOutcomes, scenarioId, currentActions } = data;

        const systemPrompt = `You are a compassionate stroke neurologist explaining a complex medical situation to a patient's family.
Avoid overly technical jargon, but use accurate terms where necessary.
IMPORTANT: 
1. Do not use markdown formatting (such as asterisks for bold/italic). Use plain text only.
2. Use relationship-neutral terms like "your loved one" or "the patient" instead of assuming a specific relationship like "your father".`;

        const userPrompt = `
      Patient Data:
      - Age/Sex: ${phenotype.age} ${phenotype.sex}
      - Condition: Acute Ischemic Stroke
      - Occlusion: ${phenotype.occlusion}
      - NIHSS: ${phenotype.nihss}
      - Core Volume (Infarted Tissue): ${phenotype.coreInitial || 'Unknown'} cc
      - Collaterals: ${phenotype.collaterals} (0-4 scale)
      
      Treatment Plan Details:
      ${currentActions ? JSON.stringify(currentActions, null, 2) : 'Standard Protocol'}

      Outcomes with Current Plan (${scenarioId}):
      - Mortality Risk: ${(currentOutcomes.mortalityRisk * 100).toFixed(1)}%
      - Chance of Functional Independence (mRS 0-2): ${(currentOutcomes.mrs0to2Probability * 100).toFixed(1)}%
      - Risk of Bleeding (sICH): ${(currentOutcomes.sichRisk * 100).toFixed(1)}%

      Please provide a concise, empathetic explanation (max 100 words) that covers:
      1. What is happening (blockage location).
      2. The stakes (brain at risk vs already lost).
      3. The outlook based on the current treatment plan (refer to specific details of the plan).
    `;

        try {
            return await this.callGroq([
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]);
        } catch (error) {
            console.error("Error generating explanation:", error instanceof Error ? error.message : error);
            // Log full error details for debugging
            if (error instanceof Error && 'cause' in error) console.error("Error cause:", (error as any).cause);
            return "I apologize, but I am currently unable to generate a detailed explanation. Please consult with the clinical team directly.";
        }
    }

    /**
     * Handles a chat interaction with context.
     */
    static async chat(history: { role: string; content: string }[], message: string, context: any): Promise<string> {
        // Construct the context-aware system prompt
        const systemPrompt = `
      You are an expert Neuro-Interventionalist assistant. You are helpful, precise, and clinical.
      IMPORTANT: Do not use markdown formatting (such as asterisks for bold/italic). Use plain text only.
      
      Current Patient Context (User sees this on their dashboard):
      ${JSON.stringify(context, null, 2)}
      
      Instructions:
      1. Answer the user's question directly based on this context.
      2. Do NOT summarize the patient data (age, NIHSS, etc.) at the start of your response. The user already knows this information.
      3. Only cite specific data points if they are critical to your reasoning for a specific answer.
      4. If the user says "Hi" or "Hello", simply ask how you can assist with this specific case without repeating the case details.
      5. If the question is about medical advice for a real patient, clarify that this is a simulation tool.
    `;

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : msg.role,
                content: msg.content
            })),
            { role: "user", content: message }
        ];

        try {
            return await this.callGroq(messages);
        } catch (error) {
            console.error("Error in chat:", error);
            return "I'm having trouble connecting to the AI service right now.";
        }
    }
}
