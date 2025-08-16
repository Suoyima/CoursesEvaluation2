// 用户头像点击事件
document.getElementById('userAvatar').addEventListener('click', function() {
    // 这里应该检查用户是否登录
    // 如果未登录，跳转到登录页面
    window.location.href = '/login';
    // 如果已登录，跳转到用户主页
    // window.location.href = '/user/profile';
});

// 浮动按钮点击事件
document.getElementById('floatButton').addEventListener('click', function() {
    // 这里应该检查用户是否登录
    // 如果未登录，跳转到登录页面
    window.location.href = '/login';
    // 如果已登录，跳转到写评价页面
    // window.location.href = '/review/new';
});

// 搜索标签切换
const tabs = document.querySelectorAll('.search-tab');
tabs.forEach(tab => {
    tab.addEventListener('click', function() {
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
    });
});