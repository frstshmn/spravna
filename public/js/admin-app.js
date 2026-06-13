/* =====================================================================
   SPRAVNA ADMIN — main Vue entry point
   ===================================================================== */
'use strict';

(function () {
    const { createApp, ref, computed } = Vue;
    const { MAvatar } = SpravnaComponents;
    const { AdminDashboardPage, AdminUsersPage } = SpravnaAdminPages;

    /* ── Guard: redirect to admin login if no token ── */
    const token = localStorage.getItem('spravna_admin_token');
    if (!token) {
        window.location.replace('/admin/login');
        return;
    }

    /* ── Admin API client (separate token + 401 redirect from the master app) ── */
    function makeAdminAPI(token) {
        const ax = axios.create({
            baseURL: '/api',
            headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' }
        });
        ax.interceptors.response.use(r => r, err => {
            if (err.response?.status === 401) {
                localStorage.removeItem('spravna_admin_token');
                localStorage.removeItem('spravna_admin_user');
                window.location.href = '/admin/login';
            }
            return Promise.reject(err);
        });
        return ax;
    }

    const api = makeAdminAPI(token);

    /* ── History API routing ── */
    const VALID_PAGES = ['dashboard', 'users'];

    function getPageFromPath() {
        const segment = window.location.pathname.replace(/^\/admin\/?/, '').split('/')[0];
        return VALID_PAGES.includes(segment) ? segment : 'dashboard';
    }

    /* ── PageView: string-template router component ── */
    const PageView = {
        name: 'PageView',
        props: ['page', 'api', 'user'],
        components: { AdminDashboardPage, AdminUsersPage },
        template: [
            '<admin-dashboard-page v-if="page===\'dashboard\'" :api="api" @navigate="$emit(\'navigate\',$event)"></admin-dashboard-page>',
            '<admin-users-page     v-else-if="page===\'users\'"  :api="api" :current-user-id="user?.id"></admin-users-page>',
        ].join('')
    };

    /* ── Root app — full shell in string template ── */
    const app = createApp({
        components: { MAvatar, PageView, AdminDashboardPage, AdminUsersPage },
        setup() {
            const page    = ref(getPageFromPath());
            const user    = ref(null);
            const loading = ref(true);

            const pages = [
                { id: 'dashboard', label: 'Дашборд',     icon: 'fa-gauge' },
                { id: 'users',     label: 'Користувачі', icon: 'fa-users' },
            ];

            const pageMeta = {
                dashboard: { title: 'Дашборд',     sub: 'Огляд системи Spravna' },
                users:     { title: 'Користувачі', sub: 'Акаунти, підписки та статистика' },
            };

            async function init() {
                try {
                    const { data } = await api.get('/auth/me');
                    if (data.role !== 'admin') throw new Error('not admin');
                    user.value = data;
                } catch (e) {
                    localStorage.removeItem('spravna_admin_token');
                    localStorage.removeItem('spravna_admin_user');
                    window.location.href = '/admin/login';
                    return;
                }
                loading.value = false;
            }

            function navigate(p) {
                if (!VALID_PAGES.includes(p)) return;
                page.value = p;
                history.pushState({ page: p }, '', '/admin/' + p);
            }

            function logout() {
                api.post('/auth/logout').catch(() => {});
                localStorage.removeItem('spravna_admin_token');
                localStorage.removeItem('spravna_admin_user');
                window.location.href = '/admin/login';
            }

            window.addEventListener('popstate', () => { page.value = getPageFromPath(); });

            init();

            return { page, user, loading, pages, pageMeta, navigate, logout, api };
        },

        template: `
<div id="maystr-root">
<div v-if="loading" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);">
  <div style="text-align:center;">
    <div class="loader-spinner" style="margin:0 auto 12px;"></div>
    <p style="color:var(--text-muted);font-size:11px;letter-spacing:2px;font-weight:700;">SPRAVNA ADMIN</p>
  </div>
</div>

<div v-else class="app-shell">

  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="brand-logo" style="background:#1a1917;"><i class="fa fa-shield-halved"></i></div>
    </div>
    <nav class="sidebar-nav">
      <button v-for="p in pages" :key="p.id"
        :class="'nav-item' + (page === p.id ? ' active' : '')"
        :data-tip="p.label"
        @click="navigate(p.id)">
        <i :class="'fa ' + p.icon"></i>
      </button>
    </nav>
    <div class="sidebar-footer">
      <div class="user-avatar" :title="user ? user.name : ''" style="background:#1a1917;">
        {{ user?.name?.charAt(0)?.toUpperCase() ?? 'A' }}
      </div>
      <button class="btn-logout" @click="logout" title="Вийти">
        <i class="fa fa-arrow-right-from-bracket"></i>
      </button>
    </div>
  </aside>

  <!-- Main content -->
  <div class="main-area">
    <header class="topbar">
      <div class="topbar-greeting">
        <div class="topbar-greeting-name">{{ pageMeta[page]?.title }}</div>
        <div class="topbar-greeting-sub">{{ pageMeta[page]?.sub }}</div>
      </div>
      <div class="topbar-actions">
        <span class="badge" style="background:rgba(26,25,23,0.08);color:var(--text);">
          <i class="fa fa-shield-halved"></i> Admin
        </span>
        <div class="avatar av-sm" style="background:#1a1917;">
          {{ user?.name?.charAt(0)?.toUpperCase() ?? 'A' }}
        </div>
      </div>
    </header>

    <div class="page-content">
      <page-view :page="page" :api="api" :user="user" @navigate="navigate"></page-view>
    </div>
  </div>

  <!-- Mobile bottom nav -->
  <nav class="mobile-nav">
    <button v-for="p in pages" :key="p.id"
      :class="'mob-nav-item' + (page === p.id ? ' active' : '')"
      @click="navigate(p.id)">
      <span style="position:relative;"><i :class="'fa ' + p.icon"></i></span>
      <span>{{ p.label }}</span>
    </button>
  </nav>

</div>
</div>
`
    });

    app.mount('#app');
    document.getElementById('pre-loader').style.display = 'none';

    if (window.location.pathname === '/admin' || window.location.pathname === '/admin/') {
        history.replaceState({ page: 'dashboard' }, '', '/admin/dashboard');
    }
})();
