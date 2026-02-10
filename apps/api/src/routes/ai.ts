import { FastifyInstance } from 'fastify';
import { LLMService } from '../services/llm';
import { z } from 'zod';

// Input Schemas
const explainSchema = z.object({
    scenarioId: z.string(),
    explanationType: z.string().optional(),
    phenotype: z.object({
        age: z.number(),
        sex: z.string(),
        nihss: z.number(),
        occlusion: z.string(),
        collaterals: z.number(),
        coreInitial: z.number().optional(),
        territory: z.number().optional(),
    }),
    baselineOutcomes: z.object({
        sichRisk: z.number(),
        mortalityRisk: z.number(),
        mrs0to2Probability: z.number(),
    }),
    currentOutcomes: z.object({
        sichRisk: z.number(),
        mortalityRisk: z.number(),
        mrs0to2Probability: z.number(),
    }),
}).passthrough(); // Allow other fields like actions/mediators without validation for now

const chatSchema = z.object({
    history: z.array(z.object({
        role: z.string(),
        content: z.string(),
    })),
    message: z.string(),
    context: z.any(),
});

export async function aiRoutes(fastify: FastifyInstance) {

    fastify.post('/explain', async (request, reply) => {
        try {
            const body = explainSchema.parse(request.body);
            const explanation = await LLMService.explainToFamily(body);

            return {
                explanation,
                generatedAt: new Date().toISOString(),
                model: "llama-3.3-70b-versatile"
            };
        } catch (error) {
            request.log.error(error);
            reply.status(400).send({ error: "Invalid request or AI service error" });
        }
    });

    fastify.post('/chat', async (request, reply) => {
        try {
            const body = chatSchema.parse(request.body);
            const response = await LLMService.chat(body.history, body.message, body.context);

            return {
                response,
                generatedAt: new Date().toISOString(),
            };
        } catch (error) {
            request.log.error(error);
            reply.status(400).send({ error: "Invalid request or AI service error" });
        }
    });

    // Validations for calculation request
    const calculateSchema = z.object({
        prompt: z.string(),
        equationRef: z.string().optional(),
        inputs: z.record(z.any()).optional()
    });

    fastify.post('/calculate', async (request, reply) => {
        try {
            const body = calculateSchema.parse(request.body);
            const result = await LLMService.calculate(body.prompt);
            return { result };
        } catch (error) {
            request.log.error(error);
            reply.status(400).send({ error: "Calculation failed" });
        }
    });
}
