import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import workspacesRoutes from './routes/workspaces.routes.js';
import invitesRoutes from './routes/invites.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import budgetsRoutes from './routes/budgets.routes.js';
import goalsRoutes from './routes/goals.routes.js';
import pushRoutes from './routes/push.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { scheduleWeeklySummaryJob } from './jobs/weeklySummary.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: [env.WEB_ORIGIN, env.ADMIN_ORIGIN],
  })
);
app.use(express.json());

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/invites', invitesRoutes);
app.use('/workspaces', workspacesRoutes);
app.use('/workspaces/:workspaceId/categories', categoriesRoutes);
app.use('/workspaces/:workspaceId/transactions', transactionsRoutes);
app.use('/workspaces/:workspaceId/budgets', budgetsRoutes);
app.use('/workspaces/:workspaceId/goals', goalsRoutes);
app.use('/push', pushRoutes);
app.use('/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});

scheduleWeeklySummaryJob();
