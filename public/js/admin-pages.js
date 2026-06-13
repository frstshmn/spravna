/* =====================================================================
   SPRAVNA ADMIN — page components
   ref, reactive, computed, onMounted, onUnmounted, watch, nextTick,
   M, MModal, MBadge, MAvatar are declared in maystr-core.js
   ===================================================================== */
'use strict';

/* =====================================================================
   1. DASHBOARD
   ===================================================================== */
const AdminDashboardPage = {
    props: ['api'],
    emits: ['navigate'],
    components: { MBadge, MAvatar },
    setup(props, { emit }) {
        const stats = ref({});
        const registrations = ref([]);
        const planBreakdown = ref({});
        const statusBreakdown = ref({});
        const expiringSoon = ref([]);
        const recentUsers = ref([]);
        const loading = ref(true);
        let chartInstance = null;

        const planRows = computed(() => Object.entries(planBreakdown.value));
        const statusRows = computed(() => Object.entries(statusBreakdown.value));

        function drawChart() {
            const canvas = document.getElementById('admin-reg-chart');
            if (!canvas || !registrations.value.length) return;
            if (chartInstance) chartInstance.destroy();
            chartInstance = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: registrations.value.map(m => m.month),
                    datasets: [{
                        label: 'Реєстрації',
                        data: registrations.value.map(m => m.count),
                        backgroundColor: 'rgba(59,94,71,0.55)',
                        borderRadius: 6,
                        maxBarThickness: 36,
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1a1917', borderColor: 'rgba(0,0,0,0.1)', borderWidth: 1,
                            titleColor: '#ffffff', bodyColor: '#a09890',
                        }
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: '#a09890', font: { size: 11 } } },
                        y: { beginAtZero: true, grid: { color: '#e2ddd6' }, ticks: { color: '#a09890', font: { size: 11 }, precision: 0 } }
                    }
                }
            });
        }

        async function load() {
            loading.value = true;
            try {
                const { data } = await props.api.get('/admin/stats');
                stats.value = data.stats;
                registrations.value = data.registrations_chart;
                planBreakdown.value = data.plan_breakdown;
                statusBreakdown.value = data.status_breakdown;
                expiringSoon.value = data.expiring_soon;
                recentUsers.value = data.recent_users;
                nextTick(drawChart);
            } catch(e) {}
            loading.value = false;
        }

        function goToUsers() { emit('navigate', 'users'); }

        onMounted(load);
        onUnmounted(() => { if (chartInstance) chartInstance.destroy(); });

        return { stats, planRows, statusRows, expiringSoon, recentUsers, loading, goToUsers, M };
    },
    template: `
<div>
  <div v-if="loading" class="empty"><i class="fa fa-spinner fa-spin"></i><p>Завантаження…</p></div>

  <template v-else>
    <div class="dash-stats">
      <div class="stat-card">
        <div class="stat-left">
          <div class="stat-label">Майстрів всього</div>
          <div class="stat-value">{{ stats.total_masters }}</div>
          <div class="stat-trend">+{{ stats.new_this_month }} цього місяця</div>
        </div>
        <div class="stat-right"><div class="stat-icon-wrap" style="background:var(--accent-soft);color:var(--accent);"><i class="fa fa-user-tie"></i></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-left">
          <div class="stat-label">Активні підписки</div>
          <div class="stat-value">{{ stats.active_subscriptions }}</div>
          <div class="stat-trend">{{ stats.trialing }} на триалі</div>
        </div>
        <div class="stat-right"><div class="stat-icon-wrap" style="background:var(--completed-soft);color:var(--completed);"><i class="fa fa-circle-check"></i></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-left">
          <div class="stat-label">Призупинені акаунти</div>
          <div class="stat-value">{{ stats.suspended }}</div>
          <div class="stat-trend">Заблоковано вхід</div>
        </div>
        <div class="stat-right"><div class="stat-icon-wrap" style="background:var(--cancelled-soft);color:var(--cancelled);"><i class="fa fa-ban"></i></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-left">
          <div class="stat-label">Дохід платформи</div>
          <div class="stat-value">{{ M.fmtMoney(stats.total_revenue) }}</div>
          <div class="stat-trend">Завершені сесії</div>
        </div>
        <div class="stat-right"><div class="stat-icon-wrap" style="background:var(--in-progress-soft);color:var(--in-progress);"><i class="fa fa-coins"></i></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-left">
          <div class="stat-label">Клієнтів у системі</div>
          <div class="stat-value">{{ stats.total_clients }}</div>
        </div>
        <div class="stat-right"><div class="stat-icon-wrap" style="background:var(--accent-soft);color:var(--accent);"><i class="fa fa-users"></i></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-left">
          <div class="stat-label">Записів всього</div>
          <div class="stat-value">{{ stats.total_appointments }}</div>
        </div>
        <div class="stat-right"><div class="stat-icon-wrap" style="background:var(--confirmed-soft);color:var(--confirmed);"><i class="fa fa-calendar"></i></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-left">
          <div class="stat-label">Записів сьогодні</div>
          <div class="stat-value">{{ stats.appointments_today }}</div>
        </div>
        <div class="stat-right"><div class="stat-icon-wrap" style="background:var(--pending-soft);color:var(--pending);"><i class="fa fa-calendar-day"></i></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-left">
          <div class="stat-label">Нові майстри</div>
          <div class="stat-value">{{ stats.new_this_month }}</div>
          <div class="stat-trend">цього місяця</div>
        </div>
        <div class="stat-right"><div class="stat-icon-wrap" style="background:var(--no-show-soft);color:var(--no-show);"><i class="fa fa-user-plus"></i></div></div>
      </div>
    </div>

    <div class="grid-2 mb-16">
      <div class="card admin-chart-card">
        <div class="card-title mb-12"><i class="fa fa-chart-column" style="color:var(--accent);margin-right:6px;"></i>Реєстрації майстрів (6 місяців)</div>
        <div class="admin-chart-wrap"><canvas id="admin-reg-chart"></canvas></div>
      </div>
      <div class="card card-body">
        <div v-if="planRows.length">
          <div class="client-detail-section-title">Плани</div>
          <div v-for="[k,v] in planRows" :key="'p'+k" class="admin-breakdown-row">
            <m-badge :status="k"></m-badge><span class="fw-700">{{ v }}</span>
          </div>
        </div>
        <div v-if="statusRows.length" style="margin-top:10px;">
          <div class="client-detail-section-title">Статус підписки</div>
          <div v-for="[k,v] in statusRows" :key="'s'+k" class="admin-breakdown-row">
            <m-badge :status="k"></m-badge><span class="fw-700">{{ v }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fa fa-hourglass-half" style="color:var(--pending);margin-right:6px;"></i>Підписки, що закінчуються</span>
        </div>
        <div class="card-body">
          <div v-if="!expiringSoon.length" class="empty" style="padding:16px 0;"><p>Немає підписок, що закінчуються найближчі 14 днів</p></div>
          <div v-else class="admin-list">
            <div v-for="u in expiringSoon" :key="u.id" class="admin-list-row" style="cursor:pointer;" @click="goToUsers">
              <m-avatar :name="u.name" size="sm"></m-avatar>
              <div class="admin-list-info">
                <div class="admin-list-name truncate">{{ u.name }}</div>
                <div class="admin-list-sub truncate">{{ u.email }}</div>
              </div>
              <div class="admin-list-meta">
                <m-badge :status="u.plan"></m-badge>
                <span class="text-sub text-sm">до {{ M.fmt(u.subscription_ends_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fa fa-user-plus" style="color:var(--accent);margin-right:6px;"></i>Останні реєстрації</span>
        </div>
        <div class="card-body">
          <div v-if="!recentUsers.length" class="empty" style="padding:16px 0;"><p>Поки немає реєстрацій</p></div>
          <div v-else class="admin-list">
            <div v-for="u in recentUsers" :key="u.id" class="admin-list-row" style="cursor:pointer;" @click="goToUsers">
              <m-avatar :name="u.name" size="sm"></m-avatar>
              <div class="admin-list-info">
                <div class="admin-list-name truncate">{{ u.name }}</div>
                <div class="admin-list-sub truncate">{{ u.email }} · {{ u.clients_count }} клієнтів · {{ u.appointments_count }} записів</div>
              </div>
              <div class="admin-list-meta">
                <m-badge :status="u.plan"></m-badge>
                <span class="text-sub text-sm">{{ M.fmt(u.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
</div>`
};

/* =====================================================================
   2. USER FORM (create / edit)
   ===================================================================== */
const UserFormBody = {
    props: { api: Object, existing: Object },
    emits: ['saved', 'cancel'],
    setup(props, { emit }) {
        const saving = ref(false);
        const error = ref('');
        const isEdit = !!props.existing;

        const form = reactive({
            name: props.existing?.name ?? '',
            email: props.existing?.email ?? '',
            password: '',
            role: props.existing?.role ?? 'master',
            specialty: props.existing?.profile?.specialty ?? '',
            plan: props.existing?.plan ?? 'free',
            subscription_status: props.existing?.subscription_status ?? 'trialing',
            subscription_ends_at: props.existing?.subscription_ends_at ? M.localDateStr(props.existing.subscription_ends_at) : '',
            is_active: props.existing?.is_active ?? true,
        });

        async function save() {
            if (!form.name.trim() || !form.email.trim()) {
                error.value = 'Заповніть ім\'я та email';
                return;
            }
            if (!isEdit && form.password.length < 8) {
                error.value = 'Пароль має містити щонайменше 8 символів';
                return;
            }
            saving.value = true; error.value = '';
            const payload = { ...form, subscription_ends_at: form.subscription_ends_at || null };
            if (isEdit && !payload.password) delete payload.password;
            try {
                const res = isEdit
                    ? await props.api.put('/admin/users/' + props.existing.id, payload)
                    : await props.api.post('/admin/users', payload);
                emit('saved', res.data);
            } catch (e) {
                error.value = e.response?.data?.message || 'Не вдалося зберегти';
            }
            saving.value = false;
        }

        return { form, saving, error, isEdit, save };
    },
    template: `
<div class="modal-body">
  <div class="form-row">
    <div class="form-group">
      <label class="label">Ім'я *</label>
      <input v-model="form.name" class="input" placeholder="Повне ім'я">
    </div>
    <div class="form-group">
      <label class="label">Email *</label>
      <input v-model="form.email" class="input" type="email" placeholder="user@example.com">
    </div>
  </div>
  <div class="form-row">
    <div class="form-group">
      <label class="label">{{ isEdit ? 'Новий пароль' : 'Пароль *' }}</label>
      <input v-model="form.password" class="input" type="password" :placeholder="isEdit ? 'Залишити без змін' : 'Щонайменше 8 символів'">
    </div>
    <div class="form-group">
      <label class="label">Роль</label>
      <select v-model="form.role" class="select">
        <option value="master">Майстер</option>
        <option value="admin">Адмін</option>
      </select>
    </div>
  </div>

  <div v-if="form.role === 'master' && !isEdit" class="form-group">
    <label class="label">Спеціальність</label>
    <input v-model="form.specialty" class="input" placeholder="Майстер з татуажу, нігтів…">
  </div>

  <template v-if="form.role === 'master'">
    <div class="form-row">
      <div class="form-group">
        <label class="label">План</label>
        <select v-model="form.plan" class="select">
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
      </div>
      <div class="form-group">
        <label class="label">Статус підписки</label>
        <select v-model="form.subscription_status" class="select">
          <option value="trialing">Триал</option>
          <option value="active">Активна</option>
          <option value="past_due">Заборгованість</option>
          <option value="cancelled">Скасована</option>
          <option value="expired">Завершена</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="label">Підписка дійсна до</label>
      <input v-model="form.subscription_ends_at" class="input" type="date" style="max-width:200px;">
    </div>
  </template>

  <div class="form-group">
    <label class="label">Статус акаунту</label>
    <div class="toggle-wrap">
      <button type="button" :class="'toggle' + (form.is_active ? ' on' : '')" @click="form.is_active = !form.is_active"></button>
      <span class="text-sm">{{ form.is_active ? 'Активний' : 'Призупинено' }}</span>
    </div>
  </div>

  <p v-if="error" style="color:var(--cancelled);font-size:12px;">{{ error }}</p>
</div>
<div class="modal-footer">
  <button class="btn btn-ghost btn-sm" @click="$emit('cancel')">Скасувати</button>
  <button class="btn btn-primary btn-sm" @click="save" :disabled="saving">
    {{ saving ? 'Збереження…' : (isEdit ? 'Зберегти зміни' : 'Створити користувача') }}
  </button>
</div>`
};

/* =====================================================================
   3. USERS
   ===================================================================== */
const AdminUsersPage = {
    props: { api: Object, currentUserId: [Number, String] },
    components: { MBadge, MAvatar, MModal, UserFormBody },
    setup(props) {
        const users = ref([]);
        const meta = ref({ current_page: 1, last_page: 1, total: 0 });
        const loading = ref(false);
        const search = ref('');
        const roleFilter = ref('');
        const planFilter = ref('');
        const statusFilter = ref('');
        const activeFilter = ref('');
        let searchTimer = null;

        const showModal = ref(false);
        const editingUser = ref(null);
        const detail = ref(null);
        const detailLoading = ref(false);

        async function load() {
            loading.value = true;
            try {
                const { data } = await props.api.get('/admin/users', {
                    params: {
                        search: search.value || undefined,
                        role: roleFilter.value || undefined,
                        plan: planFilter.value || undefined,
                        subscription_status: statusFilter.value || undefined,
                        is_active: activeFilter.value === '' ? undefined : activeFilter.value,
                        per_page: 20,
                        page: meta.value.current_page,
                    }
                });
                users.value = data.data;
                meta.value = data.meta ?? { current_page: data.current_page, last_page: data.last_page, total: data.total };
            } catch(e) {}
            loading.value = false;
        }

        function onSearchInput() {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => { meta.value.current_page = 1; load(); }, 350);
        }

        function changePage(p) { meta.value.current_page = p; load(); }

        watch([roleFilter, planFilter, statusFilter, activeFilter], () => { meta.value.current_page = 1; load(); });

        function openCreate() {
            editingUser.value = null;
            detail.value = null;
            showModal.value = true;
        }

        async function openEdit(u) {
            editingUser.value = u;
            detail.value = null;
            showModal.value = true;
            detailLoading.value = true;
            try {
                const { data } = await props.api.get('/admin/users/' + u.id);
                detail.value = data;
                editingUser.value = data.user;
            } catch(e) {}
            detailLoading.value = false;
        }

        function onSaved() {
            showModal.value = false;
            load();
        }

        async function toggleActive(u) {
            if (u.id === props.currentUserId) return;
            try {
                const { data } = await props.api.put('/admin/users/' + u.id, { is_active: !u.is_active });
                u.is_active = data.is_active;
            } catch(e) {
                alert(e.response?.data?.message || 'Не вдалося оновити статус');
            }
        }

        async function remove(u) {
            if (u.id === props.currentUserId) return;
            if (!confirm('Видалити користувача "' + u.name + '" разом з усіма клієнтами, записами та послугами? Цю дію неможливо скасувати.')) return;
            try {
                await props.api.delete('/admin/users/' + u.id);
                load();
            } catch(e) {
                alert(e.response?.data?.message || 'Не вдалося видалити користувача');
            }
        }

        async function loginAs(u) {
            try {
                const { data } = await props.api.post('/admin/users/' + u.id + '/login-as');
                localStorage.setItem('spravna_token', data.token);
                window.open('/app', '_blank');
            } catch(e) {
                alert(e.response?.data?.message || 'Не вдалося увійти в акаунт');
            }
        }

        onMounted(load);

        return {
            users, meta, loading, search, roleFilter, planFilter, statusFilter, activeFilter,
            showModal, editingUser, detail, detailLoading,
            onSearchInput, changePage, openCreate, openEdit, onSaved, toggleActive, remove, loginAs,
            M,
        };
    },
    template: `
<div>
  <div class="flex items-center justify-between mb-16" style="flex-wrap:wrap;gap:10px;">
    <h1>Користувачі</h1>
    <button class="btn btn-primary" @click="openCreate"><i class="fa fa-plus"></i> Новий користувач</button>
  </div>

  <div class="flex gap-8 mb-16" style="flex-wrap:wrap;">
    <div class="topbar-search" style="margin:0;max-width:300px;">
      <i class="fa fa-magnifying-glass topbar-search-icon"></i>
      <input type="text" v-model="search" @input="onSearchInput" placeholder="Пошук за іменем або email…">
    </div>
    <select v-model="roleFilter" class="select" style="width:140px;">
      <option value="">Всі ролі</option>
      <option value="master">Майстри</option>
      <option value="admin">Адміни</option>
    </select>
    <select v-model="planFilter" class="select" style="width:130px;">
      <option value="">Всі плани</option>
      <option value="free">Free</option>
      <option value="pro">Pro</option>
      <option value="premium">Premium</option>
    </select>
    <select v-model="statusFilter" class="select" style="width:170px;">
      <option value="">Всі підписки</option>
      <option value="trialing">Триал</option>
      <option value="active">Активна</option>
      <option value="past_due">Заборгованість</option>
      <option value="cancelled">Скасована</option>
      <option value="expired">Завершена</option>
    </select>
    <select v-model="activeFilter" class="select" style="width:150px;">
      <option value="">Всі акаунти</option>
      <option value="1">Активні</option>
      <option value="0">Призупинені</option>
    </select>
  </div>

  <div class="card">
    <div v-if="loading" class="empty"><i class="fa fa-spinner fa-spin"></i><p>Завантаження…</p></div>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Користувач</th>
            <th>Роль</th>
            <th>План</th>
            <th>Підписка</th>
            <th>Клієнти</th>
            <th>Записи</th>
            <th>Активний</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!users.length">
            <td colspan="8" class="empty" style="text-align:center;padding:32px;">Користувачів не знайдено</td>
          </tr>
          <tr v-for="u in users" :key="u.id" @click="openEdit(u)">
            <td>
              <div class="flex items-center gap-8">
                <m-avatar :name="u.name" size="sm"></m-avatar>
                <div class="min-w-0">
                  <div class="fw-700 truncate">{{ u.name }}</div>
                  <div class="text-muted text-sm truncate">{{ u.email }}</div>
                </div>
              </div>
            </td>
            <td><m-badge :status="u.role"></m-badge></td>
            <td><m-badge :status="u.plan"></m-badge></td>
            <td>
              <m-badge :status="u.subscription_status"></m-badge>
              <div v-if="u.subscription_ends_at" class="text-muted text-sm" style="margin-top:3px;">до {{ M.fmt(u.subscription_ends_at) }}</div>
            </td>
            <td>{{ u.clients_count ?? 0 }}</td>
            <td>{{ u.appointments_count ?? 0 }}</td>
            <td @click.stop>
              <div class="toggle-wrap">
                <button :class="'toggle' + (u.is_active ? ' on' : '')" :disabled="u.id === currentUserId" @click="toggleActive(u)"></button>
              </div>
            </td>
            <td @click.stop>
              <div class="flex gap-6">
                <button v-if="u.role==='master'" class="btn btn-secondary btn-sm btn-icon" @click="loginAs(u)" title="Увійти як цей користувач"><i class="fa fa-right-to-bracket"></i></button>
                <button class="btn btn-danger btn-sm btn-icon" :disabled="u.id === currentUserId" @click="remove(u)" title="Видалити"><i class="fa fa-trash"></i></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="meta.last_page > 1" style="padding:12px 14px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);">
      <button class="btn btn-ghost btn-sm" :disabled="meta.current_page <= 1" @click="changePage(meta.current_page - 1)"><i class="fa fa-chevron-left"></i> Назад</button>
      <span class="text-sub text-sm">Сторінка {{ meta.current_page }} з {{ meta.last_page }} &nbsp;·&nbsp; {{ meta.total }} всього</span>
      <button class="btn btn-ghost btn-sm" :disabled="meta.current_page >= meta.last_page" @click="changePage(meta.current_page + 1)">Далі <i class="fa fa-chevron-right"></i></button>
    </div>
  </div>

  <!-- Create / edit modal -->
  <m-modal :show="showModal" :title="editingUser ? 'Редагувати користувача' : 'Новий користувач'" :subtitle="editingUser ? editingUser.email : 'Створення нового акаунту'" size="lg" icon="user-gear" @close="showModal=false">
    <div v-if="detailLoading" class="empty" style="padding:32px 0;"><i class="fa fa-spinner fa-spin"></i><p>Завантаження…</p></div>
    <template v-else>
      <div v-if="detail" class="modal-body" style="padding-bottom:4px;">
        <div class="grid-3">
          <div class="stat-card" style="padding:12px 14px;">
            <div class="stat-label">Клієнтів</div>
            <div class="stat-value" style="font-size:20px;">{{ detail.stats.clients_count }}</div>
          </div>
          <div class="stat-card" style="padding:12px 14px;">
            <div class="stat-label">Записів</div>
            <div class="stat-value" style="font-size:20px;">{{ detail.stats.appointments_count }}</div>
          </div>
          <div class="stat-card" style="padding:12px 14px;">
            <div class="stat-label">Дохід майстра</div>
            <div class="stat-value" style="font-size:20px;">{{ M.fmtMoney(detail.stats.total_revenue) }}</div>
          </div>
        </div>

        <div class="client-detail-section-title" style="margin-top:14px;">Найближчі записи</div>
        <div v-if="!detail.upcoming_appointments.length" class="text-sub text-sm">Немає запланованих записів</div>
        <div v-else class="admin-appt-list">
          <div v-for="a in detail.upcoming_appointments" :key="'u'+a.id" class="admin-appt-row">
            <span class="admin-appt-date">{{ M.fmtDT(a.scheduled_at) }}</span>
            <span class="admin-appt-client truncate">{{ a.client?.name || '—' }}</span>
            <span class="admin-appt-service truncate">{{ a.service?.name || 'Запис' }}</span>
            <m-badge :status="a.status"></m-badge>
          </div>
        </div>
      </div>

      <user-form-body :api="api" :existing="editingUser" @saved="onSaved" @cancel="showModal=false"></user-form-body>
    </template>
  </m-modal>
</div>`
};

window.SpravnaAdminPages = { AdminDashboardPage, AdminUsersPage };
