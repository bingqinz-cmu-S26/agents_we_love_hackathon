import 'dotenv/config';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.NEBIUS_API_KEY!,
  baseURL: 'https://api.tokenfactory.nebius.com/v1/',
});

const models = [
  'meta-llama/Meta-Llama-3.1-70B-Instruct',
  'meta-llama/Meta-Llama-3.1-8B-Instruct',
  'deepseek-ai/DeepSeek-V3-0324',
  'Qwen/Qwen2.5-72B-Instruct',
  process.env.NEBIUS_MODEL,
].filter(Boolean) as string[];

for (const model of models) {
  try {
    const r = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'say ok' }],
      max_tokens: 5,
    });
    console.log('OK', model, r.choices[0]?.message?.content);
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    console.log('FAIL', model, err.status);
  }
}
