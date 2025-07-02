<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUserInfoStore } from "@/stores/userInfo";
import { useRouter } from "vue-router";
import { ElMessage, ElAvatar, ElButton, ElUpload, ElDialog, ElForm, ElFormItem, ElInput } from "element-plus";
import { Plus, Upload } from '@element-plus/icons-vue';
import axios from 'axios';
import avatar from "@/assets/default.png";

// 初始化状态
const userInfoStore = useUserInfoStore();
const router = useRouter();
const isLoading = ref(true);
const dialogVisibleName = ref(false);
const dialogVisiblePhone = ref(false);
const dialogVisibleEmail = ref(false);
const dialogVisibleAvatar = ref(false);
const imageUrl = ref('');

// 用户信息对象
const user = ref({
  id: '',
  username: '',
  email: '',
  contactPhone: '',
  avatarUrl: ''
});

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 2, message: '用户名长度不能少于2个字符', trigger: 'blur' },
    { max: 20, message: '用户名长度不能超过20个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '用户名只能包含中文、字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '邮箱不能为空', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] }
  ],
  contactPhone: [
    { required: true, message: '联系电话不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的11位手机号码', trigger: 'blur' }
  ]
};

// 表单引用（用于验证）
const nameFormRef = ref(null);
const emailFormRef = ref(null);
const phoneFormRef = ref(null);

// 获取用户信息
const getUserInfo = async () => {
  try {
    const res = await axios.get('/api/auth/getInfo');
    if (res.data.status) {
      userInfoStore.setUserInfo(res.data.data);
      user.value = {
        id: res.data.data.id,
        username: res.data.data.username,
        email: res.data.data.email,
        contactPhone: res.data.data.contactPhone,
        avatarUrl: res.data.data.avatarUrl
      };
      imageUrl.value = res.data.data.avatarUrl || avatar;
    } else {
      ElMessage.warning(res.data.message || '尚未登录，请先登录');
      router.push('/login');
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败: ' + (error.response?.data?.message || error.message));
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未设置';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// 打开编辑对话框
const Editname = () => { dialogVisibleName.value = true; };
const Editmail = () => { dialogVisibleEmail.value = true; };
const Editphone = () => { dialogVisiblePhone.value = true; };
const Editavatar = () => { dialogVisibleAvatar.value = true; };

// 头像上传处理
const handleAvatarSuccess = (response, uploadFile) => {
  if (response.status) {
    imageUrl.value = URL.createObjectURL(uploadFile.raw);
    user.value.avatarUrl = response.data.url;
    ElMessage.success('头像上传成功');
  } else {
    ElMessage.error(response.message || '头像上传失败');
  }
};

const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== "image/jpeg" && rawFile.type !== "image/png") {
    ElMessage.error('头像必须是JPG或PNG格式!');
    return false;
  } else if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('头像大小不能超过2MB!');
    return false;
  }
  return true;
};

// 提交用户信息修改
const submitUserUpdate = async (field) => {
  // 先进行表单验证
  let valid = false;
  switch (field) {
    case 'name':
      valid = await nameFormRef.value.validate();
      break;
    case 'email':
      valid = await emailFormRef.value.validate();
      break;
    case 'phone':
      valid = await phoneFormRef.value.validate();
      break;
    case 'avatar':
      valid = true; // 头像不需要额外验证
      break;
  }

  // 验证不通过则返回
  if (!valid) return;

  try {
    const updateData = { id: user.value.id };
    if (field === 'name') updateData.username = user.value.username;
    if (field === 'email') updateData.email = user.value.email;
    if (field === 'phone') updateData.contactPhone = user.value.contactPhone;
    if (field === 'avatar') updateData.avatarUrl = user.value.avatarUrl;

    const res = await axios.post('/api/user/update', updateData);
    if (res.data.status) {
      ElMessage.success('更新成功');
      // 关闭对应的对话框
      if (field === 'name') dialogVisibleName.value = false;
      if (field === 'email') dialogVisibleEmail.value = false;
      if (field === 'phone') dialogVisiblePhone.value = false;
      if (field === 'avatar') dialogVisibleAvatar.value = false;
      // 重新获取用户信息
      getUserInfo();
    } else {
      ElMessage.error(res.data.message || '更新失败');
    }
  } catch (error) {
    ElMessage.error('更新失败: ' + (error.response?.data?.message || error.message));
    console.error(error);
  }
};

// 对话框关闭时重置表单验证状态
const resetForm = (formRef) => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 初始化获取用户信息
onMounted(() => { getUserInfo(); });

// 当前用户信息
const userInfo = computed(() => userInfoStore.userInfo);
</script>

<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>用户基本资料</span>
      </div>
    </template>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>正在加载用户信息...</p>
    </div>

    <!-- 用户信息展示 -->
    <div v-else class="user-info-container">
      <!-- 头像区域 -->
      <div class="avatar-wrapper">
        <div class="avatar-with-edit">
          <el-avatar
              :src="userInfo.avatarUrl ? userInfo.avatarUrl : avatar"
              class="avatar"
              :size="140"
          />
        </div>
        <el-button type="info" round :icon="Upload" @click="Editavatar">编辑头像</el-button>
      </div>

      <!-- 信息区域 -->
      <div class="info-wrapper">
        <div class="info-row info-card">
          <div class="info-content">
            <div class="info-label">名字</div>
            <div class="info-value">{{ userInfo.username || '未设置' }}</div>
          </div>
          <el-button type="info" plain @click="Editname">编辑</el-button>
        </div>

        <div class="info-row info-card">
          <div class="info-content">
            <div class="info-label">电子邮箱</div>
            <div class="info-value">{{ userInfo.email || '未设置' }}</div>
          </div>
          <el-button type="info" plain @click="Editmail">编辑</el-button>
        </div>

        <div class="info-row info-card">
          <div class="info-content">
            <div class="info-label">联系电话</div>
            <div class="info-value">{{ userInfo.contactPhone || '未设置' }}</div>
          </div>
          <el-button type="info" plain @click="Editphone">编辑</el-button>
        </div>

        <div class="info-row info-card">
          <div class="info-content">
            <div class="info-label">注册时间</div>
            <div class="info-value">{{ formatDate(userInfo.registrationTime) }}</div>
          </div>
        </div>

        <div class="info-row info-card">
          <div class="info-content">
            <div class="info-label">最后登录时间</div>
            <div class="info-value">{{ formatDate(userInfo.lastLoginTime) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改名字对话框 -->
    <el-dialog
        v-model="dialogVisibleName"
        title="修改名字"
        width="500"
        :before-close="() => resetForm(nameFormRef)"
        :show-close="false"
    >
      <el-form
          ref="nameFormRef"
          label-width="auto"
          style="max-width: 600px"
          :model="user"
          :rules="rules"
      >
        <el-form-item label="用户名" prop="username" required>
          <el-input v-model="user.username" placeholder="请输入用户名（2-20个字符）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="() => { dialogVisibleName = false; resetForm(nameFormRef); }">取消</el-button>
          <el-button type="primary" @click="submitUserUpdate('name')">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改邮箱对话框 -->
    <el-dialog
        v-model="dialogVisibleEmail"
        title="修改邮箱"
        width="500"
        :before-close="() => resetForm(emailFormRef)"
        :show-close="false"
    >
      <el-form
          ref="emailFormRef"
          label-width="auto"
          style="max-width: 600px"
          :model="user"
          :rules="rules"
      >
        <el-form-item label="邮箱" prop="email" required>
          <el-input v-model="user.email" type="email" placeholder="请输入邮箱地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="() => { dialogVisibleEmail = false; resetForm(emailFormRef); }">取消</el-button>
          <el-button type="primary" @click="submitUserUpdate('email')">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改电话对话框 -->
    <el-dialog
        v-model="dialogVisiblePhone"
        title="修改联系电话"
        width="500"
        :before-close="() => resetForm(phoneFormRef)"
        :show-close="false"
    >
      <el-form
          ref="phoneFormRef"
          label-width="auto"
          style="max-width: 600px"
          :model="user"
          :rules="rules"
      >
        <el-form-item label="联系电话" prop="contactPhone" required>
          <el-input v-model="user.contactPhone" placeholder="请输入11位手机号码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="() => { dialogVisiblePhone = false; resetForm(phoneFormRef); }">取消</el-button>
          <el-button type="primary" @click="submitUserUpdate('phone')">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改头像对话框 -->
    <el-dialog
        v-model="dialogVisibleAvatar"
        title="修改头像"
        width="500"
    >
      <el-upload
          class="avatar-uploader"
          action="/api/file/upload"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload"
      >
        <img v-if="imageUrl" :src="imageUrl" class="avatar" style="width: 200px; height: 200px" />
        <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
      </el-upload>
      <p style="margin-top: 10px; color: #666; font-size: 12px;">
        支持JPG、PNG格式，文件大小不超过2MB
      </p>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisibleAvatar = false">取消</el-button>
          <el-button type="primary" @click="submitUserUpdate('avatar')">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
/* 原有样式不变，仅调整以下部分 */

/* 头像区域外层容器：确保整体居中 */
.avatar-wrapper {
  display: flex;
  flex-direction: column; /* 垂直布局：头像在上，名字在中，编辑名字按钮在下 */
  align-items: center; /* 整体居中 */
  margin-bottom: 30px;
  width: 100%;
  max-width: 350px; /* 与信息区域宽度一致，保持对齐 */
  margin-left: auto;
  margin-right: auto;
}

/* 头像和编辑头像按钮（右侧对齐） */
.avatar-with-edit {
  position: relative; /* 相对定位，用于编辑头像按钮的绝对定位 */
  display: flex;
  justify-content: center; /* 头像居中 */
  width: 100%; /* 占满容器宽度 */
}

.avatar {
  margin-bottom: 15px;
  border: 2px solid #f0f0f0;
}

/* 编辑头像按钮（放在头像右侧，与其他编辑按钮左侧对齐） */
.edit-avatar-btn {
  position: absolute; /* 绝对定位，相对于avatar-with-edit容器 */
  right: 15px; /* 右侧距离，与信息行的padding-right一致 */
  top: 50%; /* 垂直居中 */
  transform: translateY(-50%); /* 精确垂直居中 */
}

/* 名字（居中显示） */
.username-display {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  text-align: center; /* 文本居中 */
  margin-bottom: 8px; /* 与下方编辑名字按钮的间距 */
}

/* 编辑名字按钮（与其他编辑按钮左侧对齐） */
.edit-name-btn-wrapper {
  display: flex;
  justify-content: flex-start; /* 左侧对齐 */
  width: 100%; /* 占满容器宽度 */
  padding: 0 15px; /* 与信息行的padding一致，确保左侧对齐 */
  margin-bottom: 15px; /* 与下方信息区域的间距 */
}

/* 信息区域（完全不变，保持原有效果） */
.info-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.info-row {
  width: 100%;
  max-width: 350px;
  display: flex;
  align-items: center;
  padding: 0 15px; /* 与编辑名字按钮的padding一致，确保左侧对齐 */
}

/* 确保所有按钮左侧对齐（关键：所有按钮的左侧padding相同） */
.info-row .el-button,
.edit-name-btn-wrapper .el-button {
  margin-left: 0; /* 移除默认左边距 */
}

/* 响应式调整（保持原有逻辑） */
@media (max-width: 576px) {
  .page-container {
    margin: 10px;
    padding: 20px 15px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    padding: 10px 15px;
    gap: 10px;
  }

  .info-content {
    width: 100%;
    padding: 0;
  }

  .info-label {
    width: auto;
    text-align: left;
    margin-bottom: 5px;
  }

  /* 小屏幕下按钮布局调整 */
  .avatar-with-edit {
    flex-direction: column; /* 垂直布局 */
    align-items: center; /* 居中对齐 */
  }

  .edit-avatar-btn {
    position: static; /* 取消绝对定位 */
    transform: none; /* 取消垂直居中 */
    margin-top: -5px; /* 微调位置 */
    margin-bottom: 10px; /* 与名字的间距 */
  }

  .edit-name-btn-wrapper {
    padding: 0; /* 小屏幕下移除padding，更紧凑 */
    justify-content: center; /* 小屏幕下按钮居中 */
  }
}

/* 其他原有样式完全不变 */
.header {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.info-content {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  transition: transform 0.2s ease;
}

.info-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.info-card:hover .info-content {
  transform: translateY(-2px);
}

.info-label {
  width: 120px;
  font-weight: 500;
  color: #666;
  text-align: right;
  padding-right: 15px;
}

.info-value {
  flex: 1;
  color: #333;
  word-break: break-all;
  text-align: left;
}
</style>