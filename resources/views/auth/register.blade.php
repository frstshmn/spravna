<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register — InkCRM</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-950 text-white min-h-screen flex items-center justify-center p-4">

<div class="w-full max-w-sm">
    <div class="text-center mb-8">
        <a href="{{ route('landing') }}" class="text-2xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
            InkCRM
        </a>
        <p class="text-gray-400 mt-2">Create your master account</p>
    </div>

    <div class="bg-gray-900 border border-white/10 rounded-2xl p-8">
        <div id="error-msg" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"></div>

        <form id="registerForm" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-1.5">Your name</label>
                <input type="text" name="name" required
                    class="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition"
                    placeholder="e.g. Maria Rodriguez">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-1.5">Specialty</label>
                <select name="specialty"
                    class="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition">
                    <option value="">Select your specialty…</option>
                    <option value="tattoo">Tattoo Artist</option>
                    <option value="nails">Nail Technician</option>
                    <option value="brows">Brow Master</option>
                    <option value="lashes">Lash Artist</option>
                    <option value="piercing">Piercer</option>
                    <option value="pmu">Permanent Makeup</option>
                    <option value="hair">Hair Stylist</option>
                    <option value="massage">Massage Therapist</option>
                    <option value="cosmetology">Cosmetologist</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <input type="email" name="email" required
                    class="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <input type="password" name="password" required minlength="8"
                    class="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-1.5">Confirm password</label>
                <input type="password" name="password_confirmation" required
                    class="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition">
            </div>
            <button type="submit" id="submitBtn"
                class="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition mt-2">
                Create account
            </button>
        </form>

        <p class="text-center text-gray-500 text-sm mt-6">
            Already have an account?
            <a href="{{ route('login') }}" class="text-violet-400 hover:text-violet-300">Log in</a>
        </p>
    </div>
</div>

<script>
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const errEl = document.getElementById('error-msg');
    btn.textContent = 'Creating account…';
    btn.disabled = true;
    errEl.classList.add('hidden');

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
            const firstError = Object.values(data.errors || {})[0]?.[0] || data.message || 'Registration failed';
            errEl.textContent = firstError;
            errEl.classList.remove('hidden');
            btn.textContent = 'Create account';
            btn.disabled = false;
            return;
        }
        localStorage.setItem('inkcrm_token', data.token);
        localStorage.setItem('inkcrm_user', JSON.stringify(data.user));
        window.location.href = '/app';
    } catch(err) {
        errEl.textContent = 'Network error. Please try again.';
        errEl.classList.remove('hidden');
        btn.textContent = 'Create account';
        btn.disabled = false;
    }
});
</script>
</body>
</html>
