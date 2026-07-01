import { fetchApi } from '@/utils/api';
import firstWorkflows from '@/utils/firstWorkflows';
import { tasks } from '@/utils/shared';
import {
  cleanWorkflowTriggers,
  registerWorkflowTrigger,
} from '@/utils/workflowTrigger';
import dayjs from 'dayjs';
import defu from 'defu';
import deepmerge from 'lodash.merge';
import { nanoid } from 'nanoid';
import { defineStore } from 'pinia';
import browser from 'webextension-polyfill';
import { useOmniStudio } from '@/composable/useOmniStudio';
import { useUserStore } from './user';

const toStudioWorkflow = (workflow) => {
  let triggerData = workflow.trigger || { parameters: [], triggers: [] };
  
  if (workflow.drawflow && Array.isArray(workflow.drawflow.nodes)) {
    const triggerNode = workflow.drawflow.nodes.find((n) => n.label === 'trigger');
    if (triggerNode && triggerNode.data) {
      triggerData = {
        parameters: triggerNode.data.parameters || triggerData.parameters || [],
        triggers: triggerNode.data.triggers || triggerData.triggers || [],
      };
    }
  }

  return {
    id: workflow.id,
    name: workflow.name,
    icon: workflow.icon,
    folder_id: workflow.folderId,
    description: workflow.description,
    drawflow: workflow.drawflow,
    settings: workflow.settings,
    trigger: triggerData,
    global_data: workflow.globalData,
    table_data: workflow.table,
    data_columns: workflow.dataColumns,
    version: workflow.version,
    is_disabled: workflow.isDisabled ? 1 : 0,
    created_at: new Date(workflow.createdAt).toISOString(),
    updated_at: new Date(workflow.updatedAt).toISOString(),
  };
};

export const fromStudioWorkflow = (workflow) => {
  const parseJson = (val, fallback, fieldName) => {
    if (!val) return fallback;
    try {
      let parsed = typeof val === 'string' ? JSON.parse(val) : val;
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed); // Handle double-encoded strings
      }
      return parsed || fallback;
    } catch (e) {
      console.error(`[Workflow Validation Error] Failed to parse '${fieldName}' for workflow '${workflow.id || workflow.name}':`, e, '\nRaw value:', val);
      return fallback;
    }
  };
  
  return {
    id: workflow.id,
    name: workflow.name,
    icon: workflow.icon,
    folderId: workflow.folder_id,
    description: workflow.description,
    drawflow: parseJson(workflow.drawflow, { nodes: [], edges: [], zoom: 1.3 }, 'drawflow'),
    settings: parseJson(workflow.settings, {}, 'settings'),
    trigger: parseJson(workflow.trigger, null, 'trigger'),
    globalData: workflow.global_data || '{\n\t"key": "value"\n}',
    table: parseJson(workflow.table_data, [], 'table_data'),
    dataColumns: parseJson(workflow.data_columns, [], 'data_columns'),
    version: workflow.version,
    isDisabled: Boolean(workflow.is_disabled),
    createdAt: workflow.created_at ? new Date(workflow.created_at.includes('Z') ? workflow.created_at : workflow.created_at.replace(' ', 'T') + 'Z').getTime() : Date.now(),
    updatedAt: workflow.updated_at ? new Date(workflow.updated_at.includes('Z') ? workflow.updated_at : workflow.updated_at.replace(' ', 'T') + 'Z').getTime() : Date.now(),
  };
};



const syncToOmniStudio = (workflows) => {
  try {
    const payload = Array.isArray(workflows) ? workflows : [workflows];
    const studioPayload = payload.map(toStudioWorkflow);
    
    const { sendWsMessage } = useOmniStudio();
    const sent = sendWsMessage('push_workflows', studioPayload);
    
    if (!sent) {
      // console.debug('[SyncBridge] Omni Studio is offline. Workflows saved locally and will sync later.');
    }
  } catch (error) {
    console.error('Failed to sync workflows via WebSocket', error);
  }
};


const defaultWorkflow = (data = null, options = {}) => {
  let workflowData = {
    id: nanoid(),
    name: '',
    icon: 'riGlobalLine',
    folderId: null,
    content: null,
    connectedTable: null,
    drawflow: {
      edges: [],
      zoom: 1.3,
      nodes: [
        {
          position: {
            x: 100,
            y: window.innerHeight / 2,
          },
          id: nanoid(),
          label: 'trigger',
          data: tasks.trigger.data,
          type: tasks.trigger.component,
        },
      ],
    },
    table: [],
    dataColumns: [],
    description: '',
    trigger: { parameters: [], triggers: [] },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDisabled: false,
    settings: {
      publicId: '',
      aipowerToken: '',
      blockDelay: 0,
      saveLog: true,
      debugMode: false,
      restartTimes: 3,
      notification: true,
      execContext: 'popup',
      reuseLastState: false,
      inputAutocomplete: true,
      onError: 'stop-workflow',
      executedBlockOnWeb: false,
      insertDefaultColumn: false,
      defaultColumnName: 'column',
    },
    version: browser.runtime.getManifest().version,
    globalData: '{\n\t"key": "value"\n}',
  };

  if (data) {
    if (options.duplicateId && data.id) {
      delete workflowData.id;
    }

    if (data.drawflow?.nodes?.length > 0) {
      workflowData.drawflow.nodes = [];
    }

    workflowData = defu(data, workflowData);
  }

  return workflowData;
};

function convertWorkflowsToObject(workflows) {
  if (Array.isArray(workflows)) {
    return workflows.reduce((acc, workflow) => {
      if (typeof workflow.drawflow === 'string') {
        try {
          workflow.drawflow = JSON.parse(workflow.drawflow);
          if (typeof workflow.drawflow === 'string') {
            workflow.drawflow = JSON.parse(workflow.drawflow);
          }
        } catch (e) {
          workflow.drawflow = { nodes: [], edges: [] };
        }
      }
      acc[workflow.id] = workflow;

      return acc;
    }, {});
  } else if (typeof workflows === 'object' && workflows !== null) {
    Object.values(workflows).forEach((workflow) => {
      if (typeof workflow.drawflow === 'string') {
        try {
          workflow.drawflow = JSON.parse(workflow.drawflow);
          if (typeof workflow.drawflow === 'string') {
            workflow.drawflow = JSON.parse(workflow.drawflow);
          }
        } catch (e) {
          workflow.drawflow = { nodes: [], edges: [] };
        }
      }
    });
  }

  return workflows;
}

export const useWorkflowStore = defineStore('workflow', {
  storageMap: {
    workflows: 'workflows',
  },
  state: () => ({
    states: [],
    workflows: {},
    popupStates: [],
    retrieved: false,
    isFirstTime: false,
  }),
  getters: {
    getAllStates: (state) => [...state.popupStates, ...state.states],
    getById: (state) => (id) => state.workflows[id],
    getWorkflows: (state) => Object.values(state.workflows),
    getWorkflowStates: (state) => (id) =>
      [...state.states, ...state.popupStates].filter(
        ({ workflowId }) => workflowId === id
      ),
  },
  actions: {
    initSync() {
      const { onMessage } = useOmniStudio();
      onMessage((msg) => {
        if (msg.event_type === 'full_sync') {
          const studioWorkflows = msg.payload || [];
          let localWorkflows = { ...this.workflows };
          let workflowsToPush = [];
          const studioMap = {};

          studioWorkflows.forEach((workflow) => {
            const parsed = fromStudioWorkflow(workflow);
            const w = defaultWorkflow(parsed, { duplicateId: false });
            studioMap[w.id] = w;

            const localW = localWorkflows[w.id];
            if (!localW) {
              // Not in local, so add it from studio
              localWorkflows[w.id] = w;
            } else {
              // Exists in both, compare version first, then timestamps
              const localUpdate = localW.updatedAt || 0;
              const studioUpdate = w.updatedAt || 0;
              const localVersion = localW.version || '0.0.0';
              const studioVersion = w.version || '0.0.0';

              const vCmp = studioVersion.localeCompare(localVersion, undefined, { numeric: true, sensitivity: 'base' });

              if (vCmp > 0) {
                // Studio version is higher
                localWorkflows[w.id] = w;
              } else if (vCmp < 0) {
                // Local version is higher
                workflowsToPush.push(localW);
              } else {
                // Versions are equal, fallback to updatedAt
                if (studioUpdate >= localUpdate) {
                  // Studio is newer or equal, overwrite local
                  localWorkflows[w.id] = w;
                } else {
                  // Local is newer, keep local and push to Studio
                  workflowsToPush.push(localW);
                }
              }
            }
          });

          // Check for local workflows that don't exist in Studio at all
          Object.values(localWorkflows).forEach((localW) => {
            if (!studioMap[localW.id]) {
              workflowsToPush.push(localW);
            }
          });

          this.workflows = localWorkflows;
          browser.storage.local.set({ workflows: localWorkflows });

          if (workflowsToPush.length > 0) {
            syncToOmniStudio(workflowsToPush);
          }
        } else if (msg.event_type === 'workflows_changed') {
          const studioWorkflows = msg.payload || [];
          let localWorkflows = { ...this.workflows };
          let changed = false;

          studioWorkflows.forEach((workflow) => {
            const parsed = fromStudioWorkflow(workflow);
            const w = defaultWorkflow(parsed, { duplicateId: false });
            
            const localW = localWorkflows[w.id];
            // Only overwrite if the Studio workflow is newer or equal to local
            if (!localW || w.updatedAt >= localW.updatedAt) {
              localWorkflows[w.id] = w;
              changed = true;
            } else {
              // console.debug(`[SyncBridge] Ignoring older workflow ${w.id} from Studio`);
            }
          });

          if (changed) {
            this.workflows = localWorkflows;
            browser.storage.local.set({ workflows: localWorkflows });
          }
        } else if (msg.event_type === 'workflow_deleted') {
          const id = msg.payload?.id;
          if (id) {
            let localWorkflows = { ...this.workflows };
            delete localWorkflows[id];
            this.workflows = localWorkflows;
            browser.storage.local.set({ workflows: localWorkflows });
          }
        }
      });
    },
    async loadData() {
      this.initSync();

      const { workflows, isFirstTime } = await browser.storage.local.get([
        'workflows',
        'isFirstTime',
      ]);

      let localWorkflows = workflows || {};

      // The initial sync from Omni Studio is now handled via WebSocket
      // through initSync() which automatically receives a 'full_sync' event
      // upon successful connection.

      if (isFirstTime) {
        localWorkflows = firstWorkflows.map((workflow) =>
          defaultWorkflow(workflow)
        );
        await browser.storage.local.set({
          isFirstTime: false,
          workflows: localWorkflows,
        });
      }

      this.isFirstTime = isFirstTime;
      this.workflows = convertWorkflowsToObject(localWorkflows);

      this.retrieved = true;
    },
    updateStates(newStates) {
      this.states = newStates;
    },
    async insert(data = {}, options = {}) {
      const insertedWorkflows = {};

      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (!options.duplicateId) {
            delete item.id;
          }

          const workflow = defaultWorkflow(item, options);
          this.workflows[workflow.id] = workflow;
          insertedWorkflows[workflow.id] = workflow;
        });
      } else {
        if (!options.duplicateId) {
          delete data.id;
        }

        const workflow = defaultWorkflow(data, options);
        this.workflows[workflow.id] = workflow;
        insertedWorkflows[workflow.id] = workflow;
      }

      await this.saveToStorage('workflows');
      syncToOmniStudio(Object.values(insertedWorkflows));


      return insertedWorkflows;
    },
    async update({ id, data = {}, deep = false }) {
      const isFunction = typeof id === 'function';
      if (!isFunction && !this.workflows[id]) return null;

      const updatedWorkflows = {};
      const updateData = { ...data, updatedAt: Date.now() };

      const workflowUpdater = (workflowId) => {
        if (deep) {
          this.workflows[workflowId] = deepmerge(
            this.workflows[workflowId],
            updateData
          );
        } else {
          Object.assign(this.workflows[workflowId], updateData);
        }

        this.workflows[workflowId].updatedAt = Date.now();
        updatedWorkflows[workflowId] = this.workflows[workflowId];

        if (!('isDisabled' in data)) return;

        if (data.isDisabled) {
          cleanWorkflowTriggers(workflowId);
        } else {
          const triggerBlock = this.workflows[workflowId].drawflow.nodes?.find(
            (node) => node.label === 'trigger'
          );
          if (triggerBlock) {
            registerWorkflowTrigger(id, triggerBlock);
          }
        }
      };

      if (isFunction) {
        this.getWorkflows.forEach((workflow) => {
          const isMatch = id(workflow) ?? false;
          if (isMatch) workflowUpdater(workflow.id);
        });
      } else {
        workflowUpdater(id);
      }

      await this.saveToStorage('workflows');
      syncToOmniStudio(Object.values(updatedWorkflows));


      return updatedWorkflows;
    },
    async insertOrUpdate(
      data = [],
      { checkUpdateDate = false, duplicateId = false } = {}
    ) {
      const insertedData = {};

      data.forEach((item) => {
        const currentWorkflow = this.workflows[item.id];

        if (currentWorkflow) {
          let insert = true;
          if (checkUpdateDate && currentWorkflow.createdAt && item.updatedAt) {
            insert = dayjs(currentWorkflow.updatedAt).isBefore(item.updatedAt);
          }

          if (insert) {
            const mergedData = deepmerge(this.workflows[item.id], item);

            this.workflows[item.id] = mergedData;
            insertedData[item.id] = mergedData;
          }
        } else {
          const workflow = defaultWorkflow(item, { duplicateId });
          this.workflows[workflow.id] = workflow;
          insertedData[workflow.id] = workflow;
        }
      });

      await this.saveToStorage('workflows');
      syncToOmniStudio(Object.values(insertedData));


      return insertedData;
    },
    async delete(id) {
      if (Array.isArray(id)) {
        id.forEach((workflowId) => {
          delete this.workflows[workflowId];
        });
      } else {
        delete this.workflows[id];
      }

      await cleanWorkflowTriggers(id);

      const userStore = useUserStore();

      const hostedWorkflow = userStore.hostedWorkflows[id];
      const backupIndex = userStore.backupIds.indexOf(id);

      if (hostedWorkflow || backupIndex !== -1) {
        const response = await fetchApi(`/me/workflows?id=${id}`, {
          auth: true,
          method: 'DELETE',
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message);
        }

        if (backupIndex !== -1) {
          userStore.backupIds.splice(backupIndex, 1);
          await browser.storage.local.set({ backupIds: userStore.backupIds });
        }
      }

      await browser.storage.local.remove([
        `state:${id}`,
        `draft:${id}`,
        `draft-team:${id}`,
      ]);
      await this.saveToStorage('workflows');

      const { pinnedWorkflows } = await browser.storage.local.get(
        'pinnedWorkflows'
      );
      const pinnedWorkflowIndex = pinnedWorkflows
        ? pinnedWorkflows.indexOf(id)
        : -1;
      if (pinnedWorkflowIndex !== -1) {
        pinnedWorkflows.splice(pinnedWorkflowIndex, 1);
        await browser.storage.local.set({ pinnedWorkflows });
      }

      return id;
    },
  },
});
