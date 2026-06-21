import 'dotenv/config';
import { HydraDBClient } from '@hydradb/sdk';

const client = new HydraDBClient({ token: process.env.HYDRA_DB_API_KEY! });
const tenantId = process.env.HYDRA_TENANT_ID ?? 'still_meditation_copilot';

async function main() {
  const tenants = await client.tenants.list();
  console.log('tenants:', JSON.stringify(tenants.data, null, 2));

  const subTenants = await client.tenants.subTenants({ tenantId });
  console.log('subTenants:', JSON.stringify(subTenants.data, null, 2));

  const memories = [
    {
      source_id: 'mem_test_001',
      text: 'Test memory from Presence app',
      title: 'test',
      infer: true,
    },
  ];

  try {
    const r1 = await client.context.ingest({
      tenantId,
      type: 'memory',
      memories: JSON.stringify(memories),
      upsert: true,
    });
    console.log('ingest default sub:', r1);
  } catch (e: unknown) {
    const err = e as { statusCode?: number; body?: unknown };
    console.log('ingest default error:', err.statusCode, err.body);
  }

  try {
    const r2 = await client.context.ingest({
      tenantId,
      subTenantId: 'user_hackathon_test',
      type: 'memory',
      memories: JSON.stringify(memories),
      upsert: true,
    });
    console.log('ingest user sub:', r2);
  } catch (e: unknown) {
    const err = e as { statusCode?: number; body?: unknown };
    console.log('ingest user sub error:', err.statusCode, err.body);
  }
}

main().catch(console.error);
