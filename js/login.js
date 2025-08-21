import { request } from './api.js';
import { showError } from './utils.js';

// DOM元素
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const tabs = document.querySelectorAll('.tab');

// 切换登录/注册标签页
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // 更新活动标签
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // 切换表单显示
        document.querySelectorAll('.form-container').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab.dataset.tab}Form`).classList.add('active');
    });
});

// 登录表单提交
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        // 调用登录API
        const response = await request('/auth/login', 'POST', {
            body: { username, password }
        });
        
        // 登录成功后跳转
        window.location.href = '/index.html';
    } catch (error) {
        showError(loginForm, '用户名或密码错误');
        console.error('登录失败:', error);
    }
});

// 注册表单提交
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // 验证密码匹配
    if (password !== confirmPassword) {
        showError(registerForm, '两次输入的密码不一致');
        return;
    }
    
    try {
        // 调用注册API
        const response = await request('/auth/register', 'POST', {
            body: { username, email, password }
        });
        
        // 注册成功后自动登录或跳转
        window.location.href = '/index.html';
    } catch (error) {
        showError(registerForm, '注册失败: ' + (error.message || '请稍后再试'));
        console.error('注册失败:', error);
    }
});

/**
 * 在表单中显示错误消息
 * @param {HTMLElement} form - 表单元素
 * @param {string} message - 错误消息
 */
function showError(form, message) {
    // 移除旧的错误消息
    const oldError = form.querySelector('.error-message');
    if (oldError) oldError.remove();
    
    // 创建新的错误消息元素
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    // 插入到提交按钮前
    const submitBtn = form.querySelector('.submit-btn');
    form.insertBefore(errorElement, submitBtn);
}