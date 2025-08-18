import { getLatestReviews, getFilterOptions, searchCourses, getUserInfo } from './api.js';
import { formatDate, generateRatingStars, handleApiError } from './utils.js';

// DOM元素
const courseList = document.getElementById('courseList');
const sidebarFilters = document.getElementById('sidebarFilters');
const searchInput = document.getElementById('searchInput');
const userAvatar = document.getElementById('userAvatar');
const floatButton = document.getElementById('floatButton');
const searchTabs = document.querySelectorAll('.search-tab');

// 全局状态
let currentPage = 1;
const itemsPerPage = 10;
let currentSearchParams = {};
let isSearching = false;

// 初始化页面
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 加载筛选条件
        await loadFilterOptions();
        
        // 加载最新评价
        await loadLatestReviews();
        
        // 检查用户登录状态
        await checkLoginStatus();
    } catch (error) {
        showError(error);
    }
});

// 加载筛选条件
async function loadFilterOptions() {
    try {
        const filters = await getFilterOptions();
        renderFilterOptions(filters);
    } catch (error) {
        throw new Error('加载筛选条件失败: ' + error.message);
    }
}

// 渲染筛选条件
function renderFilterOptions(filters) {
    // 渲染学院筛选
    const departmentFilters = document.getElementById('departmentFilters');
    filters.departments.forEach(dept => {
        const filterOption = document.createElement('div');
        filterOption.className = 'filter-option';
        filterOption.innerHTML = `
            <input type="checkbox" id="dept-${dept}" value="${dept}">
            <label for="dept-${dept}">${dept}</label>
        `;
        departmentFilters.appendChild(filterOption);
    });
    
    // 渲染评分筛选
    const ratingFilters = document.getElementById('ratingFilters');
    filters.rating_ranges.forEach(range => {
        const filterOption = document.createElement('div');
        filterOption.className = 'filter-option';
        filterOption.innerHTML = `
            <input type="checkbox" id="rating-${range}" value="${range}">
            <label for="rating-${range}">${range}星</label>
        `;
        ratingFilters.appendChild(filterOption);
    });
    
    // 添加筛选事件监听
    sidebarFilters.addEventListener('change', handleFilterChange);
}

// 加载最新评价
async function loadLatestReviews() {
    try {
        isSearching = false;
        courseList.innerHTML = '<div class="loading">加载中...</div>';
        
        const reviews = await getLatestReviews(itemsPerPage, (currentPage - 1) * itemsPerPage);
        renderCourseList(reviews.reviews);
        
        // 可以添加分页逻辑
    } catch (error) {
        throw new Error('加载评价列表失败: ' + error.message);
    }
}

// 搜索课程
async function searchCoursesWithParams(params) {
    try {
        isSearching = true;
        courseList.innerHTML = '<div class="loading">加载中...</div>';
        
        const result = await searchCourses(params);
        renderCourseList(result.courses);
        
        // 可以添加分页逻辑
    } catch (error) {
        throw new Error('搜索课程失败: ' + error.message);
    }
}

// 渲染课程列表
function renderCourseList(items) {
    if (items.length === 0) {
        courseList.innerHTML = '<div class="error-message">没有找到相关课程</div>';
        return;
    }
    
    courseList.innerHTML = '';
    items.forEach(item => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        
        // 判断是课程还是评价
        if (item.course_name) {
            // 评价卡片
            courseCard.innerHTML = `
                <div class="course-header">
                    <a href="/course.html?id=${item.course_id}" class="course-title">${item.course_name}</a>
                    <div class="rating">${generateRatingStars(item.rating)}</div>
                </div>
                <div class="course-description">
                    ${item.content}
                </div>
                <div class="course-footer">
                    <span>发布于 ${formatDate(item.created_at)}</span>
                </div>
            `;
        } else {
            // 课程卡片
            courseCard.innerHTML = `
                <div class="course-header">
                    <a href="/course.html?id=${item.id}" class="course-title">${item.name}</a>
                    <div class="rating">${generateRatingStars(item.avg_rating)}</div>
                </div>
                <div class="course-meta">
                    ${item.department} · ${item.credit}学分
                </div>
            `;
        }
        
        courseList.appendChild(courseCard);
    });
}

// 检查登录状态
async function checkLoginStatus() {
    try {
        const userInfo = await getUserInfo();
        // 更新用户头像等
        if (userInfo.avatar) {
            userAvatar.src = userInfo.avatar;
        }
    } catch (error) {
        // 未登录或获取用户信息失败
        console.log('用户未登录或获取信息失败:', error.message);
    }
}

// 事件处理函数
function handleFilterChange(event) {
    const filters = {
        keyword: searchInput.value.trim(),
        department: [],
        min_rating: null,
        max_rating: null,
        credit: []
    };
    
    // 获取选中的学院
    document.querySelectorAll('#departmentFilters input[type="checkbox"]:checked').forEach(checkbox => {
        filters.department.push(checkbox.value);
    });
    
    // 获取选中的评分范围
    document.querySelectorAll('#ratingFilters input[type="checkbox"]:checked').forEach(checkbox => {
        const [min, max] = checkbox.value.split('-').map(Number);
        if (!filters.min_rating || min < filters.min_rating) {
            filters.min_rating = min;
        }
        if (!filters.max_rating || max > filters.max_rating) {
            filters.max_rating = max;
        }
    });
    
    // 更新搜索参数
    currentSearchParams = filters;
    
    if (isSearching || searchInput.value.trim() || filters.department.length || filters.min_rating) {
        searchCoursesWithParams(currentSearchParams);
    } else {
        loadLatestReviews();
    }
}

// 搜索输入事件
searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        currentSearchParams.keyword = searchInput.value.trim();
        searchCoursesWithParams(currentSearchParams);
    }
});

// 搜索标签切换
searchTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        searchTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentSearchParams.type = this.dataset.type;
    });
});

// 用户头像点击
userAvatar.addEventListener('click', function() {
    // 这里应该检查用户是否登录
    // 如果未登录，跳转到登录页面
    window.location.href = '/login';
    // 如果已登录，跳转到用户主页
    // window.location.href = '/user/profile';
});

// 浮动按钮点击
floatButton.addEventListener('click', function() {
    // 这里应该检查用户是否登录
    // 如果未登录，跳转到登录页面
    window.location.href = '/login';
    // 如果已登录，跳转到写评价页面
    // window.location.href = '/review/new';
});

// 显示错误
function showError(error) {
    courseList.innerHTML = `
        <div class="error-message">
            ${handleApiError(error)}
        </div>
    `;
}