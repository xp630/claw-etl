<template>
  <div class="tabs-bar">
    <div class="tabs-container">
      <div
        v-for="tab in tabs"
        :key="tab.path"
        :class="['tab-item', { active: activeTabPath === tab.path }]"
        @click="handleTabClick(tab)"
      >
        <span class="tab-title">{{ tab.title }}</span>
        <button
          v-if="tab.closable"
          class="tab-close"
          @click.stop="handleClose(tab)"
        >
          ×
        </button>
      </div>
    </div>
    <div class="tabs-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { tabStore, type TabItem } from '@/stores/tabStore'

const router = useRouter()

const tabs = computed(() => tabStore.tabs)
const activeTabPath = computed(() => tabStore.activePath)

function handleTabClick(tab: TabItem) {
  tabStore.switchTab(tab.path)
  router.push(tab.path)
}

function handleClose(tab: TabItem) {
  tabStore.removeTab(tab.path)
  // Navigate to remaining active tab
  if (tabStore.activePath && tabStore.activePath !== tab.path) {
    router.push(tabStore.activePath)
  } else if (tabStore.tabs.length > 0) {
    router.push(tabStore.tabs[tabStore.tabs.length - 1].path)
  }
}
</script>

<style scoped>
.tabs-bar {
  display: flex;
  align-items: center;
  background: var(--bg-tab-bar);
  border-bottom: 1px solid var(--border-light);
  padding: 0 12px;
  height: 40px;
  gap: 8px;
}

.tabs-container {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  flex: 1;
  scrollbar-width: none;
}

.tabs-container::-webkit-scrollbar {
  display: none;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-tab-item);
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  white-space: nowrap;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s;
  border: 1px solid transparent;
  border-bottom: none;
}

.tab-item:hover {
  background: var(--bg-tab-item-hover);
  color: var(--text-primary);
}

.tab-item.active {
  background: var(--bg-tab-item-active);
  color: var(--accent);
  border-color: var(--border-light);
  border-bottom-color: var(--bg-tab-item-active);
}

.tab-title {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-muted);
  transition: all 0.2s;
}

.tab-close:hover {
  background: var(--danger);
  color: white;
}

.tabs-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
