<template>
  <div class="home-page">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <h1>🎯 固件升级配置管理工具</h1>
        <p>支持ESP固件和主板升级包上传、配置生成、自动更新配置</p>
      </div>


      <!-- 文件上传区域 -->
      <div class="card fade-in">
        <h2>📁 文件上传</h2>
        <FileUpload />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import axios from 'axios'
import FileUpload from '../components/FileUpload.vue'

</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding: 24px 0;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.page-header p {
  font-size: 16px;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
}

.card h2 {
  color: #333;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 12px;
}

.test-section {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-left: 4px solid #1890ff;
}

.test-buttons {
  margin-bottom: 20px;
}

.test-result {
  margin-top: 20px;
}

.result-data {
  margin-top: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e1e1e1;
}

.result-data h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.result-data pre {
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  font-size: 12px;
  line-height: 1.4;
  color: #666;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 300px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 24px;
  }
  
  .page-header p {
    font-size: 14px;
    padding: 0 16px;
  }
  
  .test-buttons {
    text-align: center;
  }
}
</style> 