import request from "@/utils/request";

export const userInfoService = () => request.get('/api/auth/getInfo')

export const login = (user) => request.post('/api/user/login', user)

//分页列表查询user
export const userPageList = (query) => request.get('/api/user/pageList', {params: query})

// 根据ID获取用户详情
export const getUserById = (id) => request.get(`/api/user/${id}`)

// 更新用户信息
export const updateUser = (data) => request.post('/api/user/update', data)
export const addMovie =(movie)=>request.post('/api/movies/savemovie',movie)
export const moviePageList=(query)=>request.get('/api/movies/moviePageList', {params:query})
export const updateMovie=(movie)=>request.put('/api/movies/updateMovie',movie)
// export const addsessions=(sessionhalls)=>request.post('/api/sessions/addsessions',sessionhalls)
export const addsessions = (data) => {
    return fetch('/api/sessions/addsessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(res => res.json())
}
export const getSessions=()=>request.get('/api/sessions/getSessions')
export const deletescreen=(screen)=>request.post('/api/sessions/deletescreen',screen)
export const addLogs=(movie_logs)=>request.post('/api/adminMovieOperationLogs/addLogs',movie_logs)
export const getSeats=(sessionId)=>request.get('/api/seats/getseats',{params:{sessionId}})