// API配置
const API_BASE_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('authToken');

// 认证事件常量
const AuthEvents = {
    UNAUTHORIZED: 'auth:unauthorized',
    LOGOUT: 'auth:logout'
};

/**
 * 统一请求处理器
 * @param {string} endpoint - API端点
 * @param {string} method - HTTP方法
 * @param {object} options - 请求选项
 */
async function request(endpoint, method = 'GET', { body, query } = {}) {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    // 添加查询参数
    if (query) {
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value);
            }
        });
    }

    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined
    };

    // 添加认证头
    if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, config);
        
        // 处理认证失败
        if (response.status === 401) {
            console.log('认证失败，已清除登录状态');
            authAPI.logout();
            window.dispatchEvent(new CustomEvent(AuthEvents.UNAUTHORIZED));
            throw new Error('登录已过期，请重新登录');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `请求失败: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API请求错误 [${method} ${endpoint}]:`, error);
        throw error;
    }
}

// 认证相关API
const authAPI = {
    /**
     * 用户登录
     * @param {object} credentials - 登录凭证
     */
    login: (credentials) => request('/auth/login', 'POST', { body: credentials }),
    
    /**
     * 用户注册
     * @param {object} userData - 用户数据
     */
    register: (userData) => request('/auth/register', 'POST', { body: userData }),
    
    /**
     * 用户登出
     */
    logout: () => {
        authToken = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        window.dispatchEvent(new CustomEvent(AuthEvents.LOGOUT));
    }
};

// 设置认证token
const setAuthToken = (token) => {
    authToken = token;
    localStorage.setItem('authToken', token);
};

// 用户相关API
const getUserInfo = () => request('/user/info');

// 课程评价API
const getLatestReviews = (limit = 10, offset = 0) => 
    request('/reviews/latest', 'GET', { query: { limit, offset } });

const getCourseReviews = (courseId, limit = 10, offset = 0) =>
    request(`/courses/${courseId}/reviews`, 'GET', { query: { limit, offset } });

const createReview = (reviewData) => {
    // 确保评分为整数
    reviewData.rating = Math.round(reviewData.rating);
    return request('/reviews', 'POST', { body: reviewData });
};

// 课程相关API
const getCourseDetail = (courseId) => 
    request(`/courses/${courseId}`);

const searchCourses = (params) => 
    request('/courses/search', 'GET', { 
        query: {
            ...params,
            include_stats: true  // 确保包含统计信息
        } 
    });

// 筛选条件API
const getFilterOptions = () => request('/filters');

// 获取筛选评价的API
const getFilteredReviews = (params) => request('/reviews/filter', 'GET', { query: params });

// 系统API
const getHealth = () => request('/health');

// 导出所有需要的函数和对象
export {
    request,
    authAPI,
    setAuthToken,
    getUserInfo,
    getLatestReviews,
    getCourseReviews,
    createReview,
    getCourseDetail,
    searchCourses,
    getFilterOptions,
    getHealth,
    AuthEvents
};