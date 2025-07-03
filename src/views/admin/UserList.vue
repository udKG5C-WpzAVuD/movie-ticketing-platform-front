<script setup>
import {getUserById, updateUser, userPageList} from "@/api/user";
import {reactive, ref} from "vue";
import {ElMessage, ElMessageBox} from "element-plus";
import {Plus} from "@element-plus/icons-vue";

//查询相关
const query = ref({
  pageNo:1,
  pageSize:10,
  username:'',
  role:'',
  status:'',
  total:0
})

const users = ref([])
// 添加一个ref来存储当前选择的值
const selectedFilter = ref('')

// 多级选择器选项
const filterOptions = [
  {
    value: 'role',
    label: '用户角色',
    children: [
      {
        value: 'USER',
        label: '普通用户'
      },
      {
        value: 'ADMIN',
        label: '管理员'
      }
    ]
  },
  {
    value: 'status',
    label: '用户状态',
    children: [
      {
        value: 'ACTIVE',
        label: '活跃'
      },
      {
        value: 'INACTIVE',
        label: '不活跃'
      },
      {
        value: 'SUSPENDED',
        label: '已禁用'
      }
    ]
  }
]

// 修改信息的角色选项
const roleOptions = ref([
  { value: 'USER', label: '普通用户' },
  { value: 'ADMIN', label: '管理员' }
])

// 多级选择器配置
const cascaderProps = {
  expandTrigger: 'hover',
  checkStrictly: true, // 可以选择任意一级
  emitPath: false // 只返回最后一级的值
}

// 处理多级选择器变化
const handleFilterChange = (value) => {
  selectedFilter.value = value
  // 根据选择的类型重置另一个字段
  if (['USER', 'ADMIN'].includes(value)) {
    query.value.role = value
    query.value.status = ''
  } else if (['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(value)) {
    query.value.status = value
    query.value.role = ''
  } else {
    // 清除选择时
    query.value.role = ''
    query.value.status = ''
  }
}

// 获取当前显示的筛选值（用于回显）
const getDisplayValue = () => {
  return query.value.role || query.value.status || []
}


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
}
// 清除筛选条件
const clearFilters = () => {
  selectedFilter.value = ''
  query.value.role = ''
  query.value.status = ''
}
// 用户禁用与启用
const toggleUserStatus = (user) => {
  const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
  const actionName = newStatus === 'ACTIVE' ? '启用' : '禁用'

  ElMessageBox.confirm(
      `您确定要${actionName}该用户吗？${actionName === '禁用' ? '该用户被禁用后无法登录。' : ''}`,
      `确认${actionName}用户`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
  ).then(async () => {
    try {
      await updateUser({
        id: user.id,
        status: newStatus
      })
      ElMessage.success(`用户已${actionName}`)
      getUserList() // 刷新列表
    } catch (error) {
      console.error(`${actionName}用户失败:`, error)
    }
  }).catch(() => {
    ElMessage.info(`已取消${actionName}操作`)
  })
}

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
        <el-form-item label="用户筛选">
          <el-cascader
              v-model="selectedFilter"
              :options="filterOptions"
              :props="cascaderProps"
              placeholder="请选择筛选条件"
              clearable
              @change="handleFilterChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getUserList">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="users" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80"/>
        <el-table-column prop="username" label="用户名"  width="80"/>
        <el-table-column prop="email" label="邮箱"  />
        <el-table-column prop="contactPhone" label="电话" />
        <el-table-column prop="role" label="角色" width="80"/>
        <el-table-column prop="registrationTime" label="注册时间" />
        <el-table-column prop="status" label="状态" width="80"/>
        <el-table-column label="操作" width="220">
          <template #default="scope">
            <el-button type="primary" @click="modifyUserInfo(scope.row.id)">
              修改信息
            </el-button>
            <el-button
                :type="scope.row.status === 'SUSPENDED' ? 'success' : 'danger'"
                @click="toggleUserStatus(scope.row)"
            >
              {{ scope.row.status === 'SUSPENDED' ? '启用' : '禁用' }}
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

