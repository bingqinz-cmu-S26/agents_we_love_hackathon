import 'dotenv/config';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.NEBIUS_API_KEY!,
  baseURL: 'https://api.tokenfactory.nebius.com/v1/',
});

try {
  const models = await client.models.list();
  console.log(models.data?.slice(0, 15).map((m) => m.id).join('\n'));
} catch (e: unknown) {
  const err = e as { status?: number; message?: string };
  console.log('list error', err.status, err.message);
}
