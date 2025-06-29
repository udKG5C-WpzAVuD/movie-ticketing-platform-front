<script setup>
import router from "@/router";

const denglu=()=>{
router.push({path:'/admin/list'})
}
</script>

<template>
  <div>登录页</div>
<!--  测试layout页面   登录页面做好后可以直接删除-->

  <button @click="denglu">
    登录
  </button>
</template>

<style lang="scss" scoped>

</style>
