import 'dotenv/config';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.NEBIUS_API_KEY!,
  baseURL: 'https://api.tokenfactory.nebius.com/v1/',
});

const candidates = [
  'Qwen/Qwen3-235B-A22B-Instruct-2507',
  'nvidia/Llama-3_1-Nemotron-Ultra-253B-v1',
  'NousResearch/Hermes-4-405B',
  'openai/gpt-oss-120b',
  'Qwen/Qwen3-30B-A3B-Instruct-2507',
  'meta-llama/Llama-3.3-70B-Instruct',
];

for (const model of candidates) {
  try {
    const r = await client.chat.completions.create({
      model,
      temperature: 0.35,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content:
            'User feels anxious. Memory: sandalwood helped before. Reply as warm meditation companion in 2 short sentences.',
        },
      ],
    });
    console.log('OK', model);
    console.log(r.choices[0]?.message?.content);
    console.log('---');
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    console.log('FAIL', model, err.status, err.message?.slice(0, 100));
  }
}
