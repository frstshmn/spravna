<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Вхід — Spravna Admin</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<link rel="stylesheet" href="/css/maystr.css">
</head>
<body>
<div class="auth-page">
    <div class="auth-box">
        <div class="auth-logo">
            <div class="logo-icon" style="background:#1a1917;"><i class="fa fa-shield-halved"></i></div>
            <div class="logo-name">Spravna Admin</div>
            <p style="font-size:13px;color:var(--text-sub);margin-top:4px;">Панель керування системою</p>
        </div>

        <div id="error-box" style="display:none;" class="auth-error mb-12"></div>

        <form id="loginForm" class="auth-form" novalidate>
            <div class="form-group">
                <label class="label"><i class="fa fa-envelope" style="margin-right:4px;"></i>Електронна пошта</label>
                <input type="email" name="email" class="input" placeholder="admin@spravna.app" required autocomplete="email">
            </div>
            <div class="form-group">
                <label class="label"><i class="fa fa-lock" style="margin-right:4px;"></i>Пароль</label>
                <input type="password" name="password" class="input" placeholder="••••••••" required autocomplete="current-password">
            </div>
            <button type="submit" id="submitBtn" class="btn btn-primary auth-submit">
                <i class="fa fa-arrow-right-to-bracket"></i> Увійти
            </button>
        </form>
    </div>
</div>

<script>
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const err = document.getElementById('error-box');
    const form = new FormData(this);
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Вхід…';
    btn.disabled = true;
    err.style.display = 'none';

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ email: form.get('email'), password: form.get('password') })
        });
        const data = await res.json();
        if (!res.ok) {
            const msg = data.errors?.email?.[0] || data.message || 'Невірний email або пароль';
            err.textContent = msg; err.style.display = 'block';
            btn.innerHTML = '<i class="fa fa-arrow-right-to-bracket"></i> Увійти';
            btn.disabled = false;
            return;
        }
        if (data.user?.role !== 'admin') {
            // Not an admin account — discard the token immediately.
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + data.token, Accept: 'application/json' }
            }).catch(() => {});
            err.textContent = 'Цей акаунт не має прав адміністратора.'; err.style.display = 'block';
            btn.innerHTML = '<i class="fa fa-arrow-right-to-bracket"></i> Увійти';
            btn.disabled = false;
            return;
        }
        localStorage.setItem('spravna_admin_token', data.token);
        localStorage.setItem('spravna_admin_user', JSON.stringify(data.user));
        window.location.href = '/admin';
    } catch(ex) {
        err.textContent = 'Помилка мережі. Спробуйте ще раз.'; err.style.display = 'block';
        btn.innerHTML = '<i class="fa fa-arrow-right-to-bracket"></i> Увійти';
        btn.disabled = false;
    }
});
</script>
</body>
</html>
