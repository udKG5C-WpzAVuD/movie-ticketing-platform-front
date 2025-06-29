<script setup>
import { ref } from "vue";
import {useRouter, useRoute} from "vue-router";
const router = useRouter()//表示跳转
const route = useRoute()//表示获取当前路由
const queryValue = route.query
import { ElMessage } from 'element-plus';
import axios from "axios";

const loginForm = ref({
  username: "",
  password: "",
});
const loginFormRef = ref(null);

const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { type: "string", message: "用户格式不正确", trigger: ["blur", "change"] }
  ],
  password: [
    {
      required: true,
      message: "请输入密码",
      trigger: "blur",
    },
  ],
};

const login = async () => {
  if (!loginFormRef.value) return;
  try {
    await loginFormRef.value.validate();
  } catch (error) {
    ElMessage.warning("请完善登录信息");
    return;
  }
  const username = loginForm.value.username;
  const password = loginForm.value.password;
  const u = { username, password };

  try {
    const res = await axios.post('/api/user/login', u);
    console.log('Response data:', res.data);

    if (res.data && res.data.data) {
      if (res.data.data.username === u.username && res.data.data.password === u.password && res.data.data.role === "ADMIN" && res.data.data.status !="SUSPENDED") {
        ElMessage.success('登录成功');
        router.push({ name: 'Register' });
      } else if (res.data.data.username === u.username && res.data.data.password === u.password && res.data.data.role === "USER"&& res.data.data.status !="SUSPENDED") {
        ElMessage.success('登录成功');
        router.push({path: '/user/homepage'});
      } else {
        alert('登录失败，角色不符合！');
      }
    } else {
      ElMessage.error('登录失败，用户名或密码错误');
    }
  } catch (error) {
    console.error('Login request failed:', error);
    alert('登录请求失败，请稍后再试。');
  }
};


const changeUrl = () => {
  router.push({ name: 'Register' });
};
const changeUrl1 = () => {
  router.push({ name: 'ForgotPassword' });
};

const options = {
  fpsLimit: 60,
  interactivity: {
    detectsOn: "canvas",
    events: {
      onClick: {
        enable: true,
        mode: "push",
      },
      onHover: {
        enable: true,
        mode: "grab",
      },
      resize: true,
    },
    modes: {
      bubble: {
        distance: 400,
        duration: 2,
        opacity: 0.8,
        size: 40,
      },
      push: {
        quantity: 4,
      },
      grab: {
        distance: 200,
        duration: 0.4,
      },
      attract: {
        distance: 200,
        duration: 0.4,
        factor: 5,
      },
    },
  },
  particles: {
    color: {
      value: "#2F4F4F",
    },
    links: {
      color: "#FFFFFF",
      distance: 150,
      enable: true,
      opacity: 0.4,
      width: 1.2,
    },
    collisions: {
      enable: true,
    },
    move: {
      attract: { enable: false, rotateX: 600, rotateY: 1200 },
      bounce: false,
      direction: "none",
      enable: true,
      out_mode: "out",
      random: false,
      speed: 0.5,
      straight: false,
    },
    number: {
      density: {
        enable: true,
        value_area: 800,
      },
      value: 80,
    },
    opacity: {
      value: 0.7,
    },
    shape: {
      type: "star",
    },
    size: {
      random: true,
      value: 3,
    },
  },
  detectRetina: true,
};
</script>

<template>
  <div class="login">
    <Particles id="tsparticles" class="login__particles" :options="options" />

    <div class="loginPart">
      <h2>用户登录</h2>
      <el-form
          :model="loginForm"
          ref="loginFormRef"
          :rules="rules"
          label-width="100px"
          style="transform: translate(-30px)"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
              type="password"
              v-model="loginForm.password"
              placeholder="请输入密码"
              show-password
              clearable></el-input>
        </el-form-item>

        <el-button
            class="btn"
            type="primary"
            @click="login"
            auto-insert-space
            @keyup.enter="login">登录</el-button>
        <div style="text-align: right; transform: translate(0, 30px)">
          <el-link
              type="danger"
              @click="changeUrl1()"
              style="margin-right: 140px">
            忘记密码？
          </el-link>

          <el-link type="warning" @click="changeUrl">没有账号？去注册</el-link>

        </div>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login {
  height: 100vh;
  width: 100vw;
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

/* 输入框玻璃感 */
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

/* 按钮玻璃感 */
.el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.4);
  }
}
/* 响应式 */
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