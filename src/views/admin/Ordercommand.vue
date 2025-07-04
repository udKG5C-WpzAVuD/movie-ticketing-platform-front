<script setup>
//别忘了处理删除排期和退单还有删除座位的东西
import {ref} from "vue";
import {
  addorderoperation,
  deleteSeats,
  getOrders,
  getUserById,
  refundOrder, refundOrders,
  searchOrders,
  searchOrdersBysid
} from "@/api/user";
import {Upload} from "@element-plus/icons-vue";
import {ElMessage, ElMessageBox} from "element-plus";
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
  total:0,
  sessionId:""
})
const order=ref({
  orderNo:"",
  username:"",
  userId:"",
  contactPhone:"",
  paymentTransactionId:"",
  totalAmount:"",
  paymentTime:"",
  orderStatus:"",
  sessionId:"",
  ishave:"",
  Status:""
})
const getOrderList=(query)=>{
  console.log("传去的数据",query.value)
  getOrders(query.value).then(res=>{
    console.log("拿到的分页数据,",res.data.records)
    orders.value=res.data.records
    //字段拼接
    orders.value.forEach(order=>{
      getUserById(order.userId).then(res=>{
        order.username=res.data.username
      })
      if(order.orderStatus===0){
        order.Status="未支付"
      }else if(order.orderStatus===1){
        order.Status="已支付"
      }else if(order.orderStatus===2){
        order.Status="取消订单"
      }else if(order.orderStatus===3){
        order.Status="退款订单"
      }
    })

    query.value.total=res.data.total
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
const searchformsid=ref()
const handleSearchbysid=(searchformsid)=>{
  console.log("查看相应场次编号",searchformsid)
  searchOrdersBysid({sessionId:searchformsid}).then(res=>{
    console.log("查询订单编号",searchform)
    orders.value=res.data
    console.log("查询订单数据",orders.value)
  })
}
const seatssession=ref({
  sessionId:"",
  code:""
})
const returnsearch=()=>{
  getOrderList(query)
}

const outOrder = async (row) => {
  const userInfoStore = useUserInfoStore();
  const userId = userInfoStore.userInfo?.id;
console.log(row)
  // First function's validation checks
  if (!row) {
    ElMessage.error('订单数据不存在');
    return;
  }
  if (!row.orderNo) {
    ElMessage.error('订单编号缺失');
    return;
  }
  if (!row.totalAmount) {
    ElMessage.error('退款金额缺失');
    return;
  }

  try {
    // First function's confirmation dialog
    await ElMessageBox.confirm(
        `确定要退掉订单号为${row.orderNo}的订单吗？`,
        '退单确认',
        {
          confirmButtonText: '确认退单',
          cancelButtonText: '取消',
          type: 'warning'
        }
    );

    // Second function's delete operation setup
    deleteVisible.value = true;
    console.log("这一行的输出", row);
    operation.value.orderId = row.id;
    operation.value.operatorType = 1;
    operation.value.operatorId = uid;
    operation.value.operation = "删除订单";
    console.log(operation.value);

    // Second function's seat deletion logic
    seatssession.value.code = row.code;
    seatssession.value.sessionId = row.sessionId;
    console.log(seatssession.value.code);
    const selectedCodes = seatssession.value.code.split(",");

    // Process seat deletions
    for (const code of selectedCodes) {
      const ss = ref({
        sessionId: "",
        code: ""
      });
      ss.value.sessionId = seatssession.value.sessionId;
      ss.value.code = code;

      try {
        await deleteSeats(ss.value);
      } catch (error) {
        console.error('删除座位失败:', error);
        throw error; // Re-throw to be caught by outer try-catch
      }
    }

    // First function's refund logic with second function's refund call
    const refundParams = {
      orderNo: row.orderNo,
      refundAmount: row.totalAmount.toString(),
      refundReason: '用户主动退单',
      id: row.id // Added from second function
    };

    const refundRes = await refundOrder(refundParams);

    if (refundRes.status) {
      ElMessage.success('退款成功，资金将在1-3个工作日内退回原支付账户');

      // First function's order refresh
      await showOrders();

      // Second function's order list refresh
      await getOrderList(query);

      // First function's user activity update
      if (userId && row.totalAmount) {
        try {
          await fetch('/api/userActivity/update-refund', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              userId: userId.toString(),
              amount: row.totalAmount.toString()
            })
          });
          console.log('用户活动记录更新成功');
        } catch (error) {
          console.error('更新用户活动失败:', error);
        }
      }
    } else {
      ElMessage.error(`退款失败：${refundRes.message || '未知错误'}`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退单失败:', error);
      ElMessage.error(`退单失败：${error.message || '系统错误'}`);
    }
  }
};
const quxiao=(row)=>{
  deleteVisible.value=true
  console.log("这一行的输出",row)
  operation.value.orderId=row.id
  operation.value.operatorType=1
  operation.value.operatorId=uid
  operation.value.operation="取消订单"
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
      refundOrders({id:row.id}).then(res=>{
        ElMessage({
          message:'取消订单成功',
          type:'success'
        })
        getOrderList(query)
//不用退钱
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
    <el-form-item label="场次表">
      <el-input v-model="searchformsid" placeholder="请输入场次编号" clearable @keyup.enter="handleSearchbysid"></el-input>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSearch(searchform)">查询订单编号</el-button>
      <el-button type="primary" @click="handleSearchbysid(searchformsid)">查询场次编号</el-button>
      <el-button type="primary" @click="returnsearch">返回</el-button>
    </el-form-item>
  </el-form>
  <el-table :data="orders" border style="width: 100%">
    <!-- 数据列 -->
    <el-table-column prop="orderNo" label="订单编号" width="180" />
    <el-table-column prop="username" label="用户名" width="180" />
    <el-table-column prop="contactPhone" label="联系电话" width="180"/>
    <el-table-column prop="paymentTransactionId" label="支付交易号" width="180"/>
    <el-table-column prop="totalAmount" label="总金额" width="180"/>
    <el-table-column prop="paymentTime" label="支付时间" width="180"/>
    <el-table-column prop="Status" label="订单状态" />

    <!-- 操作列（正确插槽用法） -->
    <el-table-column label="操作" width="120">
      <template #default="{ row }">
        <el-button @click="outOrder(row)" v-if="row.orderStatus ===1" >退单</el-button>
        <el-button @click="quxiao(row)" v-if="row.orderStatus===0">取消订单</el-button>
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