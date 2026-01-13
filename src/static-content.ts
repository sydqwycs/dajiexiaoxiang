// 静态内容 - HTML 和 JavaScript

export function getUserPageHTML(): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>大街小巷 - 选择系统</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #667eea;
      text-align: center;
      margin-bottom: 30px;
    }
    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
      border-bottom: 2px solid #eee;
    }
    .tab {
      padding: 10px 20px;
      cursor: pointer;
      border: none;
      background: none;
      font-size: 16px;
      color: #666;
      transition: all 0.3s;
    }
    .tab.active {
      color: #667eea;
      border-bottom: 3px solid #667eea;
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .option {
      padding: 15px;
      margin: 10px 0;
      border: 2px solid #eee;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s;
    }
    .option:hover {
      border-color: #667eea;
      background: #f8f9ff;
    }
    .option.selected {
      border-color: #667eea;
      background: #f0f3ff;
    }
    .btn {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 20px;
    }
    .btn:hover { opacity: 0.9; }
    .progress-bar {
      height: 30px;
      background: #eee;
      border-radius: 15px;
      overflow: hidden;
      margin-top: 10px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
    }
    .message {
      padding: 15px;
      border-radius: 10px;
      margin: 20px 0;
      text-align: center;
    }
    .success { background: #d4edda; color: #155724; }
    .error { background: #f8d7da; color: #721c24; }
    .flower {
      position: fixed;
      font-size: 30px;
      pointer-events: none;
      animation: fall 3s linear forwards;
    }
    @keyframes fall {
      to {
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
      }
    }
    footer {
      text-align: center;
      margin-top: 30px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌸 大街小巷 🌸</h1>
    <div class="tabs">
      <button class="tab active" onclick="switchTab('current')">当前选择</button>
      <button class="tab" onclick="switchTab('history')">历史记录</button>
    </div>
    <div id="current" class="tab-content active">
      <div id="current-poll"></div>
    </div>
    <div id="history" class="tab-content">
      <div id="history-polls"></div>
    </div>
    <footer>© 2026 大街小巷</footer>
  </div>
  <script src="/app.js"></script>
</body>
</html>
  `;
}

export function getUserPageJS(): string {
  return `
let selectedOption = null;
let currentPoll = null;

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById(tab).classList.add('active');
  
  if (tab === 'current') loadCurrentPoll();
  else loadHistory();
}

async function loadCurrentPoll() {
  try {
    const res = await fetch('/api/polls/active');
    const poll = await res.json();
    
    if (!poll || !poll.id) {
      document.getElementById('current-poll').innerHTML = '<p class="message">暂无进行中的选择活动</p>';
      return;
    }
    
    currentPoll = poll;
    const results = await fetch('/api/polls/' + poll.id + '/results').then(r => r.json());
    
    let html = '<h2>' + poll.title + '</h2>';
    html += '<p>截止时间：' + new Date(poll.deadline).toLocaleString('zh-CN') + '</p>';
    html += '<div id="options">';
    
    results.options.forEach(opt => {
      html += '<div class="option" onclick="selectOption(\\''+opt.id+'\\')"><div>'+opt.optionText+'</div>';
      html += '<div class="progress-bar"><div class="progress-fill" style="width:'+(opt.percentage||0)+'%">'+(opt.voteCount||0)+' 票 ('+(opt.percentage||0)+'%)</div></div></div>';
    });
    
    html += '</div><button class="btn" onclick="submitVote()">提交选择</button>';
    document.getElementById('current-poll').innerHTML = html;
  } catch (err) {
    console.error(err);
  }
}

function selectOption(id) {
  selectedOption = id;
  document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
}

async function submitVote() {
  if (!selectedOption || !currentPoll) return alert('请选择一个选项');
  
  try {
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({pollId: currentPoll.id, optionId: selectedOption})
    });
    
    if (res.ok) {
      showFlowers();
      alert('投票成功！');
      loadCurrentPoll();
    } else {
      const err = await res.json();
      alert(err.message || '投票失败');
    }
  } catch (err) {
    alert('投票失败');
  }
}

function showFlowers() {
  const month = new Date().getMonth() + 1;
  let flowers = ['🌸','🌺'];
  if (month <= 2) flowers = ['❄️','⛄'];
  else if (month <= 4) flowers = ['🌸','🌺'];
  else if (month <= 6) flowers = ['🌹','🌷'];
  else if (month <= 8) flowers = ['🌻','☀️'];
  else if (month <= 10) flowers = ['🍂','🍁'];
  else flowers = ['❄️','⭐'];
  
  for (let i = 0; i < 150; i++) {
    setTimeout(() => {
      const flower = document.createElement('div');
      flower.className = 'flower';
      flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
      flower.style.left = Math.random() * 100 + '%';
      flower.style.animationDuration = (2 + Math.random() * 2) + 's';
      document.body.appendChild(flower);
      setTimeout(() => flower.remove(), 3000);
    }, i * 20);
  }
}

async function loadHistory() {
  try {
    const res = await fetch('/api/polls/history');
    const polls = await res.json();
    
    let html = '';
    for (const poll of polls) {
      const results = await fetch('/api/polls/' + poll.id + '/results').then(r => r.json());
      html += '<div style="margin-bottom:30px;padding:20px;border:1px solid #eee;border-radius:10px;">';
      html += '<h3>'+poll.title+'</h3>';
      html += '<p>截止时间：'+new Date(poll.deadline).toLocaleString('zh-CN')+'</p>';
      results.options.forEach(opt => {
        html += '<div style="margin:10px 0;"><div>'+opt.optionText+'</div>';
        html += '<div class="progress-bar"><div class="progress-fill" style="width:'+(opt.percentage||0)+'%">'+(opt.voteCount||0)+' 票 ('+(opt.percentage||0)+'%)</div></div></div>';
      });
      html += '</div>';
    }
    
    document.getElementById('history-polls').innerHTML = html || '<p class="message">暂无历史记录</p>';
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('click', (e) => {
  const flowers = ['🌸','🌺','🌻','🌷','🌹','🥀','🏵️','💐','🌼'];
  const flower = document.createElement('div');
  flower.className = 'flower';
  flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
  flower.style.left = e.clientX + 'px';
  flower.style.top = e.clientY + 'px';
  document.body.appendChild(flower);
  setTimeout(() => flower.remove(), 3000);
});

loadCurrentPoll();
  `;
}

export function getAdminPageHTML(): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - 大街小巷</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { color: #667eea; margin-bottom: 30px; }
    .login-form, .create-form { max-width: 400px; margin: 50px auto; }
    input, textarea {
      width: 100%;
      padding: 12px;
      margin: 10px 0;
      border: 2px solid #eee;
      border-radius: 8px;
      font-size: 14px;
    }
    .btn {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 10px;
    }
    .btn:hover { opacity: 0.9; }
    .btn-danger { background: #dc3545; }
    .poll-item {
      padding: 20px;
      margin: 15px 0;
      border: 1px solid #eee;
      border-radius: 10px;
    }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 管理后台</h1>
    <div id="login-section">
      <div class="login-form">
        <input type="password" id="password" placeholder="请输入管理员密码">
        <button class="btn" onclick="login()">登录</button>
      </div>
    </div>
    <div id="admin-section" class="hidden">
      <button class="btn" onclick="showCreateForm()">创建新选择</button>
      <div id="create-form" class="hidden create-form">
        <h2>创建选择</h2>
        <input type="text" id="title" placeholder="标题">
        <input type="datetime-local" id="deadline">
        <textarea id="options" rows="5" placeholder="选项（每行一个）"></textarea>
        <button class="btn" onclick="createPoll()">创建</button>
        <button class="btn btn-danger" onclick="hideCreateForm()">取消</button>
      </div>
      <div id="polls-list"></div>
    </div>
  </div>
  <script src="/admin.js"></script>
</body>
</html>
  `;
}

export function getAdminPageJS(): string {
  return `
let token = localStorage.getItem('admin_token');

if (token) {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('admin-section').classList.remove('hidden');
  loadPolls();
}

async function login() {
  const password = document.getElementById('password').value;
  try {
    const res = await fetch('/sydqwy/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({password})
    });
    
    if (res.ok) {
      const data = await res.json();
      token = data.token;
      localStorage.setItem('admin_token', token);
      document.getElementById('login-section').classList.add('hidden');
      document.getElementById('admin-section').classList.remove('hidden');
      loadPolls();
    } else {
      alert('密码错误');
    }
  } catch (err) {
    alert('登录失败');
  }
}

async function loadPolls() {
  try {
    const res = await fetch('/sydqwy/polls', {
      headers: {'Authorization': 'Bearer ' + token}
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('admin_token');
        location.reload();
      }
      return;
    }
    
    const polls = await res.json();
    let html = '<h2>所有选择</h2>';
    polls.forEach(poll => {
      html += '<div class="poll-item">';
      html += '<h3>'+poll.title+'</h3>';
      html += '<p>状态：'+poll.status+' | 截止：'+new Date(poll.deadline).toLocaleString('zh-CN')+'</p>';
      html += '<button class="btn btn-danger" onclick="deletePoll(\\''+poll.id+'\\')">删除</button>';
      html += '</div>';
    });
    document.getElementById('polls-list').innerHTML = html;
  } catch (err) {
    console.error(err);
  }
}

function showCreateForm() {
  document.getElementById('create-form').classList.remove('hidden');
}

function hideCreateForm() {
  document.getElementById('create-form').classList.add('hidden');
}

async function createPoll() {
  const title = document.getElementById('title').value;
  const deadline = document.getElementById('deadline').value;
  const options = document.getElementById('options').value.split('\\n').filter(o => o.trim());
  
  if (!title || !deadline || options.length < 2) {
    return alert('请填写完整信息（至少2个选项）');
  }
  
  try {
    const res = await fetch('/sydqwy/polls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({title, deadline, options})
    });
    
    if (res.ok) {
      alert('创建成功');
      hideCreateForm();
      loadPolls();
    } else {
      const err = await res.json();
      alert(err.message || '创建失败');
    }
  } catch (err) {
    alert('创建失败');
  }
}

async function deletePoll(id) {
  if (!confirm('确定要删除这个选择吗？')) return;
  
  try {
    const res = await fetch('/sydqwy/polls/' + id, {
      method: 'DELETE',
      headers: {'Authorization': 'Bearer ' + token}
    });
    
    if (res.ok) {
      alert('删除成功');
      loadPolls();
    } else {
      alert('删除失败');
    }
  } catch (err) {
    alert('删除失败');
  }
}
  `;
}
