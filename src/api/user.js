import request from "@/utils/request";

export const userInfoService = () => request.get('/api/auth/userInfo')
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