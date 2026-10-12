/**
 * login.js —— 管理员登录视图
 * 渲染登录表单，校验口令并回调 app.js 完成登录态切换。
 */
export const login = {
  render(container, { onLogin }) {
    container.innerHTML = `
      <div class="login-card">
        <div class="login-logo">💧</div>
        <h1>家庭水质健康物联网云平台</h1>
        <div class="sub">V1.0 · 河海大学</div>
        <div class="form-group">
          <label>用户名</label>
          <input class="form-input" id="login-user" placeholder="请输入用户名" value="admin">
        </div>
        <div class="form-group">
          <label>密码</label>
          <input class="form-input" id="login-pass" type="password" placeholder="请输入密码" value="123456">
        </div>
        <button class="btn btn-primary" id="login-btn" style="width:100%;justify-content:center;padding:12px">登 录</button>
        <div class="sub" style="margin-top:14px;margin-bottom:0">默认账号 admin / 123456</div>
      </div>`;

    const userInput = container.querySelector('#login-user');
    const passInput = container.querySelector('#login-pass');
    const btn = container.querySelector('#login-btn');

    const submit = () => {
      const username = userInput.value.trim();
      const password = passInput.value;
      if (!username || !password) {
        window.toastMsg('请输入用户名和密码');
        return;
      }
      btn.disabled = true;
      onLogin(username, password);
    };

    btn.addEventListener('click', submit);
    passInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    userInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    userInput.focus();
  },
};
