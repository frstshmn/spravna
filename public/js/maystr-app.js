/* =====================================================================
   SPRAVNA APP — main Vue entry point
   All rendering uses Vue string templates — no browser HTML parser quirks.
   ===================================================================== */
'use strict';

(function () {
    const { createApp, ref, computed } = Vue;
    const { MModal, MBadge, MAvatar, AppointmentFormBody, OnboardingWizard } = SpravnaComponents;
    const { DashboardPage, SchedulePage, RequestsPage, ArchivePage, ClientsPage, SettingsPage, FinancesPage, AnalyticsPage } = SpravnaPages;

    /* ── Guard: redirect to login if no token ── */
    const token = getToken();
    if (!token) {
        window.location.replace('/login');
        return;
    }

    const api = makeAPI(token);

    /* ── History API routing ── */
    const VALID_PAGES = ['dashboard', 'schedule', 'requests', 'clients', 'finances', 'analytics', 'settings'];

    function getPageFromPath() {
        const segment = window.location.pathname.replace(/^\/app\/?/, '').split('/')[0];
        return VALID_PAGES.includes(segment) ? segment : 'dashboard';
    }

    /* ── PageView: string-template router component ── */
    const PageView = {
        name: 'PageView',
        props: ['page', 'api', 'user'],
        emits: ['navigate', 'count', 'user-updated', 'restart-onboarding'],
        components: { DashboardPage, SchedulePage, RequestsPage, ArchivePage, ClientsPage, SettingsPage, FinancesPage, AnalyticsPage },
        template: [
            '<dashboard-page       v-if="page===\'dashboard\'"  :api="api" :user="user" @navigate="$emit(\'navigate\',$event)"></dashboard-page>',
            '<schedule-page        v-else-if="page===\'schedule\'" :api="api"></schedule-page>',
            '<requests-page        v-else-if="page===\'requests\'" :api="api" @count="$emit(\'count\',$event)"></requests-page>',
            '<clients-page         v-else-if="page===\'clients\'"  :api="api"></clients-page>',
            '<finances-page        v-else-if="page===\'finances\'"  :api="api"></finances-page>',
            '<analytics-page       v-else-if="page===\'analytics\'" :api="api"></analytics-page>',
            '<settings-page        v-else-if="page===\'settings\'" :api="api" :user="user" @user-updated="$emit(\'user-updated\')" @restart-onboarding="$emit(\'restart-onboarding\')"></settings-page>',
        ].join('')
    };

    /* ── Root app — full shell in string template ── */
    const app = createApp({
        components: {
            MModal, MBadge, MAvatar, AppointmentFormBody, OnboardingWizard, PageView,
            DashboardPage, SchedulePage, RequestsPage, ArchivePage, ClientsPage, SettingsPage, FinancesPage, AnalyticsPage
        },
        setup() {
            const page         = ref(getPageFromPath());
            const user         = ref(null);
            const pendingCount = ref(0);
            const loading      = ref(true);

            const pages = [
                { id: 'dashboard', label: 'Дашборд',          icon: 'fa-gauge' },
                { id: 'schedule',  label: 'Розклад',           icon: 'fa-calendar-days' },
                { id: 'requests',  label: 'Запити',            icon: 'fa-inbox' },
                { id: 'clients',   label: 'Клієнти',           icon: 'fa-users' },
                { id: 'finances',  label: 'Фінанси',           icon: 'fa-wallet' },
                { id: 'analytics', label: 'Аналітика',         icon: 'fa-chart-line' },
                { id: 'settings',  label: 'Налаштування',      icon: 'fa-gear' },
            ];

            const pageMeta = {
                dashboard: { title: 'Дашборд',          sub: () => new Date().toLocaleDateString('uk', { weekday: 'long', month: 'long', day: 'numeric' }) },
                schedule:  { title: 'Розклад',           sub: () => 'Керуйте своїми записами' },
                requests:  { title: 'Запити',            sub: () => pendingCount.value > 0 ? pendingCount.value + ' нових' : 'Нових запитів немає' },
                clients:   { title: 'Клієнти',           sub: () => 'База клієнтів та історія' },
                finances:  { title: 'Фінанси',           sub: () => 'Доходи та витрати' },
                analytics: { title: 'Аналітика',         sub: () => 'Аналіз роботи та фінансів' },
                settings:  { title: 'Налаштування',      sub: () => 'Акаунт та параметри' },
            };

            async function init() {
                try {
                    const { data } = await api.get('/auth/me');
                    user.value = data;
                    const { data: rd } = await api.get('/booking-requests', { params: { status: 'pending', per_page: 1 } });
                    pendingCount.value = rd.meta?.total ?? rd.total ?? 0;
                } catch(e) {
                    clearAuth();
                    window.location.href = '/login';
                    return;
                }
                loading.value = false;
            }

            function navigate(p) {
                if (!VALID_PAGES.includes(p)) return;
                page.value = p;
                history.pushState({ page: p }, '', '/app/' + p);
            }

            function logout() {
                api.post('/auth/logout').catch(() => {});
                clearAuth();
                window.location.href = '/login';
            }

            function onUserUpdated() { init(); }

            function onOnboardingDone() {
                if (user.value) user.value.onboarding_completed_at = new Date().toISOString();
            }

            function restartOnboarding() {
                if (user.value) user.value.onboarding_completed_at = null;
            }

            const avatarSrc = computed(() => M.avatarSrc(user.value?.profile));

            window.addEventListener('popstate', () => { page.value = getPageFromPath(); });

            init();

            return { page, user, pendingCount, loading, pages, pageMeta, navigate, logout, onUserUpdated, onOnboardingDone, restartOnboarding, avatarSrc, api };
        },

        /* ── Full app shell — Vue string template (single root) ── */
        template: `
<div id="maystr-root">
<div v-if="loading" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);">
  <div style="text-align:center;">
    <div class="loader-spinner" style="margin:0 auto 12px;"></div>
    <p style="color:var(--text-muted);font-size:11px;letter-spacing:2px;font-weight:700;">SPRAVNA</p>
  </div>
</div>

<!-- Full-page onboarding (replaces app-shell) -->
<onboarding-wizard v-else-if="!user?.onboarding_completed_at" :api="api" @done="onOnboardingDone"></onboarding-wizard>

<div v-else class="app-shell">

  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="brand-logo"><i class="fa fa-asterisk"></i></div>
    </div>
    <nav class="sidebar-nav">
      <button v-for="p in pages" :key="p.id"
        :class="'nav-item' + (page === p.id ? ' active' : '')"
        :data-tip="p.label"
        @click="navigate(p.id)">
        <i :class="'fa ' + p.icon"></i>
        <span v-if="p.id === 'requests' && pendingCount > 0" class="nav-badge">{{ pendingCount }}</span>
      </button>
    </nav>
  </aside>

  <!-- Main content -->
  <div class="main-area">
    <header class="topbar">
      <div class="topbar-greeting">
        <div class="topbar-greeting-name">Привіт, {{ user?.name?.split(' ')[0] ?? '...' }}!</div>
        <div class="topbar-greeting-sub">{{ pageMeta[page]?.sub() }}</div>
      </div>
      <div class="topbar-actions">
        <button class="topbar-btn" @click="navigate('requests')" title="Запити">
          <i class="fa fa-bell"></i>
          <span v-if="pendingCount > 0" class="topbar-btn-dot"></span>
        </button>
        <div class="avatar av-sm" style="background:var(--accent);cursor:pointer;" @click="navigate('settings')">
          <img v-if="avatarSrc" :src="avatarSrc" :alt="user.name">
          <template v-else>{{ user?.name?.charAt(0)?.toUpperCase() ?? '?' }}</template>
        </div>
        <button class="topbar-btn" @click="logout" title="Вийти">
          <i class="fa fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    </header>

    <div class="page-content">
      <page-view
        :page="page"
        :api="api"
        :user="user"
        @navigate="navigate"
        @count="pendingCount=$event"
        @user-updated="onUserUpdated"
        @restart-onboarding="restartOnboarding">
      </page-view>
    </div>
  </div>

  <!-- Mobile bottom nav -->
  <nav class="mobile-nav">
    <button v-for="p in pages" :key="p.id"
      :class="'mob-nav-item' + (page === p.id ? ' active' : '')"
      @click="navigate(p.id)">
      <span style="position:relative;">
        <i :class="'fa ' + p.icon"></i>
        <span v-if="p.id === 'requests' && pendingCount > 0" class="mob-nav-dot"></span>
      </span>
      <span>{{ p.label }}</span>
    </button>
  </nav>

</div>
`
    });

    app.mount('#app');
    document.getElementById('pre-loader').style.display = 'none';

    if (window.location.pathname === '/app' || window.location.pathname === '/app/') {
        history.replaceState({ page: 'dashboard' }, '', '/app/dashboard');
    }
})();
