/* =====================================================================
   SPRAVNA CORE — API client + shared Vue components
   This is a plain .js file — no Blade processing, no template issues.
   ===================================================================== */
'use strict';

const { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick, provide, inject } = Vue;

/* ── helpers ── */
function fmt(dt, opts) {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('uk', opts || { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(dt) {
    if (!dt) return '';
    return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
function fmtDT(dt) {
    if (!dt) return '—';
    return fmt(dt) + ' ' + fmtTime(dt);
}
function fmtFullDate(dt) {
    if (!dt) return '—';
    const d = new Date(dt);
    const dayMonth = d.toLocaleDateString('uk', { day: 'numeric', month: 'long' });
    const weekday = d.toLocaleDateString('uk', { weekday: 'long' });
    return `${dayMonth} ${d.getFullYear()} (${weekday})`;
}
function fmtFull(dt) {
    if (!dt) return '—';
    return fmtFullDate(dt) + ' ' + fmtTime(dt);
}
function fmtMoney(v, currency) {
    if (v == null) return '—';
    return (currency || '₴') + Number(v).toLocaleString(undefined, { minimumFractionDigits: 0 });
}
function timeAgo(dt) {
    const d = Math.floor((Date.now() - new Date(dt)) / 1000);
    if (d < 60) return 'щойно';
    if (d < 3600) return Math.floor(d / 60) + ' хв тому';
    if (d < 86400) return Math.floor(d / 3600) + ' год тому';
    return Math.floor(d / 86400) + ' дн тому';
}
function statusColor(s) {
    return { pending: '#f59e0b', confirmed: '#3b82f6', in_progress: '#8b5cf6', completed: '#22c55e', cancelled: '#ef4444', no_show: '#6b7280' }[s] ?? '#6b7280';
}
function initials(name) {
    return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function durationLabel(min) {
    const h = Math.floor(min / 60), m = min % 60;
    if (h && m) return h + 'г ' + m + 'хв';
    return h ? h + 'г' : m + 'хв';
}
function pad2(n) { return String(n).padStart(2, '0'); }
function localDateStr(d) {
    d = d instanceof Date ? d : new Date(d);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function toLocalInput(d) {
    d = d instanceof Date ? d : new Date(d);
    return localDateStr(d) + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
function avatarSrc(profile) {
    return profile?.avatar ? '/storage/' + profile.avatar : null;
}

window.M = { fmt, fmtTime, fmtDT, fmtFull, fmtFullDate, fmtMoney, timeAgo, statusColor, initials, durationLabel, localDateStr, toLocalInput, avatarSrc };

/* ── Auth storage (supports "remember me": localStorage vs sessionStorage) ── */
function getToken() {
    return localStorage.getItem('spravna_token') || sessionStorage.getItem('spravna_token');
}
function clearAuth() {
    localStorage.removeItem('spravna_token');
    localStorage.removeItem('maystr_user');
    sessionStorage.removeItem('spravna_token');
    sessionStorage.removeItem('maystr_user');
}
window.getToken = getToken;
window.clearAuth = clearAuth;

/* ── API factory ── */
function makeAPI(token) {
    const ax = axios.create({
        baseURL: '/api',
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' }
    });
    ax.interceptors.response.use(r => r, err => {
        if (err.response?.status === 401) {
            clearAuth();
            window.location.href = '/login';
        }
        return Promise.reject(err);
    });
    return ax;
}
window.makeAPI = makeAPI;

/* =====================================================================
   SHARED COMPONENTS
   ===================================================================== */

/* ── MModal ── */
const MModal = {
    props: { show: Boolean, title: String, subtitle: String, size: String, icon: String },
    emits: ['close'],
    template: `
<teleport to="body">
  <div v-if="show" class="modal-overlay" @mousedown.self="$emit('close')">
    <div :class="'modal-box' + (size === 'lg' ? ' modal-lg' : size === 'sm' ? ' modal-sm' : '')">
      <div class="modal-head">
        <div class="modal-head-text">
          <span v-if="icon" class="modal-icon-badge"><i :class="'fa fa-' + icon"></i></span>
          <div class="modal-title-col">
            <span class="modal-title">{{ title }}</span>
            <span v-if="subtitle" class="modal-subtitle">{{ subtitle }}</span>
          </div>
        </div>
        <button class="modal-close" @click="$emit('close')"><i class="fa fa-times"></i></button>
      </div>
      <slot></slot>
    </div>
  </div>
</teleport>`
};

/* ── PageSkeleton — shimmering placeholder shown while a page's data loads ── */
const PageSkeleton = {
    props: { type: { type: String, default: 'list' }, rows: { type: Number, default: 5 } },
    computed: {
        rowList() { return Array.from({ length: this.rows }, (_, i) => i); },
    },
    template: `
<div class="skel-wrap">

  <!-- Dashboard: timeline card + counters column + expenses + top services -->
  <template v-if="type==='dashboard'">
    <div class="dash-top-row">
      <div class="card">
        <div class="card-header">
          <div class="skel" style="width:170px;height:26px;border-radius:var(--r-md);"></div>
          <div class="skel skel-circle" style="width:32px;height:32px;"></div>
        </div>
        <div class="card-body skel-card-row">
          <div class="skel" style="height:58px;border-radius:var(--r-md);" v-for="n in 3" :key="n"></div>
        </div>
      </div>
      <div class="flex flex-col gap-16">
        <div class="dash-create-row flex-1">
          <div class="skel" style="height:64px;flex:1;border-radius:var(--r-lg);"></div>
          <div class="skel" style="height:64px;flex:1;border-radius:var(--r-lg);"></div>
        </div>
        <div class="stat-card flex-1 skel-stack">
          <div class="skel" style="width:60%;height:12px;"></div>
          <div class="skel" style="width:35%;height:24px;"></div>
        </div>
        <div class="stat-card flex-1 skel-stack">
          <div class="skel" style="width:60%;height:12px;"></div>
          <div class="skel" style="width:35%;height:24px;"></div>
        </div>
        <div class="stat-card flex-1 skel-stack">
          <div class="skel" style="width:60%;height:12px;"></div>
          <div class="skel" style="width:35%;height:24px;"></div>
        </div>
      </div>
      <div class="card dash-expenses-card">
        <div class="card-header"><div class="skel" style="width:150px;height:16px;"></div></div>
        <div class="card-body skel-stack">
          <div class="skel-row" v-for="n in 4" :key="n">
            <div class="skel skel-circle" style="width:8px;height:8px;"></div>
            <div class="skel" style="flex:1;height:11px;"></div>
            <div class="skel" style="width:46px;height:11px;"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div class="skel" style="width:180px;height:16px;"></div></div>
      <div class="card-body skel-stack">
        <div class="skel" style="height:20px;" v-for="n in 3" :key="n"></div>
      </div>
    </div>
  </template>

  <!-- Calendar (Schedule): toolbar + week grid of bars -->
  <template v-else-if="type==='calendar'">
    <div class="skel-row" style="justify-content:space-between;margin-bottom:16px;">
      <div class="skel" style="width:130px;height:32px;border-radius:var(--r-md);"></div>
      <div class="skel" style="width:200px;height:32px;border-radius:var(--r-md);"></div>
    </div>
    <div class="card" style="padding:16px;display:grid;grid-template-columns:repeat(7,1fr);gap:8px;">
      <div v-for="n in 7" :key="n" class="skel-stack">
        <div class="skel" style="height:14px;width:60%;margin:0 auto 6px;"></div>
        <div class="skel" :style="{height: (90 + (n*23)%140) + 'px', borderRadius:'var(--r-md)'}"></div>
        <div class="skel" style="height:40px;border-radius:var(--r-md);" v-if="n % 2 === 0"></div>
      </div>
    </div>
  </template>

  <!-- Generic list: avatar/dot + two lines + trailing badge -->
  <template v-else-if="type==='list'">
    <div class="card skel-stack" style="padding:6px;">
      <div class="skel-row" v-for="n in rowList" :key="n" style="padding:12px 10px;">
        <div class="skel skel-circle" style="width:38px;height:38px;"></div>
        <div class="skel-stack" style="flex:1;">
          <div class="skel" :style="{height:'13px', width: (40 + (n*17)%35) + '%'}"></div>
          <div class="skel" :style="{height:'11px', width: (20 + (n*11)%25) + '%'}"></div>
        </div>
        <div class="skel" style="width:64px;height:22px;border-radius:var(--r-full);"></div>
      </div>
    </div>
  </template>

  <!-- Table (Archive): header row + striped rows -->
  <template v-else-if="type==='table'">
    <div class="card" style="padding:14px;">
      <div class="skel-row" style="margin-bottom:14px;">
        <div class="skel" style="width:90px;height:11px;" v-for="n in 6" :key="n"></div>
      </div>
      <div class="skel-stack">
        <div class="skel-row" v-for="n in rowList" :key="n" style="padding:8px 0;border-top:1px solid var(--border);">
          <div class="skel" style="width:90px;height:13px;" v-for="c in 6" :key="c"></div>
        </div>
      </div>
    </div>
  </template>

  <!-- Cards grid (Clients): avatar + 2 lines per tile -->
  <template v-else-if="type==='cards'">
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
      <div class="card skel-row" v-for="n in rowList" :key="n" style="padding:16px;">
        <div class="skel skel-circle" style="width:44px;height:44px;"></div>
        <div class="skel-stack" style="flex:1;">
          <div class="skel" style="height:13px;width:70%;"></div>
          <div class="skel" style="height:11px;width:45%;"></div>
        </div>
      </div>
    </div>
  </template>

  <!-- Finances: tab bar + summary row + list -->
  <template v-else-if="type==='finances'">
    <div class="skel-row" style="margin-bottom:16px;">
      <div class="skel" style="width:90px;height:28px;border-radius:var(--r-md);"></div>
      <div class="skel" style="width:90px;height:28px;border-radius:var(--r-md);"></div>
    </div>
    <div class="card skel-stack" style="padding:6px;">
      <div class="skel-row" v-for="n in rowList" :key="n" style="padding:12px 10px;">
        <div class="skel skel-circle" style="width:34px;height:34px;"></div>
        <div class="skel-stack" style="flex:1;">
          <div class="skel" :style="{height:'13px', width: (35 + (n*13)%30) + '%'}"></div>
          <div class="skel" style="height:11px;width:25%;"></div>
        </div>
        <div class="skel" style="width:70px;height:14px;"></div>
      </div>
    </div>
  </template>

  <!-- Analytics: KPI row + two-column panel -->
  <template v-else-if="type==='analytics'">
    <div class="skel-row" style="margin-bottom:16px;flex-wrap:wrap;">
      <div class="skel" style="flex:1;min-width:120px;height:70px;border-radius:var(--r-lg);" v-for="n in 6" :key="n"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div class="card skel-stack" style="padding:16px;">
        <div class="skel" style="width:140px;height:14px;margin-bottom:6px;"></div>
        <div class="skel" style="height:16px;" v-for="n in 4" :key="n"></div>
      </div>
      <div class="card skel-stack" style="padding:16px;">
        <div class="skel" style="width:140px;height:14px;margin-bottom:6px;"></div>
        <div class="skel" style="height:16px;" v-for="n in 4" :key="n"></div>
      </div>
    </div>
  </template>

  <!-- Settings: three profile/hours/services tiles -->
  <template v-else-if="type==='settings'">
    <div class="settings-tiles">
      <div class="card skel-stack" style="padding:18px;">
        <div class="skel-row" style="margin-bottom:8px;">
          <div class="skel skel-circle" style="width:56px;height:56px;"></div>
          <div class="skel-stack" style="flex:1;">
            <div class="skel" style="height:13px;width:60%;"></div>
            <div class="skel" style="height:11px;width:40%;"></div>
          </div>
        </div>
        <div class="skel" style="height:34px;" v-for="n in 3" :key="n"></div>
      </div>
      <div class="card skel-stack" style="padding:18px;">
        <div class="skel" style="height:13px;width:50%;margin-bottom:6px;"></div>
        <div class="skel" style="height:26px;" v-for="n in 5" :key="n"></div>
      </div>
      <div class="card skel-stack" style="padding:18px;">
        <div class="skel" style="height:13px;width:50%;margin-bottom:6px;"></div>
        <div class="skel-row" v-for="n in 3" :key="n">
          <div class="skel skel-circle" style="width:8px;height:8px;"></div>
          <div class="skel" style="flex:1;height:14px;"></div>
        </div>
      </div>
    </div>
  </template>

  <!-- Studio: header row + tab bar + member card grid -->
  <template v-else-if="type==='studio'">
    <div class="skel-row" style="margin-bottom:20px;">
      <div class="skel skel-circle" style="width:56px;height:56px;"></div>
      <div class="skel-stack" style="flex:1;">
        <div class="skel" style="height:18px;width:35%;"></div>
        <div class="skel" style="height:12px;width:20%;"></div>
      </div>
    </div>
    <div class="skel-row" style="margin-bottom:20px;">
      <div class="skel" style="width:100px;height:24px;border-radius:var(--r-md);"></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
      <div class="card skel-stack" v-for="n in 3" :key="n" style="padding:20px 16px;align-items:center;">
        <div class="skel skel-circle" style="width:56px;height:56px;"></div>
        <div class="skel" style="height:13px;width:70%;"></div>
        <div class="skel" style="height:11px;width:50%;"></div>
      </div>
    </div>
  </template>

</div>`
};

/* ── MBadge ── */
const MBadge = {
    props: ['status'],
    methods: {
        label(s) {
            const map = {
                pending: 'Очікує', confirmed: 'Підтверджено', in_progress: 'Виконується',
                completed: 'Завершено', cancelled: 'Скасовано', no_show: 'Не з\'явився',
                accepted: 'Прийнято', declined: 'Відхилено', converted: 'Конвертовано',
                master: 'Майстер', admin: 'Адмін',
                free: 'Free', pro: 'Pro', premium: 'Premium',
                trialing: 'Триал', active: 'Активна', past_due: 'Заборгованість', expired: 'Завершена',
            };
            return map[s] || (s || '').replace('_', ' ');
        }
    },
    template: `<span :class="'badge badge-' + (status||'pending').replace('_','-')">{{ label(status) }}</span>`
};

/* ── MAvatar ── */
const MAvatar = {
    props: { name: String, size: { default: 'md' }, src: String },
    computed: { ini() { return M.initials(this.name); } },
    template: `<div :class="'avatar av-' + size"><img v-if="src" :src="src" :alt="name"><template v-else>{{ ini }}</template></div>`
};

/* ── MDateTimePicker (custom 24h date+time picker) ── */
const MDateTimePicker = {
    props: { modelValue: String },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        const open = ref(false);

        function parse(val) {
            if (val) {
                const [datePart, timePart] = val.split('T');
                const [y, mo, d] = datePart.split('-').map(Number);
                const [hh, mm] = (timePart || '00:00').split(':').map(Number);
                return { y, mo, d, hh, mm };
            }
            const now = new Date();
            return { y: now.getFullYear(), mo: now.getMonth() + 1, d: now.getDate(), hh: now.getHours(), mm: now.getMinutes() };
        }

        const parsed = ref(parse(props.modelValue));
        const viewMonth = ref(new Date(parsed.value.y, parsed.value.mo - 1, 1));

        watch(() => props.modelValue, v => { parsed.value = parse(v); });

        function emitValue() {
            const { y, mo, d, hh, mm } = parsed.value;
            emit('update:modelValue', `${y}-${pad2(mo)}-${pad2(d)}T${pad2(hh)}:${pad2(mm)}`);
        }

        const displayLabel = computed(() => {
            const { y, mo, d, hh, mm } = parsed.value;
            return `${pad2(d)}.${pad2(mo)}.${y}, ${pad2(hh)}:${pad2(mm)}`;
        });

        const monthLabel = computed(() => viewMonth.value.toLocaleDateString('uk', { month: 'long', year: 'numeric' }));

        const calendarDays = computed(() => {
            const y = viewMonth.value.getFullYear(), mo = viewMonth.value.getMonth();
            const first = (new Date(y, mo, 1).getDay() + 6) % 7;
            const daysIn = new Date(y, mo + 1, 0).getDate();
            const cells = [];
            for (let i = 0; i < first; i++) cells.push(null);
            for (let i = 1; i <= daysIn; i++) cells.push(i);
            return cells;
        });

        function selectDay(day) {
            if (!day) return;
            parsed.value = { ...parsed.value, y: viewMonth.value.getFullYear(), mo: viewMonth.value.getMonth() + 1, d: day };
            emitValue();
        }
        function prevMonth() { viewMonth.value = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() - 1, 1); }
        function nextMonth() { viewMonth.value = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() + 1, 1); }
        function setHour(h) { parsed.value = { ...parsed.value, hh: h }; emitValue(); }
        function setMinute(m) { parsed.value = { ...parsed.value, mm: m }; emitValue(); }
        function isSelectedDay(day) {
            return !!day && parsed.value.y === viewMonth.value.getFullYear() && parsed.value.mo === viewMonth.value.getMonth() + 1 && parsed.value.d === day;
        }
        function isToday(day) {
            const t = new Date();
            return !!day && t.getFullYear() === viewMonth.value.getFullYear() && t.getMonth() === viewMonth.value.getMonth() && t.getDate() === day;
        }

        const hourOptions = Array.from({ length: 24 }, (_, i) => i);
        const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

        function toggle() {
            open.value = !open.value;
            if (open.value) viewMonth.value = new Date(parsed.value.y, parsed.value.mo - 1, 1);
        }
        function close() { open.value = false; }

        return {
            open, parsed, displayLabel, monthLabel, calendarDays, selectDay, prevMonth, nextMonth,
            setHour, setMinute, isSelectedDay, isToday, hourOptions, minuteOptions, toggle, close, pad2,
        };
    },
    template: `
<div class="dt-picker">
  <button type="button" class="dt-trigger input" @click="toggle">
    <i class="fa fa-calendar-days"></i>
    <span>{{ displayLabel }}</span>
  </button>
  <teleport to="body">
    <div v-if="open" class="dt-pop-overlay" @mousedown.self="close">
      <div class="dt-pop">
        <div class="dt-pop-cal">
          <div class="dt-pop-cal-head">
            <button type="button" class="dt-nav" @click="prevMonth"><i class="fa fa-chevron-left"></i></button>
            <span class="dt-month-label">{{ monthLabel }}</span>
            <button type="button" class="dt-nav" @click="nextMonth"><i class="fa fa-chevron-right"></i></button>
          </div>
          <div class="dt-pop-weekdays">
            <span v-for="d in ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']" :key="d">{{ d }}</span>
          </div>
          <div class="dt-pop-days">
            <button v-for="(day,i) in calendarDays" :key="i" type="button"
              :class="['dt-day', { empty: !day, selected: isSelectedDay(day), today: isToday(day) }]"
              :disabled="!day" @click="selectDay(day)">{{ day }}</button>
          </div>
        </div>
        <div class="dt-pop-time">
          <div class="dt-pop-time-label"><i class="fa fa-clock"></i> Час (24г)</div>
          <div class="dt-pop-time-row">
            <select class="select dt-time-select" :value="parsed.hh" @change="setHour(+$event.target.value)">
              <option v-for="h in hourOptions" :key="h" :value="h">{{ pad2(h) }}</option>
            </select>
            <span class="dt-time-sep">:</span>
            <select class="select dt-time-select" :value="parsed.mm" @change="setMinute(+$event.target.value)">
              <option v-for="m in minuteOptions" :key="m" :value="m">{{ pad2(m) }}</option>
            </select>
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-sm dt-pop-done" @click="close">Готово</button>
      </div>
    </div>
  </teleport>
</div>`
};

/* ── MTimePicker (custom 24h time-only picker) ── */
const MTimePicker = {
    props: { modelValue: String },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        const open = ref(false);

        function parse(val) {
            const [hh, mm] = (val || '00:00').split(':').map(Number);
            return { hh: hh || 0, mm: mm || 0 };
        }

        const parsed = ref(parse(props.modelValue));
        watch(() => props.modelValue, v => { parsed.value = parse(v); });

        function emitValue() {
            emit('update:modelValue', `${pad2(parsed.value.hh)}:${pad2(parsed.value.mm)}`);
        }

        const displayLabel = computed(() => `${pad2(parsed.value.hh)}:${pad2(parsed.value.mm)}`);

        function setHour(h) { parsed.value = { ...parsed.value, hh: h }; emitValue(); }
        function setMinute(m) { parsed.value = { ...parsed.value, mm: m }; emitValue(); }

        const hourOptions = Array.from({ length: 24 }, (_, i) => i);
        const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

        function toggle() { open.value = !open.value; }
        function close() { open.value = false; }

        return { open, parsed, displayLabel, hourOptions, minuteOptions, setHour, setMinute, toggle, close, pad2 };
    },
    template: `
<div class="dt-picker tp-picker">
  <button type="button" class="dt-trigger input tp-trigger" @click="toggle">
    <i class="fa fa-clock"></i>
    <span>{{ displayLabel }}</span>
  </button>
  <teleport to="body">
    <div v-if="open" class="dt-pop-overlay" @mousedown.self="close">
      <div class="dt-pop tp-pop">
        <div class="dt-pop-time-row">
          <select class="select dt-time-select" :value="parsed.hh" @change="setHour(+$event.target.value)">
            <option v-for="h in hourOptions" :key="h" :value="h">{{ pad2(h) }}</option>
          </select>
          <span class="dt-time-sep">:</span>
          <select class="select dt-time-select" :value="parsed.mm" @change="setMinute(+$event.target.value)">
            <option v-for="m in minuteOptions" :key="m" :value="m">{{ pad2(m) }}</option>
          </select>
        </div>
        <button type="button" class="btn btn-primary btn-sm dt-pop-done" @click="close">Готово</button>
      </div>
    </div>
  </teleport>
</div>`
};

/* ── Client Form ── */
const ClientFormBody = {
    props: { api: Object, existing: Object },
    emits: ['saved', 'cancel'],
    setup(props, { emit }) {
        const saving = ref(false);
        const error = ref('');
        const form = reactive({
            name: props.existing?.name ?? '',
            phone: props.existing?.phone ?? '',
            email: props.existing?.email ?? '',
            instagram: props.existing?.instagram ?? '',
            birthday: props.existing?.birthday ? props.existing.birthday.slice(0, 10) : '',
            source: props.existing?.source ?? '',
            notes: props.existing?.notes ?? '',
            medical_notes: props.existing?.medical_notes ?? '',
            is_vip: props.existing?.is_vip ?? false,
        });
        async function save() {
            if (!form.name.trim()) { error.value = 'Ім\'я обов\'язкове'; return; }
            saving.value = true; error.value = '';
            try {
                const res = props.existing
                    ? await props.api.put('/clients/' + props.existing.id, form)
                    : await props.api.post('/clients', form);
                emit('saved', res.data);
            } catch(e) { error.value = 'Не вдалося зберегти'; }
            saving.value = false;
        }
        return { form, saving, error, save };
    },
    template: `
<div class="modal-body">
  <div class="form-row">
    <div class="form-group">
      <label class="label">Ім'я *</label>
      <input v-model="form.name" class="input" placeholder="Повне ім'я">
    </div>
    <div class="form-group">
      <label class="label">Телефон</label>
      <input v-model="form.phone" class="input" type="tel">
    </div>
  </div>
  <div class="form-row">
    <div class="form-group">
      <label class="label">Електронна пошта</label>
      <input v-model="form.email" class="input" type="email">
    </div>
    <div class="form-group">
      <label class="label">Instagram</label>
      <input v-model="form.instagram" class="input" placeholder="@handle">
    </div>
  </div>
  <div class="form-row">
    <div class="form-group">
      <label class="label">День народження</label>
      <input v-model="form.birthday" class="input" type="date">
    </div>
    <div class="form-group">
      <label class="label">Джерело</label>
      <input v-model="form.source" class="input" placeholder="Instagram, рекомендація…">
    </div>
  </div>
  <div class="form-group">
    <label class="label">Нотатки</label>
    <textarea v-model="form.notes" class="textarea" rows="2"></textarea>
  </div>
  <div class="form-group">
    <label class="label">Медичні / шкірні нотатки (приватно)</label>
    <textarea v-model="form.medical_notes" class="textarea" rows="2" placeholder="Алергії, стани…"></textarea>
  </div>
  <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
    <input type="checkbox" v-model="form.is_vip"> <span>VIP клієнт</span>
  </label>
  <p v-if="error" style="color:var(--cancelled);font-size:12px;">{{ error }}</p>
</div>
<div class="modal-footer">
  <button class="btn btn-ghost btn-sm" @click="$emit('cancel')">Скасувати</button>
  <button class="btn btn-primary btn-sm" @click="save" :disabled="saving">
    {{ saving ? 'Збереження…' : (existing ? 'Оновити клієнта' : 'Додати клієнта') }}
  </button>
</div>`
};

/* ── Appointment Form component ── */
const AppointmentFormBody = {
    props: { api: Object, existing: Object, initialDate: String, initialHour: Number, initialMinute: Number },
    emits: ['saved', 'cancel'],
    components: { MModal, ClientFormBody, MDateTimePicker },
    setup(props, { emit }) {
        const clients = ref([]);
        const services = ref([]);
        const saving = ref(false);
        const error = ref('');
        const showClientModal = ref(false);
        const clientQuery = ref('');
        const clientDropdownOpen = ref(false);
        const blockPresets = ['Підготовка', 'Обід', 'Перерва'];

        const defaultDT = () => {
            if (props.initialDate) {
                return `${props.initialDate}T${pad2(props.initialHour ?? 10)}:${pad2(props.initialMinute ?? 0)}`;
            }
            return M.toLocalInput(new Date());
        };

        const form = reactive({
            type: props.existing?.type ?? 'appointment',
            title: props.existing?.title ?? '',
            client_id: props.existing?.client_id ?? '',
            service_id: props.existing?.service_id ?? '',
            scheduled_at: props.existing?.scheduled_at ? M.toLocalInput(new Date(props.existing.scheduled_at)) : defaultDT(),
            duration: props.existing?.duration ?? 60,
            status: props.existing?.status ?? 'confirmed',
            price: props.existing?.price ?? '',
            deposit: props.existing?.deposit ?? '',
            deposit_paid: props.existing?.deposit_paid ?? false,
            notes: props.existing?.notes ?? '',
            internal_notes: props.existing?.internal_notes ?? '',
        });

        function onServiceChange() {
            const s = services.value.find(s => s.id == form.service_id);
            if (s) { form.duration = s.duration; if (s.price) form.price = s.price; }
        }

        async function save() {
            if (form.type === 'appointment' && !form.client_id) { error.value = 'Оберіть клієнта'; return; }
            if (form.type === 'block' && !form.title.trim()) { error.value = 'Вкажіть назву перерви'; return; }
            saving.value = true; error.value = '';
            try {
                const p = { ...form };
                if (form.type === 'block') {
                    delete p.client_id;
                    delete p.service_id;
                    delete p.price;
                    delete p.deposit;
                    delete p.deposit_paid;
                    delete p.notes;
                    delete p.status;
                } else {
                    p.title = p.title?.trim() ? p.title.trim() : null;
                    if (!p.service_id) delete p.service_id;
                    if (p.price === '' || p.price === null) delete p.price;
                    if (p.deposit === '' || p.deposit === null) delete p.deposit;
                }
                const res = props.existing
                    ? await props.api.put('/appointments/' + props.existing.id, p)
                    : await props.api.post('/appointments', p);
                emit('saved', res.data);
            } catch(e) { error.value = e.response?.data?.message || 'Не вдалося зберегти'; }
            saving.value = false;
        }

        async function del() {
            if (!confirm('Видалити цей запис?')) return;
            await props.api.delete('/appointments/' + props.existing.id);
            emit('saved', null);
        }

        function newClient() { showClientModal.value = true; }
        function onClientCreated(client) {
            clients.value = [client, ...clients.value];
            form.client_id = client.id;
            showClientModal.value = false;
        }

        const selectedClient = computed(() => clients.value.find(c => String(c.id) === String(form.client_id)) || null);
        const filteredClients = computed(() => {
            const q = clientQuery.value.trim().toLowerCase();
            if (!q) return clients.value;
            return clients.value.filter(c =>
                c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
            );
        });
        function openClientDropdown() { clientDropdownOpen.value = true; clientQuery.value = ''; }
        function selectClient(c) { form.client_id = c.id; clientQuery.value = ''; clientDropdownOpen.value = false; }
        function onClientBlur() { setTimeout(() => { clientDropdownOpen.value = false; clientQuery.value = ''; }, 100); }
        function onClientEnter() { if (filteredClients.value.length) selectClient(filteredClients.value[0]); }

        onMounted(async () => {
            const [c, s] = await Promise.all([
                props.api.get('/clients', { params: { per_page: 200 } }),
                props.api.get('/services', { params: { active_only: true } })
            ]);
            clients.value = c.data.data ?? c.data;
            services.value = s.data;
        });

        return {
            form, clients, services, saving, error, showClientModal, onServiceChange, save, del, newClient, onClientCreated,
            clientQuery, clientDropdownOpen, selectedClient, filteredClients, openClientDropdown, selectClient, onClientBlur, onClientEnter,
            blockPresets,
        };
    },
    template: `
<div class="modal-body">
  <div class="form-row appt-type-toggle">
    <button type="button" :class="'btn btn-sm flex-1 ' + (form.type==='appointment' ? 'btn-primary' : 'btn-ghost')" @click="form.type='appointment'">
      <i class="fa fa-user"></i> Запис клієнта
    </button>
    <button type="button" :class="'btn btn-sm flex-1 ' + (form.type==='block' ? 'btn-primary' : 'btn-ghost')" @click="form.type='block'">
      <i class="fa fa-mug-hot"></i> Підготовка / обід
    </button>
  </div>

  <template v-if="form.type==='appointment'">
  <div class="form-row">
    <div class="form-group">
      <label class="label">Клієнт *</label>
      <div class="client-select-row">
        <div class="client-combo">
          <input
            class="input"
            :value="clientDropdownOpen ? clientQuery : (selectedClient ? selectedClient.name : '')"
            @focus="openClientDropdown"
            @input="clientQuery = $event.target.value"
            @blur="onClientBlur"
            @keydown.enter.prevent="onClientEnter"
            @keydown.esc="onClientBlur"
            placeholder="Пошук клієнта за іменем або телефоном…"
            autocomplete="off"
          >
          <i class="fa fa-chevron-down client-combo-caret"></i>
          <div v-if="clientDropdownOpen" class="client-combo-dropdown">
            <div v-if="!filteredClients.length" class="client-combo-empty">Нічого не знайдено</div>
            <div v-for="c in filteredClients" :key="c.id"
                 :class="['client-combo-option', { active: c.id == form.client_id }]"
                 @mousedown.prevent="selectClient(c)">
              <span class="cco-name">{{ c.name }}</span>
              <span v-if="c.phone" class="cco-phone">{{ c.phone }}</span>
            </div>
          </div>
        </div>
        <button type="button" class="btn-add-client" title="Додати нового клієнта" @click="newClient">
          <i class="fa fa-user-plus"></i>
        </button>
      </div>
    </div>
    <div class="form-group">
      <label class="label">Послуга</label>
      <select v-model="form.service_id" @change="onServiceChange" class="select">
        <option value="">Без послуги</option>
        <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
    </div>
  </div>
  </template>

  <template v-else>
  <div class="form-group">
    <label class="label">Тип перерви</label>
    <div class="block-presets">
      <button v-for="p in blockPresets" :key="p" type="button"
        :class="'preset-chip' + (form.title===p ? ' active' : '')" @click="form.title=p">{{ p }}</button>
    </div>
    <input v-model="form.title" class="input" placeholder="Напр. Підготовка, Обід…" style="margin-top:8px;">
  </div>
  </template>

  <div class="form-row">
    <div class="form-group">
      <label class="label">Дата та час *</label>
      <m-date-time-picker v-model="form.scheduled_at"></m-date-time-picker>
    </div>
    <div class="form-group">
      <label class="label">Тривалість (хв)</label>
      <input type="number" v-model.number="form.duration" class="input" min="5" step="5">
    </div>
  </div>

  <template v-if="form.type==='appointment'">
  <div class="form-row">
    <div class="form-group">
      <label class="label">Ціна</label>
      <input type="number" v-model.number="form.price" class="input" placeholder="0.00" min="0" step="0.01">
    </div>
    <div class="form-group">
      <label class="label">Статус</label>
      <select v-model="form.status" class="select">
        <option value="pending">Очікує</option>
        <option value="confirmed">Підтверджено</option>
        <option value="in_progress">Виконується</option>
        <option value="completed">Завершено</option>
        <option value="cancelled">Скасовано</option>
        <option value="no_show">Не з'явився</option>
      </select>
    </div>
  </div>
  <div class="form-group">
    <label class="label">Нотатки (видно клієнту)</label>
    <textarea v-model="form.notes" class="textarea" placeholder="Нотатки до сесії…"></textarea>
  </div>
  </template>

  <div class="form-group">
    <label class="label">Внутрішні нотатки</label>
    <textarea v-model="form.internal_notes" class="textarea" placeholder="Приватно…"></textarea>
  </div>
  <p v-if="error" style="color:var(--cancelled);font-size:12px;margin-top:4px;">{{ error }}</p>
</div>
<div class="modal-footer">
  <button v-if="existing" class="btn btn-danger btn-sm" @click="del" style="margin-right:auto">
    <i class="fa fa-trash"></i> Видалити
  </button>
  <button class="btn btn-ghost btn-sm" @click="$emit('cancel')">Скасувати</button>
  <button class="btn btn-primary btn-sm" @click="save" :disabled="saving">
    <i class="fa fa-check"></i> {{ saving ? 'Збереження…' : (existing ? 'Оновити' : 'Створити запис') }}
  </button>
</div>
<m-modal :show="showClientModal" title="Новий клієнт" subtitle="Додайте картку — і одразу оберіть її для запису" icon="user-plus" size="sm" @close="showClientModal=false">
  <client-form-body :api="api" @saved="onClientCreated" @cancel="showClientModal=false"></client-form-body>
</m-modal>`
};

/* ── Service Form ── */
const ServiceFormBody = {
    props: { api: Object, existing: Object },
    emits: ['saved', 'cancel'],
    setup(props, { emit }) {
        const saving = ref(false);
        const error = ref('');
        const pricingType = ref(
            props.existing?.price_on_request ? 'request'
            : props.existing?.price_to ? 'range'
            : props.existing?.price_from ? 'from'
            : 'fixed'
        );
        const form = reactive({
            name: props.existing?.name ?? '',
            category: props.existing?.category ?? '',
            duration: props.existing?.duration ?? 60,
            price: props.existing?.price ?? '',
            price_from: props.existing?.price_from ?? '',
            price_to: props.existing?.price_to ?? '',
            description: props.existing?.description ?? '',
            color: props.existing?.color ?? '#7c5cfc',
            is_active: props.existing?.is_active ?? true,
        });
        async function save() {
            if (!form.name.trim()) { error.value = 'Назва обов\'язкова'; return; }
            saving.value = true; error.value = '';
            const p = { ...form, price_on_request: pricingType.value === 'request' };
            if (pricingType.value === 'fixed') { p.price_from = null; p.price_to = null; }
            else if (pricingType.value === 'from') { p.price = null; p.price_to = null; }
            else if (pricingType.value === 'range') { p.price = null; }
            else { p.price = null; p.price_from = null; p.price_to = null; }
            try {
                props.existing ? await props.api.put('/services/' + props.existing.id, p) : await props.api.post('/services', p);
                emit('saved');
            } catch(e) { error.value = 'Не вдалося зберегти'; }
            saving.value = false;
        }
        return { form, pricingType, saving, error, save };
    },
    template: `
<div class="modal-body">
  <div class="form-group">
    <label class="label">Назва послуги *</label>
    <input v-model="form.name" class="input" placeholder="напр. Повний рукав">
  </div>
  <div class="form-row">
    <div class="form-group">
      <label class="label">Категорія</label>
      <select v-model="form.category" class="select">
        <option value="">Без категорії</option>
        <option value="tattoo">Тату</option><option value="nails">Нігті</option>
        <option value="brows">Брови</option><option value="lashes">Вії</option>
        <option value="piercing">Пірсинг</option><option value="pmu">Перманент</option>
        <option value="hair">Волосся</option><option value="other">Інше</option>
      </select>
    </div>
    <div class="form-group">
      <label class="label">Тривалість (хв)</label>
      <input type="number" v-model.number="form.duration" class="input" min="15" step="15">
    </div>
  </div>
  <div class="form-group">
    <label class="label">Ціноутворення</label>
    <select v-model="pricingType" class="select">
      <option value="fixed">Фіксована ціна</option>
      <option value="range">Діапазон (від–до)</option>
      <option value="from">Від (початкова ціна)</option>
      <option value="request">За запитом</option>
    </select>
  </div>
  <div v-if="pricingType==='fixed'" class="form-group">
    <label class="label">Ціна</label>
    <input type="number" v-model.number="form.price" class="input" min="0">
  </div>
  <div v-if="pricingType==='range'" class="form-row">
    <div class="form-group"><label class="label">Від</label><input type="number" v-model.number="form.price_from" class="input" min="0"></div>
    <div class="form-group"><label class="label">До</label><input type="number" v-model.number="form.price_to" class="input" min="0"></div>
  </div>
  <div v-if="pricingType==='from'" class="form-group">
    <label class="label">Починаючи від</label>
    <input type="number" v-model.number="form.price_from" class="input" min="0">
  </div>
  <div class="form-group">
    <label class="label">Опис</label>
    <textarea v-model="form.description" class="textarea" rows="2"></textarea>
  </div>
  <div class="form-row">
    <div class="form-group">
      <label class="label">Колір в календарі</label>
      <input type="color" v-model="form.color" class="input" style="padding:3px;height:38px;cursor:pointer;">
    </div>
    <div class="form-group" style="justify-content:flex-end;">
      <label class="label" style="visibility:hidden;">.</label>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;height:38px;">
        <input type="checkbox" v-model="form.is_active"> Активна
      </label>
    </div>
  </div>
  <p v-if="error" style="color:var(--cancelled);font-size:12px;">{{ error }}</p>
</div>
<div class="modal-footer">
  <button class="btn btn-ghost btn-sm" @click="$emit('cancel')">Скасувати</button>
  <button class="btn btn-primary btn-sm" @click="save" :disabled="saving">
    {{ saving ? 'Збереження…' : (existing ? 'Оновити послугу' : 'Створити послугу') }}
  </button>
</div>`
};

/* ── Respond to Request form ── */
const RespondFormBody = {
    props: { api: Object, request: Object },
    emits: ['responded', 'cancel'],
    components: { MDateTimePicker },
    setup(props, { emit }) {
        const responding = ref(false);
        const error = ref('');
        const mode = ref('accept'); // accept | decline
        const form = reactive({
            status: 'accepted',
            response_message: '',
            scheduled_at: props.request?.preferred_date ? M.localDateStr(props.request.preferred_date) + 'T' + (props.request.preferred_time || '10:00') : '',
            duration: props.request?.service?.duration ?? 60,
            price: props.request?.service?.price ?? '',
        });

        watch(() => mode.value, v => { form.status = v === 'accept' ? 'accepted' : 'declined'; });

        async function respond() {
            if (mode.value === 'accept' && !form.scheduled_at) { error.value = 'Вкажіть дату та час'; return; }
            responding.value = true; error.value = '';
            try {
                await props.api.post('/booking-requests/' + props.request.id + '/respond', {
                    status: form.status,
                    response_message: form.response_message || null,
                    scheduled_at: mode.value === 'accept' ? form.scheduled_at : null,
                    duration: form.duration,
                    price: form.price || null,
                });
                emit('responded');
            } catch(e) { error.value = e.response?.data?.message || 'Помилка'; }
            responding.value = false;
        }
        return { M, form, mode, responding, error, respond };
    },
    template: `
<div class="modal-body">
  <div style="background:var(--surface-3);border-radius:var(--r-md);padding:12px 14px;margin-bottom:4px;">
    <p style="font-weight:600;font-size:13px;margin-bottom:2px;">{{ request.client_name }}</p>
    <p style="font-size:12px;color:var(--text-sub);">{{ request.client_phone || request.client_email || request.client_instagram }}</p>
    <p v-if="request.service" style="font-size:12px;margin-top:4px;"><i class="fa fa-scissors" style="color:var(--accent);margin-right:4px;"></i>{{ request.service.name }}</p>
    <p v-if="request.preferred_date" style="font-size:12px;"><i class="fa fa-calendar" style="color:var(--accent);margin-right:4px;"></i>Бажано: {{ M.fmtFullDate(request.preferred_date) }}{{ request.preferred_time ? ' ' + request.preferred_time : '' }}</p>
    <p v-if="request.message" style="font-size:12px;color:var(--text-sub);margin-top:6px;font-style:italic;">"{{ request.message }}"</p>
  </div>

  <div class="flex gap-8">
    <button :class="'btn btn-sm flex-1 ' + (mode==='accept' ? 'btn-success' : 'btn-ghost')" @click="mode='accept'">
      <i class="fa fa-check"></i> Прийняти
    </button>
    <button :class="'btn btn-sm flex-1 ' + (mode==='decline' ? 'btn-danger' : 'btn-ghost')" @click="mode='decline'">
      <i class="fa fa-times"></i> Відхилити
    </button>
  </div>

  <template v-if="mode==='accept'">
    <div class="form-row">
      <div class="form-group">
        <label class="label">Дата та час *</label>
        <m-date-time-picker v-model="form.scheduled_at"></m-date-time-picker>
      </div>
      <div class="form-group">
        <label class="label">Тривалість (хв)</label>
        <input type="number" v-model.number="form.duration" class="input" min="15" step="15">
      </div>
    </div>
    <div class="form-group">
      <label class="label">Ціна</label>
      <input type="number" v-model.number="form.price" class="input" min="0" placeholder="0.00">
    </div>
  </template>

  <div class="form-group">
    <label class="label">Повідомлення клієнту (необов'язково)</label>
    <textarea v-model="form.response_message" class="textarea" rows="2" placeholder="Ваша відповідь…"></textarea>
  </div>
  <p v-if="error" style="color:var(--cancelled);font-size:12px;">{{ error }}</p>
</div>
<div class="modal-footer">
  <button class="btn btn-ghost btn-sm" @click="$emit('cancel')">Скасувати</button>
  <button :class="'btn btn-sm ' + (mode==='accept' ? 'btn-primary' : 'btn-danger')" @click="respond" :disabled="responding">
    {{ responding ? 'Відправлення…' : (mode==='accept' ? 'Прийняти та записати' : 'Відхилити') }}
  </button>
</div>`
};

/* ── Onboarding Wizard (first-login setup, skippable step by step) ── */
const OnboardingWizard = {
    props: { api: Object },
    emits: ['done'],
    components: { MTimePicker },
    setup(props, { emit }) {
        const step = ref(1);
        const saving = ref(false);
        const error = ref('');

        const form = reactive({
            name: '', specialty: '', bio: '', city: '', country: '', phone: '', instagram: '', website: '',
        });
        const avatarUrl = ref(null);
        const avatarUploading = ref(false);
        const fileInput = ref(null);

        const dayNames = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
        const workingHours = ref([]);

        const services = ref([]);
        const svcForm = reactive({ name: '', category: '', duration: 60, price: '' });
        const addingSvc = ref(false);

        async function loadProfile() {
            try {
                const { data } = await props.api.get('/profile');
                form.name = data.name || '';
                const p = data.profile || {};
                ['specialty', 'bio', 'city', 'country', 'phone', 'instagram', 'website'].forEach(k => { form[k] = p[k] ?? ''; });
                avatarUrl.value = p.avatar ? '/storage/' + p.avatar : null;
            } catch (e) {}
        }

        async function loadHours() {
            try {
                const { data } = await props.api.get('/schedule/working-hours');
                const days = [0, 1, 2, 3, 4, 5, 6];
                workingHours.value = days.map(d => data.find(h => h.day_of_week === d) || { day_of_week: d, start_time: '09:00', end_time: '18:00', is_working: d >= 1 && d <= 5 });
            } catch (e) {}
        }

        function pickAvatar() { fileInput.value?.click(); }
        async function onAvatarChange(e) {
            const file = e.target.files[0];
            if (!file) return;
            avatarUploading.value = true; error.value = '';
            const fd = new FormData();
            fd.append('avatar', file);
            try {
                const { data } = await props.api.post('/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                avatarUrl.value = data.avatar_url;
            } catch (e) {
                error.value = 'Не вдалося завантажити фото';
            }
            avatarUploading.value = false;
            e.target.value = '';
        }

        async function saveStep1(next) {
            saving.value = true; error.value = '';
            try {
                await props.api.put('/profile', form);
                if (next) step.value = 2;
            } catch (e) { error.value = 'Не вдалося зберегти'; }
            saving.value = false;
        }

        async function saveStep2(next) {
            saving.value = true; error.value = '';
            try {
                await props.api.put('/schedule/working-hours', { hours: workingHours.value });
                if (next) step.value = 3;
            } catch (e) { error.value = 'Не вдалося зберегти'; }
            saving.value = false;
        }

        async function addService() {
            if (!svcForm.name.trim()) return;
            addingSvc.value = true; error.value = '';
            try {
                const { data } = await props.api.post('/services', {
                    name: svcForm.name, category: svcForm.category || null,
                    duration: svcForm.duration, price: svcForm.price || null,
                });
                services.value.push(data);
                svcForm.name = ''; svcForm.category = ''; svcForm.duration = 60; svcForm.price = '';
            } catch (e) { error.value = 'Не вдалося додати послугу'; }
            addingSvc.value = false;
        }

        async function removeService(s) {
            await props.api.delete('/services/' + s.id);
            services.value = services.value.filter(x => x.id !== s.id);
        }

        async function finish() {
            saving.value = true;
            try { await props.api.post('/onboarding/complete'); } catch (e) {}
            emit('done');
        }

        function skipStep() {
            if (step.value < 3) step.value += 1;
            else finish();
        }

        const stepMeta = [
            { icon: 'fa-user-pen',  title: 'Розкажіть про себе',    sub: 'Клієнти побачать цю інформацію на вашій публічній сторінці.' },
            { icon: 'fa-clock',     title: 'Ваш графік роботи',     sub: 'Вкажіть, коли приймаєте клієнтів. Можна змінити пізніше.' },
            { icon: 'fa-scissors',  title: 'Ваші послуги',          sub: 'Додайте послуги, які пропонуєте. Можна доповнити пізніше.' },
        ];

        onMounted(() => { loadProfile(); loadHours(); });

        return {
            step, saving, error, form, avatarUrl, avatarUploading, fileInput,
            dayNames, workingHours, services, svcForm, addingSvc, stepMeta,
            pickAvatar, onAvatarChange, saveStep1, saveStep2, addService, removeService, finish, skipStep,
        };
    },
    template: `
<div class="ob-page">
  <!-- Top bar -->
  <div class="ob-topbar">
    <div class="ob-logo">
      <div class="ob-logo-icon"><i class="fa fa-asterisk"></i></div>
      <span class="ob-logo-name">Spravna</span>
    </div>
    <div class="ob-topbar-right">
      <span class="ob-step-counter">Крок {{ step }} з 3</span>
      <button type="button" class="btn btn-ghost btn-sm" @click="finish" style="color:var(--text-muted);">Пропустити</button>
    </div>
  </div>

  <!-- Progress bar -->
  <div class="ob-progress-bar">
    <div class="ob-progress-fill" :style="{width: (step/3*100) + '%'}"></div>
  </div>

  <!-- Content -->
  <div class="ob-body">
    <div class="ob-card">

      <!-- Step badge + title -->
      <div class="ob-step-head">
        <div class="ob-step-icon"><i :class="'fa ' + stepMeta[step-1].icon"></i></div>
        <div>
          <div class="ob-step-badge">Крок {{ step }} з 3</div>
          <h2 class="ob-title">{{ stepMeta[step-1].title }}</h2>
          <p class="ob-subtitle">{{ stepMeta[step-1].sub }}</p>
        </div>
      </div>

      <div class="ob-divider"></div>

      <!-- Step 1: Profile info + avatar -->
      <div v-if="step===1" style="display:flex;flex-direction:column;gap:14px;">
        <div class="avatar-upload-row">
          <div class="avatar av-xl">
            <img v-if="avatarUrl" :src="avatarUrl" :alt="form.name">
            <span v-else>{{ form.name?.charAt(0)?.toUpperCase() || '?' }}</span>
          </div>
          <div>
            <button type="button" class="btn btn-secondary btn-sm" @click="pickAvatar" :disabled="avatarUploading">
              <i class="fa fa-camera"></i> {{ avatarUploading ? 'Завантаження…' : 'Завантажити фото' }}
            </button>
            <input ref="fileInput" type="file" accept="image/*" style="display:none;" @change="onAvatarChange">
            <p style="font-size:11px;color:var(--text-muted);margin-top:4px;">JPG або PNG, до 2 МБ</p>
          </div>
        </div>
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
          <textarea v-model="form.bio" class="textarea" rows="3" placeholder="Розкажіть клієнтам про себе…"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="label">Місто</label><input v-model="form.city" class="input"></div>
          <div class="form-group"><label class="label">Країна</label><input v-model="form.country" class="input"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="label">Телефон</label><input v-model="form.phone" class="input" type="tel"></div>
          <div class="form-group"><label class="label">Instagram</label><input v-model="form.instagram" class="input" placeholder="@handle"></div>
        </div>
      </div>

      <!-- Step 2: Working hours -->
      <div v-if="step===2" style="display:flex;flex-direction:column;gap:2px;">
        <div v-for="h in workingHours" :key="h.day_of_week" class="wh-row">
          <span class="wh-day">{{ dayNames[h.day_of_week] }}</span>
          <button type="button" :class="'toggle' + (h.is_working ? ' on' : '')" @click="h.is_working = !h.is_working" style="flex-shrink:0;"></button>
          <template v-if="h.is_working">
            <m-time-picker v-model="h.start_time"></m-time-picker>
            <span style="color:var(--text-muted);font-size:13px;">—</span>
            <m-time-picker v-model="h.end_time"></m-time-picker>
          </template>
          <span v-else style="font-size:13px;color:var(--text-muted);">Вихідний</span>
        </div>
      </div>

      <!-- Step 3: Services -->
      <div v-if="step===3" style="display:flex;flex-direction:column;gap:14px;">
        <div v-if="services.length" class="onboarding-svc-list">
          <div v-for="s in services" :key="s.id" class="svc-card">
            <div class="svc-dot" :style="{background: s.color || '#c9a84c'}"></div>
            <div class="svc-info">
              <div class="svc-name">{{ s.name }}</div>
              <div class="svc-meta">{{ s.category || '—' }} · {{ s.duration ? s.duration + ' хв' : '' }}</div>
            </div>
            <button type="button" class="btn btn-ghost btn-sm btn-icon" @click="removeService(s)"><i class="fa fa-trash"></i></button>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="label">Назва послуги</label>
            <input v-model="svcForm.name" class="input" placeholder="напр. Стрижка">
          </div>
          <div class="form-group">
            <label class="label">Тривалість (хв)</label>
            <input type="number" v-model.number="svcForm.duration" class="input" min="15" step="15">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="label">Категорія</label>
            <select v-model="svcForm.category" class="select">
              <option value="">Без категорії</option>
              <option value="tattoo">Тату</option><option value="nails">Нігті</option>
              <option value="brows">Брови</option><option value="lashes">Вії</option>
              <option value="piercing">Пірсинг</option><option value="pmu">Перманент</option>
              <option value="hair">Волосся</option><option value="other">Інше</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">Ціна</label>
            <input type="number" v-model.number="svcForm.price" class="input" min="0" placeholder="0.00">
          </div>
        </div>
        <div>
          <button type="button" class="btn btn-secondary btn-sm" @click="addService" :disabled="addingSvc || !svcForm.name.trim()">
            <i class="fa fa-plus"></i> Додати послугу
          </button>
        </div>
      </div>

      <p v-if="error" style="color:var(--cancelled);font-size:12px;margin-top:12px;">{{ error }}</p>

      <!-- Footer -->
      <div class="ob-divider" style="margin-top:28px;"></div>
      <div class="ob-actions">
        <div class="ob-dots">
          <span v-for="n in 3" :key="n" :class="'ob-dot' + (n===step ? ' active' : '') + (n<step ? ' done' : '')"></span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" class="btn btn-ghost btn-sm" @click="skipStep">Пропустити крок</button>
          <button v-if="step===1" type="button" class="btn btn-primary" @click="saveStep1(true)" :disabled="saving">
            {{ saving ? 'Збереження…' : 'Далі' }} <i class="fa fa-arrow-right" style="font-size:12px;"></i>
          </button>
          <button v-if="step===2" type="button" class="btn btn-primary" @click="saveStep2(true)" :disabled="saving">
            {{ saving ? 'Збереження…' : 'Далі' }} <i class="fa fa-arrow-right" style="font-size:12px;"></i>
          </button>
          <button v-if="step===3" type="button" class="btn btn-primary" @click="finish" :disabled="saving">
            <i class="fa fa-check"></i> {{ saving ? 'Завершення…' : 'Завершити' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</div>`
};

/* Export all shared components */
window.SpravnaComponents = {
    MModal, MBadge, MAvatar, MDateTimePicker, MTimePicker, OnboardingWizard, PageSkeleton,
    AppointmentFormBody, ClientFormBody, ServiceFormBody, RespondFormBody
};
