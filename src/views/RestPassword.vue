<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useUserInfoStore } from "@/stores/userInfo";
import { useRouter } from "vue-router";
import { ElMessage, ElForm, ElFormItem, ElInput, ElButton } from "element-plus";
import { Lock, Check, RefreshLeft } from '@element-plus/icons-vue';
import axios from 'axios';

// 状态管理与路由
const userInfoStore = useUserInfoStore();
const router = useRouter();

// 表单数据
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 表单验证规则
const rules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 表单引用
const passwordForm = ref(null);

// 检查用户登录状态
onMounted(() => {
  if (!userInfoStore.userInfo.id) {
    ElMessage.warning('请先登录');
    router.push('/login');
  }
});

// 提交密码修改
const submitPasswordChange = async () => {
  // 表单验证
  await passwordForm.value.validate().catch(err => {
    ElMessage.error('请完善表单信息');
    return;
  });

  try {
    // 构建请求数据
    const requestData = {
      userId: userInfoStore.userInfo.id,
      oldPassword: form.oldPassword,
      newPassword: form.newPassword
    };

    // 发送修改请求
    const response = await axios.post('/api/user/updatePassword', requestData);

    if (response.data.status) {
      ElMessage.success('密码修改成功');
      userInfoStore.removeUserInfo();
      router.push('/login');
    } else {
      ElMessage.error(response.data.message || '修改失败');
    }
  } catch (error) {
    console.error('密码修改失败:', error);
    ElMessage.error(error.response?.data?.message || '网络错误，请稍后重试');
  }
};

// 重置表单
const resetForm = () => {
  passwordForm.value.resetFields();
};
</script>

<template>
  <el-card class="password-card">
    <div class="title-container">
      <h1>重置密码</h1>
      <p class="subtitle">请输入原密码和新密码完成修改</p>
    </div>

    <el-form
        ref="passwordForm"
        :model="form"
        :rules="rules"
        class="password-form"
        label-width="120px"
    >
      <el-form-item label="原密码" prop="oldPassword">
        <el-input
            v-model="form.oldPassword"
            type="password"
            placeholder="请输入原密码"
            :prefix-icon="Lock"
        />
      </el-form-item>

      <el-form-item label="新密码" prop="newPassword">
        <el-input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            :prefix-icon="RefreshLeft"
        />
      </el-form-item>

      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            :prefix-icon="Check"
        />
      </el-form-item>

      <el-form-item class="form-actions">
        <el-button type="primary" @click="submitPasswordChange">确认修改</el-button>
        <el-button @click="resetForm">重置表单</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
.password-card {
  max-width: 500px;
  margin: 50px auto;
  padding: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .title-container {
    text-align: center;
    margin-bottom: 30px;

    .subtitle {
      color: #606266;
      font-size: 14px;
      margin-top: 8px;
    }
  }

  .password-form {
    margin-top: 20px;
  }

  .form-actions {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 20px;
  }
}

// 响应式调整
@media (max-width: 576px) {
  .password-card {
    margin: 20px;
    padding: 20px 15px;
  }

  .title-container h1 {
    font-size: 20px;
  }
}
</style>