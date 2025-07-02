<script setup>
import {ref} from "vue";
import {
  deleteSeats,
  fetchOrders,
  getMoviesid,
  getOrders,
  getSeats,
  getSessionsByid,
  refundOrder,
  searchOrders
} from "@/api/user";
import router from "@/router";
import {ElMessage} from "element-plus";
import {useUserInfoStore} from "@/stores/userInfo";
const userInfoStore = useUserInfoStore();
const uid = userInfoStore.userInfo?.id;
// 删除排期则显示相应需要退款的订单
// 管理员需要根据排期号来选择
// 删除排期则删除座位排布
//最好一键完成   删除排期  先删订单，再删排期，最后删座位  is_deleted??????
// 退款功能


const notpayedlist=ref([])
//未支付订单 0
const payedlist=ref([])
//已支付并使用订单（在电影开场半小时内不退） 1且过时间了
const refundlist=ref([])
//已退单订单 3
const cantuikuan=ref([])
//可以退单订单 1
const quxiao=ref([])
//已取消订单 2
const orders=ref([])
const isAfter30Minutes = (inputTime) => {
  const targetTime = new Date(inputTime);
  const currentTime = new Date();
  const timeDiff = targetTime.getTime() - currentTime.getTime();
  const thirtyMinutesInMs = 0;
  return timeDiff > thirtyMinutesInMs;
};
const showOrders=()=>{

  fetchOrders().then(res=>{
    console.log(res.data)
    console.log(uid)
    orders.value = res.data.filter(order => order.userId===uid);
    console.log(orders.value)
  //   此处进行拼接字段
   orders.value.forEach(order=>{
     const xuqouorder=ref({
       orderNo:"",
       contactPhone:"",
       paymentTransactionId:"",
       totalAmount:"",
       paymentTime:"",
       orderStatus:"",
       code:"",
       title:"",
       time:"",
       movieId:"",
       userId:"",
     })

     getSessionsByid({sessionId:order.sessionId}).then(res=>{
       xuqouorder.value=order
       xuqouorder.value.time=res.data.time
       xuqouorder.value.movieId=res.data.movieId
       console.log(res.data.movieId)
       getMoviesid({id:res.data.movieId}).then(res=>{
            xuqouorder.value.title=res.data.title
         if(xuqouorder.value.orderStatus==0){
           if(!isAfter30Minutes(xuqouorder.value.time)){
             refundlist.value.push(xuqouorder.value)
           }else{
           notpayedlist.value.push(xuqouorder.value)
           console.log(xuqouorder.value)}
         }else if(xuqouorder.value.orderStatus==1){
                if(!isAfter30Minutes(xuqouorder.value.time)){
                  payedlist.value.push(xuqouorder.value)
                }else{
                  cantuikuan.value.push(xuqouorder.value)
                }

         }else if(xuqouorder.value.orderStatus==2){
           quxiao.value.push(xuqouorder.value)
         }else{
           refundlist.value.push(xuqouorder.value)
         }

       })
     })
   })
  })

}
showOrders()
const payout=(row)=>{
  //接支付接口

}
const outOrder=(row)=>{
  //退单接口加seats表改变
  console.log("看这儿",row.id)
  getSeats(row.sessionId).then(res=>{
    console.log("取到的座位数据",res.data)
    const seats=row.code
    const selectedCodes = row.code.split(','); // 分割成数组，如 ["a1", "b2", "c3"]
// 查找对应的 seatId
    for (const code of selectedCodes) {
      const seatssession=ref({
        sessionId:"",
        code:""
      })
      seatssession.value.sessionId=row.sessionId
      seatssession.value.code=code
      const shuju={...seatssession.value}
      console.log(shuju)
      deleteSeats(shuju).then(res=>{
        //订单退单的函数及接口  将状态改为3
        refundOrder({id:row.id}).then(res=>{
          ElMessage({
            message:'退单成功',
            type:'success'
          })
          showOrders()
        })

      })
    }

  })
}
const repay=(row)=>{
  //重新购买接口  就跳到相应电影详情页即可
   router.push('/film/ticket?fid=' + row.movieId)
  console.log("电影id",row.movieId)
}
</script>

<template>
  <el-card>
    <h1>订单</h1>

  </el-card>
<div class="box">
  <div>
    <p>用户待支付订单</p>
    <el-table :data="notpayedlist" border style="width: 100%">
      <!-- 数据列 -->
      <el-table-column prop="orderNo" label="订单编号" width="180" />
      <el-table-column prop="code" label="座位号" width="180" />
      <el-table-column prop="time" label="开场时间" width="180" />
      <el-table-column prop="title" label="电影名称" width="180"/>
      <el-table-column prop="paymentTransactionId" label="支付方式" width="180"/>
      <el-table-column prop="totalAmount" label="总金额" width="180"/>
      <el-table-column prop="paymentTime" label="支付时间" width="180"/>
      <!-- 操作列（正确插槽用法） -->
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button @click="payout(row)">支付</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <div>
    <p>用户待使用订单</p>
    <el-table :data="cantuikuan" border style="width: 100%">
      <!-- 数据列 -->
      <el-table-column prop="orderNo" label="订单编号" width="180" />
      <el-table-column prop="code" label="座位号" width="180" />
      <el-table-column prop="time" label="开场时间" width="180" />
      <el-table-column prop="title" label="电影名称" width="180"/>
      <el-table-column prop="paymentTransactionId" label="支付方式" width="180"/>
      <el-table-column prop="totalAmount" label="总金额" width="180"/>
      <el-table-column prop="paymentTime" label="支付时间" width="180"/>
      <!-- 操作列（正确插槽用法） -->
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button @click="outOrder(row)">退单</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>



  <div>
    <p>用户已取消订单</p>
    <el-table :data="quxiao" border style="width: 100%"  >
      <!-- 数据列 -->
      <el-table-column prop="orderNo"  label="订单编号" width="180" />
      <el-table-column prop="code" label="座位号" width="180" />
      <el-table-column prop="time" label="开场时间" width="180" />
      <el-table-column prop="title" label="电影名称" width="180"/>
      <el-table-column prop="paymentTransactionId" label="支付方式" width="180"/>
      <el-table-column prop="totalAmount" label="总金额" width="180"/>
      <el-table-column prop="paymentTime" label="支付时间" width="180"/>
      <!-- 操作列（正确插槽用法） -->
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button @click="repay(row)">重新购买</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>


  <div>
    <p>用户已完成订单</p>
    <el-table :data="payedlist" border style="width: 100%">
      <!-- 数据列 -->
      <el-table-column prop="orderNo" label="订单编号" width="180" />
      <el-table-column prop="code" label="座位号" width="180" />
      <el-table-column prop="time" label="开场时间" width="180" />
      <el-table-column prop="title" label="电影名称" width="180"/>
      <el-table-column prop="paymentTransactionId" label="支付方式" width="180"/>
      <el-table-column prop="totalAmount" label="总金额" width="180"/>
      <el-table-column prop="paymentTime" label="支付时间" width="180"/>
      <!-- 操作列（正确插槽用法） -->
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
        </template>
      </el-table-column>
    </el-table>
  </div>


  <div>
    <p>用户退单订单</p>
    <el-table :data="refundlist" border style="width: 100%">
      <!-- 数据列 -->
      <el-table-column prop="orderNo" label="订单编号" width="180" />
      <el-table-column prop="code" label="座位号" width="180" />
      <el-table-column prop="time" label="开场时间" width="180" />
      <el-table-column prop="title" label="电影名称" width="180"/>
      <el-table-column prop="paymentTransactionId" label="支付方式" width="180"/>
      <el-table-column prop="totalAmount" label="总金额" width="180"/>
      <el-table-column prop="paymentTime" label="支付时间" width="180"/>
      <!-- 操作列（正确插槽用法） -->
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
        </template>
      </el-table-column>
    </el-table>
  </div>
</div>
</template>

<style scoped lang="scss">
:deep(.el-table th.el-table__cell) {
  text-align: center;
}

</style>