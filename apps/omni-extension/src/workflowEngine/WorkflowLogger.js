import dbLogs, { defaultLogItem } from '@/db/logs';
/* eslint-disable class-methods-use-this */
class WorkflowLogger {
  async add({ detail, history, ctxData, data }) {
    const logDetail = { ...defaultLogItem, ...detail };

    await Promise.all([
      dbLogs.logsData.add(data),
      dbLogs.ctxData.add(ctxData),
      dbLogs.items.add(logDetail),
      dbLogs.histories.add(history),
    ]);

    // Send telemetry to Omni-Studio as fallback for full report
    try {
      const baseUrl = process.env.VUE_APP_OMNI_STUDIO_API || 'http://127.0.0.1:1422';
      await fetch(`${baseUrl}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          detail: logDetail,
          history,
          ctxData,
          data,
        }),
      });
    } catch (err) {
      console.warn('Failed to send workflow report to Omni-Studio:', err);
    }
  }
}

export default WorkflowLogger;
