import { Router } from 'express';
import { getAgentModel, getAgentModelLabel } from '../services/nebius.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    ok: true,
    hydradb: Boolean(process.env.HYDRA_DB_API_KEY),
    nebius: Boolean(process.env.NEBIUS_API_KEY),
    nebiusModel: getAgentModelLabel(),
    nebiusModelId: getAgentModel(),
    tenant: process.env.HYDRA_TENANT_ID ?? 'still_meditation_copilot',
    demoUserId: process.env.DEMO_USER_ID ?? undefined,
    demoDisplayName: process.env.DEMO_DISPLAY_NAME ?? undefined,
  });
});
