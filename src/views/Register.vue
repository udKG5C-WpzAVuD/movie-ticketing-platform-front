<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from 'element-plus';
import axios from "axios";

const isTime = ref(true);
const currentTime = ref(60);
const codeLoading = ref(false);
const registerLoading = ref(false);

const getCode = async () => {
  const email = registerForm.value.email;
  console.log("准备发送验证码的邮箱：", email);
  if (codeLoading.value) return;
  codeLoading.value = true;
  try {
    const response = await axios.post(
        "/api/user/send-code",
        null,
        { params: { email: email } }
    );
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
    ElMessage.success(response.data.message || "验证码已发送");
  } catch (error) {
    const errorMsg = error.response?.data?.message || "发送失败，请稍后重试";
    ElMessage.error(errorMsg);
    isTime.value = true;
  } finally {
    codeLoading.value = false;
  }
};

const registerForm = ref({
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  code: "",
  username: "",
});

const registerFormRef = ref(null);
const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "用户名长度在3-20之间", trigger: "blur" }
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "邮箱格式不正确", trigger: ["blur", "change"] },
  ],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    { pattern: /^[1][3-9][0-9]{9}$/, message: "手机号格式不正确", trigger: "blur" },
  ],
  password: [{ required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度至少为6位", trigger: "blur" }],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value == "") {
          callback(new Error("请再次输入密码"));
        } else if (value !== registerForm.value.password) {
          callback(new Error("两次密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  code: [{ required: true, message: "请输入验证码", trigger: "blur" }],
};

const router = useRouter();

const registerService = async (formData) => {
  return await axios.post("/api/user/register", formData);
};

const register = async () => {
  if (!registerFormRef.value) return;
  try {
    await registerFormRef.value.validate();
  } catch (error) {
    ElMessage.warning("请完善表单信息");
    return;
  }
  try {
    registerLoading.value = true;
    const response = await registerService(registerForm.value);
    ElMessage.success(response.data.message || "注册成功");
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  } catch (error) {
    const errorMsg = error.response?.data?.message || "注册失败";
    ElMessage.error(errorMsg);
  } finally {
    registerLoading.value = false;
  }
};

const goToLogin = () => {
  router.push("/login");
};

const options = {
  fpsLimit: 60,
  interactivity: {
    detectsOn: "canvas",
    events: {
      onClick: { enable: true, mode: "push" },
      onHover: { enable: true, mode: "grab" },
      resize: true,
    },
    modes: {
      bubble: { distance: 400, duration: 2, opacity: 0.8, size: 40 },
      push: { quantity: 4 },
      grab: { distance: 200, duration: 0.4 },
      attract: { distance: 200, duration: 0.4, factor: 5 },
    },
  },
  particles: {
    color: { value: "#FFFFFF" },
    links: { color: "#555555", distance: 150, enable: true, opacity: 0.4, width: 1.2 },
    collisions: { enable: true },
    move: { enable: true, speed: 0.5, straight: false },
    number: { density: { enable: true, value_area: 800 }, value: 80 },
    opacity: { value: 0.7 },
    shape: { type: "star" },
    size: { random: true, value: 3 },
  },
  detectRetina: true,
};
</script>

<template>
  <div class="login">
    <Particles id="tsparticles" class="login__particles" :options="options" />

    <div class="loginPart">
      <h2>用户注册</h2>
      <el-form
          aria-autocomplete="off"
          :model="registerForm"
          ref="registerFormRef"
          :rules="rules"
          label-width="100px"
          style="transform: translate(-30px)"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名"
          ></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input
              v-model="registerForm.email"
              placeholder="请输入邮箱"
          ></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input
              v-model="registerForm.phone"
              placeholder="请输入手机号"
          ></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
              type="password"
              v-model="registerForm.password"
              placeholder="请输入密码"
              show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
              type="password"
              v-model="registerForm.confirmPassword"
              placeholder="请确认密码"
              show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <el-input
              style="width: 150px"
              v-model="registerForm.code"
              placeholder="请输入验证码"
              maxlength="6"
              clearable
          ></el-input>
          <el-button
              round
              class="code-btn"
              type="primary"
              v-if="isTime"
              @click="getCode(registerForm.email)"
          >获取验证码</el-button>
          <el-button
              round
              class="code-btn"
              size="Large"
              color="#c0c4c3"
              v-if="!isTime"
          >{{ currentTime }}后重新获取</el-button>
        </el-form-item>
        <el-button class="btn" type="primary" @click="register">注册</el-button>
        <div style="text-align: right; transform: translate(0, 30px)">
          <el-link type="success" @click="goToLogin">已有账号？去登录</el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
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

h2 {
  margin: 0 0 30px;
  padding: 0;
  color: #fff;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

/* 输入框玻璃感样式 */
.el-input__wrapper {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  &:hover, &:focus-within {
    border-color: rgba(255, 255, 255, 0.5);
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
  }
}

.el-input__placeholder {
  color: rgba(255, 255, 255, 0.7);
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

/* 响应式调整 */
@media (max-width: 768px) {
  .loginPart {
    left: 50%;
    width: 90%;
    padding: 30px;
  }
  .btn {
    transform: translate(0);
    width: 100%;
  }
}
</style>