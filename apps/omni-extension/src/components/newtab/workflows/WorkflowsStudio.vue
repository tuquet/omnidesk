<template>
  <div v-if="loading" class="col-span-full flex justify-center p-8">
    <ui-spinner class="h-8 w-8 text-accent" />
  </div>
  <div v-else-if="workflows.length === 0" class="col-span-full text-center p-8 text-gray-500 dark:text-gray-400">
    <v-remixicon name="riCloudOffLine" class="mx-auto mb-2 h-10 w-10 opacity-50" />
    No workflows found in Omni Studio.
  </div>
  <template v-else>
    <shared-card
      v-for="workflow in workflows"
      :key="workflow.id"
      :data="workflow"
      :disabled="true"
      @click="pullAndEdit(workflow)"
    >
      <template #header>
        <div class="mb-4 flex items-center">
          <span class="bg-box-transparent rounded-lg p-2">
            <v-remixicon :name="workflow.icon || 'riGlobalLine'" />
          </span>
          <div class="grow"></div>
        </div>
      </template>
    </shared-card>
  </template>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useWorkflowStore, fromStudioWorkflow } from '@/stores/workflow';
import SharedCard from '@/components/newtab/shared/SharedCard.vue';
import { arraySorter } from '@/utils/helper';

const props = defineProps({
  search: {
    type: String,
    default: '',
  },
  folderId: {
    type: String,
    default: '',
  },
  sort: {
    type: Object,
    default: () => ({
      by: '',
      order: '',
    }),
  },
});

const { t } = useI18n();
const toast = useToast();
const router = useRouter();
const workflowStore = useWorkflowStore();

const loading = ref(true);
const rawWorkflows = ref([]);

const workflows = computed(() => {
  let filtered = rawWorkflows.value;
  
  if (props.folderId) {
    filtered = filtered.filter(({ folderId }) => folderId === props.folderId);
  }
  
  filtered = filtered.filter(({ name }) =>
    name.toLocaleLowerCase().includes(props.search.toLocaleLowerCase())
  );
  
  return arraySorter({
    data: filtered,
    key: props.sort.by,
    order: props.sort.order,
  });
});

async function fetchWorkflows() {
  loading.value = true;
  try {
    const baseUrl = process.env.VUE_APP_OMNI_STUDIO_API || 'http://localhost:1422';
    const response = await fetch(`${baseUrl}/api/automa/workflows`);
    if (response.ok) {
      const data = await response.json();
      rawWorkflows.value = data.map(w => ({
        id: w.id,
        name: w.name || 'Unnamed Workflow',
        description: w.description || '',
        icon: w.icon || 'riGlobalLine',
        folderId: w.folder_id || w.folderId || null,
        createdAt: w.created_at ? new Date(w.created_at).getTime() : Date.now(),
        updatedAt: w.updated_at ? new Date(w.updated_at).getTime() : Date.now(),
        fullData: w
      }));
    }
  } catch (error) {
    console.error('Failed to fetch from Omni Studio:', error);
  } finally {
    loading.value = false;
  }
}

async function pullToLocal(workflow) {
  try {
    const localData = fromStudioWorkflow(workflow.fullData);
    await workflowStore.insertOrUpdate([localData], { duplicateId: false });
    return true;
  } catch (e) {
    console.error(e);
    toast.error('Failed to pull workflow');
    return false;
  }
}

async function pullAndEdit(workflow) {
  const success = await pullToLocal(workflow);
  if (success) {
    router.push(`/workflows/${workflow.id}`);
  }
}

onMounted(() => {
  fetchWorkflows();
});
</script>
