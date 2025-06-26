<script setup>
import {getUserById, updateUser, userPageList} from "@/api/user";
import {reactive, ref} from "vue";
import {ElMessage} from "element-plus";
import {Plus} from "@element-plus/icons-vue";

//查询相关
const query = ref({
  pageNo:1,
  pageSize:10,
  username:'',
  role:'',
  total:0
})

const users = ref([])

// 角色选项
const roleOptions = [
  {
    value: 'USER',
    label: '普通用户'
  },
  {
    value: 'ADMIN',
    label: '管理员'
  }
]

//获取用户列表
const getUserList =()=>{

  userPageList(query.value).then(res=>{
    users.value = res.data.records
    query.value.total = res.data.total
  })
}

getUserList()
//分页相关
const pageNoChange = (value) => {
  query.value.pageNo = value
  getUserList()
}
const pageSizeChange = value => {
  query.value.pageSize = value
  getUserList()
}

// 对话框相关
const dialogVisible = ref(false)
const form = reactive({
  id: '',
  username: '',
  email: '',
  contactPhone: '',
  role: 'USER',
})
// 打开修改对话框
const modifyUserInfo = (userId) => {
  getUserById(userId).then(res => {
    Object.assign(form, res.data) // 将用户数据填充到表单
    dialogVisible.value = true
  }).catch(err => {
    ElMessage.error('获取用户信息失败')
  })
}

// 提交修改
const onSubmit = async () => {
  try {
    // 发送请求（拦截器会自动处理code≠0的错误）
    await updateUser(form);

    // 只有code=0的请求能执行到这里
    ElMessage.success('修改成功');
    dialogVisible.value = false;
    getUserList();

  } catch (err) {
    // 所有错误已被拦截器处理过，这里只需补充操作
    console.error('操作失败:', err);
  }
};


</script>

<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>用户列表</span>
      </div>

      <hr>
      <el-form :inline="true" class="demo-form-inline">
        <el-form-item label="用户名">
          <el-input v-model="query.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="用户角色">
          <el-select
              v-model="query.role"
              clearable
              placeholder="请选择角色"
              style="width: 240px"
          >
            <el-option
                v-for="item in roleOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getUserList">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="users" style="width: 100%">
        <el-table-column prop="id" label="ID" width="100"/>
        <el-table-column prop="username" label="用户名"  />
        <el-table-column prop="email" label="邮箱"  />
        <el-table-column prop="contactPhone" label="电话" />
        <el-table-column prop="role" label="角色" />
        <el-table-column prop="registrationTime" label="注册时间" />
        <el-table-column label="操作" >
          <template #default="scope">
            <el-button type="primary" @click="modifyUserInfo(scope.row.id)">
              修改信息
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
          v-model:current-page="query.pageNo"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="query.total"
          @size-change="pageSizeChange"
          @current-change="pageNoChange"
      />
    </template>
  </el-card>

  <!-- 修改用户信息的对话框 -->
  <el-dialog v-model="dialogVisible" title="修改用户信息" width="50%">
    <el-form :model="form" label-width="120px">
      <el-form-item label="用户名">
        <el-input v-model="form.username" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="form.email" />
      </el-form-item>
      <el-form-item label="联系电话">
        <el-input v-model="form.contactPhone" />
      </el-form-item>
      <el-form-item label="用户角色">
        <el-select v-model="form.role" placeholder="请选择角色">
          <el-option
              v-for="item in roleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
          />
        </el-select>
      </el-form-item>

    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style>

<style>
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}
</style>

