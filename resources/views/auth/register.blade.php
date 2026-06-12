<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Реєстрація — Spravna</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<link rel="stylesheet" href="/css/maystr.css">
</head>
<body>
<div class="auth-page">
    <div class="auth-box">
        <div class="auth-logo">
            <div class="logo-icon"><i class="fa fa-asterisk"></i></div>
            <div class="logo-name">Spravna</div>
            <p style="font-size:13px;color:var(--text-sub);margin-top:4px;">Створіть свій акаунт майстра</p>
        </div>

        <div id="error-msg" style="display:none;" class="auth-error mb-12"></div>

        <form id="registerForm" class="auth-form" novalidate>
            <div class="form-group">
                <label class="label"><i class="fa fa-user" style="margin-right:4px;"></i>Ваше ім'я</label>
                <input type="text" name="name" class="input" placeholder="напр. Марія Коваленко" required autocomplete="name">
            </div>
            <div class="form-group">
                <label class="label"><i class="fa fa-palette" style="margin-right:4px;"></i>Спеціалізація</label>
                <select name="specialty" class="select">
                    <option value="">Оберіть спеціалізацію…</option>
                    <option value="tattoo">Тату-майстер</option>
                    <option value="nails">Майстер манікюру</option>
                    <option value="brows">Брів-майстер</option>
                    <option value="lashes">Леш-мейкер</option>
                    <option value="piercing">Майстер пірсингу</option>
                    <option value="pmu">Перманентний макіяж</option>
                    <option value="hair">Перукар</option>
                    <option value="massage">Масажист</option>
                    <option value="cosmetology">Косметолог</option>
                    <option value="other">Інше</option>
                </select>
            </div>
            <div class="form-group">
                <label class="label"><i class="fa fa-envelope" style="margin-right:4px;"></i>Електронна пошта</label>
                <input type="email" name="email" class="input" placeholder="you@example.com" required autocomplete="email">
            </div>
            <div class="form-group">
                <label class="label"><i class="fa fa-lock" style="margin-right:4px;"></i>Пароль</label>
                <input type="password" name="password" class="input" placeholder="••••••••" required minlength="8" autocomplete="new-password">
            </div>
            <div class="form-group">
                <label class="label"><i class="fa fa-lock" style="margin-right:4px;"></i>Підтвердіть пароль</label>
                <input type="password" name="password_confirmation" class="input" placeholder="••••••••" required autocomplete="new-password">
            </div>
            <button type="submit" id="submitBtn" class="btn btn-primary auth-submit">
                <i class="fa fa-user-plus"></i> Створити акаунт
            </button>
        </form>

        <p style="text-align:center;font-size:13px;color:var(--text-muted);margin-top:18px;">
            Вже маєте акаунт?
            <a href="{{ route('login') }}" style="color:var(--accent);font-weight:600;">Увійти</a>
        </p>
    </div>
</div>

<script>
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const errEl = document.getElementById('error-msg');
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Створення…';
    btn.disabled = true;
    errEl.style.display = 'none';

    const form = new FormData(this);
    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                name: form.get('name'),
                email: form.get('email'),
                password: form.get('password'),
                password_confirmation: form.get('password_confirmation'),
                specialty: form.get('specialty'),
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            const firstError = Object.values(data.errors || {})[0]?.[0] || data.message || 'Помилка реєстрації';
            errEl.textContent = firstError;
            errEl.style.display = 'block';
            btn.innerHTML = '<i class="fa fa-user-plus"></i> Створити акаунт';
            btn.disabled = false;
            return;
        }
        localStorage.setItem('spravna_token', data.token);
        localStorage.setItem('maystr_user', JSON.stringify(data.user));
        window.location.href = '/app';
    } catch(err) {
        errEl.textContent = 'Помилка мережі. Спробуйте ще раз.';
        errEl.style.display = 'block';
        btn.innerHTML = '<i class="fa fa-user-plus"></i> Створити акаунт';
        btn.disabled = false;
    }
});
</script>
</body>
</html>
