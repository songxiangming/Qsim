<script setup lang="ts">
import { ref } from 'vue'
import type { SimulationConfig } from '@/types/config'
import SystemDiagram from '../diagram/SystemDiagram.vue'
import GatewayConfig from '../popups/GatewayConfig.vue'
import PreprocessorConfig from '../popups/PreprocessorConfig.vue'
import QueueConfig from '../popups/QueueConfig.vue'
import AsyncProcessorConfig from '../popups/AsyncProcessorConfig.vue'
import BosConfig from '../popups/BosConfig.vue'
import ClientConfig from '../popups/ClientConfig.vue'

defineProps<{ config: SimulationConfig }>()

const activePopup = ref<string | null>(null)

function onComponentClick(component: string) {
  activePopup.value = component
}

function closePopup() {
  activePopup.value = null
}
</script>

<template>
  <div class="config-tab">
    <section>
      <h2>System Pipeline</h2>
      <p class="hint">Click on any component to configure it.</p>
      <SystemDiagram :config="config" mode="config" @component-click="onComponentClick" />
    </section>

    <GatewayConfig v-if="activePopup === 'gateway'" :config="config" @close="closePopup" />
    <PreprocessorConfig v-if="activePopup === 'preprocessor'" :config="config" @close="closePopup" />
    <QueueConfig v-if="activePopup === 'q1'" title="Queue Q1" :queue="config.q1" @close="closePopup" />
    <QueueConfig v-if="activePopup === 'q2'" title="Queue Q2" :queue="config.q2" @close="closePopup" />
    <AsyncProcessorConfig v-if="activePopup === 'asyncProcessor'" :config="config" @close="closePopup" />
    <BosConfig v-if="activePopup === 'bos'" :config="config" @close="closePopup" />
    <ClientConfig v-if="activePopup === 'clients'" :config="config" @close="closePopup" />
  </div>
</template>

<style scoped>
.config-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.config-tab h2 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
}
</style>
