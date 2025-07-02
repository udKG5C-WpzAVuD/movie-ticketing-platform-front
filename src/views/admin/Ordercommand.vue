<script setup>
//别忘了处理删除排期和退单还有删除座位的东西
import {ref} from "vue";
import {addorderoperation, deleteSeats, getOrders, refundOrder, searchOrders} from "@/api/user";
import {Upload} from "@element-plus/icons-vue";
import {ElMessage} from "element-plus";
import {useUserInfoStore} from "@/stores/userInfo";
const userInfoStore = useUserInfoStore();
const uid = userInfoStore.userInfo?.id;
const deleteVisible=ref(false)
const operation=ref({
  orderId:"",
  operatorType:"",
  operatorId:"",
  operation:"",
  operationDesc:""
})
const orders=ref([])
const query=ref({
  pageNum:1,
  pageSize:10,
  orderNo:'',
  total:0
})
const order=ref({
  orderNo:"",
  user_id:"",
  contactPhone:"",
  paymentTransactionId:"",
  totalAmount:"",
  paymentTime:"",
  orderStatus:"",
  sessionId:"",
  ishave:""
})
const getOrderList=(query)=>{
  console.log("传去的数据",query.value)
  getOrders(query.value).then(res=>{
    console.log("拿到的分页数据,",res.data.records)
    orders.value=res.data.records

  })
}
const pageNoChange =(value)=>{
  query.value.pageNum=value
  getOrderList(query)
}
const pageSizeChange=(value)=>{
  query.value.pageSize=value
  getOrderList(query)
}
const searchform=ref()
const handleSearch=(searchform)=>{
console.log("查询订单编号",searchform)
  searchOrders({orderNo:searchform}).then(res=>{
    console.log("查询订单编号",searchform)
    orders.value=res.data
    console.log("查询订单数据",orders.value)


  }).catch(error=>{
    console.log(error)
  })
}
const seatssession=ref({
  sessionId:"",
  code:""
})
const returnsearch=()=>{

  getOrderList(query)
}

const outOrder=(row)=>{
  deleteVisible.value=true
  console.log("这一行的输出",row)
  operation.value.orderId=row.id
  operation.value.operatorType=1
  operation.value.operatorId=uid
  operation.value.operation="删除订单"
  console.log(operation.value)
  //写相应的退单过程映射包括从sessionid和code来映射出唯一的seats然后删除
   seatssession.value.code=row.code
  seatssession.value.sessionId=row.sessionId
  console.log(seatssession.value.code)
  const selectedCodes=seatssession.value.code.split(",")
  for (const code of selectedCodes) {
    const ss=ref({
      sessionId:"",
      code:""
    })
    ss.value.sessionId=seatssession.value.sessionId
    ss.value.code=code
  deleteSeats(ss.value).then(res=>{
    console.log(row.id)
    refundOrder({id:row.id}).then(res=>{
      ElMessage({
        message:'退单成功',
        type:'success'
      })
      getOrderList(query)

      //订单退款接口   改订单状态  id
    })

  })
  }
}
getOrderList(query)
const orderdes=ref("")
const updatedeleteVisible=()=>{
operation.value.operationDesc="无"
  addorderoperation(operation.value).then(res=>{
    ElMessage({
      message:'添加日志成功',
      type:'success'
    })
    deleteVisible.value=false
  })
}
const deleteMovies=()=>{
operation.value.operationDesc=orderdes.value
  console.log("在这儿数据",order.value)
  addorderoperation(operation.value).then(res=>{
    ElMessage({
      message:'添加日志成功',
      type:'success'
    })
    deleteVisible.value=false
  })
}
</script>

<template>
  <div class="header">
    <!--        电影管理标题及添加按钮-->
    <div><span>订单管理</span></div>
  </div>
<br>
  <el-form :inline="true" :model="orders" class="demo-form-inline" >
    <el-form-item label="订单表">
      <el-input v-model="searchform" placeholder="请输入订单编号" clearable @keyup.enter="handleSearch"></el-input>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSearch(searchform)">查询</el-button>
      <el-button type="primary" @click="returnsearch">返回</el-button>
    </el-form-item>
  </el-form>
  <el-table :data="orders" border style="width: 100%">
    <!-- 数据列 -->
    <el-table-column prop="orderNo" label="订单编号" width="180" />
    <el-table-column prop="userId" label="用户id" width="180" />
    <el-table-column prop="contactPhone" label="联系电话" width="180"/>
    <el-table-column prop="paymentTransactionId" label="支付方式" width="180"/>
    <el-table-column prop="totalAmount" label="总金额" width="180"/>
    <el-table-column prop="paymentTime" label="支付时间" width="180"/>
    <el-table-column prop="orderStatus" label="订单状态" />

    <!-- 操作列（正确插槽用法） -->
    <el-table-column label="操作" width="120">
      <template #default="{ row }">
        <el-button @click="outOrder(row)" v-if="row.orderStatus !== 3" >退单</el-button>
      </template>
    </el-table-column>
  </el-table>
  <el-pagination
      :current-page="query.pageNum"
      :page-size="query.pageSize"
      :page-sizes="[10,20,30,40]"
      :background="true"
      layout="total, sizes, prev, pager, next, jumper"
      :total="query.total"
      @size-change="pageSizeChange"
      @current-change="pageNoChange"
  />

  <el-dialog   v-model="deleteVisible" title="Tips" width="500">
    <div><p>可以输入相应描述</p></div>
    <el-input v-model="orderdes"  clearable></el-input>
    <el-button @click="updatedeleteVisible">取消</el-button>
    <el-button @click="deleteMovies">确定</el-button>
  </el-dialog>
</template>

<style scoped lang="scss">
.header{
  width: 100%;
}
</style>