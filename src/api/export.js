import request from '@/utils/request'

// 辅助函数：解析Blob类型的错误信息
// 这个函数需要接收一个Blob对象，并返回一个Promise，解析出错误信息
const parseBlobError = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function() {
            try {
                const errorJson = JSON.parse(reader.result);
                // 假设错误信息在 errorJson.message
                reject(errorJson.message || '未知错误');
            } catch (e) {
                // 如果解析失败，说明不是JSON，直接返回原始文本或默认错误
                reject(reader.result || '导出失败: 服务器返回未知错误');
            }
        };
        reader.onerror = function() {
            reject('无法读取错误响应');
        };
        reader.readAsText(blob);
    });
};


// 数据导出
export const exportData = (params) => {
    // 确保这里的 URL 与你的后端 Controller 的 @RequestMapping 和 @GetMapping 路径匹配
    // 后端 @RequestMapping("/api/export")
    // 后端 @GetMapping("/data")
    // 所以完整的路径应该是 /api/export/data
    return request({
        url: '/api/export/data', // 使用相对路径，让request.js的baseURL来管理域名
        method: 'get',
        params,
        responseType: 'blob' // 关键：表示期望服务器返回二进制数据（文件）
    }).then(response => {
        // 如果请求成功，返回完整的response对象
        // response.data 会是 Blob 对象
        return response
    }).catch(error => {
        // 捕获请求失败的情况
        if (error.response && error.response.data instanceof Blob) {
            // 如果错误响应是Blob类型（例如服务器返回了JSON格式的错误信息，但responseType是blob）
            return parseBlobError(error.response.data).then(msg => {
                // 如果能解析出错误信息，将其作为reject的原因
                return Promise.reject(msg);
            }).catch(() => {
                // 如果解析失败，返回通用错误
                return Promise.reject('导出失败: 服务器返回错误但无法解析');
            });
        }
        // 对于其他类型的错误（网络错误，非Blob响应等），直接返回错误信息
        return Promise.reject(error.message || '导出请求失败');
    })
}
