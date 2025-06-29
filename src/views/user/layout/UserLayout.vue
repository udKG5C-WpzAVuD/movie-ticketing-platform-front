<script setup lang="ts">
import Header from "./Header.vue"
import Footer from "./Footer.vue"
</script>

<template>
  <el-container>
    <el-header style="padding: 0">
      <Header />
    </el-header>
    <el-main style="padding: 0">
      <router-view />
    </el-main>
    <el-footer style="padding: 0">
      <Footer />
    </el-footer>
  </el-container>
</template>

<style scoped lang="scss">
.el-main {
  overflow: auto;
}
</style>