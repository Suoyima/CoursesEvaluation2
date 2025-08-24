import { request } from './api.js';

// 安全获取DOM元素的函数
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`错误: 找不到ID为"${id}"的元素`);
        return null;
    }
    return element;
}

// 初始化所有DOM元素
function initElements() {
    const elements = {
        userAvatarLarge: getElement('userAvatarLarge'),
        userName: getElement('userName'),
        reviewsCount: getElement('reviewsCount'),
        usernameInput: getElement('username'),
        nameInput: getElement('name'),
        avatarInput: getElement('avatar'),
        profileForm: getElement('profileForm'),
        passwordForm: getElement('passwordForm'),
        profileError: getElement('profileError'),
        profileSuccess: getElement('profileSuccess'),
        passwordError: getElement('passwordError'),
        passwordSuccess: getElement('passwordSuccess'),
        oldPassword: getElement('oldPassword'),
        newPassword: getElement('newPassword'),
        confirmPassword: getElement('confirmPassword')
    };

    // 验证关键元素
    const requiredElements = ['userAvatarLarge', 'userName'];
    for (const elem of requiredElements) {
        if (!elements[elem]) {
            throw new Error(`关键元素${elem}缺失，请检查HTML结构`);
        }
    }

    return elements;
}

// 更新用户界面
function updateUserProfileUI(elements, user) {
    if (elements.userAvatarLarge) {
        elements.userAvatarLarge.src = user.avatar || 'https://img.ixintu.com/download/jpg/20200910/f9256155491e54bf5e99bf29eece0156_512_512.jpg!ys';
    }
    if (elements.userName) {
        elements.userName.textContent = user.name || '未设置昵称';
    }
    if (elements.usernameInput) elements.usernameInput.value = user.username || '';
    if (elements.nameInput) elements.nameInput.value = user.name || '';
    if (elements.avatarInput) elements.avatarInput.value = user.avatar || '';
    if (elements.reviewsCount) elements.reviewsCount.textContent = user.reviews_count || 0;
}

// 加载用户信息
async function loadUserProfile(elements) {
    try {
        const response = await request('/user/profile', 'GET');
        updateUserProfileUI(elements, response);
    } catch (error) {
        console.error('加载用户信息失败:', error);
        if (elements.profileError) {
            elements.profileError.textContent = '加载用户信息失败: ' + error.message;
        }
    }
}

// 处理基本信息更新
async function handleProfileUpdate(elements) {
    clearMessages(elements);
    
    try {
        // 验证输入
        if (!elements.nameInput.value.trim()) {
            throw new Error('昵称不能为空');
        }
        
        const response = await request('/user/profile', 'PUT', {
            body: {
                name: elements.nameInput.value.trim(),
                avatar: elements.avatarInput.value.trim()
            }
        });
        
        // 更新UI
        updateUserProfileUI(elements, {
            ...response,
            name: elements.nameInput.value.trim(),
            avatar: elements.avatarInput.value.trim()
        });
        
        // 更新本地存储
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        userInfo.name = elements.nameInput.value.trim();
        userInfo.avatar = elements.avatarInput.value.trim();
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        // 显示成功消息
        if (elements.profileSuccess) {
            elements.profileSuccess.textContent = '个人信息更新成功';
        }
        
    } catch (error) {
        console.error('更新失败:', error);
        if (elements.profileError) {
            elements.profileError.textContent = error.message;
        }
    }
}

// 处理密码修改
async function handlePasswordChange(elements) {
    clearMessages(elements);
    
    try {
        const oldPassword = elements.oldPassword.value;
        const newPassword = elements.newPassword.value;
        const confirmPassword = elements.confirmPassword.value;
        
        // 验证输入
        if (!oldPassword || !newPassword || !confirmPassword) {
            throw new Error('所有密码字段都必须填写');
        }
        
        if (newPassword !== confirmPassword) {
            throw new Error('两次输入的新密码不一致');
        }
        
        if (newPassword.length < 6) {
            throw new Error('密码长度至少为6个字符');
        }
        
        await request('/user/password', 'PUT', {
            body: {
                old_password: oldPassword,
                new_password: newPassword
            }
        });
        
        // 清空表单
        elements.passwordForm.reset();
        
        // 显示成功消息
        if (elements.passwordSuccess) {
            elements.passwordSuccess.textContent = '密码修改成功';
        }
        
    } catch (error) {
        console.error('修改密码失败:', error);
        if (elements.passwordError) {
            elements.passwordError.textContent = error.message;
        }
    }
}

// 清空所有消息
function clearMessages(elements) {
    if (elements.profileError) elements.profileError.textContent = '';
    if (elements.profileSuccess) elements.profileSuccess.textContent = '';
    if (elements.passwordError) elements.passwordError.textContent = '';
    if (elements.passwordSuccess) elements.passwordSuccess.textContent = '';
}

// 设置事件监听
function setupEventListeners(elements) {
    if (elements.profileForm) {
        elements.profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleProfileUpdate(elements);
        });
    }
    
    if (elements.passwordForm) {
        elements.passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handlePasswordChange(elements);
        });
    }
}

// 主初始化函数
async function initProfile() {
    try {
        // 初始化DOM元素
        const elements = initElements();
        
        // 检查登录状态
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/index.html';
            return;
        }
        
        // 加载用户信息
        await loadUserProfile(elements);
        
        // 设置事件监听
        setupEventListeners(elements);
        
    } catch (error) {
        console.error('初始化失败:', error);
        alert('页面初始化失败: ' + error.message);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initProfile);