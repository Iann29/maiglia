import { defineApp } from "convex/server";
import betterAuth from "./betterAuth/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import migrations from "@convex-dev/migrations/convex.config";
import aggregate from "@convex-dev/aggregate/convex.config";
import convexFilesControl from "@gilhrpenner/convex-files-control/convex.config";

const app = defineApp();
app.use(betterAuth);
app.use(rateLimiter);
app.use(migrations);
app.use(aggregate);
app.use(convexFilesControl);

export default app;
