/* =====================================================================
   SPRAVNA PAGES — all 6 page components
   ===================================================================== */
'use strict';
/* ref, reactive, computed, onMounted, watch, nextTick are declared in maystr-core.js */
/* MModal, MBadge, MAvatar, AppointmentFormBody etc. are declared in maystr-core.js */

/* =====================================================================
   1. DASHBOARD
   ===================================================================== */
const DashboardPage = {
    props: ['api', 'user'],
    emits: ['navigate'],
    components: { MModal, MBadge, AppointmentFormBody, ClientFormBody },
    setup(props) {
        const stats = ref({});
        const todayAppts = ref([]);
        const upcoming = ref([]);
        const topServices = ref([]);
        const chart = ref([]);
        const dashExpenses = ref([]);
        const showApptModal = ref(false);
        const editingAppt = ref(null);
        const showClientModal = ref(false);
        const chartInstance = ref(null);
        const now = ref(new Date());
        let nowTimer = null;

        /* ── Today timeline ── */
        const timelineRange = computed(() => {
            let startH = 8, endH = 20;
            todayAppts.value.forEach(a => {
                if (!a.scheduled_at) return;
                const s = new Date(a.scheduled_at);
                const sh = s.getHours() + s.getMinutes() / 60;
                const eh = sh + (a.duration || 60) / 60;
                startH = Math.min(startH, Math.floor(sh));
                endH = Math.max(endH, Math.ceil(eh));
            });
            return { start: startH, end: endH };
        });

        const timelineHours = computed(() => {
            const { start, end } = timelineRange.value;
            const span = end - start;
            const step = span > 9 ? 2 : 1;
            const hrs = [];
            for (let h = start; h <= end; h += step) hrs.push(h);
            return hrs;
        });

        const trackHeight = computed(() => {
            const span = timelineRange.value.end - timelineRange.value.start || 1;
            const px = Math.max(28, Math.min(70, 480 / span));
            return Math.round(span * px);
        });

        function tickPos(h) {
            const { start, end } = timelineRange.value;
            return (h - start) / (end - start) * trackHeight.value;
        }

        /* Strictly stacked, one-per-line timeline: items are positioned by time
           but never allowed to overlap — each block starts no earlier than
           the bottom edge of the previous one. */
        const timeline = computed(() => {
            const { start, end } = timelineRange.value;
            const span = end - start || 1;
            const track = trackHeight.value;
            const MIN_H = 30, GAP = 4;
            const items = todayAppts.value
                .filter(a => a.scheduled_at)
                .map(a => {
                    const s = new Date(a.scheduled_at);
                    const sh = s.getHours() + s.getMinutes() / 60;
                    const dur = (a.duration || 60) / 60;
                    return {
                        a, sh, eh: sh + dur,
                        top: (sh - start) / span * track,
                        height: Math.max((dur / span * track) - GAP, MIN_H),
                    };
                })
                .sort((x, y) => x.sh - y.sh);
            let bottom = 0;
            items.forEach(it => {
                it.top = Math.max(it.top, bottom);
                bottom = it.top + it.height + GAP;
            });
            return { items, height: Math.max(track, bottom - GAP) };
        });

        const nowPos = computed(() => {
            const { start, end } = timelineRange.value;
            const nh = now.value.getHours() + now.value.getMinutes() / 60;
            if (nh < start || nh > end) return null;
            return (nh - start) / (end - start) * trackHeight.value;
        });

        const nowLabel = computed(() => now.value.toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' }));

        function apptTimeLabel(a) {
            const s = new Date(a.scheduled_at);
            const e = new Date(s.getTime() + (a.duration || 60) * 60000);
            const fmt = d => d.toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' });
            return { start: fmt(s), end: fmt(e) };
        }

        /* ── Upcoming list (next 7 days, excluding today's appointments already shown above) ── */
        const upcomingList = computed(() => {
            const todayIds = new Set(todayAppts.value.map(a => a.id));
            return upcoming.value.filter(a => !todayIds.has(a.id)).slice(0, 5);
        });

        function openAppt(a) { editingAppt.value = a; showApptModal.value = true; }
        function newAppt() { editingAppt.value = null; showApptModal.value = true; }
        function onApptSaved() { showApptModal.value = false; load(); }

        function newClient() { showClientModal.value = true; }
        function onClientSaved() { showClientModal.value = false; load(); }

        /* ── Public page widget ── */
        const pubSettings = reactive({ is_public: true, is_accepting_bookings: true });
        const pubLinkCopied = ref(false);

        watch(() => props.user?.profile, (profile) => {
            if (!profile) return;
            pubSettings.is_public = !!profile.is_public;
            pubSettings.is_accepting_bookings = !!profile.is_accepting_bookings;
        }, { immediate: true });

        function copyPublicLink() {
            const slug = props.user?.profile?.slug || '';
            const url = window.location.origin + '/master/' + slug;
            navigator.clipboard?.writeText(url);
            pubLinkCopied.value = true;
            setTimeout(() => pubLinkCopied.value = false, 2000);
        }

        async function togglePubSetting(key) {
            pubSettings[key] = !pubSettings[key];
            try {
                await props.api.put('/profile', { [key]: pubSettings[key] });
            } catch (e) {
                pubSettings[key] = !pubSettings[key];
            }
        }

        /* chart */
        function drawChart() {
            const canvas = document.getElementById('revenue-chart');
            if (!canvas || !chart.value.length) return;
            if (chartInstance.value) chartInstance.value.destroy();
            chartInstance.value = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: chart.value.map(m => m.month),
                    datasets: [{
                        label: 'Revenue',
                        data: chart.value.map(m => m.revenue),
                        backgroundColor: 'rgba(59,94,71,0.08)',
                        borderColor: '#3b5e47',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#3b5e47',
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: {
                        backgroundColor: '#1a1917', borderColor: 'rgba(0,0,0,0.1)', borderWidth: 1,
                        titleColor: '#ffffff', bodyColor: '#a09890',
                        callbacks: { label: ctx => ' $' + ctx.parsed.y.toLocaleString() }
                    }},
                    scales: {
                        x: { grid: { display: false }, ticks: { color: '#a09890', font: { size: 11 } } },
                        y: { grid: { color: '#e2ddd6' }, ticks: { color: '#a09890', font: { size: 11 }, callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(0)+'k' : v) } }
                    }
                }
            });
        }

        async function load() {
            try {
                const now2 = new Date();
                const expFrom = new Date(now2.getFullYear(), now2.getMonth(), 1).toISOString().split('T')[0];
                const expTo = new Date(now2.getFullYear(), now2.getMonth() + 1, 0).toISOString().split('T')[0];
                const [dash, exp] = await Promise.all([
                    props.api.get('/dashboard'),
                    props.api.get('/expenses', { params: { from: expFrom, to: expTo } }).catch(() => ({ data: [] })),
                ]);
                stats.value = dash.data.stats;
                todayAppts.value = dash.data.today_appointments;
                upcoming.value = dash.data.upcoming_appointments;
                topServices.value = dash.data.top_services || [];
                chart.value = dash.data.revenue_chart;
                dashExpenses.value = exp.data.slice(0, 5);
                nextTick(drawChart);
            } catch(e) {}
        }

        onMounted(() => {
            load();
            now.value = new Date();
            nowTimer = setInterval(() => { now.value = new Date(); }, 60000);
        });
        onUnmounted(() => { if (nowTimer) clearInterval(nowTimer); });

        const dashView = ref('today');

        return {
            stats, todayAppts, upcoming, upcomingList, topServices, chart,
            showApptModal, editingAppt, openAppt, newAppt, onApptSaved,
            showClientModal, newClient, onClientSaved,
            timelineRange, timelineHours, timeline, tickPos, trackHeight, nowPos, nowLabel, apptTimeLabel,
            pubSettings, pubLinkCopied, copyPublicLink, togglePubSetting,
            dashView, dashExpenses, load,
        };
    },
    template: `
<div>
  <!-- Top row: combined today/upcoming card + key counters -->
  <div class="dash-top-row">
    <!-- Combined today timeline / upcoming sessions card -->
    <div class="card">
      <div class="card-header">
        <div class="dash-view-toggle">
          <button :class="'dvt-btn' + (dashView==='today' ? ' active' : '')" @click="dashView='today'">
            <i class="fa fa-clock"></i> Сьогодні
          </button>
          <button :class="'dvt-btn' + (dashView==='upcoming' ? ' active' : '')" @click="dashView='upcoming'">
            <i class="fa fa-calendar-week"></i> Найближчі
          </button>
        </div>
        <button class="btn btn-secondary btn-icon" @click="newAppt" title="Новий запис"><i class="fa fa-plus"></i></button>
      </div>
      <div class="card-body">

        <!-- Today view -->
        <template v-if="dashView==='today'">
          <div v-if="!todayAppts.length" class="empty" style="padding:20px 0;">
            <i class="fa fa-calendar-xmark"></i>
            <p>Сьогодні немає записів</p>
          </div>
          <div v-else class="day-timeline-v">
            <div class="day-timeline-ruler-v" :style="{height: timeline.height + 'px'}">
              <span v-for="h in timelineHours" :key="h" class="day-timeline-tick-v" :style="{top: tickPos(h) + 'px'}">{{ h }}:00</span>
              <span v-for="it in timeline.items" :key="'s'+it.a.id" class="day-timeline-start-label-v" :style="{top: it.top + 'px'}">
                {{ new Date(it.a.scheduled_at).toLocaleTimeString('uk',{hour:'2-digit',minute:'2-digit'}) }}
              </span>
            </div>
            <div class="day-timeline-track-v" :style="{height: timeline.height + 'px'}">
              <div v-for="h in timelineHours" :key="'g'+h" class="day-timeline-gridline-v" :style="{top: tickPos(h) + 'px'}"></div>
              <div v-if="nowPos !== null" class="day-timeline-now-v" :style="{top: nowPos + 'px'}">
                <span class="day-timeline-now-label-v">{{ nowLabel }}</span>
              </div>
              <div v-for="it in timeline.items" :key="it.a.id" class="day-timeline-block-v"
                :style="{top: it.top + 'px', height: it.height + 'px', left: 0, width: 'calc(100% - 6px)', background: it.a.service?.color || 'var(--accent)'}"
                :title="(it.a.client?.name || '') + ' — ' + (it.a.service?.name || 'Запис')"
                @click="openAppt(it.a)">
                <span class="dtb-time">{{ new Date(it.a.scheduled_at).toLocaleTimeString('uk',{hour:'2-digit',minute:'2-digit'}) }}</span>
                <span class="dtb-name truncate">{{ it.a.client?.name }}</span>
              </div>
            </div>
          </div>
          <div v-if="todayAppts.length" class="day-timeline-compact-v">
            <div v-for="it in timeline.items" :key="'c'+it.a.id" class="day-timeline-compact-row" @click="openAppt(it.a)">
              <div class="dtc-time">
                <span class="dtc-time-start">{{ apptTimeLabel(it.a).start }}</span>
                <span class="dtc-time-end">{{ apptTimeLabel(it.a).end }}</span>
              </div>
              <span class="dtc-bar" :style="{background: it.a.service?.color || 'var(--accent)'}"></span>
              <div class="dtc-info">
                <div class="dtc-name truncate">{{ it.a.client?.name }}</div>
                <div class="dtc-sub truncate">{{ it.a.service?.name || 'Запис' }}</div>
              </div>
              <m-badge :status="it.a.status"></m-badge>
            </div>
          </div>
        </template>

        <!-- Upcoming view -->
        <template v-else>
          <div v-if="!upcomingList.length" class="empty" style="padding:20px 0;">
            <i class="fa fa-calendar"></i><p>Немає майбутніх записів</p>
          </div>
          <template v-else>
            <div class="upcoming-header">
              <span class="uh-time">Час</span>
              <span class="uh-dot"></span>
              <span class="uh-client">Клієнт</span>
              <span class="uh-extra">Контакти</span>
              <span class="uh-price">Сума</span>
              <span class="uh-status">Статус</span>
            </div>
            <div v-for="a in upcomingList" :key="a.id" class="upcoming-row" style="cursor:pointer;" @click="openAppt(a)">
              <span class="tl-time">{{ new Date(a.scheduled_at).toLocaleDateString('uk',{month:'short',day:'numeric'}) }}<br>{{ new Date(a.scheduled_at).toLocaleTimeString('uk',{hour:'2-digit',minute:'2-digit'}) }}</span>
              <span class="tl-dot" :style="{background: a.service?.color || 'var(--accent)'}"></span>
              <div class="tl-body">
                <div class="tl-name truncate">{{ a.client?.name }}</div>
                <div class="tl-svc truncate">{{ a.service?.name || 'Запис' }}</div>
              </div>
              <div class="upcoming-extra">
                <div class="upcoming-phone" v-if="a.client?.phone"><i class="fa fa-phone"></i> {{ a.client.phone }}</div>
                <div class="upcoming-duration" v-if="a.duration"><i class="fa fa-hourglass-half"></i> {{ a.duration }} хв</div>
              </div>
              <div class="upcoming-price" v-if="a.price">₴{{ Number(a.price).toLocaleString() }}</div>
              <div class="upcoming-status"><m-badge :status="a.status"></m-badge></div>
            </div>
            <div style="padding:10px 0 2px;text-align:right;">
              <button class="btn btn-ghost btn-sm" @click="$emit('navigate','schedule')">Всі записи <i class="fa fa-arrow-right"></i></button>
            </div>
          </template>
        </template>

      </div>
    </div>

    <!-- Counters column -->
    <div class="flex flex-col gap-16">
      <div class="dash-create-row flex-1">
        <button class="dash-create-btn dash-create-btn-primary" @click="newAppt">
          <span class="dcb-icon"><i class="fa fa-feather-pointed"></i></span>
          <span class="dcb-label">
            <span class="dcb-title">Створити сеанс</span>
            <span class="dcb-sub">Новий запис</span>
          </span>
        </button>
        <button class="dash-create-btn dash-create-btn-secondary" @click="newClient">
          <span class="dcb-icon"><i class="fa fa-user-plus"></i></span>
          <span class="dcb-label">
            <span class="dcb-title">Додати клієнта</span>
            <span class="dcb-sub">Нова картка</span>
          </span>
        </button>
      </div>

      <!-- Today's sessions count -->
      <div class="stat-card flex-1" style="cursor:pointer;" @click="$emit('navigate','schedule')">
        <div class="stat-left">
          <div class="stat-label">Сесій сьогодні</div>
          <div class="stat-value">{{ todayAppts.length }}</div>
          <div class="stat-trend">{{ stats.month_sessions ?? 0 }} завершено цього місяця</div>
        </div>
        <div class="stat-right">
          <div class="stat-icon-wrap" style="background:var(--accent-soft);color:var(--accent);">
            <i class="fa fa-calendar-day"></i>
          </div>
        </div>
      </div>

      <!-- Pending requests -->
      <div class="stat-card stat-card-dark flex-1" style="cursor:pointer;" @click="$emit('navigate','requests')">
        <div class="stat-left">
          <div class="stat-label">Запити очікують</div>
          <div class="stat-value">{{ stats.pending_requests ?? 0 }}</div>
          <div class="stat-trend">Потребують відповіді</div>
        </div>
        <div class="stat-right">
          <div class="stat-icon-wrap" style="background:rgba(255,255,255,0.15);color:#fff;">
            <i class="fa fa-bell"></i>
          </div>
        </div>
      </div>

      <!-- Public page -->
      <div class="stat-card dash-pubpage flex-1">
        <div class="dash-pubpage-head">
          <div class="stat-label">Публічна сторінка</div>
          <div class="stat-icon-wrap" style="background:var(--accent-soft);color:var(--accent);">
            <i class="fa fa-globe"></i>
          </div>
        </div>
        <button class="dash-pubpage-copy" @click="copyPublicLink">
          <i :class="pubLinkCopied ? 'fa fa-check' : 'fa fa-link'"></i>
          {{ pubLinkCopied ? 'Скопійовано!' : 'Копіювати посилання' }}
        </button>
        <div class="dash-pubpage-toggles">
          <div class="toggle-wrap">
            <button :class="'toggle' + (pubSettings.is_public ? ' on' : '')" @click="togglePubSetting('is_public')"></button>
            <span>Сторінка {{ pubSettings.is_public ? 'активна' : 'прихована' }}</span>
          </div>
          <div class="toggle-wrap">
            <button :class="'toggle' + (pubSettings.is_accepting_bookings ? ' on' : '')" @click="togglePubSetting('is_accepting_bookings')"></button>
            <span>{{ pubSettings.is_accepting_bookings ? 'Приймає' : 'Не приймає' }} запити</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Expenses column -->
    <div class="card dash-expenses-card">
      <div class="card-header">
        <span class="card-title"><i class="fa fa-receipt" style="color:var(--cancelled);margin-right:6px;"></i>Витрати цього місяця</span>
        <button class="btn btn-ghost btn-sm btn-icon" @click="$emit('navigate','finances')" title="Всі фінанси"><i class="fa fa-arrow-right"></i></button>
      </div>
      <div v-if="!dashExpenses.length" class="empty" style="padding:20px 0;font-size:13px;">
        <i class="fa fa-receipt"></i><p>Витрат немає</p>
      </div>
      <div v-else class="dash-exp-list">
        <div v-for="e in dashExpenses" :key="e.id" class="dash-exp-row">
          <span class="dash-exp-dot" :style="{background: {rent:'#f59e0b',materials:'#3b82f6',ads:'#8b5cf6',equipment:'#10b981',subscription:'#06b6d4',other:'#6b7280'}[e.category]||'#6b7280'}"></span>
          <div class="dash-exp-info">
            <div class="dash-exp-name truncate">{{ e.description || {rent:'Оренда',materials:'Матеріали',ads:'Реклама',equipment:'Обладнання',subscription:'Підписка',other:'Інше'}[e.category] || e.category }}</div>
            <div class="dash-exp-date">{{ new Date(e.date).toLocaleDateString('uk',{day:'numeric',month:'short'}) }}</div>
          </div>
          <span class="dash-exp-amount">₴{{ Number(e.amount).toLocaleString() }}</span>
        </div>
        <div class="dash-exp-total">
          <span>Разом</span>
          <span>₴{{ dashExpenses.reduce((s,e)=>s+Number(e.amount),0).toLocaleString() }}</span>
        </div>
      </div>
    </div>

  </div>

  <!-- Top services -->
  <div class="card" v-if="topServices.length">
    <div class="card-header">
      <span class="card-title"><i class="fa fa-ranking-star" style="color:var(--accent);margin-right:6px;"></i>Топ послуг цього місяця</span>
    </div>
    <div class="card-body" style="display:flex;flex-direction:column;gap:10px;">
      <div v-for="s in topServices" :key="s.service_id" class="top-svc-row">
        <span class="top-svc-dot" :style="{background: s.service?.color || 'var(--accent)'}"></span>
        <span class="top-svc-name truncate">{{ s.service?.name || '—' }}</span>
        <div class="top-svc-bar-wrap">
          <div class="top-svc-bar" :style="{width: (s.count / topServices[0].count * 100) + '%', background: s.service?.color || 'var(--accent)'}"></div>
        </div>
        <span class="top-svc-count">{{ s.count }} {{ s.count === 1 ? 'сесія' : 'сесій' }}</span>
        <span class="top-svc-revenue">₴{{ Number(s.revenue).toLocaleString() }}</span>
      </div>
    </div>
  </div>

  <!-- Appointment modal -->
  <m-modal :show="showApptModal" :title="editingAppt ? 'Запис: ' + (editingAppt.client?.name || '') : 'Новий сеанс'" :subtitle="editingAppt ? 'Редагування запису' : 'Заплануйте новий запис для клієнта'" icon="calendar-plus" size="lg" @close="showApptModal=false">
    <appointment-form-body :api="api" :existing="editingAppt" @saved="onApptSaved" @cancel="showApptModal=false"></appointment-form-body>
  </m-modal>

  <!-- New client modal -->
  <m-modal :show="showClientModal" title="Новий клієнт" subtitle="Створіть картку клієнта з повною інформацією" icon="user-plus" size="sm" @close="showClientModal=false">
    <client-form-body :api="api" @saved="onClientSaved" @cancel="showClientModal=false"></client-form-body>
  </m-modal>
</div>`,
};

/* =====================================================================
   2. SCHEDULE
   ===================================================================== */
const PX_PER_MIN = 0.8; // 24px per 30-minute slot

const SchedulePage = {
    props: ['api'],
    components: { MModal, MBadge, AppointmentFormBody, RespondFormBody },
    setup(props) {
        const view = ref('week');
        const currentDate = ref(new Date());
        const appointments = ref([]);
        const bookingRequests = ref([]);
        const showRequests = ref(true);
        const workingHours = ref([]);
        const showModal = ref(false);
        const modalTitle = ref('');
        const editingAppt = ref(null);
        const newApptDate = ref('');
        const newApptHour = ref(9);
        const newApptMinute = ref(0);
        const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8–20
        const halfSlots = hours.flatMap(h => [{ hour: h, minute: 0 }, { hour: h, minute: 30 }]);
        const gridHeight = halfSlots.length * 24;
        const gridStartMin = hours[0] * 60;

        /* ── Week helpers ── */
        function getWeekStart(d) {
            const dt = new Date(d);
            const day = (dt.getDay() + 6) % 7;
            dt.setDate(dt.getDate() - day); dt.setHours(0, 0, 0, 0);
            return dt;
        }
        const weekStart = computed(() => getWeekStart(currentDate.value));
        const localDateStr = M.localDateStr;
        const weekDays = computed(() => Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart.value); d.setDate(d.getDate() + i);
            const today = new Date();
            return {
                date: localDateStr(d),
                label: d.toLocaleDateString('uk', { weekday: 'short' }),
                num: d.getDate(),
                isToday: d.toDateString() === today.toDateString(),
            };
        }));
        const weekLabel = computed(() => {
            const s = weekDays.value[0], e = weekDays.value[6];
            // Parse local date string directly to avoid off-by-one from UTC conversion
            const parseLocal = str => { const [y,m,d] = str.split('-'); return new Date(+y, +m-1, +d); };
            return parseLocal(s.date).toLocaleDateString('uk', { month: 'short', day: 'numeric' }) + ' – ' + parseLocal(e.date).toLocaleDateString('uk', { month: 'short', day: 'numeric', year: 'numeric' });
        });
        function prevWeek() { const d = new Date(currentDate.value); d.setDate(d.getDate() - 7); currentDate.value = d; loadAppointments(); }
        function nextWeek() { const d = new Date(currentDate.value); d.setDate(d.getDate() + 7); currentDate.value = d; loadAppointments(); }
        function prevMonth() { currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1); loadAppointments(); }
        function nextMonth() { currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1); loadAppointments(); }

        function dayAppts(date) {
            return appointments.value.filter(a => a.scheduled_at && localDateStr(new Date(a.scheduled_at)) === date);
        }

        function apptStyle(a) {
            const start = new Date(a.scheduled_at);
            const startMin = start.getHours() * 60 + start.getMinutes();
            const top = (startMin - gridStartMin) * PX_PER_MIN;
            const height = (a.duration || 60) * PX_PER_MIN;
            return { top: Math.max(top, 0) + 'px', height: Math.max(height, 20) + 'px' };
        }

        function apptTimeRange(a) {
            const start = new Date(a.scheduled_at);
            const end = new Date(start.getTime() + (a.duration || 60) * 60000);
            return M.fmtTime(start) + '–' + M.fmtTime(end);
        }

        function apptTypeLabel(a) {
            if (a.type === 'block') return '';
            return a.service?.name || '';
        }

        function apptOverlaps(a, date) {
            const start = new Date(a.scheduled_at).getTime();
            const end = start + (a.duration || 60) * 60000;
            return dayAppts(date).some(b => {
                if (b.id === a.id) return false;
                const bStart = new Date(b.scheduled_at).getTime();
                const bEnd = bStart + (b.duration || 60) * 60000;
                return start < bEnd && end > bStart;
            });
        }

        /* ── Pointer Events drag (mouse + touch unified) ── */
        const draggingId = ref(null);
        const draggingDuration = ref(60);
        const dropPreview = ref(null);
        let _ptrDrag = null;

        function _getDayColAtPoint(x, y) {
            const els = document.elementsFromPoint(x, y);
            for (const el of els) {
                const col = el.closest('.week-day-col[data-date]');
                if (col) return col;
            }
            return null;
        }

        function _snapMinutes(colEl, clientY) {
            const rect = colEl.getBoundingClientRect();
            const offsetY = clientY - rect.top;
            let minutes = gridStartMin + offsetY / PX_PER_MIN;
            return Math.max(gridStartMin, Math.round(minutes / 15) * 15);
        }

        function onApptPointerDown(e, a) {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            _ptrDrag = { id: a.id, appt: a, startX: e.clientX, startY: e.clientY, moved: false, duration: a.duration || 60 };
        }

        function onApptPointerMove(e) {
            if (!_ptrDrag) return;
            const dx = e.clientX - _ptrDrag.startX;
            const dy = e.clientY - _ptrDrag.startY;
            if (!_ptrDrag.moved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
                _ptrDrag.moved = true;
                draggingId.value = _ptrDrag.id;
                draggingDuration.value = _ptrDrag.duration;
            }
            if (!_ptrDrag.moved) return;
            const col = _getDayColAtPoint(e.clientX, e.clientY);
            if (col) {
                const minutes = _snapMinutes(col, e.clientY);
                dropPreview.value = { date: col.dataset.date, top: (minutes - gridStartMin) * PX_PER_MIN, height: _ptrDrag.duration * PX_PER_MIN };
            } else {
                dropPreview.value = null;
            }
        }

        async function onApptPointerUp(e, a) {
            if (!_ptrDrag || _ptrDrag.id !== a.id) { _ptrDrag = null; return; }
            const drag = _ptrDrag;
            _ptrDrag = null;
            draggingId.value = null;
            dropPreview.value = null;
            if (!drag.moved) { openEdit(drag.appt); return; }
            const col = _getDayColAtPoint(e.clientX, e.clientY);
            if (!col) return;
            const minutes = _snapMinutes(col, e.clientY);
            const hour = Math.floor(minutes / 60), minute = minutes % 60;
            const scheduled_at = `${col.dataset.date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            const prev = drag.appt.scheduled_at;
            drag.appt.scheduled_at = scheduled_at;
            try {
                await props.api.put(`/appointments/${drag.appt.id}`, { scheduled_at });
            } catch (err) {
                drag.appt.scheduled_at = prev;
            }
        }

        function onApptPointerCancel() {
            _ptrDrag = null;
            draggingId.value = null;
            dropPreview.value = null;
        }

        /* ── Current time marker ── */
        const now = ref(new Date());
        let nowTimer = null;
        onMounted(() => { nowTimer = setInterval(() => { now.value = new Date(); }, 60000); });
        onUnmounted(() => clearInterval(nowTimer));
        function nowLineVisible() {
            const mins = now.value.getHours() * 60 + now.value.getMinutes();
            return mins >= gridStartMin && mins <= (hours[hours.length - 1] + 1) * 60;
        }
        function nowLineStyle() {
            const mins = now.value.getHours() * 60 + now.value.getMinutes();
            return { top: ((mins - gridStartMin) * PX_PER_MIN) + 'px' };
        }
        function nowTimeLabel() {
            return String(now.value.getHours()).padStart(2, '0') + ':' + String(now.value.getMinutes()).padStart(2, '0');
        }

        /* ── Day start/end boundary markers ── */
        function slotEdgeClass(dayIdx, idx) {
            const slot = halfSlots[idx];
            if (isOffHours(dayIdx, slot.hour)) return '';
            const prev = halfSlots[idx - 1];
            const next = halfSlots[idx + 1];
            let cls = '';
            if (idx === 0 || isOffHours(dayIdx, prev.hour)) cls += ' day-start';
            if (idx === halfSlots.length - 1 || isOffHours(dayIdx, next.hour)) cls += ' day-end';
            return cls;
        }

        /* ── Booking requests (dashed blocks) ── */
        function dayRequests(date) {
            if (!showRequests.value) return [];
            return bookingRequests.value.filter(r => r.preferred_time && r.preferred_date && localDateStr(new Date(r.preferred_date)) === date);
        }

        function requestStyle(r) {
            const [hh, mm] = r.preferred_time.split(':').map(Number);
            const startMin = hh * 60 + (mm || 0);
            const top = (startMin - gridStartMin) * PX_PER_MIN;
            const duration = r.service?.duration || 60;
            const height = duration * PX_PER_MIN;
            return { top: Math.max(top, 0) + 'px', height: Math.max(height, 20) + 'px' };
        }

        async function loadBookingRequests() {
            try {
                const { data } = await props.api.get('/booking-requests', { params: { status: 'pending', per_page: 100 } });
                bookingRequests.value = data.data ?? data;
            } catch(e) {}
        }

        /* ── Booking request modal ── */
        const showRespondModal = ref(false);
        const selectedRequest = ref(null);
        function openRequest(r) { selectedRequest.value = r; showRespondModal.value = true; }
        function onResponded() { showRespondModal.value = false; loadBookingRequests(); loadAppointments(); }

        /* ── Prep/lunch automation ── */
        const prepDuration = ref(parseInt(localStorage.getItem('spravna_prep_duration') || '15'));
        const prepAutoEnabled = ref(localStorage.getItem('spravna_prep_auto') === '1');
        const prepApplying = ref(false);
        watch(prepDuration, v => localStorage.setItem('spravna_prep_duration', v));
        watch(prepAutoEnabled, v => localStorage.setItem('spravna_prep_auto', v ? '1' : '0'));

        function hasPrepBefore(a) {
            const start = new Date(a.scheduled_at).getTime();
            return appointments.value.some(b => b.type === 'block' && new Date(b.scheduled_at).getTime() + (b.duration || 0) * 60000 === start);
        }
        function sessionsWithoutPrep() {
            return appointments.value.filter(a => a.type !== 'block' && !hasPrepBefore(a));
        }
        async function createPrepBefore(appt, duration) {
            const start = new Date(appt.scheduled_at);
            const prepStart = new Date(start.getTime() - duration * 60000);
            try {
                await props.api.post('/appointments', {
                    type: 'block', title: 'Підготовка',
                    scheduled_at: M.toLocalInput(prepStart),
                    duration,
                });
            } catch (e) {}
        }
        async function applyPrepToWeek() {
            const missing = sessionsWithoutPrep();
            if (!missing.length) return;
            prepApplying.value = true;
            for (const a of missing) await createPrepBefore(a, prepDuration.value);
            await loadAppointments();
            prepApplying.value = false;
        }
        async function removeAutoPrep() {
            const blocks = appointments.value.filter(a => a.type === 'block' && a.title === 'Підготовка');
            if (!blocks.length) return;
            prepApplying.value = true;
            for (const b of blocks) {
                try { await props.api.delete(`/appointments/${b.id}`); } catch (e) {}
            }
            await loadAppointments();
            prepApplying.value = false;
        }

        /* ── Auto-populate recurring slots ── */
        const showAutoPopulate = ref(false);
        const autoPopClients = ref([]);
        const autoPopulating = ref(false);
        const autoPopProgress = reactive({ current: 0, total: 0 });
        const autoPopForm = reactive({
            client_id: '', weekday: 1, time: '10:00',
            duration: 60, service_id: '', price: '', weeks: 4,
        });

        async function openAutoPopulate() {
            try {
                const { data } = await props.api.get('/clients', { params: { per_page: 200 } });
                autoPopClients.value = data.data ?? data;
            } catch(e) {}
            showAutoPopulate.value = true;
        }

        async function submitAutoPopulate() {
            if (!autoPopForm.client_id || !autoPopForm.weeks) return;
            autoPopulating.value = true;
            const [h, m] = autoPopForm.time.split(':').map(Number);
            const jsDay = autoPopForm.weekday === 7 ? 0 : autoPopForm.weekday;
            const base = new Date();
            base.setHours(h, m, 0, 0);
            while (base.getDay() !== jsDay) { base.setDate(base.getDate() + 1); }
            autoPopProgress.current = 0; autoPopProgress.total = autoPopForm.weeks;
            for (let w = 0; w < autoPopForm.weeks; w++) {
                const d = new Date(base);
                d.setDate(base.getDate() + w * 7);
                d.setHours(h, m, 0, 0);
                try {
                    await props.api.post('/appointments', {
                        client_id: autoPopForm.client_id,
                        service_id: autoPopForm.service_id || undefined,
                        scheduled_at: M.toLocalInput(d),
                        duration: autoPopForm.duration,
                        price: autoPopForm.price || undefined,
                        status: 'confirmed',
                    });
                } catch(e) {}
                autoPopProgress.current = w + 1;
            }
            autoPopulating.value = false;
            showAutoPopulate.value = false;
            loadAppointments();
        }

        function isOffHours(dayIdx, hour) {
            if (!workingHours.value.length) return false;
            const wh = workingHours.value.find(w => w.day_of_week === (dayIdx + 1) % 7);
            if (!wh || !wh.is_working) return true;
            const start = parseInt(wh.start_time?.slice(0, 2) || '9');
            const end = parseInt(wh.end_time?.slice(0, 2) || '18');
            return hour < start || hour >= end;
        }

        /* ── Month helpers ── */
        const monthLabel = computed(() => currentDate.value.toLocaleDateString('uk', { month: 'long', year: 'numeric' }));
        const monthDays = computed(() => {
            const y = currentDate.value.getFullYear(), mo = currentDate.value.getMonth();
            const first = (new Date(y, mo, 1).getDay() + 6) % 7;
            const daysIn = new Date(y, mo + 1, 0).getDate();
            const daysPrev = new Date(y, mo, 0).getDate();
            const cells = [];
            for (let i = first - 1; i >= 0; i--) cells.push({ d: daysPrev - i, cur: false, date: null });
            const today = new Date();
            for (let i = 1; i <= daysIn; i++) {
                const date = localDateStr(new Date(y, mo, i));
                const isToday = i === today.getDate() && y === today.getFullYear() && mo === today.getMonth();
                cells.push({ d: i, cur: true, date, isToday });
            }
            while (cells.length < 42) cells.push({ d: cells.length - daysIn - first + 1, cur: false, date: null });
            return cells;
        });

        function monthAppts(date) {
            if (!date) return [];
            return appointments.value.filter(a => a.scheduled_at && localDateStr(new Date(a.scheduled_at)) === date);
        }

        /* ── Modal ── */
        function openNew(date, hour, minute) {
            editingAppt.value = null; newApptDate.value = date; newApptHour.value = hour; newApptMinute.value = minute ?? 0;
            modalTitle.value = 'Новий запис'; showModal.value = true;
        }
        function openEdit(appt) {
            editingAppt.value = appt; modalTitle.value = 'Редагувати запис'; showModal.value = true;
        }
        async function onSaved(appt) {
            showModal.value = false;
            const wasNew = !editingAppt.value;
            if (wasNew && appt && appt.type === 'appointment' && prepAutoEnabled.value) {
                await createPrepBefore(appt, prepDuration.value);
            }
            loadAppointments();
        }

        async function loadAppointments() {
            try {
                let start, end;
                if (view.value === 'week') {
                    start = weekDays.value[0].date; end = weekDays.value[6].date;
                } else {
                    const y = currentDate.value.getFullYear(), mo = currentDate.value.getMonth();
                    start = localDateStr(new Date(y, mo, 1));
                    end = localDateStr(new Date(y, mo + 1, 0));
                }
                const { data } = await props.api.get('/appointments', { params: { start, end } });
                appointments.value = data;
            } catch(e) {}
        }

        onMounted(async () => {
            loadAppointments();
            loadBookingRequests();
            try { const { data } = await props.api.get('/schedule/working-hours'); workingHours.value = data; } catch(e) {}
        });

        watch(view, loadAppointments);

        return {
            M, view, currentDate, weekDays, weekLabel, monthLabel, monthDays, appointments, hours, halfSlots, gridHeight,
            showModal, modalTitle, editingAppt, newApptDate, newApptHour, newApptMinute,
            prevWeek, nextWeek, prevMonth, nextMonth, dayAppts, monthAppts, apptStyle, apptTimeRange, apptTypeLabel, apptOverlaps,
            openNew, openEdit, onSaved, isOffHours, showRequests, dayRequests, requestStyle, localDateStr,
            onApptPointerDown, onApptPointerMove, onApptPointerUp, onApptPointerCancel, dropPreview, nowLineVisible, nowLineStyle, nowTimeLabel, slotEdgeClass, draggingId,
            showRespondModal, selectedRequest, openRequest, onResponded,
            prepDuration, prepAutoEnabled, prepApplying, sessionsWithoutPrep, applyPrepToWeek, removeAutoPrep,
            showAutoPopulate, autoPopClients, autoPopulating, autoPopProgress, autoPopForm, openAutoPopulate, submitAutoPopulate,
        };
    },
    template: `
<div>
  <!-- Controls -->
  <div class="sched-controls">
    <div class="view-toggle">
      <button :class="'view-btn' + (view==='week' ? ' active' : '')" @click="view='week'">Тиждень</button>
      <button :class="'view-btn' + (view==='month' ? ' active' : '')" @click="view='month'">Місяць</button>
    </div>
    <button class="btn btn-ghost btn-sm" @click="view==='week' ? prevWeek() : prevMonth()"><i class="fa fa-chevron-left"></i></button>
    <span style="font-size:13px;font-weight:600;min-width:180px;text-align:center;">{{ view==='week' ? weekLabel : monthLabel }}</span>
    <button class="btn btn-ghost btn-sm" @click="view==='week' ? nextWeek() : nextMonth()"><i class="fa fa-chevron-right"></i></button>
    <button class="btn btn-ghost btn-sm" @click="currentDate=new Date();loadAppointments()">Сьогодні</button>
    <label class="req-filter-toggle">
      <input type="checkbox" v-model="showRequests"> <i class="fa fa-clock-rotate-left"></i> Запити
    </label>
    <button class="btn btn-ghost btn-sm" @click="openAutoPopulate" title="Авто-наповнення">
      <i class="fa fa-rotate"></i> Авто-наповнення
    </button>
    <button class="btn btn-primary btn-sm" style="margin-left:auto;" @click="openNew(localDateStr(new Date()), 10, 0)">
      <i class="fa fa-plus"></i> Новий запис
    </button>
  </div>

  <!-- Week view -->
  <div v-if="view==='week'" class="week-wrap">
    <div class="week-cal">
      <!-- Header -->
      <div class="week-hdr-corner"></div>
      <div v-for="day in weekDays" :key="day.date" :class="'week-hdr-day' + (day.isToday ? ' today' : '')">
        <div class="wday">{{ day.label }}</div>
        <div class="wdate">{{ day.num }}</div>
      </div>
      <!-- Time column -->
      <div class="week-time-col" :style="{height: gridHeight+'px'}">
        <div v-for="slot in halfSlots" :key="slot.hour+'-'+slot.minute" class="week-time-slot">
          <span v-if="slot.minute===0">{{ String(slot.hour).padStart(2,'0') }}:00</span>
        </div>
      </div>
      <!-- Day columns -->
      <div v-for="(day, di) in weekDays" :key="day.date" :class="'week-day-col' + (day.isToday ? ' today' : '')" :style="{height: gridHeight+'px'}" :data-date="day.date">
        <div v-for="(slot, si) in halfSlots" :key="slot.hour+'-'+slot.minute"
          :class="'week-half-cell' + (isOffHours(di, slot.hour) ? ' off-hours' : '') + (slot.minute===30 ? ' half' : '') + slotEdgeClass(di, si)"
          @click="openNew(day.date, slot.hour, slot.minute)">
        </div>
        <div v-if="day.isToday && nowLineVisible()" class="now-line" :style="nowLineStyle()" :data-time="nowTimeLabel()"></div>
        <div v-if="dropPreview && dropPreview.date===day.date" class="drop-preview" :style="{top: dropPreview.top+'px', height: dropPreview.height+'px'}"></div>
        <div v-for="r in dayRequests(day.date)" :key="'req'+r.id"
          class="req-block" :style="requestStyle(r)"
          :title="r.client_name + ' · ' + r.preferred_time?.slice(0,5) + (r.service ? ' · ' + r.service.name : '')"
          @click.stop="openRequest(r)">
          <div class="appt-block-name">{{ r.client_name }}</div>
          <div class="appt-block-meta">{{ r.preferred_time?.slice(0,5) }}<span v-if="r.service"> · {{ r.service.name }}</span></div>
        </div>
        <div v-for="a in dayAppts(day.date)" :key="a.id"
          :class="'appt-block' + (a.type==='block' ? ' is-block' : '') + (apptOverlaps(a, day.date) ? ' overlap' : '') + (draggingId===a.id ? ' dragging' : '')"
          :style="[apptStyle(a), a.type!=='block' ? {background: a.service?.color || a.color || '#7c5cfc', color:'#fff'} : {}]"
          @pointerdown="onApptPointerDown($event, a)"
          @pointermove="onApptPointerMove($event)"
          @pointerup="onApptPointerUp($event, a)"
          @pointercancel="onApptPointerCancel">
          <div class="appt-block-name">{{ a.type==='block' ? (a.title || a.title_display || 'Перерва') : (a.client?.name || a.title_display) }}</div>
          <div class="appt-block-meta">{{ apptTimeRange(a) }}<span v-if="apptTypeLabel(a)"> · {{ apptTypeLabel(a) }}</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Month view -->
  <div v-else class="month-cal">
    <div class="month-hdr-row">
      <div v-for="d in ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']" :key="d" class="month-hdr-cell">{{ d }}</div>
    </div>
    <div class="month-grid">
      <div v-for="(day,i) in monthDays" :key="i"
        :class="'month-day' + (day.isToday ? ' today' : '') + (!day.cur ? ' other-month' : '')"
        @click="day.cur && openNew(day.date, 10)">
        <div class="mday-num">{{ day.d }}</div>
        <div v-for="a in monthAppts(day.date)" :key="a.id"
          :class="'mday-appt' + (a.type==='block' ? ' is-block' : '')"
          :style="a.type!=='block' ? {background: (a.service?.color || '#7c5cfc') + '33', color: a.service?.color || '#7c5cfc'} : {}"
          @click.stop="openEdit(a)">
          {{ M.fmtTime(a.scheduled_at) }} {{ a.type==='block' ? (a.title || 'Перерва') : (a.client?.name || a.title_display) }}
        </div>
      </div>
    </div>
  </div>

  <!-- Prep/lunch automation -->
  <div v-if="view==='week'" class="prep-automation">
    <div class="prep-automation-hdr">
      <i class="fa fa-mug-hot"></i>
      <h3>Автоматична підготовка / обід</h3>
    </div>
    <div class="prep-automation-body">
      <div class="prep-row">
        <span class="prep-label">Тривалість перед сесією:</span>
        <div class="chip-row">
          <button v-for="d in [15,30,60]" :key="d" type="button" :class="'chip' + (prepDuration===d ? ' active' : '')" @click="prepDuration=d">{{ d }} хв</button>
        </div>
      </div>
      <label class="prep-toggle">
        <input type="checkbox" v-model="prepAutoEnabled">
        Додавати автоматично перед кожним новим записом
      </label>
      <div class="prep-actions">
        <button class="btn btn-ghost btn-sm" :disabled="prepApplying || !sessionsWithoutPrep().length" @click="applyPrepToWeek">
          <i class="fa fa-wand-magic-sparkles"></i> Додати підготовку до записів цього тижня ({{ sessionsWithoutPrep().length }})
        </button>
        <button class="btn btn-ghost btn-sm" :disabled="prepApplying" @click="removeAutoPrep">
          <i class="fa fa-trash"></i> Прибрати підготовку цього тижня
        </button>
      </div>
    </div>
  </div>

  <!-- Modal -->
  <m-modal :show="showModal" :title="modalTitle" size="lg" @close="showModal=false">
    <appointment-form-body
      :api="api"
      :existing="editingAppt"
      :initial-date="newApptDate"
      :initial-hour="newApptHour"
      :initial-minute="newApptMinute"
      @saved="onSaved"
      @cancel="showModal=false">
    </appointment-form-body>
  </m-modal>

  <!-- Booking request modal -->
  <m-modal :show="showRespondModal" title="Відповідь на запит" size="lg" @close="showRespondModal=false">
    <respond-form-body v-if="selectedRequest" :api="api" :request="selectedRequest" @responded="onResponded" @cancel="showRespondModal=false"></respond-form-body>
  </m-modal>

  <!-- Auto-populate modal -->
  <m-modal :show="showAutoPopulate" title="Авто-наповнення" subtitle="Заплануйте повторювані слоти для клієнта" icon="rotate" size="sm" @close="showAutoPopulate=false">
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div class="form-group">
        <label class="label">Клієнт</label>
        <select v-model="autoPopForm.client_id" class="select">
          <option value="">— Оберіть клієнта —</option>
          <option v-for="c in autoPopClients" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="label">День тижня</label>
        <div class="weekday-picker">
          <button v-for="d in [{l:'Пн',v:1},{l:'Вт',v:2},{l:'Ср',v:3},{l:'Чт',v:4},{l:'Пт',v:5},{l:'Сб',v:6},{l:'Нд',v:7}]"
            :key="d.v" type="button"
            :class="['weekday-btn', autoPopForm.weekday === d.v ? 'active' : '']"
            @click="autoPopForm.weekday = d.v">{{ d.l }}</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="label">Час початку</label>
          <input type="time" v-model="autoPopForm.time" class="input">
        </div>
        <div class="form-group">
          <label class="label">Тривалість (хв)</label>
          <input type="number" v-model.number="autoPopForm.duration" class="input" min="15" step="15">
        </div>
      </div>
      <div class="form-group">
        <label class="label">Кількість тижнів</label>
        <div style="display:flex;align-items:center;gap:12px;">
          <input type="range" v-model.number="autoPopForm.weeks" min="1" max="26" step="1" style="flex:1;">
          <span style="font-size:14px;font-weight:700;min-width:48px;">{{ autoPopForm.weeks }} тиж.</span>
        </div>
        <p style="font-size:11px;color:var(--text-muted);margin-top:4px;">Починаючи з найближчого {{ [{l:'понеділка',v:1},{l:'вівторка',v:2},{l:'середи',v:3},{l:'четверга',v:4},{l:'п\'ятниці',v:5},{l:'суботи',v:6},{l:'неділі',v:7}].find(d=>d.v===autoPopForm.weekday)?.l }} — {{ autoPopForm.weeks }} записів</p>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="label">Ціна (₴)</label>
          <input type="number" v-model="autoPopForm.price" class="input" placeholder="Необов'язково">
        </div>
      </div>
      <div v-if="autoPopulating" style="text-align:center;padding:8px 0;">
        <i class="fa fa-spinner fa-spin"></i>
        Створення {{ autoPopProgress.current }} / {{ autoPopProgress.total }}…
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-ghost" @click="showAutoPopulate=false">Скасувати</button>
        <button class="btn btn-primary" :disabled="!autoPopForm.client_id || autoPopulating" @click="submitAutoPopulate">
          <i class="fa fa-check"></i> Створити {{ autoPopForm.weeks }} записів
        </button>
      </div>
    </div>
  </m-modal>
</div>`
};


/* =====================================================================
   3b. ARCHIVE (defined here so RequestsPage can reference it in components:{})
   ===================================================================== */
const ArchivePage = {
    props: ['api'],
    components: { MModal, MBadge, AppointmentFormBody },
    setup(props) {
        const appointments = ref([]);
        const meta = ref({ current_page: 1, last_page: 1, total: 0 });
        const statusFilter = ref('');
        const search = ref('');
        const loading = ref(false);
        const viewingAppt = ref(null);
        const showModal = ref(false);

        async function load() {
            loading.value = true;
            try {
                const { data } = await props.api.get('/appointments/archive', {
                    params: { status: statusFilter.value, per_page: 25, page: meta.value.current_page }
                });
                appointments.value = data.data;
                meta.value = data.meta ?? { current_page: data.current_page, last_page: data.last_page, total: data.total };
            } catch(e) {}
            loading.value = false;
        }

        function openView(a) { viewingAppt.value = a; showModal.value = true; }
        function onSaved() { showModal.value = false; load(); }
        function changePage(p) { meta.value.current_page = p; load(); }

        watch(statusFilter, () => { meta.value.current_page = 1; load(); });
        onMounted(load);

        return { appointments, meta, statusFilter, search, loading, viewingAppt, showModal, load, openView, onSaved, changePage };
    },
    template: `
<div>
  <div class="flex items-center justify-between mb-16">
    <h1>Архів сесій</h1>
    <div class="flex gap-8">
      <select v-model="statusFilter" class="select" style="width:160px;">
        <option value="">Всі статуси</option>
        <option value="completed">Завершені</option>
        <option value="cancelled">Скасовані</option>
        <option value="no_show">Не з'явився</option>
      </select>
    </div>
  </div>

  <div class="card">
    <div v-if="loading" class="empty"><i class="fa fa-spinner fa-spin"></i><p>Завантаження…</p></div>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Дата та час</th>
            <th>Клієнт</th>
            <th>Послуга</th>
            <th>Тривалість</th>
            <th>Ціна</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!appointments.length">
            <td colspan="6" class="empty" style="text-align:center;padding:32px;">Сесій не знайдено</td>
          </tr>
          <tr v-for="a in appointments" :key="a.id" @click="openView(a)">
            <td>{{ a.scheduled_at ? new Date(a.scheduled_at).toLocaleDateString('uk',{month:'short',day:'numeric',year:'numeric'}) : '—' }}</td>
            <td>
              <div class="flex items-center gap-8">
                <div class="avatar av-xs">{{ a.client?.name?.charAt(0) }}</div>
                <span class="fw-700">{{ a.client?.name }}</span>
              </div>
            </td>
            <td style="color:var(--text-sub)">{{ a.service?.name || '—' }}</td>
            <td style="color:var(--text-sub)">{{ a.duration ? a.duration + ' хв' : '—' }}</td>
            <td style="font-weight:600;">{{ a.price ? '₴' + Number(a.price).toLocaleString() : '—' }}</td>
            <td><m-badge :status="a.status"></m-badge></td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Pagination -->
    <div v-if="meta.last_page > 1" style="padding:12px 14px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);">
      <button class="btn btn-ghost btn-sm" :disabled="meta.current_page <= 1" @click="changePage(meta.current_page - 1)"><i class="fa fa-chevron-left"></i> Назад</button>
      <span class="text-sub text-sm">Сторінка {{ meta.current_page }} з {{ meta.last_page }} &nbsp;·&nbsp; {{ meta.total }} всього</span>
      <button class="btn btn-ghost btn-sm" :disabled="meta.current_page >= meta.last_page" @click="changePage(meta.current_page + 1)">Далі <i class="fa fa-chevron-right"></i></button>
    </div>
  </div>

  <!-- View/Edit modal -->
  <m-modal :show="showModal" :title="viewingAppt ? 'Сесія: ' + (viewingAppt.client?.name || '') : ''" size="lg" @close="showModal=false">
    <appointment-form-body v-if="viewingAppt" :api="api" :existing="viewingAppt" @saved="onSaved" @cancel="showModal=false"></appointment-form-body>
  </m-modal>
</div>`
};

/* =====================================================================
   3. REQUESTS
   ===================================================================== */
const RequestsPage = {
    props: ['api'],
    emits: ['count'],
    components: { MModal, MBadge, MAvatar, RespondFormBody, ArchivePage },
    setup(props, { emit }) {
        const subTab = ref('requests');
        const requests = ref([]);
        const filter = ref('pending');
        const loading = ref(false);
        const showRespond = ref(false);
        const selectedReq = ref(null);

        async function load() {
            loading.value = true;
            try {
                const params = filter.value ? { status: filter.value, per_page: 50 } : { per_page: 50 };
                const { data } = await props.api.get('/booking-requests', { params });
                requests.value = data.data ?? data;
                if (filter.value === 'pending') emit('count', data.meta?.total ?? data.total ?? requests.value.length);
            } catch(e) {}
            loading.value = false;
        }

        function openRespond(r) { selectedReq.value = r; showRespond.value = true; }
        function onResponded() { showRespond.value = false; load(); }

        watch(filter, load);
        onMounted(load);

        return { subTab, requests, filter, loading, showRespond, selectedReq, load, openRespond, onResponded };
    },
    template: `
<div>
  <div class="page-tabs mb-16">
    <button :class="['page-tab', subTab==='requests' ? 'active' : '']" @click="subTab='requests'">
      <i class="fa fa-inbox"></i> Запити
    </button>
    <button :class="['page-tab', subTab==='archive' ? 'active' : '']" @click="subTab='archive'">
      <i class="fa fa-box-archive"></i> Архів сесій
    </button>
  </div>

  <!-- Requests sub-tab -->
  <template v-if="subTab==='requests'">
    <div class="chip-row">
      <button :class="'chip' + (filter==='pending' ? ' active' : '')" @click="filter='pending'">Нові</button>
      <button :class="'chip' + (filter==='accepted' ? ' active' : '')" @click="filter='accepted'">Прийняті</button>
      <button :class="'chip' + (filter==='declined' ? ' active' : '')" @click="filter='declined'">Відхилені</button>
      <button :class="'chip' + (filter==='' ? ' active' : '')" @click="filter=''">Всі</button>
    </div>
    <div v-if="loading" class="empty"><i class="fa fa-spinner fa-spin"></i><p>Завантаження…</p></div>
    <div v-else-if="!requests.length" class="empty"><i class="fa fa-inbox"></i><p>Запитів немає</p></div>
    <div v-else style="display:flex;flex-direction:column;gap:10px;">
      <div v-for="r in requests" :key="r.id" class="req-card" @click="openRespond(r)">
        <div class="req-header">
          <div class="flex items-center gap-10">
            <div class="avatar av-sm">{{ r.client_name?.charAt(0).toUpperCase() }}</div>
            <span class="req-name">{{ r.client_name }}</span>
          </div>
          <div class="flex items-center gap-8">
            <m-badge :status="r.status"></m-badge>
            <span style="font-size:11px;color:var(--text-muted);">{{ r.created_at ? new Date(r.created_at).toLocaleDateString('uk',{month:'short',day:'numeric'}) : '' }}</span>
          </div>
        </div>
        <div class="req-meta">
          <span v-if="r.client_phone"><i class="fa fa-phone"></i>{{ r.client_phone }}</span>
          <span v-if="r.client_email"><i class="fa fa-envelope"></i>{{ r.client_email }}</span>
          <span v-if="r.client_instagram"><i class="fa-brands fa-instagram"></i>{{ r.client_instagram }}</span>
          <span v-if="r.service"><i class="fa fa-scissors"></i>{{ r.service.name }}</span>
          <span v-if="r.preferred_date"><i class="fa fa-calendar"></i>{{ new Date(r.preferred_date).toLocaleDateString('uk',{month:'short',day:'numeric'}) }}{{ r.preferred_time ? ' ' + r.preferred_time : '' }}</span>
        </div>
        <p v-if="r.message" class="req-msg">"{{ r.message }}"</p>
        <div v-if="r.status === 'pending'" class="flex gap-8" @click.stop>
          <button class="btn btn-success btn-sm" @click="openRespond(r)"><i class="fa fa-check"></i> Відповісти</button>
        </div>
      </div>
    </div>
    <m-modal :show="showRespond" title="Відповідь на запит" size="lg" @close="showRespond=false">
      <respond-form-body v-if="selectedReq" :api="api" :request="selectedReq" @responded="onResponded" @cancel="showRespond=false"></respond-form-body>
    </m-modal>
  </template>

  <!-- Archive sub-tab -->
  <archive-page v-else :api="api"></archive-page>
</div>`
};

/* =====================================================================
   4b. CLIENTS
   ===================================================================== */
const ClientsPage = {
    props: ['api'],
    components: { MModal, MBadge, MAvatar, ClientFormBody },
    setup(props) {
        const clients = ref([]);
        const meta = ref({ current_page: 1, last_page: 1, total: 0 });
        const loading = ref(false);
        const search = ref('');
        const vipOnly = ref(false);
        const viewMode = ref('cards');

        const showNewModal = ref(false);

        const showDetailDrawer = ref(false);
        const detail = ref(null);
        const detailLoading = ref(false);
        const editMode = ref(false);
        const editForm = reactive({ name: '', phone: '', email: '', instagram: '', birthday: '', source: '', is_vip: false });
        const originalForm = reactive({ name: '', phone: '', email: '', instagram: '', birthday: '', source: '', is_vip: false });
        const savingEdit = ref(false);
        const editError = ref('');

        function isFieldDirty(field) { return editForm[field] !== originalForm[field]; }
        const isDirty = computed(() => Object.keys(editForm).some(isFieldDirty));
        const notesForm = reactive({ notes: '', medical_notes: '' });
        const savingNotes = ref(false);
        const notesSaved = ref(false);

        let searchTimer = null;
        let notesTimer = null;
        let suppressNotesWatch = false;

        async function load() {
            loading.value = true;
            try {
                const { data } = await props.api.get('/clients', {
                    params: {
                        search: search.value || undefined,
                        vip: vipOnly.value ? 1 : undefined,
                        per_page: 60,
                        page: meta.value.current_page,
                    }
                });
                clients.value = data.data;
                meta.value = data.meta ?? { current_page: data.current_page, last_page: data.last_page, total: data.total };
            } catch(e) {}
            loading.value = false;
        }

        function onSearchInput() {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => { meta.value.current_page = 1; load(); }, 350);
        }

        function toggleVip() {
            vipOnly.value = !vipOnly.value;
            meta.value.current_page = 1;
            load();
        }

        function changePage(p) { meta.value.current_page = p; load(); }

        function openNew() { showNewModal.value = true; }

        async function onNewSaved() {
            showNewModal.value = false;
            await load();
        }

        function closeDetail() {
            showDetailDrawer.value = false;
            detail.value = null;
            editMode.value = false;
        }

        async function openDetail(c) {
            showDetailDrawer.value = true;
            detail.value = null;
            editMode.value = false;
            notesSaved.value = false;
            detailLoading.value = true;
            try {
                const { data } = await props.api.get('/clients/' + c.id);
                detail.value = data;
                suppressNotesWatch = true;
                notesForm.notes = data.client.notes || '';
                notesForm.medical_notes = data.client.medical_notes || '';
                nextTick(() => { suppressNotesWatch = false; });
            } catch(e) {}
            detailLoading.value = false;
        }

        function startEdit() {
            const c = detail.value.client;
            editForm.name = c.name || '';
            editForm.phone = c.phone || '';
            editForm.email = c.email || '';
            editForm.instagram = c.instagram || '';
            editForm.birthday = c.birthday ? c.birthday.slice(0, 10) : '';
            editForm.source = c.source || '';
            editForm.is_vip = !!c.is_vip;
            Object.assign(originalForm, editForm);
            editError.value = '';
            editMode.value = true;
        }

        async function saveEdit() {
            if (!editForm.name.trim()) { editError.value = 'Ім\'я обов\'язкове'; return; }
            savingEdit.value = true; editError.value = '';
            try {
                const id = detail.value.client.id;
                await props.api.put('/clients/' + id, editForm);
                editMode.value = false;
                await load();
                const { data } = await props.api.get('/clients/' + id);
                detail.value = data;
                suppressNotesWatch = true;
                notesForm.notes = data.client.notes || '';
                notesForm.medical_notes = data.client.medical_notes || '';
                nextTick(() => { suppressNotesWatch = false; });
            } catch(e) { editError.value = 'Не вдалося зберегти'; }
            savingEdit.value = false;
        }

        async function saveNotes() {
            if (!detail.value) return;
            savingNotes.value = true; notesSaved.value = false;
            try {
                await props.api.put('/clients/' + detail.value.client.id, {
                    notes: notesForm.notes,
                    medical_notes: notesForm.medical_notes,
                });
                detail.value.client.notes = notesForm.notes;
                detail.value.client.medical_notes = notesForm.medical_notes;
                notesSaved.value = true;
            } catch(e) {}
            savingNotes.value = false;
        }

        watch(() => [notesForm.notes, notesForm.medical_notes], () => {
            if (suppressNotesWatch) return;
            notesSaved.value = false;
            clearTimeout(notesTimer);
            notesTimer = setTimeout(saveNotes, 800);
        });

        function instagramUrl(handle) {
            if (!handle) return '';
            return 'https://instagram.com/' + handle.replace(/^@/, '');
        }

        onMounted(load);

        return {
            clients, meta, loading, search, vipOnly, viewMode,
            showNewModal,
            showDetailDrawer, detail, detailLoading, editMode,
            editForm, savingEdit, editError, isFieldDirty, isDirty,
            notesForm, savingNotes, notesSaved,
            onSearchInput, toggleVip, changePage,
            openNew, onNewSaved, closeDetail, openDetail, startEdit, saveEdit, saveNotes, instagramUrl,
            M,
        };
    },
    template: `
<div>
  <div class="clients-toolbar">
    <div class="topbar-search clients-search">
      <i class="fa fa-magnifying-glass topbar-search-icon"></i>
      <input type="text" v-model="search" @input="onSearchInput" placeholder="Пошук за іменем, телефоном, email…">
    </div>
    <div class="chip-row" style="margin:0;">
      <button :class="'chip' + (vipOnly ? ' active' : '')" @click="toggleVip"><i class="fa fa-star"></i> VIP</button>
    </div>
    <div class="view-toggle">
      <button :class="'view-toggle-btn' + (viewMode==='cards' ? ' active' : '')" @click="viewMode='cards'" title="Картки"><i class="fa fa-grip"></i></button>
      <button :class="'view-toggle-btn' + (viewMode==='list' ? ' active' : '')" @click="viewMode='list'" title="Список"><i class="fa fa-list"></i></button>
    </div>
    <button class="btn btn-primary" @click="openNew" style="margin-left:auto;"><i class="fa fa-plus"></i> Новий клієнт</button>
  </div>

  <div v-if="loading" class="empty"><i class="fa fa-spinner fa-spin"></i><p>Завантаження…</p></div>

  <div v-else-if="!clients.length" class="empty">
    <i class="fa fa-users"></i>
    <p>Клієнтів не знайдено</p>
  </div>

  <!-- Card view -->
  <div v-else-if="viewMode==='cards'" class="clients-grid">
    <div v-for="c in clients" :key="c.id" class="client-card" @click="openDetail(c)">
      <div v-if="c.is_vip" class="client-card-vip"><i class="fa fa-star"></i> VIP</div>
      <img v-if="c.avatar_url" :src="c.avatar_url" class="client-card-avatar" :alt="c.name">
      <m-avatar v-else :name="c.name" size="xl"></m-avatar>
      <div class="client-card-name">{{ c.name }}</div>
      <div class="client-card-info">
        <div v-if="c.phone" class="client-card-row"><i class="fa fa-phone"></i> {{ c.phone }}</div>
        <div v-if="c.instagram" class="client-card-row"><i class="fa fa-instagram"></i> {{ c.instagram.replace('@','') }}</div>
        <div v-if="!c.phone && !c.instagram && c.email" class="client-card-row"><i class="fa fa-envelope"></i> {{ c.email }}</div>
      </div>
      <div class="client-card-stats">
        <div class="client-card-stat">
          <div class="client-card-stat-value">{{ c.total_visits ?? 0 }}</div>
          <div class="client-card-stat-label">Візити</div>
        </div>
        <div class="client-card-stat">
          <div class="client-card-stat-value">{{ M.fmtMoney(c.total_spent_sum || 0) }}</div>
          <div class="client-card-stat-label">Витрачено</div>
        </div>
        <div class="client-card-stat">
          <div class="client-card-stat-value">{{ c.last_visit_at ? M.fmt(c.last_visit_at, {month:'short',day:'numeric'}) : '—' }}</div>
          <div class="client-card-stat-label">Останній візит</div>
        </div>
      </div>
    </div>
  </div>

  <!-- List view -->
  <div v-else class="card">
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Клієнт</th>
            <th>Контакти</th>
            <th>Візити</th>
            <th>Витрачено</th>
            <th>Останній візит</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in clients" :key="c.id" @click="openDetail(c)">
            <td>
              <div class="flex items-center gap-8">
                <img v-if="c.avatar_url" :src="c.avatar_url" class="avatar av-sm" style="object-fit:cover;" :alt="c.name">
                <m-avatar v-else :name="c.name" size="sm"></m-avatar>
                <div class="min-w-0">
                  <div class="fw-700">{{ c.name }} <i v-if="c.is_vip" class="fa fa-star" style="color:#f59e0b;font-size:11px;"></i></div>
                </div>
              </div>
            </td>
            <td style="color:var(--text-sub)">
              <div v-if="c.phone">{{ c.phone }}</div>
              <div v-if="c.instagram" style="font-size:11px;color:var(--text-muted);"><i class="fa fa-instagram"></i> {{ c.instagram.replace('@','') }}</div>
              <div v-if="!c.phone && !c.instagram">—</div>
            </td>
            <td>{{ c.total_visits ?? 0 }}</td>
            <td style="font-weight:600;">{{ M.fmtMoney(c.total_spent_sum || 0) }}</td>
            <td style="color:var(--text-sub)">{{ c.last_visit_at ? M.fmt(c.last_visit_at) : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Pagination -->
  <div v-if="meta.last_page > 1" style="padding:12px 14px;display:flex;align-items:center;justify-content:space-between;">
    <button class="btn btn-ghost btn-sm" :disabled="meta.current_page <= 1" @click="changePage(meta.current_page - 1)"><i class="fa fa-chevron-left"></i> Назад</button>
    <span class="text-sub text-sm">Сторінка {{ meta.current_page }} з {{ meta.last_page }} &nbsp;·&nbsp; {{ meta.total }} всього</span>
    <button class="btn btn-ghost btn-sm" :disabled="meta.current_page >= meta.last_page" @click="changePage(meta.current_page + 1)">Далі <i class="fa fa-chevron-right"></i></button>
  </div>

  <!-- New client modal -->
  <m-modal :show="showNewModal" title="Новий клієнт" @close="showNewModal=false">
    <client-form-body :api="api" :existing="null" @saved="onNewSaved" @cancel="showNewModal=false"></client-form-body>
  </m-modal>

  <!-- Detail / edit drawer -->
  <teleport to="body">
    <div v-if="showDetailDrawer" class="drawer-overlay" @mousedown.self="closeDetail"></div>
    <transition name="drawer-slide">
    <div v-if="showDetailDrawer" class="client-drawer">
      <div class="modal-head">
        <span class="modal-title">{{ editMode ? 'Редагувати клієнта' : (detail ? detail.client.name : 'Клієнт') }}</span>
        <div class="flex items-center gap-8">
          <button v-if="detail && !editMode && !detailLoading" class="btn btn-secondary btn-icon" @click="startEdit" title="Редагувати"><i class="fa fa-pen"></i></button>
          <button v-if="editMode" :class="'btn btn-icon ' + (isDirty ? 'btn-save-dirty' : 'btn-secondary')" @click="saveEdit" :disabled="savingEdit" title="Зберегти">
            <i :class="savingEdit ? 'fa fa-spinner fa-spin' : 'fa fa-check'"></i>
          </button>
          <button class="modal-close" @click="editMode ? (editMode=false) : closeDetail()" :title="editMode ? 'Скасувати' : 'Закрити'"><i class="fa fa-times"></i></button>
        </div>
      </div>

      <div class="client-drawer-body">
        <div v-if="detailLoading" class="empty"><i class="fa fa-spinner fa-spin"></i><p>Завантаження…</p></div>

        <div v-else-if="detail" class="client-detail">

          <div class="client-detail-head">
            <img v-if="detail.client.avatar_url" :src="detail.client.avatar_url" class="client-detail-avatar" :alt="detail.client.name">
            <m-avatar v-else :name="detail.client.name" size="xl"></m-avatar>
            <div class="flex-1 min-w-0">
              <template v-if="!editMode">
                <div class="flex items-center gap-8">
                  <div style="font-size:17px;font-weight:700;">{{ detail.client.name }}</div>
                  <span v-if="detail.client.is_vip" class="badge" style="background:rgba(245,158,11,.15);color:#b45309;"><i class="fa fa-star"></i> VIP</span>
                </div>
                <div class="client-detail-meta">
                  <span v-if="detail.client.phone"><i class="fa fa-phone"></i> {{ detail.client.phone }}</span>
                  <span v-if="detail.client.email"><i class="fa fa-envelope"></i> {{ detail.client.email }}</span>
                  <a v-if="detail.client.instagram" :href="instagramUrl(detail.client.instagram)" target="_blank" rel="noopener"><i class="fa fa-instagram"></i> {{ detail.client.instagram.replace('@','') }}</a>
                  <span v-if="detail.client.birthday"><i class="fa fa-cake-candles"></i> {{ M.fmt(detail.client.birthday) }}</span>
                  <span v-if="detail.client.source"><i class="fa fa-circle-info"></i> {{ detail.client.source }}</span>
                </div>
              </template>
              <template v-else>
                <div class="form-group mb-12">
                  <input v-model="editForm.name" :class="'input' + (isFieldDirty('name') ? ' input-dirty' : '')" placeholder="Ім'я" style="font-size:15px;font-weight:700;">
                </div>
                <div class="client-detail-meta-edit">
                  <div class="form-group"><label class="label">Телефон</label><input v-model="editForm.phone" :class="'input' + (isFieldDirty('phone') ? ' input-dirty' : '')" type="tel"></div>
                  <div class="form-group"><label class="label">Email</label><input v-model="editForm.email" :class="'input' + (isFieldDirty('email') ? ' input-dirty' : '')" type="email"></div>
                  <div class="form-group"><label class="label">Instagram</label><input v-model="editForm.instagram" :class="'input' + (isFieldDirty('instagram') ? ' input-dirty' : '')" placeholder="@handle"></div>
                  <div class="form-group"><label class="label">День народження</label><input v-model="editForm.birthday" :class="'input' + (isFieldDirty('birthday') ? ' input-dirty' : '')" type="date"></div>
                  <div class="form-group" style="grid-column: span 2;"><label class="label">Джерело</label><input v-model="editForm.source" :class="'input' + (isFieldDirty('source') ? ' input-dirty' : '')" placeholder="Instagram, рекомендація…"></div>
                  <label :class="'vip-edit-toggle' + (isFieldDirty('is_vip') ? ' input-dirty' : '')">
                    <input type="checkbox" v-model="editForm.is_vip"> <span>VIP клієнт</span>
                  </label>
                </div>
                <p v-if="editError" style="color:var(--cancelled);font-size:12px;margin-top:8px;">{{ editError }}</p>
              </template>
            </div>
          </div>

          <div class="client-detail-stats">
            <div class="stat-card" style="padding:12px 14px;">
              <div class="stat-label">Витрачено всього</div>
              <div class="stat-value" style="font-size:20px;">{{ M.fmtMoney(detail.total_spent) }}</div>
            </div>
            <div class="stat-card" style="padding:12px 14px;">
              <div class="stat-label">Завершених візитів</div>
              <div class="stat-value" style="font-size:20px;">{{ detail.visits_count }}</div>
            </div>
            <div class="stat-card" style="padding:12px 14px;">
              <div class="stat-label">Клієнт з</div>
              <div class="stat-value" style="font-size:20px;">{{ M.fmt(detail.client.created_at, {month:'short', year:'numeric'}) }}</div>
            </div>
          </div>

          <div v-if="detail.spending_by_service && detail.spending_by_service.length" class="client-detail-section">
            <div class="client-detail-section-title">Витрати за послугами</div>
            <div class="spend-row" v-for="row in detail.spending_by_service" :key="row.service_id">
              <span class="svc-dot" :style="{ background: row.service?.color || '#999' }"></span>
              <span class="flex-1">{{ row.service?.name || 'Послуга' }}</span>
              <span class="text-sub text-sm">{{ row.count }}x</span>
              <span style="font-weight:600;">{{ M.fmtMoney(row.total) }}</span>
            </div>
          </div>

          <div class="client-detail-section">
            <div class="client-detail-section-title">Історія записів</div>
            <div v-if="!detail.client.appointments || !detail.client.appointments.length" class="empty" style="padding:16px;">
              <p>Записів ще немає</p>
            </div>
            <div v-else class="client-history">
              <div class="history-row" v-for="a in detail.client.appointments" :key="a.id">
                <span class="svc-dot" :style="{ background: a.service?.color || a.color || '#999' }"></span>
                <div class="flex-1 min-w-0">
                  <div class="fw-700" style="font-size:13px;">{{ a.service?.name || a.title }}</div>
                  <div class="text-sub" style="font-size:11px;">{{ M.fmtDT(a.scheduled_at) }}</div>
                </div>
                <span style="font-weight:600;font-size:13px;">{{ a.price ? M.fmtMoney(a.price) : '—' }}</span>
                <m-badge :status="a.status"></m-badge>
              </div>
            </div>
          </div>

          <div class="client-detail-section">
            <div class="client-detail-section-title flex items-center gap-8" style="justify-content:space-between;">
              <span>Нотатки</span>
              <span class="notes-save-indicator">
                <span v-if="savingNotes"><i class="fa fa-spinner fa-spin"></i> Збереження…</span>
                <span v-else-if="notesSaved" style="color:var(--completed);"><i class="fa fa-check"></i> Збережено</span>
              </span>
            </div>
            <div class="form-group mb-12">
              <label class="label">Загальні нотатки</label>
              <textarea v-model="notesForm.notes" class="textarea" rows="2" placeholder="Нотатки про клієнта…"></textarea>
            </div>
            <div class="form-group">
              <label class="label">Медичні / шкірні нотатки (приватно)</label>
              <textarea v-model="notesForm.medical_notes" class="textarea" rows="2" placeholder="Алергії, стани…"></textarea>
            </div>
          </div>

        </div>
      </div>
    </div>
    </transition>
  </teleport>
</div>`
};

/* =====================================================================
   5. PUBLIC PAGE SETTINGS
   ===================================================================== */
/* =====================================================================
   MAvatarCropper — drag/pinch/scroll crop modal, outputs 400×400 JPEG
   ===================================================================== */
const MAvatarCropper = {
    props: ['file'],
    emits: ['save', 'cancel'],
    setup(props, { emit }) {
        const VIEW = 280, OUT = 400;
        const imgRef     = ref(null);
        const imageUrl   = ref('');
        const natW       = ref(0), natH = ref(0);
        const userScale  = ref(1);
        const ox         = ref(0), oy = ref(0);
        const isDragging = ref(false);

        const baseScale  = computed(() => (natW.value && natH.value) ? Math.max(VIEW / natW.value, VIEW / natH.value) : 1);
        const totalScale = computed(() => baseScale.value * userScale.value);

        function clamp() {
            const hw = Math.max(0, (natW.value * totalScale.value - VIEW) / 2);
            const hh = Math.max(0, (natH.value * totalScale.value - VIEW) / 2);
            ox.value = Math.max(-hw, Math.min(hw, ox.value));
            oy.value = Math.max(-hh, Math.min(hh, oy.value));
        }

        const ptrs = new Map();
        let lastDist = 0;
        function onPtrDown(e) {
            e.currentTarget.setPointerCapture(e.pointerId);
            ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
            isDragging.value = true;
        }
        function onPtrMove(e) {
            const prev = ptrs.get(e.pointerId);
            if (!prev) return;
            if (ptrs.size === 1) {
                ox.value += e.clientX - prev.x;
                oy.value += e.clientY - prev.y;
                clamp();
            } else if (ptrs.size === 2) {
                const ids = [...ptrs.keys()];
                const other = ptrs.get(ids[0] === e.pointerId ? ids[1] : ids[0]);
                if (other) {
                    const d = Math.hypot(e.clientX - other.x, e.clientY - other.y);
                    if (lastDist) { userScale.value = Math.max(1, Math.min(5, userScale.value * (d / lastDist))); clamp(); }
                    lastDist = d;
                }
            }
            ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }
        function onPtrUp(e) {
            ptrs.delete(e.pointerId);
            if (ptrs.size < 2) lastDist = 0;
            if (ptrs.size === 0) isDragging.value = false;
        }
        function onWheel(e) {
            e.preventDefault();
            userScale.value = Math.max(1, Math.min(5, userScale.value - e.deltaY / 400));
            clamp();
        }
        function onImgLoad() {
            natW.value = imgRef.value.naturalWidth;
            natH.value = imgRef.value.naturalHeight;
            userScale.value = 1; ox.value = 0; oy.value = 0;
        }
        function save() {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = OUT;
            const ctx = canvas.getContext('2d');
            const ts = totalScale.value;
            ctx.drawImage(imgRef.value,
                natW.value / 2 - (VIEW / 2 + ox.value) / ts,
                natH.value / 2 - (VIEW / 2 + oy.value) / ts,
                VIEW / ts, VIEW / ts,
                0, 0, OUT, OUT);
            canvas.toBlob(blob => emit('save', blob), 'image/jpeg', 0.92);
        }
        watch(() => props.file, f => { if (f) imageUrl.value = URL.createObjectURL(f); }, { immediate: true });
        const imgStyle = computed(() => ({
            position: 'absolute', left: '50%', top: '50%', maxWidth: 'none', pointerEvents: 'none',
            transform: `translate(calc(-50% + ${ox.value}px), calc(-50% + ${oy.value}px)) scale(${totalScale.value})`,
            transformOrigin: 'center',
        }));
        const cropStyle = computed(() => ({
            position: 'relative',
            width: 'min(280px, calc(100vw - 80px))',
            height: 'min(280px, calc(100vw - 80px))',
            overflow: 'hidden',
            borderRadius: '50%',
            background: 'var(--bg-sub)',
            cursor: isDragging.value ? 'grabbing' : 'grab',
            touchAction: 'none',
            flexShrink: '0',
            boxShadow: '0 0 0 3px var(--accent)',
        }));
        return { imgRef, imageUrl, imgStyle, cropStyle, onPtrDown, onPtrMove, onPtrUp, onWheel, onImgLoad, save };
    },
    template: `
<div class="modal-overlay">
  <div class="modal-box" style="max-width:400px;">
    <div class="modal-head">
      <div class="modal-head-text">
        <div class="modal-icon-badge"><i class="fa fa-crop-simple"></i></div>
        <div class="modal-title-col">
          <span class="modal-title">Обрізати фото</span>
          <span class="modal-subtitle">Перетягніть · прокрутіть або зведіть для масштабу</span>
        </div>
      </div>
      <button class="modal-close" @click="$emit('cancel')"><i class="fa fa-times"></i></button>
    </div>
    <div class="modal-body" style="align-items:center;gap:16px;">
      <div :style="cropStyle"
           @pointerdown="onPtrDown" @pointermove="onPtrMove" @pointerup="onPtrUp" @pointercancel="onPtrUp" @wheel.prevent="onWheel">
        <img ref="imgRef" :src="imageUrl" :style="imgStyle" @load="onImgLoad" @dragstart.prevent>
      </div>
      <p style="font-size:11px;color:var(--text-muted);text-align:center;margin:0;">Результат: квадрат 400×400 px · JPG</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" style="flex:1;" @click="$emit('cancel')">Скасувати</button>
      <button class="btn btn-primary" style="flex:1;" @click="save"><i class="fa fa-check"></i> Зберегти</button>
    </div>
  </div>
</div>`
};

/* =====================================================================
   6. SETTINGS
   ===================================================================== */
const SettingsPage = {
    props: ['api', 'user'],
    emits: ['user-updated', 'restart-onboarding'],
    components: { MModal, MBadge, MTimePicker, ServiceFormBody, MAvatarCropper },
    setup(props, { emit }) {
        const tab = ref('profile');
        const workingHours = ref([]);
        const services = ref([]);
        const profile = ref(null);

        const savingProfile = ref(false);
        const savedProfile = ref(false);
        const savingPublic = ref(false);
        const savedPublic = ref(false);
        const savingHours = ref(false);
        const savedHours = ref(false);
        const showSvcModal = ref(false);
        const editingSvc = ref(null);
        const copied = ref(false);

        const pwForm = reactive({ current_password: '', password: '', password_confirmation: '' });
        const pwError = ref(''); const pwSaved = ref(false); const savingPw = ref(false);

        const formLoaded = ref(false);
        const hoursLoaded = ref(false);
        const profileDirty = ref(false);
        const hoursDirty = ref(false);
        const savedAll = ref(false);

        const form = reactive({
            name: props.user?.name || '',
            email: props.user?.email || '',
            bio: '', specialty: '', phone: '', city: '', country: '',
            instagram: '', website: '', booking_notice: '', cancellation_policy: '',
            is_public: true, is_accepting_bookings: true, show_availability: true, currency: 'UAH',
            theme: 'default', pub_corners: 'smooth', pub_accent: '#0891b2',
            social_links: { facebook: '', tiktok: '', telegram: '', whatsapp: '' },
        });

        const avatarUrl = ref(M.avatarSrc(props.user?.profile));
        const avatarUploading = ref(false);
        const fileInput = ref(null);
        const showCropper = ref(false);
        const cropperFile = ref(null);
        const user = computed(() => props.user || {});

        const publicUrl = computed(() => window.location.origin + '/master/' + (profile.value?.slug || ''));

        const previewAccent = computed(() => {
            if (form.theme === 'light') return form.pub_accent || '#0891b2';
            if (form.theme === 'dark') return form.pub_accent || '#22c55e';
            if (form.theme === 'bold') return '#111111';
            return '#3b5e47';
        });
        const previewBg = computed(() => ({ default:'#edeae4', light:'#f4f3f0', dark:'#0c0c0c', bold:'#ffffff' }[form.theme] || '#edeae4'));
        const previewIsDark = computed(() => form.theme === 'dark');
        const previewText = computed(() => previewIsDark.value ? '#f0f0f0' : '#1a1917');
        const previewSub = computed(() => previewIsDark.value ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.48)');

        watch(() => [form.name, form.bio, form.specialty, form.phone, form.city, form.country, form.instagram, form.website],
            () => { if (formLoaded.value) profileDirty.value = true; });

        watch(workingHours, () => { if (hoursLoaded.value) hoursDirty.value = true; }, { deep: true });

        async function load() {
            const { data } = await props.api.get('/profile');
            profile.value = data.profile;
            form.name = data.name || '';
            form.email = data.email || '';
            const p = data.profile || {};
            avatarUrl.value = M.avatarSrc(p);
            ['bio','specialty','phone','city','country','instagram','website','booking_notice','cancellation_policy','is_public','is_accepting_bookings','show_availability','currency','theme','pub_corners','pub_accent'].forEach(k => {
                if (p[k] !== undefined && p[k] !== null) form[k] = p[k];
            });
            form.social_links = { facebook: '', tiktok: '', telegram: '', whatsapp: '', ...(p.social_links || {}) };
            await nextTick();
            formLoaded.value = true;
        }

        function pickAvatar() { fileInput.value?.click(); }
        function onAvatarChange(e) {
            const file = e.target.files[0];
            if (!file) return;
            cropperFile.value = file;
            showCropper.value = true;
            e.target.value = '';
        }
        async function onCropSave(blob) {
            showCropper.value = false;
            avatarUploading.value = true;
            const fd = new FormData();
            fd.append('avatar', blob, 'avatar.jpg');
            try {
                const { data } = await props.api.post('/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                avatarUrl.value = M.avatarSrc({ avatar: data.avatar });
                emit('user-updated');
            } catch (e) {}
            avatarUploading.value = false;
        }

        function applyToAll(h) {
            workingHours.value.forEach(d => {
                if (d.is_working) { d.start_time = h.start_time; d.end_time = h.end_time; }
            });
        }

        async function loadHours() {
            const { data } = await props.api.get('/schedule/working-hours');
            const days = [0,1,2,3,4,5,6];
            workingHours.value = days.map(d => data.find(h => h.day_of_week === d) || { day_of_week: d, start_time: '09:00', end_time: '18:00', is_working: d >= 1 && d <= 5 });
            await nextTick();
            hoursLoaded.value = true;
        }
        async function saveHours() {
            savingHours.value = true;
            await props.api.put('/schedule/working-hours', { hours: workingHours.value });
            hoursDirty.value = false;
            savedHours.value = true; savingHours.value = false;
            setTimeout(() => savedHours.value = false, 2000);
        }
        async function loadServices() {
            const { data } = await props.api.get('/services');
            services.value = data;
        }
        function editSvc(s) { editingSvc.value = s; showSvcModal.value = true; }
        function newSvc() { editingSvc.value = null; showSvcModal.value = true; }
        async function deleteSvc(s) {
            if (!confirm('Видалити «' + s.name + '»?')) return;
            await props.api.delete('/services/' + s.id); loadServices();
        }
        async function toggleSvc(s) {
            await props.api.put('/services/' + s.id, { is_active: !s.is_active }); loadServices();
        }
        function onSvcSaved() { showSvcModal.value = false; loadServices(); }

        async function saveProfile() {
            savingProfile.value = true;
            await props.api.put('/profile', {
                name: form.name, bio: form.bio, specialty: form.specialty, phone: form.phone,
                city: form.city, country: form.country, instagram: form.instagram, website: form.website,
            });
            profileDirty.value = false;
            savedProfile.value = true; savingProfile.value = false;
            emit('user-updated');
            setTimeout(() => savedProfile.value = false, 2000);
        }

        async function savePublicSettings() {
            savingPublic.value = true;
            await props.api.put('/profile', {
                is_public: form.is_public, is_accepting_bookings: form.is_accepting_bookings, show_availability: form.show_availability,
                booking_notice: form.booking_notice, cancellation_policy: form.cancellation_policy,
                currency: form.currency, social_links: form.social_links, theme: form.theme, pub_corners: form.pub_corners, pub_accent: form.pub_accent,
            });
            savedPublic.value = true; savingPublic.value = false;
            setTimeout(() => savedPublic.value = false, 2500);
        }

        async function saveAll() {
            if (profileDirty.value) await saveProfile();
            if (hoursDirty.value) await saveHours();
            savedAll.value = true;
            setTimeout(() => savedAll.value = false, 2500);
        }

        function copyLink() {
            navigator.clipboard?.writeText(publicUrl.value);
            copied.value = true; setTimeout(() => copied.value = false, 2000);
        }

        async function changePassword() {
            pwError.value = ''; pwSaved.value = false;
            if (pwForm.password !== pwForm.password_confirmation) { pwError.value = 'Паролі не збігаються'; return; }
            savingPw.value = true;
            try {
                await props.api.post('/auth/change-password', pwForm);
                pwSaved.value = true; pwForm.current_password = ''; pwForm.password = ''; pwForm.password_confirmation = '';
            } catch(e) { pwError.value = e.response?.data?.message || 'Помилка'; }
            savingPw.value = false;
        }

        const dayNames = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'];

        function priceDisplay(s) {
            if (s.price_on_request) return 'За запитом';
            if (s.price) return '₴' + s.price;
            if (s.price_from && s.price_to) return '₴' + s.price_from + ' – ₴' + s.price_to;
            if (s.price_from) return 'від ₴' + s.price_from;
            return '—';
        }

        onMounted(() => { load(); loadHours(); loadServices(); });

        return {
            M, tab, workingHours, services, form, profile, user,
            savingProfile, savedProfile, savingPublic, savedPublic, savingHours, savedHours,
            profileDirty, hoursDirty, savedAll, saveAll,
            showSvcModal, editingSvc, copied, publicUrl,
            previewAccent, previewBg, previewIsDark, previewText, previewSub,
            pwForm, pwError, pwSaved, savingPw, dayNames, priceDisplay, saveHours, loadServices, editSvc, newSvc,
            deleteSvc, toggleSvc, onSvcSaved, saveProfile, savePublicSettings, copyLink, changePassword,
            avatarUrl, avatarUploading, fileInput, pickAvatar, onAvatarChange, onCropSave, showCropper, cropperFile, applyToAll,
        };
    },
    template: `
<div>
  <m-avatar-cropper v-if="showCropper" :file="cropperFile" @save="onCropSave" @cancel="showCropper = false"></m-avatar-cropper>

  <h1 class="mb-16">Налаштування</h1>

  <div class="settings-layout">
    <!-- Nav -->
    <div class="settings-nav">
      <button :class="'settings-nav-item' + (tab==='profile' ? ' active' : '')" @click="tab='profile'">
        <i class="fa fa-user"></i> Профіль
      </button>
      <button :class="'settings-nav-item' + (tab==='public' ? ' active' : '')" @click="tab='public'">
        <i class="fa fa-globe"></i> Публічна сторінка
      </button>
      <button :class="'settings-nav-item' + (tab==='subscription' ? ' active' : '')" @click="tab='subscription'">
        <i class="fa fa-crown"></i> Підписка
      </button>
    </div>

    <!-- Panels -->
    <div class="settings-panel">

      <!-- Profile: 2×2 tiles -->
      <template v-if="tab==='profile'">
        <div class="settings-tiles">

          <!-- Tile 1: Personal info + avatar -->
          <div :class="'card settings-tile' + (profileDirty ? ' tile-dirty' : '')">
            <div class="card-header">
              <span class="card-title"><i class="fa fa-user" style="margin-right:6px;opacity:.5;"></i>Особиста інформація</span>
              <span v-if="profileDirty" class="dirty-badge">Змінено</span>
            </div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:12px;">
              <div class="avatar-upload-row">
                <div class="avatar av-lg">
                  <img v-if="avatarUrl" :src="avatarUrl" :alt="form.name">
                  <span v-else>{{ form.name?.charAt(0)?.toUpperCase() || '?' }}</span>
                </div>
                <div>
                  <button type="button" class="btn btn-secondary btn-sm" @click="pickAvatar" :disabled="avatarUploading">
                    <i class="fa fa-camera"></i> {{ avatarUploading ? 'Завантаження…' : 'Змінити фото' }}
                  </button>
                  <input ref="fileInput" type="file" accept="image/*" style="display:none;" @change="onAvatarChange">
                  <p style="font-size:11px;color:var(--text-muted);margin-top:4px;">JPG або PNG, до 2 МБ</p>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="label">Повне ім'я</label>
                  <input v-model="form.name" class="input">
                </div>
                <div class="form-group">
                  <label class="label">Спеціалізація</label>
                  <select v-model="form.specialty" class="select">
                    <option value="">Оберіть…</option>
                    <option value="tattoo">Тату-майстер</option>
                    <option value="nails">Нейл-майстер</option>
                    <option value="brows">Бровіст</option>
                    <option value="lashes">Майстер вій</option>
                    <option value="piercing">П'єрсер</option>
                    <option value="pmu">Перманентний макіяж</option>
                    <option value="hair">Перукар</option>
                    <option value="massage">Масажист</option>
                    <option value="other">Інше</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="label">Телефон</label>
                  <input v-model="form.phone" class="input" type="tel">
                </div>
                <div class="form-group">
                  <label class="label">Instagram</label>
                  <input v-model="form.instagram" class="input" placeholder="@handle">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="label">Місто</label>
                  <input v-model="form.city" class="input">
                </div>
                <div class="form-group">
                  <label class="label">Країна</label>
                  <input v-model="form.country" class="input">
                </div>
              </div>
              <div class="form-group">
                <label class="label">Про себе</label>
                <textarea v-model="form.bio" class="textarea" rows="3" placeholder="Розкажіть клієнтам про себе…"></textarea>
              </div>
              <div class="form-group">
                <label class="label">Сайт</label>
                <input v-model="form.website" class="input" type="url" placeholder="https://…">
              </div>
            </div>
          </div>

          <!-- Tile 2: Working hours -->
          <div :class="'card settings-tile' + (hoursDirty ? ' tile-dirty' : '')">
            <div class="card-header">
              <span class="card-title"><i class="fa fa-clock" style="margin-right:6px;opacity:.5;"></i>Робочі години</span>
              <span v-if="hoursDirty" class="dirty-badge">Змінено</span>
            </div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:4px;padding-top:10px;padding-bottom:12px;">
              <div v-for="h in workingHours" :key="h.day_of_week" class="wh-row wh-compact">
                <span class="wh-day-short">{{ dayNames[h.day_of_week] }}</span>
                <button :class="'toggle' + (h.is_working ? ' on' : '')" @click="h.is_working = !h.is_working" style="flex-shrink:0;"></button>
                <template v-if="h.is_working">
                  <m-time-picker v-model="h.start_time"></m-time-picker>
                  <span style="color:var(--text-muted);font-size:12px;flex-shrink:0;">—</span>
                  <m-time-picker v-model="h.end_time"></m-time-picker>
                </template>
                <span v-else style="font-size:12px;color:var(--text-muted);">Вихідний</span>
              </div>
              <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
                <p style="font-size:11px;color:var(--text-muted);">Утримуйте <kbd style="font-size:10px;background:var(--bg-2);border:1px solid var(--border);border-radius:3px;padding:1px 4px;">Alt</kbd> на часі щоб застосувати до всіх робочих днів</p>
              </div>
            </div>
          </div>

          <!-- Tile 3: Services -->
          <div class="card settings-tile">
            <div class="card-header">
              <span class="card-title"><i class="fa fa-scissors" style="margin-right:6px;opacity:.5;"></i>Послуги ({{ services.length }})</span>
              <button class="btn btn-primary btn-sm" @click="newSvc"><i class="fa fa-plus"></i> Додати</button>
            </div>
            <div style="max-height:320px;overflow-y:auto;">
              <div v-if="!services.length" class="empty" style="padding:28px 16px;"><i class="fa fa-scissors"></i><p>Послуг ще немає</p></div>
              <div v-for="s in services" :key="s.id" class="svc-card">
                <div class="svc-dot" :style="{background: s.color || '#c9a84c'}"></div>
                <div class="svc-info">
                  <div class="svc-name" :style="s.is_active ? '' : 'opacity:.5'">{{ s.name }}</div>
                  <div class="svc-meta">{{ s.duration ? s.duration + ' хв' : '' }}{{ s.duration && priceDisplay(s) !== '—' ? ' · ' : '' }}{{ priceDisplay(s) !== '—' ? priceDisplay(s) : '' }}</div>
                </div>
                <button class="btn btn-ghost btn-sm btn-icon" @click="toggleSvc(s)" :title="s.is_active ? 'Деактивувати' : 'Активувати'">
                  <i :class="'fa fa-' + (s.is_active ? 'eye-slash' : 'eye')"></i>
                </button>
                <button class="btn btn-ghost btn-sm btn-icon" @click="editSvc(s)"><i class="fa fa-pen"></i></button>
                <button class="btn btn-danger btn-sm btn-icon" @click="deleteSvc(s)"><i class="fa fa-trash"></i></button>
              </div>
            </div>
          </div>

          <!-- Tile 4: Security + Account info -->
          <div class="card settings-tile">
            <div class="card-header"><span class="card-title"><i class="fa fa-shield-halved" style="margin-right:6px;opacity:.5;"></i>Акаунт та безпека</span></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:14px;">
              <div class="account-info-grid">
                <div class="account-info-item">
                  <span class="account-info-label">Роль</span>
                  <m-badge :status="user.role"></m-badge>
                </div>
                <div class="account-info-item">
                  <span class="account-info-label">Тариф</span>
                  <m-badge :status="user.plan"></m-badge>
                </div>
                <div class="account-info-item">
                  <span class="account-info-label">Підписка</span>
                  <m-badge :status="user.subscription_status"></m-badge>
                </div>
                <div class="account-info-item">
                  <span class="account-info-label">Реєстрація</span>
                  <span class="account-info-value">{{ M.fmtFullDate(user.created_at) }}</span>
                </div>
              </div>
              <div style="border-top:1px solid var(--border);padding-top:12px;">
                <p style="font-size:12px;font-weight:600;margin-bottom:10px;">Зміна пароля</p>
                <div style="display:flex;flex-direction:column;gap:8px;">
                  <input type="password" v-model="pwForm.current_password" class="input" placeholder="Поточний пароль">
                  <input type="password" v-model="pwForm.password" class="input" placeholder="Новий пароль">
                  <input type="password" v-model="pwForm.password_confirmation" class="input" placeholder="Підтвердження">
                  <p v-if="pwError" style="color:var(--cancelled);font-size:12px;">{{ pwError }}</p>
                  <p v-if="pwSaved" style="color:var(--completed);font-size:12px;"><i class="fa fa-check"></i> Пароль змінено</p>
                  <button class="btn btn-secondary btn-sm" @click="changePassword" :disabled="savingPw" style="align-self:flex-start;">
                    {{ savingPw ? 'Збереження…' : 'Змінити пароль' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div style="display:flex;justify-content:center;padding-top:8px;">
          <button type="button" class="btn btn-ghost btn-sm" style="color:var(--text-muted);font-size:12px;" @click="$emit('restart-onboarding')">
            <i class="fa fa-wand-magic-sparkles" style="font-size:11px;"></i> Пройти майстра налаштувань знову
          </button>
        </div>

      </template>

      <!-- Public page -->
      <template v-if="tab==='public'">
        <div class="card card-body pub-link-bar">
          <div>
            <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);letter-spacing:.5px;margin-bottom:4px;">Ваше посилання</p>
            <code style="font-size:12px;color:var(--accent);word-break:break-all;">{{ publicUrl }}</code>
          </div>
          <div class="flex gap-8" style="flex-shrink:0;">
            <button class="btn btn-secondary btn-sm" @click="copyLink">
              <i :class="copied ? 'fa fa-check' : 'fa fa-link'"></i> {{ copied ? 'Скопійовано!' : 'Копіювати' }}
            </button>
            <a :href="publicUrl" target="_blank" class="btn btn-ghost btn-sm"><i class="fa fa-arrow-up-right-from-square"></i> Переглянути</a>
          </div>
        </div>

        <div class="pub-layout">
          <!-- Form -->
          <div style="display:flex;flex-direction:column;gap:16px;">
            <!-- Visibility -->
            <div class="card card-body" style="display:flex;flex-direction:column;gap:12px;">
              <h2>Видимість</h2>
              <div class="toggle-wrap">
                <button :class="'toggle' + (form.is_public ? ' on' : '')" @click="form.is_public = !form.is_public"></button>
                <span style="font-size:13px;">Сторінка <strong>{{ form.is_public ? 'відкрита' : 'прихована' }}</strong></span>
              </div>
              <div class="toggle-wrap">
                <button :class="'toggle' + (form.is_accepting_bookings ? ' on' : '')" @click="form.is_accepting_bookings = !form.is_accepting_bookings"></button>
                <span style="font-size:13px;">{{ form.is_accepting_bookings ? 'Приймає' : 'Не приймає' }} запити на запис</span>
              </div>
              <div class="toggle-wrap">
                <button :class="'toggle' + (form.show_availability ? ' on' : '')" @click="form.show_availability = !form.show_availability"></button>
                <span style="font-size:13px;">Календар доступності <strong>{{ form.show_availability ? 'увімкнений' : 'вимкнений' }}</strong></span>
              </div>
            </div>

            <!-- Booking info -->
            <div class="card">
              <div class="card-header"><span class="card-title">Умови запису</span></div>
              <div class="card-body" style="display:flex;flex-direction:column;gap:12px;">
                <div class="form-group">
                  <label class="label">Умови бронювання</label>
                  <input v-model="form.booking_notice" class="input" placeholder="напр. Записуйтесь мінімум за 2 тижні">
                </div>
                <div class="form-group">
                  <label class="label">Правила скасування</label>
                  <textarea v-model="form.cancellation_policy" class="textarea" placeholder="Опишіть умови скасування запису…"></textarea>
                </div>
                <div class="form-group">
                  <label class="label">Валюта</label>
                  <select v-model="form.currency" class="select" style="width:120px;">
                    <option value="USD">USD $</option>
                    <option value="EUR">EUR €</option>
                    <option value="GBP">GBP £</option>
                    <option value="UAH">UAH ₴</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Social links -->
            <div class="card">
              <div class="card-header"><span class="card-title">Соціальні мережі</span></div>
              <div class="card-body" style="display:flex;flex-direction:column;gap:12px;">
                <div class="form-row">
                  <div class="form-group">
                    <label class="label">Facebook</label>
                    <div class="input-icon-group">
                      <i class="fa-brands fa-facebook"></i>
                      <input v-model="form.social_links.facebook" class="input" placeholder="https://facebook.com/…">
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="label">TikTok</label>
                    <div class="input-icon-group">
                      <i class="fa-brands fa-tiktok"></i>
                      <input v-model="form.social_links.tiktok" class="input" placeholder="https://tiktok.com/@…">
                    </div>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="label">Telegram</label>
                    <div class="input-icon-group">
                      <i class="fa-brands fa-telegram"></i>
                      <input v-model="form.social_links.telegram" class="input" placeholder="https://t.me/…">
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="label">WhatsApp</label>
                    <div class="input-icon-group">
                      <i class="fa-brands fa-whatsapp"></i>
                      <input v-model="form.social_links.whatsapp" class="input" placeholder="https://wa.me/…">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Theme picker -->
            <div class="card">
              <div class="card-header"><span class="card-title"><i class="fa fa-palette" style="color:var(--accent);margin-right:6px;"></i>Тема публічної сторінки</span></div>
              <div class="card-body" style="display:flex;flex-direction:column;gap:20px;">
                <div class="theme-picker-grid">
                  <button v-for="t in [
                    { id:'default', label:'Default',   sub:'Мінімалізм' },
                    { id:'light',   label:'Light',     sub:'Акцент на колір' },
                    { id:'dark',    label:'Dark',      sub:'Нічний режим' },
                    { id:'bold',    label:'Editorial', sub:'Контраст' },
                  ]" :key="t.id" type="button"
                    :class="['theme-swatch-btn', form.theme === t.id ? 'active' : '']"
                    @click="form.theme = t.id; if(t.id==='light' && !['#0891b2','#db2777','#c4632a','#059669'].includes(form.pub_accent)) form.pub_accent='#0891b2'; if(t.id==='dark' && !['#22c55e','#d97706','#a855f7'].includes(form.pub_accent)) form.pub_accent='#22c55e';">
                    <div :class="'theme-swatch theme-swatch-' + t.id">
                      <div class="ts-geo ts-geo-1" :style="form.pub_corners==='sharp'?{borderRadius:'0'}:{}"></div>
                      <div class="ts-geo ts-geo-2" :style="form.pub_corners==='sharp'?{borderRadius:'0'}:{}"></div>
                      <div class="ts-geo ts-geo-3" :style="form.pub_corners==='sharp'?{borderRadius:'0'}:{}"></div>
                    </div>
                    <div class="theme-swatch-label">{{ t.label }}</div>
                    <div class="theme-swatch-sub">{{ t.sub }}</div>
                    <i v-if="form.theme === t.id" class="fa fa-circle-check theme-swatch-check"></i>
                  </button>
                </div>

                <!-- Accent colour picker (only for light / dark themes) -->
                <div v-if="form.theme === 'light' || form.theme === 'dark'" class="accent-picker">
                  <span class="accent-picker-label">Акцентний колір</span>
                  <div class="accent-dots">
                    <template v-if="form.theme === 'light'">
                      <button v-for="a in [{c:'#0891b2',l:'Ocean'},{c:'#db2777',l:'Sakura'},{c:'#c4632a',l:'Artisan'},{c:'#059669',l:'Mint'}]"
                        :key="a.c" type="button"
                        :class="['accent-dot', form.pub_accent === a.c ? 'active' : '']"
                        :style="{background: a.c}" :title="a.l"
                        @click="form.pub_accent = a.c">
                      </button>
                    </template>
                    <template v-if="form.theme === 'dark'">
                      <button v-for="a in [{c:'#22c55e',l:'Noir'},{c:'#d97706',l:'Copper'},{c:'#a855f7',l:'Aurora'}]"
                        :key="a.c" type="button"
                        :class="['accent-dot', form.pub_accent === a.c ? 'active' : '']"
                        :style="{background: a.c}" :title="a.l"
                        @click="form.pub_accent = a.c">
                      </button>
                    </template>
                  </div>
                </div>

                <!-- Corner style toggle -->
                <div>
                  <p style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;">Стиль кутів</p>
                  <div class="corners-toggle">
                    <button type="button" :class="['corners-opt', form.pub_corners === 'smooth' ? 'active' : '']" @click="form.pub_corners = 'smooth'">
                      <span class="corners-preview corners-smooth"></span>
                      <span>Заокруглені</span>
                    </button>
                    <button type="button" :class="['corners-opt', form.pub_corners === 'sharp' ? 'active' : '']" @click="form.pub_corners = 'sharp'">
                      <span class="corners-preview corners-sharp"></span>
                      <span>Гострі</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-8">
              <p v-if="savedPublic" style="color:var(--completed);font-size:13px;align-self:center;"><i class="fa fa-check"></i> Збережено</p>
              <button class="btn btn-primary" @click="savePublicSettings" :disabled="savingPublic">
                <i class="fa fa-save"></i> {{ savingPublic ? 'Збереження…' : 'Зберегти зміни' }}
              </button>
            </div>
          </div>

          <!-- Preview -->
          <div class="pub-preview">
            <div class="pub-preview-header" :style="{background:previewBg,borderBottom:form.theme==='bold'?'2px solid #111':'1px solid rgba(0,0,0,0.08)'}">
              <div class="avatar av-lg" :style="{margin:'0 auto 10px',borderRadius:form.pub_corners==='sharp'?'6px':'50%',background:previewAccent+'22',color:previewAccent}">
                <img v-if="avatarUrl" :src="avatarUrl" :alt="form.name" style="border-radius:inherit;">
                <template v-else>{{ form.name?.charAt(0) }}</template>
              </div>
              <p :style="{fontWeight:'700',fontSize:'16px',color:previewText}">{{ form.name || "Ваше ім'я" }}</p>
              <p :style="{fontSize:'12px',marginTop:'2px',color:previewSub}">{{ form.specialty || 'Майстер' }}</p>
              <span v-if="form.specialty" :style="{display:'inline-block',marginTop:'6px',padding:'3px 10px',fontSize:'10px',fontWeight:'700',borderRadius:form.pub_corners==='sharp'?'0':'20px',background:previewAccent+'1a',color:previewAccent,textTransform:'uppercase',letterSpacing:'.6px'}">{{ form.specialty }}</span>
              <p v-if="form.city" :style="{fontSize:'11px',color:previewSub,marginTop:'6px'}"><i class="fa fa-location-dot"></i> {{ form.city }}{{ form.country ? ', ' + form.country : '' }}</p>
            </div>
            <div style="padding:14px 16px;border-bottom:1px solid var(--border);">
              <p v-if="form.bio" style="font-size:12px;color:var(--text-sub);line-height:1.6;">{{ form.bio }}</p>
              <p v-else style="font-size:12px;color:var(--text-muted);font-style:italic;">Опис ще не заповнено</p>
            </div>
            <div style="padding:12px 16px;">
              <p style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;letter-spacing:.5px;">Ваше посилання</p>
              <code style="font-size:11px;color:var(--accent);word-break:break-all;">{{ publicUrl }}</code>
            </div>
            <div style="padding:0 16px 14px;">
              <button :class="'btn w-full ' + (form.is_accepting_bookings ? 'btn-primary' : 'btn-secondary')"
                      :style="form.is_accepting_bookings ? {background:previewAccent,borderColor:previewAccent,borderRadius:form.pub_corners==='sharp'?'0':'50px',color:'#fff'} : {}"
                      style="justify-content:center;" disabled>
                <i class="fa fa-calendar-plus"></i>
                {{ form.is_accepting_bookings ? 'Записатися' : 'Запис закритий' }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Subscription -->
      <template v-if="tab==='subscription'">
        <div class="sub-current-plan card">
          <div class="card-body" style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
            <div class="sub-plan-icon"><i class="fa fa-crown"></i></div>
            <div style="flex:1;min-width:160px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <span style="font-size:20px;font-weight:700;">Pro</span>
                <span class="sub-status-badge sub-active"><i class="fa fa-circle-check"></i> Активна</span>
              </div>
              <p style="font-size:13px;color:var(--text-sub);">Наступне списання <strong>14 липня 2026</strong> · 299 ₴/міс</p>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <button class="btn btn-ghost btn-sm">Скасувати підписку</button>
            </div>
          </div>
        </div>

        <div class="sub-grid">
          <!-- Features -->
          <div class="card">
            <div class="card-header"><span class="card-title">Що включено в Pro</span></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:10px;">
              <div class="sub-feature"><i class="fa fa-check sub-feat-ok"></i><span>Необмежена кількість клієнтів та записів</span></div>
              <div class="sub-feature"><i class="fa fa-check sub-feat-ok"></i><span>Публічна сторінка майстра</span></div>
              <div class="sub-feature"><i class="fa fa-check sub-feat-ok"></i><span>Онлайн-записи та управління запитами</span></div>
              <div class="sub-feature"><i class="fa fa-check sub-feat-ok"></i><span>Повна аналітика та статистика</span></div>
              <div class="sub-feature"><i class="fa fa-check sub-feat-ok"></i><span>Управління послугами та ціновою сіткою</span></div>
              <div class="sub-feature"><i class="fa fa-check sub-feat-ok"></i><span>Розклад, робочі години, архів</span></div>
              <div class="sub-feature sub-feat-soon"><i class="fa fa-clock" style="color:var(--text-muted);"></i><span>SMS-нагадування клієнтам <em>(незабаром)</em></span></div>
              <div class="sub-feature sub-feat-soon"><i class="fa fa-clock" style="color:var(--text-muted);"></i><span>Інтеграція з Instagram <em>(незабаром)</em></span></div>
            </div>
          </div>

          <!-- Upgrade card -->
          <div class="card sub-upgrade-card">
            <div class="card-body" style="display:flex;flex-direction:column;gap:14px;align-items:center;text-align:center;">
              <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#e8c96d);display:flex;align-items:center;justify-content:center;">
                <i class="fa fa-rocket" style="color:#fff;font-size:20px;"></i>
              </div>
              <div>
                <p style="font-size:16px;font-weight:700;margin-bottom:4px;">Business</p>
                <p style="font-size:13px;color:var(--text-sub);">Для студій та команд майстрів</p>
              </div>
              <div style="background:var(--bg-2);border-radius:var(--r);padding:14px 20px;width:100%;">
                <p style="font-size:24px;font-weight:800;">599 ₴<span style="font-size:13px;font-weight:400;color:var(--text-muted);">/міс</span></p>
              </div>
              <div style="width:100%;text-align:left;display:flex;flex-direction:column;gap:6px;">
                <div class="sub-feature"><i class="fa fa-check sub-feat-ok"></i><span>Усе з Pro</span></div>
                <div class="sub-feature"><i class="fa fa-check sub-feat-ok"></i><span>До 5 майстрів в одному акаунті</span></div>
                <div class="sub-feature"><i class="fa fa-check sub-feat-ok"></i><span>Пріоритетна підтримка</span></div>
                <div class="sub-feature"><i class="fa fa-check sub-feat-ok"></i><span>Корпоративний домен</span></div>
              </div>
              <button class="btn btn-primary w-full" style="justify-content:center;" disabled>
                <i class="fa fa-arrow-up"></i> Перейти на Business
              </button>
              <p style="font-size:10px;color:var(--text-muted);">Незабаром · Наразі в розробці</p>
            </div>
          </div>
        </div>

        <!-- Billing history -->
        <div class="card">
          <div class="card-header"><span class="card-title">Історія платежів</span></div>
          <div>
            <div class="sub-bill-row">
              <div>
                <p style="font-size:13px;font-weight:500;">Pro · червень 2026</p>
                <p style="font-size:11px;color:var(--text-muted);">14 червня 2026</p>
              </div>
              <span class="sub-bill-amount">299 ₴</span>
              <span class="sub-status-badge sub-active" style="font-size:11px;">Сплачено</span>
            </div>
            <div class="sub-bill-row">
              <div>
                <p style="font-size:13px;font-weight:500;">Pro · травень 2026</p>
                <p style="font-size:11px;color:var(--text-muted);">14 травня 2026</p>
              </div>
              <span class="sub-bill-amount">299 ₴</span>
              <span class="sub-status-badge sub-active" style="font-size:11px;">Сплачено</span>
            </div>
            <div class="sub-bill-row">
              <div>
                <p style="font-size:13px;font-weight:500;">Pro · квітень 2026</p>
                <p style="font-size:11px;color:var(--text-muted);">14 квітня 2026</p>
              </div>
              <span class="sub-bill-amount">299 ₴</span>
              <span class="sub-status-badge sub-active" style="font-size:11px;">Сплачено</span>
            </div>
          </div>
        </div>
      </template>

    </div>
  </div>

  <!-- Floating save button / saved toast -->
  <div v-if="savedAll" class="float-saved-toast">
    <i class="fa fa-circle-check"></i> Зміни збережено
  </div>
  <div v-else-if="profileDirty || hoursDirty" class="float-save-wrap">
    <button class="btn btn-primary float-save-btn" @click="saveAll" :disabled="savingProfile || savingHours">
      <i class="fa fa-floppy-disk"></i>
      {{ (savingProfile || savingHours) ? 'Збереження…' : 'Зберегти зміни' }}
    </button>
  </div>

  <!-- Service modal -->
  <m-modal :show="showSvcModal" :title="editingSvc ? 'Редагувати послугу' : 'Нова послуга'" @close="showSvcModal=false">
    <service-form-body :api="api" :existing="editingSvc" @saved="onSvcSaved" @cancel="showSvcModal=false"></service-form-body>
  </m-modal>
</div>`
};

/* =====================================================================
   6. FINANCES
   ===================================================================== */
const FinancesPage = {
    props: ['api'],
    components: { MModal },
    setup(props) {
        const expenses = ref([]);
        const income = ref([]);
        const loading = ref(false);
        const tab = ref('expenses');
        const year = ref(new Date().getFullYear());
        const month = ref(new Date().getMonth() + 1);
        const showModal = ref(false);
        const editingExp = ref(null);
        const saving = ref(false);
        const expForm = reactive({ amount: '', category: 'other', description: '', date: new Date().toISOString().split('T')[0] });

        const monthNames = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
        const monthLabel = computed(() => monthNames[month.value - 1] + ' ' + year.value);
        const fromDate = computed(() => year.value + '-' + String(month.value).padStart(2,'0') + '-01');
        const toDate = computed(() => { const d = new Date(year.value, month.value, 0); return d.toISOString().split('T')[0]; });

        const totalExp = computed(() => expenses.value.reduce((s,e) => s + Number(e.amount), 0));
        const totalInc = computed(() => income.value.reduce((s,a) => s + Number(a.price), 0));
        const profit = computed(() => totalInc.value - totalExp.value);

        const catColors = { rent:'#f59e0b', materials:'#3b82f6', ads:'#8b5cf6', equipment:'#10b981', subscription:'#06b6d4', other:'#6b7280' };
        const catLabels = { rent:'Оренда', materials:'Матеріали', ads:'Реклама', equipment:'Обладнання', subscription:'Підписка', other:'Інше' };
        const catList = Object.entries(catLabels).map(([v,l]) => ({ v, l }));

        async function load() {
            loading.value = true;
            const [exp, inc] = await Promise.all([
                props.api.get('/expenses', { params: { from: fromDate.value, to: toDate.value } }).catch(()=>({data:[]})),
                props.api.get('/finances/income', { params: { from: fromDate.value, to: toDate.value } }).catch(()=>({data:[]})),
            ]);
            expenses.value = exp.data;
            income.value = inc.data;
            loading.value = false;
        }

        function openAdd() {
            editingExp.value = null;
            Object.assign(expForm, { amount:'', category:'other', description:'', date: fromDate.value });
            showModal.value = true;
        }
        function openEdit(e) {
            editingExp.value = e;
            Object.assign(expForm, { amount: e.amount, category: e.category, description: e.description||'', date: e.date });
            showModal.value = true;
        }
        async function saveExpense() {
            saving.value = true;
            if (editingExp.value) { await props.api.put('/expenses/'+editingExp.value.id, expForm); }
            else { await props.api.post('/expenses', expForm); }
            saving.value = false; showModal.value = false; load();
        }
        async function deleteExpense(e) {
            if (!confirm('Видалити витрату?')) return;
            await props.api.delete('/expenses/'+e.id); load();
        }
        function prevMonth() { if (month.value===1){month.value=12;year.value--;}else month.value--; }
        function nextMonth() { if (month.value===12){month.value=1;year.value++;}else month.value++; }

        watch([year, month], load);
        onMounted(load);

        return { expenses, income, loading, tab, year, month, monthLabel, showModal, editingExp, saving, expForm,
            totalExp, totalInc, profit, catColors, catLabels, catList,
            openAdd, openEdit, saveExpense, deleteExpense, prevMonth, nextMonth };
    },
    template: `
<div>
  <div class="fin-header">
    <h1>Фінанси</h1>
    <div class="fin-month-nav">
      <button class="btn btn-ghost btn-sm btn-icon" @click="prevMonth"><i class="fa fa-chevron-left"></i></button>
      <span class="fin-month-label">{{ monthLabel }}</span>
      <button class="btn btn-ghost btn-sm btn-icon" @click="nextMonth"><i class="fa fa-chevron-right"></i></button>
    </div>
  </div>

  <!-- Summary cards -->
  <div class="fin-summary">
    <div class="fin-sum-card fin-sum-income">
      <div class="fin-sum-icon"><i class="fa fa-arrow-trend-up"></i></div>
      <div class="fin-sum-body">
        <div class="fin-sum-label">Дохід</div>
        <div class="fin-sum-value">₴{{ Number(totalInc).toLocaleString() }}</div>
      </div>
    </div>
    <div class="fin-sum-card fin-sum-expense">
      <div class="fin-sum-icon"><i class="fa fa-arrow-trend-down"></i></div>
      <div class="fin-sum-body">
        <div class="fin-sum-label">Витрати</div>
        <div class="fin-sum-value">₴{{ Number(totalExp).toLocaleString() }}</div>
      </div>
    </div>
    <div :class="['fin-sum-card', profit >= 0 ? 'fin-sum-profit' : 'fin-sum-loss']">
      <div class="fin-sum-icon"><i :class="'fa fa-scale-' + (profit>=0 ? 'balanced' : 'unbalanced')"></i></div>
      <div class="fin-sum-body">
        <div class="fin-sum-label">Прибуток</div>
        <div class="fin-sum-value">{{ profit >= 0 ? '+' : '' }}₴{{ Number(profit).toLocaleString() }}</div>
      </div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="page-tabs mb-16">
    <button :class="['page-tab', tab==='expenses' ? 'active' : '']" @click="tab='expenses'">
      <i class="fa fa-receipt"></i> Витрати
    </button>
    <button :class="['page-tab', tab==='income' ? 'active' : '']" @click="tab='income'">
      <i class="fa fa-coins"></i> Доходи
    </button>
  </div>

  <!-- Expenses tab -->
  <template v-if="tab==='expenses'">
    <div class="flex items-center justify-between mb-12">
      <span style="font-size:13px;color:var(--text-muted);">{{ expenses.length }} записів</span>
      <button class="btn btn-primary btn-sm" @click="openAdd"><i class="fa fa-plus"></i> Додати витрату</button>
    </div>
    <div v-if="loading" class="empty"><i class="fa fa-spinner fa-spin"></i></div>
    <div v-else-if="!expenses.length" class="empty">
      <i class="fa fa-receipt"></i><p>Витрат за цей місяць немає</p>
      <button class="btn btn-primary btn-sm" @click="openAdd"><i class="fa fa-plus"></i> Додати</button>
    </div>
    <div v-else class="card">
      <div class="fin-exp-list">
        <div v-for="e in expenses" :key="e.id" class="fin-exp-row" @click="openEdit(e)">
          <span class="fin-exp-dot" :style="{background: catColors[e.category]||'#999'}"></span>
          <div class="fin-exp-info">
            <div class="fin-exp-name">{{ e.description || catLabels[e.category] || e.category }}</div>
            <div class="fin-exp-meta">{{ catLabels[e.category]||e.category }} · {{ new Date(e.date).toLocaleDateString('uk',{day:'numeric',month:'short'}) }}</div>
          </div>
          <span class="fin-exp-amount">₴{{ Number(e.amount).toLocaleString() }}</span>
          <button class="btn btn-ghost btn-icon btn-sm" @click.stop="deleteExpense(e)" style="color:var(--cancelled);"><i class="fa fa-trash"></i></button>
        </div>
      </div>
    </div>
  </template>

  <!-- Income tab -->
  <template v-else>
    <div style="margin-bottom:12px;font-size:13px;color:var(--text-muted);">{{ income.length }} завершених сесій</div>
    <div v-if="loading" class="empty"><i class="fa fa-spinner fa-spin"></i></div>
    <div v-else-if="!income.length" class="empty"><i class="fa fa-coins"></i><p>Доходів за цей місяць немає</p></div>
    <div v-else class="card">
      <div class="fin-exp-list">
        <div v-for="a in income" :key="a.id" class="fin-exp-row">
          <div class="avatar av-xs" style="flex-shrink:0;">{{ a.client?.name?.charAt(0) }}</div>
          <div class="fin-exp-info">
            <div class="fin-exp-name">{{ a.client?.name || '—' }}</div>
            <div class="fin-exp-meta">{{ a.service?.name || 'Сесія' }} · {{ new Date(a.scheduled_at).toLocaleDateString('uk',{day:'numeric',month:'short'}) }}</div>
          </div>
          <span class="fin-exp-amount" style="color:var(--completed);">+₴{{ Number(a.price).toLocaleString() }}</span>
        </div>
      </div>
    </div>
  </template>

  <!-- Add/Edit modal -->
  <m-modal :show="showModal" :title="editingExp ? 'Редагувати витрату' : 'Нова витрата'" size="sm" @close="showModal=false">
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div class="form-row">
        <div class="form-group">
          <label class="label">Сума (₴)</label>
          <input type="number" v-model="expForm.amount" class="input" placeholder="0" min="0" step="0.01" autofocus>
        </div>
        <div class="form-group">
          <label class="label">Дата</label>
          <input type="date" v-model="expForm.date" class="input">
        </div>
      </div>
      <div class="form-group">
        <label class="label">Категорія</label>
        <div class="cat-picker">
          <button v-for="c in catList" :key="c.v" type="button"
            :class="['cat-btn', expForm.category===c.v ? 'active' : '']"
            :style="expForm.category===c.v ? {borderColor: catColors[c.v], background: catColors[c.v]+'22', color: catColors[c.v]} : {}"
            @click="expForm.category=c.v">{{ c.l }}</button>
        </div>
      </div>
      <div class="form-group">
        <label class="label">Опис</label>
        <input type="text" v-model="expForm.description" class="input" placeholder="Необов'язково">
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-ghost" @click="showModal=false">Скасувати</button>
        <button class="btn btn-primary" :disabled="!expForm.amount || saving" @click="saveExpense">
          {{ saving ? 'Збереження…' : 'Зберегти' }}
        </button>
      </div>
    </div>
  </m-modal>
</div>`
};

/* =====================================================================
   7. ANALYTICS
   ===================================================================== */
const AnalyticsPage = {
    props: ['api'],
    setup(props) {
        const data = ref(null);
        const loading = ref(false);
        const period = ref('month');
        const from = ref('');
        const to = ref('');
        const chartInstances = {};

        function setPeriod(p) {
            period.value = p;
            const now = new Date();
            if (p === 'month') {
                from.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                to.value = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split('T')[0];
            } else if (p === 'quarter') {
                const q = Math.floor(now.getMonth()/3);
                from.value = new Date(now.getFullYear(), q*3, 1).toISOString().split('T')[0];
                to.value = new Date(now.getFullYear(), q*3+3, 0).toISOString().split('T')[0];
            } else if (p === 'year') {
                from.value = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                to.value = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
            }
        }

        function mkChart(id, type, chartData, opts) {
            const el = document.getElementById(id); if (!el) return;
            chartInstances[id]?.destroy();
            chartInstances[id] = new Chart(el, {
                type, data: chartData,
                options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, ...(opts||{}) }
            });
        }

        function renderCharts(d) {
            const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3b5e47';
            const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#888';

            // Revenue bar
            mkChart('an-revenue', 'bar', {
                labels: d.revenue_chart.map(r=>r.label),
                datasets: [{ label:'Дохід ₴', data: d.revenue_chart.map(r=>r.revenue),
                    backgroundColor:'rgba(59,94,71,0.75)', borderRadius:6, borderSkipped:false }]
            }, { scales:{ y:{ ticks:{ callback: v=>'₴'+v.toLocaleString(), color:textMuted }, grid:{color:'rgba(0,0,0,0.05)'} }, x:{ ticks:{color:textMuted}, grid:{display:false} } } });

            // Sessions bar (secondary)
            mkChart('an-sessions', 'bar', {
                labels: d.revenue_chart.map(r=>r.label),
                datasets: [{ label:'Сесій', data: d.revenue_chart.map(r=>r.sessions),
                    backgroundColor:'rgba(59,130,246,0.7)', borderRadius:6, borderSkipped:false }]
            }, { scales:{ y:{ ticks:{color:textMuted}, grid:{color:'rgba(0,0,0,0.05)'} }, x:{ ticks:{color:textMuted}, grid:{display:false} } } });

            // Retention donut
            mkChart('an-retention', 'doughnut', {
                labels: ['Нові','Постійні'],
                datasets: [{ data:[d.client_retention.new, d.client_retention.returning],
                    backgroundColor:['rgba(139,92,246,0.8)','rgba(59,94,71,0.8)'], borderWidth:0 }]
            }, { plugins:{ legend:{ display:true, position:'bottom', labels:{color:textMuted, boxWidth:12, padding:10} } }, cutout:'70%' });

            // Completion donut
            const cr = d.completion_rate;
            mkChart('an-completion', 'doughnut', {
                labels:['Завершено','Скасовано','Не з\'явився','Очікує'],
                datasets:[{ data:[cr.completed,cr.cancelled,cr.no_show,cr.pending],
                    backgroundColor:['rgba(16,185,129,.8)','rgba(239,68,68,.8)','rgba(107,114,128,.8)','rgba(245,158,11,.8)'],
                    borderWidth:0 }]
            }, { plugins:{ legend:{ display:true, position:'bottom', labels:{color:textMuted, boxWidth:12, padding:8} } }, cutout:'65%' });

            // Top services horizontal bar
            const svcs = (d.top_services||[]).slice(0,6);
            mkChart('an-services', 'bar', {
                labels: svcs.map(s=>s.name),
                datasets:[{ label:'₴', data:svcs.map(s=>s.revenue),
                    backgroundColor:svcs.map((_,i)=>['rgba(59,94,71,.75)','rgba(59,130,246,.7)','rgba(139,92,246,.7)','rgba(16,185,129,.7)','rgba(245,158,11,.7)','rgba(239,68,68,.7)'][i]||'rgba(99,102,241,.7)'),
                    borderRadius:4, borderSkipped:false }]
            }, { indexAxis:'y', scales:{ x:{ ticks:{ callback:v=>'₴'+v.toLocaleString(), color:textMuted }, grid:{color:'rgba(0,0,0,0.05)'} }, y:{ ticks:{color:textMuted}, grid:{display:false} } } });
        }

        async function load() {
            loading.value = true;
            try {
                const { data: d } = await props.api.get('/analytics', { params: { from: from.value, to: to.value } });
                data.value = d;
                await nextTick();
                renderCharts(d);
            } catch(e) {}
            loading.value = false;
        }

        watch([from, to], load);
        onMounted(() => { setPeriod('month'); });
        onUnmounted(() => { Object.values(chartInstances).forEach(c=>c?.destroy()); });

        const dayLabels = ['','Пн','Вт','Ср','Чт','Пт','Сб','Нд'];

        return { data, loading, period, from, to, setPeriod, dayLabels };
    },
    template: `
<div>
  <div class="an-header">
    <h1>Аналітика</h1>
    <div class="an-period-btns">
      <button :class="['btn btn-sm', period==='month' ? 'btn-primary' : 'btn-ghost']" @click="setPeriod('month')">Місяць</button>
      <button :class="['btn btn-sm', period==='quarter' ? 'btn-primary' : 'btn-ghost']" @click="setPeriod('quarter')">Квартал</button>
      <button :class="['btn btn-sm', period==='year' ? 'btn-primary' : 'btn-ghost']" @click="setPeriod('year')">Рік</button>
    </div>
  </div>

  <div v-if="loading && !data" class="empty" style="padding:60px 0;"><i class="fa fa-spinner fa-spin fa-2x"></i></div>

  <template v-if="data">
    <!-- KPI row -->
    <div class="an-kpi-row">
      <div class="an-kpi">
        <div class="an-kpi-icon" style="background:var(--accent-soft);color:var(--accent);"><i class="fa fa-calendar-check"></i></div>
        <div class="an-kpi-body">
          <div class="an-kpi-label">Сесій</div>
          <div class="an-kpi-value">{{ data.summary.total_sessions }}</div>
        </div>
      </div>
      <div class="an-kpi">
        <div class="an-kpi-icon" style="background:var(--pending-soft);color:var(--pending);"><i class="fa fa-coins"></i></div>
        <div class="an-kpi-body">
          <div class="an-kpi-label">Дохід</div>
          <div class="an-kpi-value">₴{{ Number(data.summary.total_revenue).toLocaleString() }}</div>
        </div>
      </div>
      <div class="an-kpi">
        <div class="an-kpi-icon" style="background:var(--confirmed-soft);color:var(--confirmed);"><i class="fa fa-chart-line"></i></div>
        <div class="an-kpi-body">
          <div class="an-kpi-label">Середній чек</div>
          <div class="an-kpi-value">₴{{ Number(data.summary.avg_session_value).toLocaleString() }}</div>
        </div>
      </div>
      <div class="an-kpi">
        <div class="an-kpi-icon" style="background:rgba(139,92,246,.12);color:#8b5cf6;"><i class="fa fa-user-plus"></i></div>
        <div class="an-kpi-body">
          <div class="an-kpi-label">Нових клієнтів</div>
          <div class="an-kpi-value">{{ data.summary.new_clients }}</div>
        </div>
      </div>
      <div class="an-kpi">
        <div class="an-kpi-icon" style="background:rgba(239,68,68,.1);color:#ef4444;"><i class="fa fa-receipt"></i></div>
        <div class="an-kpi-body">
          <div class="an-kpi-label">Витрати</div>
          <div class="an-kpi-value">₴{{ Number(data.summary.total_expenses).toLocaleString() }}</div>
        </div>
      </div>
      <div :class="['an-kpi', data.summary.profit >= 0 ? '' : 'an-kpi-loss']">
        <div class="an-kpi-icon" :style="data.summary.profit>=0 ? 'background:rgba(16,185,129,.12);color:#10b981;' : 'background:rgba(239,68,68,.1);color:#ef4444;'"><i class="fa fa-piggy-bank"></i></div>
        <div class="an-kpi-body">
          <div class="an-kpi-label">Прибуток</div>
          <div class="an-kpi-value">{{ data.summary.profit>=0?'+':'' }}₴{{ Number(data.summary.profit).toLocaleString() }}</div>
        </div>
      </div>
    </div>

    <!-- Charts grid -->
    <div class="an-charts-grid">
      <div class="card an-chart-card an-chart-wide">
        <div class="card-header"><span class="card-title">Дохід за період</span></div>
        <div class="an-chart-body"><canvas id="an-revenue"></canvas></div>
      </div>
      <div class="card an-chart-card an-chart-wide">
        <div class="card-header"><span class="card-title">Кількість сесій</span></div>
        <div class="an-chart-body"><canvas id="an-sessions"></canvas></div>
      </div>
      <div class="card an-chart-card">
        <div class="card-header"><span class="card-title">Нові vs постійні</span></div>
        <div class="an-chart-body" style="max-height:220px;"><canvas id="an-retention"></canvas></div>
        <div v-if="data.client_retention.new===0&&data.client_retention.returning===0" class="empty" style="padding:20px 0;"><i class="fa fa-users"></i><p>Даних немає</p></div>
      </div>
      <div class="card an-chart-card">
        <div class="card-header"><span class="card-title">Статуси сесій</span></div>
        <div class="an-chart-body" style="max-height:220px;"><canvas id="an-completion"></canvas></div>
      </div>
      <div class="card an-chart-card an-chart-wide">
        <div class="card-header"><span class="card-title">Топ послуг за доходом</span></div>
        <div v-if="!data.top_services?.length" class="empty" style="padding:24px 0;"><i class="fa fa-ranking-star"></i><p>Даних немає</p></div>
        <div v-else class="an-chart-body"><canvas id="an-services"></canvas></div>
      </div>
      <div class="card an-chart-card an-chart-wide">
        <div class="card-header"><span class="card-title"><i class="fa fa-fire" style="color:var(--accent);margin-right:6px;"></i>Пікове навантаження</span></div>
        <div class="an-heatmap">
          <div class="an-heatmap-labels">
            <div v-for="d in dayLabels.slice(1)" :key="d" class="an-heatmap-day">{{ d }}</div>
          </div>
          <div class="an-heatmap-grid">
            <template v-for="h in Array.from({length:13},(_,i)=>i+8)" :key="h">
              <div v-for="day in [1,2,3,4,5,6,7]" :key="day"
                class="an-heatmap-cell"
                :style="{ opacity: (data.busiest_slots.find(s=>s.day===day&&s.hour===h)?.count||0) > 0
                  ? 0.15 + Math.min(0.85, (data.busiest_slots.find(s=>s.day===day&&s.hour===h)?.count||0) / 5 * 0.85) : 0.04,
                  background: 'var(--accent)' }"
                :title="(data.busiest_slots.find(s=>s.day===day&&s.hour===h)?.count||0) + ' сесій'">
              </div>
            </template>
          </div>
          <div class="an-heatmap-hours">
            <span v-for="h in Array.from({length:13},(_,i)=>i+8)" :key="h">{{ String(h).padStart(2,'0') }}</span>
          </div>
        </div>
      </div>
    </div>
  </template>
</div>`
};

/* Export all pages */
window.SpravnaPages = { DashboardPage, SchedulePage, RequestsPage, ArchivePage, ClientsPage, SettingsPage, FinancesPage, AnalyticsPage };
