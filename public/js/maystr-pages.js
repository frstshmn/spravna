/* =====================================================================
   MAYSTR PAGES — all 6 page components
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
    components: { MModal, MBadge, AppointmentFormBody },
    setup(props) {
        const stats = ref({});
        const todayAppts = ref([]);
        const upcoming = ref([]);
        const recentRequests = ref([]);
        const chart = ref([]);
        const calDate = ref(new Date());
        const apptDates = ref([]);
        const showNewAppt = ref(false);
        const chartInstance = ref(null);

        const maxRevenue = computed(() => Math.max(1, ...chart.value.map(m => m.revenue)));

        /* calendar helpers */
        function localDate(y, mo, d) {
            const dd = String(d).padStart(2, '0');
            const mm = String(mo + 1).padStart(2, '0');
            return `${y}-${mm}-${dd}`;
        }
        function calDays() {
            const y = calDate.value.getFullYear(), mo = calDate.value.getMonth();
            const first = new Date(y, mo, 1).getDay();
            const days_in = new Date(y, mo + 1, 0).getDate();
            const days_prev = new Date(y, mo, 0).getDate();
            const start = (first + 6) % 7; // Mon-start
            const cells = [];
            for (let i = start - 1; i >= 0; i--) cells.push({ d: days_prev - i, cur: false });
            for (let i = 1; i <= days_in; i++) cells.push({ d: i, cur: true });
            while (cells.length < 42) cells.push({ d: cells.length - days_in - start + 1, cur: false });
            const today = new Date();
            return cells.map(c => ({
                ...c,
                isToday: c.cur && c.d === today.getDate() && y === today.getFullYear() && mo === today.getMonth(),
                hasEvent: c.cur && apptDates.value.includes(localDate(y, mo, c.d)),
            }));
        }
        const calMonthLabel = computed(() => calDate.value.toLocaleDateString('en', { month: 'long', year: 'numeric' }));
        function prevMonth() { calDate.value = new Date(calDate.value.getFullYear(), calDate.value.getMonth() - 1, 1); }
        function nextMonth() { calDate.value = new Date(calDate.value.getFullYear(), calDate.value.getMonth() + 1, 1); }

        /* chart */
        function drawChart() {
            const canvas = document.getElementById('revenue-chart');
            if (!canvas || !chart.value.length) return;
            if (chartInstance.value) chartInstance.value.destroy();
            chartInstance.value = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: chart.value.map(m => m.month),
                    datasets: [{
                        label: 'Revenue',
                        data: chart.value.map(m => m.revenue),
                        backgroundColor: 'rgba(201,168,76,0.75)',
                        borderColor: '#c9a84c',
                        borderWidth: 1,
                        borderRadius: 6,
                        borderSkipped: false,
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: {
                        backgroundColor: '#1a1614', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
                        titleColor: '#f5f0ea', bodyColor: '#9a9088',
                        callbacks: { label: ctx => ' $' + ctx.parsed.y.toLocaleString() }
                    }},
                    scales: {
                        x: { grid: { color: '#e4dbd0' }, ticks: { color: '#a89e94', font: { size: 11 } } },
                        y: { grid: { color: '#e4dbd0' }, ticks: { color: '#a89e94', font: { size: 11 }, callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(0)+'k' : v) } }
                    }
                }
            });
        }

        async function load() {
            try {
                const { data } = await props.api.get('/dashboard');
                stats.value = data.stats;
                todayAppts.value = data.today_appointments;
                upcoming.value = data.upcoming_appointments;
                recentRequests.value = data.recent_requests;
                chart.value = data.revenue_chart;
                // Collect appointment dates for calendar (use string slice — no UTC shift)
                const all = [...todayAppts.value, ...upcoming.value];
                apptDates.value = [...new Set(all.map(a => a.scheduled_at?.slice(0, 10)).filter(Boolean))];
                nextTick(drawChart);
            } catch(e) {}
        }

        onMounted(load);

        const greeting = computed(() => {
            const h = new Date().getHours();
            const name = props.user?.name?.split(' ')[0] || 'майстре';
            if (h < 12) return 'Доброго ранку, ' + name + '!';
            if (h < 17) return 'Доброго дня, ' + name + '!';
            return 'Доброго вечора, ' + name + '!';
        });

        return { stats, todayAppts, upcoming, recentRequests, chart, maxRevenue, calDate, calDays, calMonthLabel, prevMonth, nextMonth, apptDates, showNewAppt, greeting, load };
    },
    template: `
<div>
  <!-- Greeting -->
  <div class="flex items-center justify-between mb-16">
    <div>
      <h1>{{ greeting }}</h1>
      <p class="text-sub" style="font-size:13px;margin-top:2px;">{{ new Date().toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'}) }}</p>
    </div>
    <button class="btn btn-primary" @click="showNewAppt=true">
      <i class="fa fa-plus"></i> Новий запис
    </button>
  </div>

  <!-- Stats -->
  <div class="dash-stats">
    <div class="stat-card">
      <div class="stat-icon-wrap" style="background:var(--accent-soft);color:var(--accent)"><i class="fa fa-calendar-day"></i></div>
      <div class="stat-label">Сьогодні</div>
      <div class="stat-value">{{ stats.today_appointments ?? '—' }}</div>
      <div class="stat-trend">Запланованих сесій</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-wrap" style="background:rgba(34,197,94,.14);color:#22c55e"><i class="fa fa-dollar-sign"></i></div>
      <div class="stat-label">Дохід за місяць</div>
      <div class="stat-value">{{ stats.month_revenue != null ? '$' + Number(stats.month_revenue).toLocaleString() : '—' }}</div>
      <div class="stat-trend" :class="stats.revenue_change >= 0 ? 'trend-up' : 'trend-down'" v-if="stats.revenue_change !== null">
        <i :class="'fa fa-arrow-' + (stats.revenue_change >= 0 ? 'up' : 'down')"></i>
        {{ Math.abs(stats.revenue_change) }}% порівняно з минулим місяцем
      </div>
      <div v-else class="stat-trend">порівняно з минулим місяцем</div>
    </div>
    <div class="stat-card" style="cursor:pointer;" @click="$emit('navigate','requests')">
      <div class="stat-icon-wrap" style="background:var(--pending-soft);color:var(--pending)"><i class="fa fa-inbox"></i></div>
      <div class="stat-label">Нові запити</div>
      <div class="stat-value" :style="stats.pending_requests > 0 ? 'color:var(--pending)' : ''">{{ stats.pending_requests ?? '—' }}</div>
      <div class="stat-trend">Очікують відповіді</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-wrap" style="background:var(--confirmed-soft);color:var(--confirmed)"><i class="fa fa-users"></i></div>
      <div class="stat-label">Всього клієнтів</div>
      <div class="stat-value">{{ stats.total_clients ?? '—' }}</div>
      <div class="stat-trend">У вашій базі</div>
    </div>
  </div>

  <!-- Chart + Calendar -->
  <div class="dash-mid">
    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fa fa-chart-bar" style="color:var(--accent);margin-right:6px;"></i>Дохід — останні 6 місяців</span>
      </div>
      <div class="card-body" style="height:220px;">
        <canvas id="revenue-chart"></canvas>
      </div>
    </div>
    <div class="cal-card">
      <div class="mini-cal">
        <div class="mini-cal-head">
          <button class="cal-nav-btn" @click="prevMonth"><i class="fa fa-chevron-left"></i></button>
          <span class="mini-cal-title">{{ calMonthLabel }}</span>
          <button class="cal-nav-btn" @click="nextMonth"><i class="fa fa-chevron-right"></i></button>
        </div>
        <div class="cal-grid">
          <div v-for="d in ['M','T','W','T','F','S','S']" :key="d + Math.random()" class="cal-dname">{{ d }}</div>
          <div v-for="(day,i) in calDays()" :key="i"
            :class="'cal-day' + (day.isToday ? ' today' : '') + (day.hasEvent ? ' has-event' : '') + (!day.cur ? ' other-month' : '')"
            :style="day.cur ? 'cursor:pointer' : ''"
            @click="day.cur && $emit('navigate', 'schedule')">
            {{ day.d }}
          </div>
        </div>
        <div class="cal-legend">
          <div class="cal-legend-item">
            <span class="cal-legend-dot" style="background:var(--accent);"></span> Сесія
          </div>
          <div class="cal-legend-item">
            <span class="cal-legend-dot" style="background:#fff;opacity:0.5;"></span> Сьогодні
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Today + Requests -->
  <div class="dash-bot">
    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fa fa-clock" style="color:var(--accent);margin-right:6px;"></i>Розклад на сьогодні</span>
        <button class="btn btn-ghost btn-sm" @click="$emit('navigate','schedule')">Всі <i class="fa fa-arrow-right"></i></button>
      </div>
      <div class="card-body" style="padding-top:6px;padding-bottom:6px;">
        <div v-if="!todayAppts.length" class="empty" style="padding:20px 0;">
          <i class="fa fa-calendar-xmark"></i>
          <p>Сьогодні сесій немає</p>
        </div>
        <div v-for="a in todayAppts" :key="a.id" class="timeline-item">
          <span class="tl-time">{{ $root ? '' : '' }}{{ a.scheduled_at ? new Date(a.scheduled_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '' }}</span>
          <span class="tl-dot" :style="{background: a.service?.color || '#7c5cfc'}"></span>
          <div class="tl-body">
            <div class="tl-name truncate">{{ a.client?.name }}</div>
            <div class="tl-svc">{{ a.service?.name || a.title || 'Appointment' }}</div>
          </div>
          <m-badge :status="a.status"></m-badge>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fa fa-inbox" style="color:var(--accent);margin-right:6px;"></i>Нові запити</span>
        <button class="btn btn-ghost btn-sm" @click="$emit('navigate','requests')">Всі <i class="fa fa-arrow-right"></i></button>
      </div>
      <div class="card-body" style="padding-top:6px;padding-bottom:6px;">
        <div v-if="!recentRequests.length" class="empty" style="padding:20px 0;">
          <i class="fa fa-inbox"></i><p>Нових запитів немає</p>
        </div>
        <div v-for="r in recentRequests" :key="r.id" class="timeline-item" style="cursor:pointer;" @click="$emit('navigate','requests')">
          <div class="avatar av-sm" style="margin-top:2px;">{{ r.client_name?.charAt(0).toUpperCase() }}</div>
          <div class="flex-1 min-w-0">
            <div class="tl-name truncate">{{ r.client_name }}</div>
            <div class="tl-svc">{{ r.service?.name || 'General inquiry' }}</div>
          </div>
          <m-badge status="pending"></m-badge>
        </div>
      </div>
    </div>
  </div>

  <!-- New appointment modal -->
  <m-modal :show="showNewAppt" title="Новий запис" @close="showNewAppt=false">
    <appointment-form-body :api="api" @saved="showNewAppt=false; load()" @cancel="showNewAppt=false"></appointment-form-body>
  </m-modal>
</div>`,
};

/* =====================================================================
   2. SCHEDULE
   ===================================================================== */
const SchedulePage = {
    props: ['api'],
    components: { MModal, MBadge, AppointmentFormBody },
    setup(props) {
        const view = ref('week');
        const currentDate = ref(new Date());
        const appointments = ref([]);
        const workingHours = ref([]);
        const showModal = ref(false);
        const modalTitle = ref('');
        const editingAppt = ref(null);
        const newApptDate = ref('');
        const newApptHour = ref(9);
        const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8–20

        /* ── Week helpers ── */
        function getWeekStart(d) {
            const dt = new Date(d);
            const day = (dt.getDay() + 6) % 7;
            dt.setDate(dt.getDate() - day); dt.setHours(0, 0, 0, 0);
            return dt;
        }
        const weekStart = computed(() => getWeekStart(currentDate.value));
        function localDateStr(d) {
            // Format as YYYY-MM-DD in local time (avoids UTC shift)
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }
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

        function getAppts(date, hour) {
            return appointments.value.filter(a => {
                if (!a.scheduled_at) return false;
                // Use string slicing to avoid UTC↔local timezone shift
                return a.scheduled_at.slice(0, 10) === date &&
                       parseInt(a.scheduled_at.slice(11, 13)) === hour;
            });
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
            return appointments.value.filter(a => a.scheduled_at?.slice(0, 10) === date);
        }

        /* ── Modal ── */
        function openNew(date, hour) {
            editingAppt.value = null; newApptDate.value = date; newApptHour.value = hour;
            modalTitle.value = 'Новий запис'; showModal.value = true;
        }
        function openEdit(appt) {
            editingAppt.value = appt; modalTitle.value = 'Редагувати запис'; showModal.value = true;
        }
        function onSaved() { showModal.value = false; loadAppointments(); }

        async function loadAppointments() {
            try {
                let start, end;
                if (view.value === 'week') {
                    start = weekDays.value[0].date; end = weekDays.value[6].date;
                } else {
                    const y = currentDate.value.getFullYear(), mo = currentDate.value.getMonth();
                    start = new Date(y, mo, 1).toISOString().slice(0, 10);
                    end = new Date(y, mo + 1, 0).toISOString().slice(0, 10);
                }
                const { data } = await props.api.get('/appointments', { params: { start, end } });
                appointments.value = data;
            } catch(e) {}
        }

        onMounted(async () => {
            loadAppointments();
            try { const { data } = await props.api.get('/schedule/working-hours'); workingHours.value = data; } catch(e) {}
        });

        watch(view, loadAppointments);

        return { view, currentDate, weekDays, weekLabel, monthLabel, monthDays, appointments, hours, showModal, modalTitle, editingAppt, newApptDate, newApptHour, prevWeek, nextWeek, prevMonth, nextMonth, getAppts, monthAppts, openNew, openEdit, onSaved, isOffHours };
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
    <button class="btn btn-ghost btn-sm" @click="currentDate=new Date();view==='week'?null:null;loadAppointments ? loadAppointments() : null">Сьогодні</button>
    <button class="btn btn-primary btn-sm" style="margin-left:auto;" @click="openNew(new Date().toISOString().slice(0,10), 10)">
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
      <!-- Time rows -->
      <template v-for="hour in hours" :key="hour">
        <div class="week-time-label">{{ String(hour).padStart(2,'0') }}</div>
        <div v-for="(day, di) in weekDays" :key="day.date + hour"
          :class="'week-cell' + (isOffHours(di, hour) ? ' off-hours' : '')"
          @click="openNew(day.date, hour)">
          <div v-for="a in getAppts(day.date, hour)" :key="a.id"
            class="appt-chip"
            :style="{background: a.service?.color || a.color || '#7c5cfc', color:'#fff'}"
            @click.stop="openEdit(a)">
            {{ a.client?.name || a.title }}
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- Month view -->
  <div v-else class="month-cal">
    <div class="month-hdr-row">
      <div v-for="d in ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']" :key="d" class="month-hdr-cell">{{ d }}</div>
    </div>
    <div class="month-grid">
      <div v-for="(day,i) in monthDays" :key="i"
        :class="'month-day' + (day.isToday ? ' today' : '') + (!day.cur ? ' other-month' : '')"
        @click="day.cur && openNew(day.date, 10)">
        <div class="mday-num">{{ day.d }}</div>
        <div v-for="a in monthAppts(day.date)" :key="a.id"
          class="mday-appt"
          :style="{background: (a.service?.color || '#7c5cfc') + '33', color: a.service?.color || '#7c5cfc'}"
          @click.stop="openEdit(a)">
          {{ a.client?.name }}
        </div>
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
      @saved="onSaved"
      @cancel="showModal=false">
    </appointment-form-body>
  </m-modal>
</div>`
};


/* =====================================================================
   3. REQUESTS
   ===================================================================== */
const RequestsPage = {
    props: ['api'],
    emits: ['count'],
    components: { MModal, MBadge, MAvatar, RespondFormBody },
    setup(props, { emit }) {
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

        return { requests, filter, loading, showRespond, selectedReq, load, openRespond, onResponded };
    },
    template: `
<div>
  <div class="flex items-center justify-between mb-16">
    <h1>Запити на запис</h1>
  </div>

  <!-- Filter chips -->
  <div class="chip-row">
    <button :class="'chip' + (filter==='pending' ? ' active' : '')" @click="filter='pending'">Нові</button>
    <button :class="'chip' + (filter==='accepted' ? ' active' : '')" @click="filter='accepted'">Прийняті</button>
    <button :class="'chip' + (filter==='declined' ? ' active' : '')" @click="filter='declined'">Відхилені</button>
    <button :class="'chip' + (filter==='' ? ' active' : '')" @click="filter=''">Всі</button>
  </div>

  <!-- Loading -->
  <div v-if="loading" class="empty"><i class="fa fa-spinner fa-spin"></i><p>Завантаження…</p></div>

  <!-- Empty -->
  <div v-else-if="!requests.length" class="empty">
    <i class="fa fa-inbox"></i>
    <p>Запитів немає</p>
  </div>

  <!-- List -->
  <div v-else style="display:flex;flex-direction:column;gap:10px;">
    <div v-for="r in requests" :key="r.id" class="req-card" @click="openRespond(r)">
      <div class="req-header">
        <div class="flex items-center gap-10">
          <div class="avatar av-sm">{{ r.client_name?.charAt(0).toUpperCase() }}</div>
          <span class="req-name">{{ r.client_name }}</span>
        </div>
        <div class="flex items-center gap-8">
          <m-badge :status="r.status"></m-badge>
          <span style="font-size:11px;color:var(--text-muted);">{{ r.created_at ? new Date(r.created_at).toLocaleDateString('en',{month:'short',day:'numeric'}) : '' }}</span>
        </div>
      </div>
      <div class="req-meta">
        <span v-if="r.client_phone"><i class="fa fa-phone"></i>{{ r.client_phone }}</span>
        <span v-if="r.client_email"><i class="fa fa-envelope"></i>{{ r.client_email }}</span>
        <span v-if="r.client_instagram"><i class="fa-brands fa-instagram"></i>{{ r.client_instagram }}</span>
        <span v-if="r.service"><i class="fa fa-scissors"></i>{{ r.service.name }}</span>
        <span v-if="r.preferred_date"><i class="fa fa-calendar"></i>{{ new Date(r.preferred_date).toLocaleDateString('en',{month:'short',day:'numeric'}) }}{{ r.preferred_time ? ' ' + r.preferred_time : '' }}</span>
      </div>
      <p v-if="r.message" class="req-msg">"{{ r.message }}"</p>
      <div v-if="r.status === 'pending'" class="flex gap-8" @click.stop>
        <button class="btn btn-success btn-sm" @click="openRespond(r)">
          <i class="fa fa-check"></i> Відповісти
        </button>
      </div>
    </div>
  </div>

  <!-- Respond modal -->
  <m-modal :show="showRespond" title="Відповідь на запит" size="lg" @close="showRespond=false">
    <respond-form-body v-if="selectedReq" :api="api" :request="selectedReq" @responded="onResponded" @cancel="showRespond=false"></respond-form-body>
  </m-modal>
</div>`
};

/* =====================================================================
   4. ARCHIVE
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
            <td>{{ a.scheduled_at ? new Date(a.scheduled_at).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'}) : '—' }}</td>
            <td>
              <div class="flex items-center gap-8">
                <div class="avatar av-xs">{{ a.client?.name?.charAt(0) }}</div>
                <span class="fw-700">{{ a.client?.name }}</span>
              </div>
            </td>
            <td style="color:var(--text-sub)">{{ a.service?.name || '—' }}</td>
            <td style="color:var(--text-sub)">{{ a.duration ? a.duration + ' хв' : '—' }}</td>
            <td style="font-weight:600;">{{ a.price ? '$' + Number(a.price).toLocaleString() : '—' }}</td>
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
   5. PUBLIC PAGE SETTINGS
   ===================================================================== */
const PublicPageSettings = {
    props: ['api', 'user'],
    components: { MModal },
    setup(props) {
        const profile = ref(null);
        const saving = ref(false);
        const saved = ref(false);
        const copied = ref(false);
        const uploading = ref(false);
        const form = reactive({
            name: '',
            bio: '', specialty: '', phone: '', city: '', country: '',
            instagram: '', website: '', booking_notice: '',
            cancellation_policy: '', is_public: true, is_accepting_bookings: true, currency: 'USD',
        });

        const publicUrl = computed(() => {
            const slug = profile.value?.slug || '';
            return window.location.origin + '/master/' + slug;
        });

        async function load() {
            const { data } = await props.api.get('/profile');
            profile.value = data.profile;
            form.name = data.name || '';
            Object.keys(form).forEach(k => { if (data.profile?.[k] !== undefined) form[k] = data.profile[k]; });
        }

        async function save() {
            saving.value = true; saved.value = false;
            await props.api.put('/profile', form);
            saved.value = true; saving.value = false;
            setTimeout(() => saved.value = false, 2500);
        }

        function copyLink() {
            navigator.clipboard?.writeText(publicUrl.value);
            copied.value = true; setTimeout(() => copied.value = false, 2000);
        }

        onMounted(load);
        return { profile, form, saving, saved, copied, publicUrl, save, copyLink };
    },
    template: `
<div>
  <div class="flex items-center justify-between mb-16">
    <h1>Публічна сторінка</h1>
    <div class="flex gap-8">
      <button class="btn btn-secondary btn-sm" @click="copyLink">
        <i :class="copied ? 'fa fa-check' : 'fa fa-link'"></i> {{ copied ? 'Скопійовано!' : 'Копіювати посилання' }}
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
      </div>

      <!-- Profile info -->
      <div class="card">
        <div class="card-header"><span class="card-title">Інформація профілю</span></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:12px;">
          <div class="form-row">
            <div class="form-group">
              <label class="label">Ім'я</label>
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
          <div class="form-group">
            <label class="label">Про себе</label>
            <textarea v-model="form.bio" class="textarea" placeholder="Розкажіть клієнтам про себе…"></textarea>
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
          <div class="form-group">
            <label class="label">Сайт</label>
            <input v-model="form.website" class="input" type="url" placeholder="https://…">
          </div>
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

      <div class="flex justify-end gap-8">
        <p v-if="saved" style="color:var(--completed);font-size:13px;align-self:center;"><i class="fa fa-check"></i> Збережено</p>
        <button class="btn btn-primary" @click="save" :disabled="saving">
          <i class="fa fa-save"></i> {{ saving ? 'Збереження…' : 'Зберегти зміни' }}
        </button>
      </div>
    </div>

    <!-- Preview -->
    <div class="pub-preview">
      <div class="pub-preview-header">
        <div class="avatar av-lg" style="margin:0 auto 10px;">{{ form.name?.charAt(0) }}</div>
        <p style="font-weight:700;font-size:16px;">{{ form.name || "Ваше ім'я" }}</p>
        <p style="font-size:12px;color:var(--text-sub);margin-top:2px;">{{ form.specialty || 'Майстер' }}</p>
        <p v-if="form.city" style="font-size:11px;color:var(--text-muted);margin-top:4px;"><i class="fa fa-location-dot"></i> {{ form.city }}{{ form.country ? ', ' + form.country : '' }}</p>
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
        <button :class="'btn w-full ' + (form.is_accepting_bookings ? 'btn-primary' : 'btn-secondary')" style="justify-content:center;" disabled>
          <i class="fa fa-calendar-plus"></i>
          {{ form.is_accepting_bookings ? 'Записатися' : 'Запис закритий' }}
        </button>
      </div>
    </div>
  </div>
</div>`
};

/* =====================================================================
   6. SETTINGS
   ===================================================================== */
const SettingsPage = {
    props: ['api', 'user'],
    emits: ['user-updated'],
    components: { MModal, MBadge, ServiceFormBody },
    setup(props, { emit }) {
        const tab = ref('profile');
        const workingHours = ref([]);
        const services = ref([]);
        const savingProfile = ref(false);
        const savedProfile = ref(false);
        const savingHours = ref(false);
        const savedHours = ref(false);
        const showSvcModal = ref(false);
        const editingSvc = ref(null);
        const pwForm = reactive({ current_password: '', password: '', password_confirmation: '' });
        const pwError = ref(''); const pwSaved = ref(false); const savingPw = ref(false);

        const profileForm = reactive({
            name: props.user?.name || '',
            email: props.user?.email || '',
        });

        async function loadHours() {
            const { data } = await props.api.get('/schedule/working-hours');
            const days = [0,1,2,3,4,5,6];
            workingHours.value = days.map(d => data.find(h => h.day_of_week === d) || { day_of_week: d, start_time: '09:00', end_time: '18:00', is_working: d >= 1 && d <= 5 });
        }
        async function saveHours() {
            savingHours.value = true;
            await props.api.put('/schedule/working-hours', { hours: workingHours.value });
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
            if (!confirm('Delete "' + s.name + '"?')) return;
            await props.api.delete('/services/' + s.id); loadServices();
        }
        async function toggleSvc(s) {
            await props.api.put('/services/' + s.id, { is_active: !s.is_active }); loadServices();
        }
        function onSvcSaved() { showSvcModal.value = false; loadServices(); }

        async function saveProfile() {
            savingProfile.value = true;
            await props.api.put('/profile', { name: profileForm.name });
            savedProfile.value = true; savingProfile.value = false;
            emit('user-updated');
            setTimeout(() => savedProfile.value = false, 2000);
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

        const dayNames = ['Неділя','Понеділок','Вівторок','Середа','Четвер','П\'ятниця','Субота'];

        function priceDisplay(s) {
            if (s.price_on_request) return 'On request';
            if (s.price) return '$' + s.price;
            if (s.price_from && s.price_to) return '$' + s.price_from + ' – $' + s.price_to;
            if (s.price_from) return 'from $' + s.price_from;
            return '—';
        }

        onMounted(() => { loadHours(); loadServices(); });

        return { tab, workingHours, services, savingProfile, savedProfile, savingHours, savedHours, showSvcModal, editingSvc, profileForm, pwForm, pwError, pwSaved, savingPw, dayNames, priceDisplay, saveHours, loadServices, editSvc, newSvc, deleteSvc, toggleSvc, onSvcSaved, saveProfile, changePassword };
    },
    template: `
<div>
  <h1 class="mb-16">Налаштування</h1>

  <div class="settings-layout">
    <!-- Nav -->
    <div class="settings-nav">
      <button :class="'settings-nav-item' + (tab==='profile' ? ' active' : '')" @click="tab='profile'">
        <i class="fa fa-user"></i> Профіль
      </button>
      <button :class="'settings-nav-item' + (tab==='hours' ? ' active' : '')" @click="tab='hours'">
        <i class="fa fa-clock"></i> Робочі години
      </button>
      <button :class="'settings-nav-item' + (tab==='services' ? ' active' : '')" @click="tab='services'">
        <i class="fa fa-scissors"></i> Послуги
      </button>
      <button :class="'settings-nav-item' + (tab==='security' ? ' active' : '')" @click="tab='security'">
        <i class="fa fa-lock"></i> Безпека
      </button>
    </div>

    <!-- Panels -->
    <div class="settings-panel">

      <!-- Profile -->
      <template v-if="tab==='profile'">
        <div class="card">
          <div class="card-header"><span class="card-title">Дані акаунту</span></div>
          <div class="card-body" style="display:flex;flex-direction:column;gap:12px;">
            <div class="form-row">
              <div class="form-group">
                <label class="label">Повне ім'я</label>
                <input v-model="profileForm.name" class="input">
              </div>
              <div class="form-group">
                <label class="label">Електронна пошта</label>
                <input v-model="profileForm.email" class="input" disabled style="opacity:.6;">
              </div>
            </div>
            <div class="flex justify-end gap-8">
              <p v-if="savedProfile" style="color:var(--completed);font-size:13px;align-self:center;"><i class="fa fa-check"></i> Збережено</p>
              <button class="btn btn-primary btn-sm" @click="saveProfile" :disabled="savingProfile">
                {{ savingProfile ? 'Збереження…' : 'Зберегти зміни' }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Working hours -->
      <template v-if="tab==='hours'">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Робочі години</span>
            <button class="btn btn-primary btn-sm" @click="saveHours" :disabled="savingHours">
              <i class="fa fa-save"></i> {{ savedHours ? 'Збережено!' : 'Зберегти' }}
            </button>
          </div>
          <div class="card-body" style="display:flex;flex-direction:column;">
            <div v-for="h in workingHours" :key="h.day_of_week" class="wh-row">
              <span class="wh-day">{{ dayNames[h.day_of_week] }}</span>
              <button :class="'toggle' + (h.is_working ? ' on' : '')" @click="h.is_working = !h.is_working" style="flex-shrink:0;"></button>
              <template v-if="h.is_working">
                <input type="time" v-model="h.start_time" class="input" style="max-width:110px;">
                <span style="color:var(--text-muted);font-size:13px;">—</span>
                <input type="time" v-model="h.end_time" class="input" style="max-width:110px;">
              </template>
              <span v-else style="font-size:13px;color:var(--text-muted);">Вихідний</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Services -->
      <template v-if="tab==='services'">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Послуги ({{ services.length }})</span>
            <button class="btn btn-primary btn-sm" @click="newSvc"><i class="fa fa-plus"></i> Додати послугу</button>
          </div>
          <div>
            <div v-if="!services.length" class="empty"><i class="fa fa-scissors"></i><p>Послуг ще немає</p></div>
            <div v-for="s in services" :key="s.id" class="svc-card">
              <div class="svc-dot" :style="{background: s.color || '#c9a84c'}"></div>
              <div class="svc-info">
                <div class="svc-name" :style="s.is_active ? '' : 'opacity:.5'">{{ s.name }}</div>
                <div class="svc-meta">{{ s.category || '—' }} &nbsp;·&nbsp; {{ s.duration ? s.duration + ' хв' : '' }} &nbsp;·&nbsp; {{ priceDisplay(s) }}</div>
              </div>
              <span v-if="!s.is_active" style="font-size:11px;color:var(--text-muted);margin-right:8px;">Неактивна</span>
              <button class="btn btn-ghost btn-sm btn-icon" @click="toggleSvc(s)" :title="s.is_active ? 'Деактивувати' : 'Активувати'">
                <i :class="'fa fa-' + (s.is_active ? 'eye-slash' : 'eye')"></i>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon" @click="editSvc(s)"><i class="fa fa-pen"></i></button>
              <button class="btn btn-danger btn-sm btn-icon" @click="deleteSvc(s)"><i class="fa fa-trash"></i></button>
            </div>
          </div>
        </div>
      </template>

      <!-- Security -->
      <template v-if="tab==='security'">
        <div class="card">
          <div class="card-header"><span class="card-title">Зміна пароля</span></div>
          <div class="card-body" style="display:flex;flex-direction:column;gap:12px;">
            <div class="form-group">
              <label class="label">Поточний пароль</label>
              <input type="password" v-model="pwForm.current_password" class="input">
            </div>
            <div class="form-group">
              <label class="label">Новий пароль</label>
              <input type="password" v-model="pwForm.password" class="input">
            </div>
            <div class="form-group">
              <label class="label">Підтвердіть новий пароль</label>
              <input type="password" v-model="pwForm.password_confirmation" class="input">
            </div>
            <p v-if="pwError" style="color:var(--cancelled);font-size:12px;">{{ pwError }}</p>
            <p v-if="pwSaved" style="color:var(--completed);font-size:12px;"><i class="fa fa-check"></i> Пароль змінено</p>
            <button class="btn btn-primary btn-sm" @click="changePassword" :disabled="savingPw">
              {{ savingPw ? 'Збереження…' : 'Змінити пароль' }}
            </button>
          </div>
        </div>
      </template>

    </div>
  </div>

  <!-- Service modal -->
  <m-modal :show="showSvcModal" :title="editingSvc ? 'Редагувати послугу' : 'Нова послуга'" @close="showSvcModal=false">
    <service-form-body :api="api" :existing="editingSvc" @saved="onSvcSaved" @cancel="showSvcModal=false"></service-form-body>
  </m-modal>
</div>`
};

/* Export all pages */
window.MaystrPages = { DashboardPage, SchedulePage, RequestsPage, ArchivePage, PublicPageSettings, SettingsPage };
