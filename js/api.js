// 配置
const API_BASE_URL = 'http://localhost:5000/api';
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

/**
 * 统一请求处理器
 * @param {string} endpoint - API端点路径（如 '/user/info'）
 * @param {string} method - HTTP方法
 * @param {object} [body] - 请求体
 * @param {object} [query] - 查询参数
 */
async function request(endpoint, method = 'GET', { body, query } = {}) {
  // 构建完整URL
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
    headers: DEFAULT_HEADERS,
    credentials: 'include', // 跨域携带cookie
    body: body ? JSON.stringify(body) : undefined
  };

  try {
    const response = await fetch(url, config);
    
    // 处理非200响应
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `请求失败: ${response.status} ${response.statusText}`
      );
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API请求错误 [${method} ${endpoint}]:`, error);
    throw error;
  }
}

// 用户相关API
export const getUserInfo = () => request('/user/info');

// 课程评价API
export const getLatestReviews = (limit = 10, offset = 0, filters = {}) => {
    const query = { limit, offset };
    
    // 添加筛选参数
    if (filters.department && filters.department.length > 0) {
        query.department = filters.department.join(',');
    }
    if (filters.min_rating) {
        query.min_rating = filters.min_rating;
    }
    // 可以添加其他筛选条件...
    
    return request('/reviews/latest', 'GET', { query });
};

export const getCourseReviews = (courseId, limit = 10, offset = 0) =>
  request(`/courses/${courseId}/reviews`, 'GET', { query: { limit, offset } });

// 课程相关API
export const getCourseDetail = (courseId) => 
  request(`/courses/${courseId}`);

export const searchCourses = (params) => 
  request('/courses/search', 'GET', { query: params });

// 筛选条件
export const getFilterOptions = () => request('/filters');