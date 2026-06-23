<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Запрошення до студії — Spravna</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<link rel="stylesheet" href="/css/maystr.css">
<script src="/js/vendor/vue.global.prod.js"></script>
</head>
<body style="background:var(--bg-page,#f5f5f0);display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
<script>window.__INVITE_TOKEN__ = "{{ $token }}";</script>
<div id="invite-app">
  <div style="max-width:440px;width:100%;margin:0 auto;padding:16px;">
    <div class="card" style="padding:32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;color:var(--accent,#2d4a3e);">✦</div>
      <div style="font-weight:700;font-size:18px;margin-bottom:24px;color:var(--text);">Spravna</div>

      <div v-if="loading" style="padding:24px 0;color:var(--text-muted);">
        <i class="fa fa-spinner fa-spin"></i> Завантаження…
      </div>

      <div v-else-if="!invite" style="color:var(--cancelled,#ef4444);">
        <i class="fa fa-circle-xmark fa-2x" style="margin-bottom:12px;"></i>
        <p style="margin:0;font-size:14px;">Запрошення не знайдено або вже оброблено.</p>
        <a href="/" style="display:inline-block;margin-top:20px;font-size:13px;color:var(--accent);">На головну</a>
      </div>

      <template v-else>
        <div v-if="invite.studio_photo" style="margin-bottom:16px;">
          <img :src="invite.studio_photo" alt="Studio" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid var(--border);">
        </div>
        <div v-else style="width:72px;height:72px;border-radius:50%;background:var(--accent,#2d4a3e);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;color:#fff;">
          <i class="fa fa-store"></i>
        </div>

        <h1 style="font-size:18px;font-weight:700;margin:0 0 8px;color:var(--text);">{{ invite.studio_name }}</h1>
        <p style="font-size:13px;color:var(--text-muted);margin:0 0 28px;line-height:1.6;">
          Вас запрошено приєднатися до студії як майстра.<br>
          Ваш план буде змінено на <strong>Studio</strong>.
        </p>

        <div v-if="done" style="color:var(--completed,#22c55e);">
          <i class="fa fa-circle-check fa-2x" style="margin-bottom:12px;"></i>
          <p style="margin:0 0 8px;font-weight:600;">{{ doneMessage }}</p>
          <a href="/app/studio" style="display:inline-block;margin-top:16px;font-size:13px;color:var(--accent);">Відкрити студію</a>
        </div>

        <template v-else-if="!hasToken">
          <p style="font-size:13px;color:var(--text-muted);margin:0 0 16px;">Увійдіть в акаунт, щоб прийняти запрошення.</p>
          <a :href="'/login?redirect=/join/' + token" class="btn btn-primary" style="width:100%;justify-content:center;">
            <i class="fa fa-right-to-bracket"></i> Увійти та прийняти
          </a>
        </template>

        <template v-else>
          <p v-if="error" style="color:var(--cancelled,#ef4444);font-size:13px;margin:0 0 12px;">{{ error }}</p>
          <div style="display:flex;gap:10px;">
            <button @click="decline" :disabled="busy" class="btn btn-ghost" style="flex:1;justify-content:center;">
              Відхилити
            </button>
            <button @click="accept" :disabled="busy" class="btn btn-primary" style="flex:1;justify-content:center;">
              <i class="fa fa-check"></i> Прийняти
            </button>
          </div>
        </template>
      </template>
    </div>
    <p style="text-align:center;margin-top:16px;font-size:11px;color:#aaa;">Spravna — CRM для майстрів</p>
  </div>
</div>

@verbatim
<script>
const { createApp, ref, onMounted } = Vue;
createApp({
    setup() {
        const token    = window.__INVITE_TOKEN__ || location.pathname.split('/').pop();
        const loading  = ref(true);
        const invite   = ref(null);
        const hasToken = ref(!!localStorage.getItem('spravna_token'));
        const busy     = ref(false);
        const done     = ref(false);
        const doneMessage = ref('');
        const error    = ref('');

        async function load() {
            try {
                const r = await fetch('/api/studio/invitations/' + token, { headers: { Accept: 'application/json' } });
                if (r.ok) invite.value = await r.json();
            } catch {}
            loading.value = false;
        }

        async function accept() {
            busy.value = true; error.value = '';
            try {
                const tok = localStorage.getItem('spravna_token');
                const r = await fetch('/api/studio/invitations/' + token + '/accept', {
                    method: 'POST',
                    headers: { Accept: 'application/json', Authorization: 'Bearer ' + tok },
                });
                const d = await r.json();
                if (!r.ok) throw new Error(d.error || 'Помилка');
                done.value = true;
                doneMessage.value = d.message;
            } catch(e) { error.value = e.message; }
            busy.value = false;
        }

        async function decline() {
            busy.value = true; error.value = '';
            try {
                await fetch('/api/studio/invitations/' + token + '/decline', {
                    method: 'POST',
                    headers: { Accept: 'application/json' },
                });
                done.value = true;
                doneMessage.value = 'Запрошення відхилено.';
            } catch {}
            busy.value = false;
        }

        onMounted(load);
        return { token, loading, invite, hasToken, busy, done, doneMessage, error, accept, decline };
    }
}).mount('#invite-app');
</script>
@endverbatim
</body>
</html>
