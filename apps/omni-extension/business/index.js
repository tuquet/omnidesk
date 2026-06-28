import devBridge from './dev/index.js';
import runtimeBridge from './runtime/index.js';

export default function (context, message) {
  // SyncBridge (dev) for syncing with Workflow App
  devBridge(context, message);

  // RuntimeBridge for Execution Engine integration
  runtimeBridge(context, message);
}
