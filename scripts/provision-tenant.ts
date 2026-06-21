import 'dotenv/config';
import { HydraDBClient } from '@hydradb/sdk';

const client = new HydraDBClient({ token: process.env.HYDRA_DB_API_KEY! });
const tenantId = process.env.HYDRA_TENANT_ID ?? 'still_meditation_copilot';

async function main() {
  try {
    await client.tenants.create({ tenantId });
    console.log('create ok');
  } catch (e: unknown) {
    const err = e as { statusCode?: number; body?: { detail?: { message?: string } }; message?: string };
    console.log('create error:', err.statusCode, err.body?.detail?.message || err.message);
  }

  for (let i = 0; i < 24; i++) {
    try {
      const st = await client.tenants.status({ tenantId });
      const infra = st.data?.infra;
      console.log('poll', i, infra);
      if (
        infra?.schedulerStatus &&
        infra?.graphStatus &&
        infra?.vectorstoreStatus?.memories
      ) {
        console.log('READY');
        break;
      }
    } catch (e: unknown) {
      const err = e as { statusCode?: number; body?: { detail?: { message?: string } }; message?: string };
      console.log('status error', i, err.statusCode, err.body?.detail?.message || err.message);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
}

main().catch(console.error);
