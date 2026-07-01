import { MessageListener } from '@/utils/message';
import { toRaw } from 'vue';

class RendererWorkflowService {
  static executeWorkflow(workflowData, options) {
    /**
     * Convert Vue-created proxy into plain object.
     * It will throw error if there a proxy inside the object.
     */
    const clonedWorkflowData = JSON.parse(JSON.stringify(workflowData));

    return MessageListener.sendMessage(
      'workflow:execute',
      { ...clonedWorkflowData, options },
      'background'
    );
  }

  static stopWorkflowExecution(executionId) {
    return MessageListener.sendMessage(
      'workflow:stop',
      executionId,
      'background'
    );
  }
}

export default RendererWorkflowService;
