<template>
  <div id="app">
    <RouterView />
    <div class="version-badge" v-if="buildInfo">
      <span>{{ buildInfo.appName }} v{{ buildInfo.version }} ({{ buildInfo.commit }})</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// 根组件，路由视图容器
const buildInfo = (typeof __BUILD_INFO__ !== 'undefined') ? __BUILD_INFO__ : null
</script>

<style>
#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.version-badge {
  position: fixed;
  right: 12px;
  bottom: 10px;
  z-index: 9999;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  backdrop-filter: blur(2px);
}
</style> 