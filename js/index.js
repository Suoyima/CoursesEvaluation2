import { getLatestReviews, getFilterOptions, searchCourses, getUserInfo, authAPI, setAuthToken, request} from './api.js';
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
let isLoggedIn = false;
let currentUser = null;
let currentSearchType = 'reviews'; // 添加当前搜索类型状态

// 初始化页面
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 检查本地存储的token
        const token = localStorage.getItem('authToken');
        if (token) {
            setAuthToken(token);
            await checkLoginStatus();
        } else {
            updateLoginUI(false);
        }
        
        // 加载筛选条件
        await loadFilterOptions();
        
        // 默认加载最新评价
        await loadLatestReviews();
        
        // 监听登出事件
        window.addEventListener('logout', () => {
            isLoggedIn = false;
            currentUser = null;
            updateLoginUI(false);
        });
        
        // 监听未授权事件
        window.addEventListener('unauthorized', () => {
            showLoginModal();
        });
        
    } catch (error) {
        showError(error);
    }
});

// 加载筛选条件
async function loadFilterOptions() {
    try {
        courseList.innerHTML = '<div class="loading">加载筛选条件中...</div>';
        const filters = await getFilterOptions();
        renderFilterOptions(filters);
    } catch (error) {
        console.error('加载筛选条件失败:', error);
        courseList.innerHTML = `
            <div class="error-message">
                筛选条件加载失败: ${error.message}
                <button onclick="location.reload()">重试</button>
            </div>
        `;
    }
}

// 渲染筛选条件
function renderFilterOptions(filters) {
    // 渲染学院筛选 - 改为单选
    const departmentFilters = document.getElementById('departmentFilters');
    departmentFilters.innerHTML = '';
    
    // 添加"不限"选项
    const deptNoneOption = document.createElement('div');
    deptNoneOption.className = 'filter-option';
    deptNoneOption.innerHTML = `
        <input type="radio" id="dept-none" value="" name="department" checked>
        <label for="dept-none">不限</label>
    `;
    departmentFilters.appendChild(deptNoneOption);
    
    filters.departments.forEach(dept => {
        const filterOption = document.createElement('div');
        filterOption.className = 'filter-option';
        filterOption.innerHTML = `
            <input type="radio" id="dept-${dept}" value="${dept}" name="department">
            <label for="dept-${dept}">${dept}</label>
        `;
        departmentFilters.appendChild(filterOption);
    });
    
    // 渲染评分筛选 - 已经是单选，保持不变
    const ratingFilters = document.getElementById('ratingFilters');
    ratingFilters.innerHTML = '';
    const noneOption = document.createElement('div');
    noneOption.className = 'filter-option';
    noneOption.innerHTML = `
        <input type="radio" id="rating-none" value="" name="rating" checked>
        <label for="rating-none">不限</label>
    `;
    ratingFilters.appendChild(noneOption);
    
    filters.rating_ranges.forEach(range => {
        const filterOption = document.createElement('div');
        filterOption.className = 'filter-option';
        filterOption.innerHTML = `
            <input type="radio" id="rating-${range}" value="${range}" name="rating">
            <label for="rating-${range}">${range}星</label>
        `;
        ratingFilters.appendChild(filterOption);
    });
    
    // 渲染学分筛选 - 改为单选
    const creditFilters = document.getElementById('creditFilters');
    creditFilters.innerHTML = '';
    
    // 添加"不限"选项
    const creditNoneOption = document.createElement('div');
    creditNoneOption.className = 'filter-option';
    creditNoneOption.innerHTML = `
        <input type="radio" id="credit-none" value="" name="credit" checked>
        <label for="credit-none">不限</label>
    `;
    creditFilters.appendChild(creditNoneOption);
    
    filters.credits.forEach(credit => {
        const filterOption = document.createElement('div');
        filterOption.className = 'filter-option';
        filterOption.innerHTML = `
            <input type="radio" id="credit-${credit}" value="${credit}" name="credit">
            <label for="credit-${credit}">${credit}学分</label>
        `;
        creditFilters.appendChild(filterOption);
    });
    
    // 添加筛选事件监听
    sidebarFilters.addEventListener('change', handleFilterChange);
}

// 加载最新评价
async function loadLatestReviews() {
    try {
        isSearching = false;
        courseList.innerHTML = '<div class="loading">加载最新评价中...</div>';
        
        const reviews = await getLatestReviews(itemsPerPage, (currentPage - 1) * itemsPerPage);
        renderCourseList(reviews.reviews, 'reviews');
        
    } catch (error) {
        console.error('加载评价列表失败:', error);
        showError(new Error('加载评价列表失败: ' + error.message));
    }
}

// 加载所有课程
async function loadAllCourses(params = {}) {
    try {
        isSearching = true;
        courseList.innerHTML = '<div class="loading">加载课程中...</div>';
        
        // 确保评分范围参数正确传递
        const searchParams = {
            include_reviews_count: true,
            ...params
        };
        
        // 如果只有min_rating或max_rating，确保另一个参数不被错误设置
        if (searchParams.min_rating && !searchParams.max_rating) {
            searchParams.max_rating = 5; // 默认最大值为5
        }
        if (searchParams.max_rating && !searchParams.min_rating) {
            searchParams.min_rating = 1; // 默认最小值为1
        }
        
        const result = await searchCourses(searchParams);
        renderCourseList(result.courses, 'courses');
        
    } catch (error) {
        console.error('加载课程失败:', error);
        showError(new Error('加载课程失败: ' + error.message));
    }
}

// 加载筛选后的评价
async function loadFilteredReviews(filters) {
    try {
        isSearching = true;
        courseList.innerHTML = '<div class="loading">加载评价中...</div>';
        
        const query = {
            limit: itemsPerPage,
            offset: (currentPage - 1) * itemsPerPage
        };
        
        // 添加筛选参数（使用单个值）
        if (filters.keyword) query.keyword = filters.keyword;
        if (filters.department) query.department = filters.department;
        if (filters.min_rating) query.min_rating = filters.min_rating;
        if (filters.max_rating) query.max_rating = filters.max_rating;
        if (filters.credit) query.credit = filters.credit;
        
        const response = await request('/reviews/filter', 'GET', { query });
        renderCourseList(response.reviews, 'reviews');
        
    } catch (error) {
        console.error('获取评价列表失败:', error);
        showError(new Error('获取评价列表失败: ' + error.message));
    }
}

// 渲染课程/评价列表
function renderCourseList(items, type) {
    if (items.length === 0) {
        courseList.innerHTML = '<div class="error-message">没有找到相关内容</div>';
        return;
    }
    
    courseList.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'course-card';
        
        if (type === 'reviews') {
            // 评价卡片 - 修复用户名显示问题
            const userName = item.user_name || item.username || item.user_name || '匿名用户';
            const courseName = item.course_name || item.courseName || '未知课程';
            const departmentName = item.department_name || item.department || '';
            
            card.innerHTML = `
                <div class="course-header">
                    <a href="/course.html?id=${item.course_id || item.courseId}" class="course-title">${courseName}</a>
                    <div class="rating">${generateRatingStars(item.rating)}</div>
                </div>
                <div class="course-meta">
                    ${departmentName ? departmentName + ' · ' : ''}难度: ${item.difficulty} | 给分: ${item.grading} | 收获: ${item.harvest}
                </div>
                <div class="course-description">
                    ${item.content || '暂无评价内容'}
                </div>
                <div class="course-footer">
                    <span class="user">${userName}</span>
                    <span class="date">发布于 ${formatDate(item.created_at || item.createdAt)}</span>
                </div>
            `;
        } else {
            // 课程卡片 - 确保使用统一的评分显示方式
            const avgRating = item.avg_rating || 0;
            const reviewCount = item.review_count || 0;
            
            card.innerHTML = `
                <div class="course-header">
                    <a href="/course.html?id=${item.id}" class="course-title">${item.name}</a>
                    <div class="rating">${generateRatingStars(avgRating)}</div>
                </div>
                <div class="course-meta">
                    ${item.department || '未知院系'} · ${item.credit || 0}学分
                </div>
                <div class="course-stats">
                    平均评分: ${avgRating ? avgRating.toFixed(1) : '暂无'}分 · 
                    评价数: ${reviewCount}
                </div>
            `;
        }
        
        courseList.appendChild(card);
    });
}

// 搜索标签切换
searchTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        searchTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentSearchType = this.dataset.type;
        
        // 更新搜索框提示文字
        searchInput.placeholder = currentSearchType === 'reviews' ? '搜索评价...' : '搜索课程...';
        
        // 清空搜索输入框和筛选条件
        searchInput.value = '';
        clearFilters();
        
        // 根据当前类型加载内容
        if (currentSearchType === 'reviews') {
            loadLatestReviews();
        } else {
            loadAllCourses();
        }
    });
});

// 清空筛选条件
function clearFilters() {
    // 清空学院筛选（重置为"不限"）
    document.querySelectorAll('#departmentFilters input[type="radio"]').forEach(radio => {
        if (radio.value === '') {
            radio.checked = true;
        } else {
            radio.checked = false;
        }
    });
    
    // 清空评分筛选（重置为"不限"）
    document.querySelector('#rating-none').checked = true;
    
    // 清空学分筛选（重置为"不限"）
    document.querySelectorAll('#creditFilters input[type="radio"]').forEach(radio => {
        if (radio.value === '') {
            radio.checked = true;
        } else {
            radio.checked = false;
        }
    });
    
    currentSearchParams = {};
}

// 搜索输入事件
searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        const keyword = searchInput.value.trim();
        
        if (currentSearchType === 'reviews') {
            // 搜索评价
            currentSearchParams.keyword = keyword;
            if (keyword) {
                loadFilteredReviews(currentSearchParams);
            } else {
                loadLatestReviews();
            }
        } else {
            // 搜索课程
            currentSearchParams.keyword = keyword;
            loadAllCourses(currentSearchParams);
        }
    }
});

// 筛选条件变化处理
function handleFilterChange(event) {
    const filters = {
        keyword: searchInput.value.trim(),
        department: null,
        min_rating: null,
        max_rating: null,
        credit: null
    };
    
    // 获取选中的学院（单选）
    const selectedDept = document.querySelector('#departmentFilters input[type="radio"]:checked');
    if (selectedDept && selectedDept.value) {
        filters.department = selectedDept.value;
    }
    
    // 处理评分范围 - 修改为使用min_rating和max_rating
    const ratingRadio = document.querySelector('#ratingFilters input[type="radio"]:checked');
    if (ratingRadio && ratingRadio.value) {
        const [min, max] = ratingRadio.value.split('-').map(Number);
        filters.min_rating = min;
        filters.max_rating = max;
    }
    
    // 获取选中的学分（单选）
    const selectedCredit = document.querySelector('#creditFilters input[type="radio"]:checked');
    if (selectedCredit && selectedCredit.value) {
        filters.credit = parseInt(selectedCredit.value);
    }
    
    // 清理空值
    const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => 
            v !== null && v !== undefined && v !== ''
        )
    );
    
    // 更新搜索参数
    currentSearchParams = cleanFilters;
    
    // 根据当前类型应用筛选
    if (currentSearchType === 'reviews') {
        if (Object.keys(cleanFilters).length > 0) {
            loadFilteredReviews(cleanFilters);
        } else {
            loadLatestReviews();
        }
    } else {
        loadAllCourses(cleanFilters);
    }
}

// 登录功能
async function login(username, password) {
    try {
        const response = await authAPI.login({ username, password });
        setAuthToken(response.token);
        currentUser = response.user;
        isLoggedIn = true;
        
        localStorage.setItem('userInfo', JSON.stringify(response.user));
        await checkLoginStatus();
        return response;
    } catch (error) {
        // 更详细的错误处理
        if (error.message.includes('401')) {
            throw new Error('用户名或密码错误');
        } else if (error.message.includes('Network Error')) {
            throw new Error('网络连接失败');
        } else {
            throw new Error('登录失败: ' + error.message);
        }
    }
}

// 检查登录状态
async function checkLoginStatus() {
    try {
        const userInfo = await getUserInfo();
        isLoggedIn = true;
        currentUser = userInfo;
        
        if (userInfo.avatar) {
            userAvatar.src = userInfo.avatar;
            userAvatar.alt = userInfo.name;
        }
        
        updateLoginUI(true, userInfo.name);
        return userInfo;
    } catch (error) {
        isLoggedIn = false;
        currentUser = null;
        updateLoginUI(false);
        console.log('用户未登录:', error.message);
        return null;
    }
}

// 更新登录状态UI
function updateLoginUI(loggedIn, userName = '') {
    if (loggedIn) {
        userAvatar.title = `欢迎, ${userName}`;
        userAvatar.style.cursor = 'pointer';
        floatButton.style.display = 'flex';
        floatButton.title = '写评价';
    } else {
        userAvatar.title = '点击登录';
        userAvatar.style.cursor = 'pointer';
        floatButton.style.display = 'none';
    }
}

// 显示登录模态框
function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>登录课程评价系统</h3>
            <form id="loginForm">
                <div class="form-group">
                    <input type="text" placeholder="用户名" name="username" required>
                </div>
                <div class="form-group">
                    <input type="password" placeholder="密码" name="password" required>
                </div>
                <button type="submit" class="btn-primary">登录</button>
            </form>
            <div class="modal-footer">
                <p>还没有账号？ <a href="#" id="showRegister">立即注册</a></p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // 关闭模态框
    modal.querySelector('.close').addEventListener('click', () => {
        modal.remove();
    });

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // 登录表单提交
    modal.querySelector('#loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '登录中...';
        submitBtn.disabled = true;
        
        try {
            await login(credentials.username, credentials.password);
            modal.remove();
            await loadLatestReviews();
        } catch (error) {
            alert(error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // 显示注册模态框
    modal.querySelector('#showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        modal.remove();
        showRegisterModal();
    });
}

// 显示注册模态框
function showRegisterModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>注册新账号</h3>
            <form id="registerForm">
                <div class="form-group">
                    <input type="text" placeholder="用户名" name="username" required>
                </div>
                <div class="form-group">
                    <input type="text" placeholder="显示名称" name="name" required>
                </div>
                <div class="form-group">
                    <input type="password" placeholder="密码" name="password" required>
                </div>
                <div class="form-group">
                    <input type="password" placeholder="确认密码" name="confirmPassword" required>
                </div>
                <button type="submit" class="btn-primary">注册</button>
            </form>
            <div class="modal-footer">
                <p>已有账号？ <a href="#" id="showLogin">立即登录</a></p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.close').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // 注册表单提交
    modal.querySelector('#registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userData = {
            username: formData.get('username'),
            name: formData.get('name'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        if (userData.password !== userData.confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '注册中...';
        submitBtn.disabled = true;

        try {
            await authAPI.register(userData);
            alert('注册成功，请登录');
            modal.remove();
            showLoginModal();
        } catch (error) {
            alert('注册失败: ' + error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    modal.querySelector('#showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        modal.remove();
        showLoginModal();
    });
}

// 显示用户菜单
function showUserMenu() {
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML = `
        <div class="user-menu-content">
            <div class="user-info">
                
                <span>${currentUser.name}</span>
            </div>
            <hr>
            <ul>
                <li><a href="/profile.html">个人中心</a></li>
                <li><a href="/my-reviews.html">我的评价</a></li>
                <li><a href="#" id="logoutBtn">退出登录</a></li>
            </ul>
        </div>
    `;
    
    document.body.appendChild(menu);

    // 退出登录
    menu.querySelector('#logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        authAPI.logout();
        menu.remove();
        location.reload();
    });

    // 点击外部关闭菜单
    setTimeout(() => {
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== userAvatar) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }, 100);
}

// 用户头像点击
userAvatar.addEventListener('click', function() {
    if (!isLoggedIn) {
        showLoginModal();
    } else {
        showUserMenu();
    }
});

// 浮动按钮点击
floatButton.addEventListener('click', function() {
    if (!isLoggedIn) {
        showLoginModal();
    } else {
        window.location.href = '/review.html';
    }
});

// 显示错误
function showError(error) {
    courseList.innerHTML = `
        <div class="error-message">
            ${handleApiError(error)}
            <br>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px;">
                重新加载
            </button>
        </div>
    `;
}

// 全局重载函数
window.reloadPage = function() {
    location.reload();
};