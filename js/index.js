import { getLatestReviews, getFilterOptions, searchCourses, getUserInfo, authAPI, setAuthToken } from './api.js';
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
        
        // 加载最新评价
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
    // 渲染学院筛选
    const departmentFilters = document.getElementById('departmentFilters');
    departmentFilters.innerHTML = '';
    filters.departments.forEach(dept => {
        const filterOption = document.createElement('div');
        filterOption.className = 'filter-option';
        filterOption.innerHTML = `
            <input type="checkbox" id="dept-${dept}" value="${dept}" name="department">
            <label for="dept-${dept}">${dept}</label>
        `;
        departmentFilters.appendChild(filterOption);
    });
    
    // 渲染评分筛选
    const ratingFilters = document.getElementById('ratingFilters');
    ratingFilters.innerHTML = '';
    filters.rating_ranges.forEach(range => {
        const filterOption = document.createElement('div');
        filterOption.className = 'filter-option';
        filterOption.innerHTML = `
            <input type="radio" id="rating-${range}" value="${range}" name="rating">
            <label for="rating-${range}">${range}星</label>
        `;
        ratingFilters.appendChild(filterOption);
    });
    
    // 渲染学分筛选
    const creditFilters = document.getElementById('creditFilters');
    creditFilters.innerHTML = '';
    filters.credits.forEach(credit => {
        const filterOption = document.createElement('div');
        filterOption.className = 'filter-option';
        filterOption.innerHTML = `
            <input type="checkbox" id="credit-${credit}" value="${credit}" name="credit">
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
        renderCourseList(reviews.reviews);
        
    } catch (error) {
        console.error('加载评价列表失败:', error);
        showError(new Error('加载评价列表失败: ' + error.message));
    }
}

// 搜索课程
async function searchCoursesWithParams(params) {
    try {
        isSearching = true;
        courseList.innerHTML = '<div class="loading">搜索课程中...</div>';
        
        const searchParams = {};
        if (params.keyword) searchParams.keyword = params.keyword;
        if (params.department && params.department.length > 0) {
            searchParams.department = params.department[0];
        }
        if (params.min_rating) searchParams.min_rating = params.min_rating;
        if (params.credit && params.credit.length > 0) {
            searchParams.credit = params.credit[0];
        }
        
        const result = await searchCourses(searchParams);
        renderCourseList(result.courses);
        
    } catch (error) {
        console.error('搜索课程失败:', error);
        showError(new Error('搜索课程失败: ' + error.message));
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
        
        if (item.course_name) {
            // 评价卡片
            courseCard.innerHTML = `
                <div class="course-header">
                    <a href="/course.html?id=${item.course_id}" class="course-title">${item.course_name}</a>
                    <div class="rating">${generateRatingStars(item.rating)}</div>
                </div>
                <div class="course-description">
                    ${item.content || '暂无评价内容'}
                </div>
                <div class="course-footer">
                    <span class="user">${item.user_name || '匿名用户'}</span>
                    <span class="date">发布于 ${formatDate(item.created_at)}</span>
                </div>
            `;
        } else {
            // 课程卡片
            courseCard.innerHTML = `
                <div class="course-header">
                    <a href="/course.html?id=${item.id}" class="course-title">${item.name}</a>
                    <div class="rating">${generateRatingStars(item.avg_rating || 0)}</div>
                </div>
                <div class="course-meta">
                    ${item.department || '未知院系'} · ${item.credit || 0}学分
                </div>
                <div class="course-stats">
                    平均评分: ${item.avg_rating ? item.avg_rating.toFixed(1) : '暂无'}分 · 
                    评价数: ${item.review_count || 0}
                </div>
            `;
        }
        
        courseList.appendChild(courseCard);
    });
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

// 事件处理函数
function handleFilterChange(event) {
    const filters = {
        keyword: searchInput.value.trim(),
        department: [],
        min_rating: null,
        credit: []
    };
    
    // 获取选中的学院
    document.querySelectorAll('#departmentFilters input[type="checkbox"]:checked').forEach(checkbox => {
        filters.department.push(checkbox.value);
    });
    
    // 获取选中的评分范围
    const ratingRadio = document.querySelector('#ratingFilters input[type="radio"]:checked');
    if (ratingRadio) {
        const [min, max] = ratingRadio.value.split('-').map(Number);
        filters.min_rating = min;
    }
    
    // 获取选中的学分
    document.querySelectorAll('#creditFilters input[type="checkbox"]:checked').forEach(checkbox => {
        filters.credit.push(parseInt(checkbox.value));
    });
    
    // 清理空值
    const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => 
            v !== null && v !== undefined && 
            (!Array.isArray(v) || v.length > 0) &&
            v !== ''
        )
    );
    
    // 更新搜索参数
    currentSearchParams = cleanFilters;
    
    if (Object.keys(cleanFilters).length > 0) {
        searchCoursesWithParams(cleanFilters);
    } else {
        loadLatestReviews();
    }
}

// 搜索输入事件
searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        currentSearchParams.keyword = searchInput.value.trim();
        if (currentSearchParams.keyword) {
            searchCoursesWithParams(currentSearchParams);
        } else {
            loadLatestReviews();
        }
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