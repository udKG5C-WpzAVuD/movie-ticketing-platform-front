<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from 'element-plus';
import axios from "axios";

const router = useRouter();

const forgotForm = ref({
  email: "", // 用于接收验证码的邮箱
  code: "", // 验证码
  newPassword: "", // 新密码
  confirmPassword: "" // 确认新密码
});

const forgotFormRef = ref(null);

const isTime = ref(true); // 验证码倒计时状态
const currentTime = ref(60); // 倒计时时间
const codeLoading = ref(false); // 验证码按钮加载状态
const submitLoading = ref(false); // 提交按钮加载状态

const rules = {
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "邮箱格式不正确", trigger: ["blur", "change"] }
  ],
  code: [
    { required: true, message: "请输入验证码", trigger: "blur" }
  ],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度在6-20之间", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, message: "请确认新密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value === "") {
          callback(new Error("请再次输入密码"));
        } else if (value !== forgotForm.value.newPassword) {
          callback(new Error("两次密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};

// 获取验证码（复用注册页逻辑）
const getCode = async () => {
  const email = forgotForm.value.email.trim();
  if (!email) {
    ElMessage.warning("请输入邮箱");
    return;
  }
  if (codeLoading.value) return;
  codeLoading.value = true;

  try {
    await axios.post(
        "/api/user/forgot/send-code",
        null,
        { params: { email } }
    );
    ElMessage.success("验证码已发送至邮箱，5分钟内有效");

    // 倒计时逻辑
    isTime.value = false;
    let countdown = currentTime.value;
    const timer = setInterval(() => {
      countdown--;
      currentTime.value = countdown;
      if (countdown <= 0) {
        clearInterval(timer);
        isTime.value = true;
        currentTime.value = 60;
      }
    }, 1000);
  } catch (error) {
    const msg = error.response?.data?.message || "发送验证码失败";
    ElMessage.error(msg);
    isTime.value = true; // 错误时恢复按钮状态
  } finally {
    codeLoading.value = false;
  }
};
// 提交密码重置
const submitReset = async () => {
  if (!forgotFormRef.value) return;

  // 表单验证
  try {
    await forgotFormRef.value.validate();
  } catch (error) {
    ElMessage.warning("请完善表单信息");
    return;
  }

  const formData = {
    email: forgotForm.value.email.trim(),
    code: forgotForm.value.code.trim(),
    newPassword: forgotForm.value.newPassword.trim()
  };

  try {
    submitLoading.value = true;
    await axios.post("/api/user/forgot/reset-password", formData);
    ElMessage.success("密码重置成功，请登录");
    // 重置成功后跳转登录页
    setTimeout(() => {
      router.push("login");
    }, 1500);
  } catch (error) {
    const msg = error.response?.data?.message || "密码重置失败";
    ElMessage.error(msg);
  } finally {
    submitLoading.value = false;
  }
};

const options = {
  fpsLimit: 60,
  interactivity: {
    detectsOn: "canvas",
    events: {
      onClick: { enable: true, mode: "push" },
      onHover: { enable: true, mode: "grab" },
      resize: true
    },
    modes: {
      bubble: { distance: 400, duration: 2, opacity: 0.8, size: 40 },
      push: { quantity: 4 },
      grab: { distance: 200, duration: 0.4 },
      attract: { distance: 200, duration: 0.4, factor: 5 }
    }
  },
  particles: {
    color: { value: "#F5F5DC" },
    links: { color: "#707070", distance: 150, enable: true, opacity: 0.4, width: 1.2 },
    collisions: { enable: true },
    move: { enable: true, speed: 0.5, straight: false },
    number: { density: { enable: true, value_area: 800 }, value: 80 },
    opacity: { value: 0.7 },
    shape: { type: "star" },
    size: { random: true, value: 3 }
  },
  detectRetina: true
};
</script>

<template>
    <Particles id="tsparticles" class="login__particles" :options="options" />

    <div class="loginPart">
      <h2>忘记密码</h2>
      <el-form
          :model="forgotForm"
          ref="forgotFormRef"
          :rules="rules"
          label-width="100px"
          style="transform: translate(-30px)"
      >
        <!-- 邮箱输入框 -->
        <el-form-item label="邮箱" prop="email">
          <el-input
              v-model="forgotForm.email"
              placeholder="请输入注册邮箱"
              clearable
          ></el-input>
        </el-form-item>

        <!-- 验证码输入框 -->
        <el-form-item label="验证码" prop="code">
          <el-input
              style="width: 150px"
              v-model="forgotForm.code"
              placeholder="请输入验证码"
              maxlength="6"
              clearable
          ></el-input>
          <el-button
              round
              class="code-btn"
              type="primary"
              v-if="isTime"
              @click="getCode"
              :loading="codeLoading"
          >
            获取验证码
          </el-button>
          <el-button
              round
              class="code-btn"
              size="Large"
              color="#c0c4c3"
              v-if="!isTime"
              disabled
          >
            {{ currentTime }}后重新获取
          </el-button>
        </el-form-item>

        <!-- 新密码输入框 -->
        <el-form-item label="新密码" prop="newPassword">
          <el-input
              type="password"
              v-model="forgotForm.newPassword"
              placeholder="请输入新密码"
              show-password
          ></el-input>
        </el-form-item>

        <!-- 确认新密码输入框 -->
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
              type="password"
              v-model="forgotForm.confirmPassword"
              placeholder="请确认新密码"
              show-password
          ></el-input>
        </el-form-item>

        <!-- 提交按钮 -->
        <el-button
            class="btn"
            type="primary"
            @click="submitReset"
            :loading="submitLoading"
        >
          重置密码
        </el-button>

        <!-- 跳转登录链接 -->
        <div style="text-align: right; transform: translate(0, 30px)">
          <el-link type="success" @click="$router.push('/login')">
            已记起密码？去登录
          </el-link>
        </div>
      </el-form>
  </div>
</template>

<style scoped lang="scss">
.login {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.login__particles {
  height: 100%;
  width: 100%;
  background-size: cover;
  background-repeat: no-repeat;
  background-image: url("@/assets/loginback.jpg");
  opacity: 0.9;
  position: fixed;
  pointer-events: none;
}

.loginPart {
  position: absolute;
  top: 50%;
  left: 80%;
  transform: translate(-50%, -50%);
  width: 450px;
  padding: 50px;
  /* 玻璃感核心样式 */
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-sizing: border-box;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
}

/* 输入框玻璃感样式 */
.el-input__wrapper {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  &:hover, &:focus-within {
    border-color: rgba(255, 255, 255, 0.5);
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
  }
}

/* 按钮玻璃感样式 */
.el-button {
  background: rgba(255, 255, 255, 0.2); /* 原有玻璃感半透明背景 */
  border: 1px solid rgba(255, 255, 255, 0.3); /* 原有玻璃感边框 */
  color: #180505;
  &:hover {
    background: rgba(255, 255, 255, 0.3); /* 原有hover半透明背景 */
    border-color: rgba(255, 255, 255, 0.4); /* 原有hover边框 */
    color: #444444; /* hover时文字稍深（增强反馈） */
  }
}

h2 {
  margin: 0 0 30px;
  padding: 0;
  color: #fff;
  text-align: center;
}

.btn {
  transform: translate(170px);
  width: 80px;
  height: 40px;
  font-size: 15px;
}

.code-btn {
  transform: translate(20px);
  width: 90px;
  height: 40px;
  font-size: 10px;
}
</style>