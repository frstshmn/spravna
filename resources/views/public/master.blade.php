<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $master->name }} — Spravna</title>
<meta name="description" content="{{ $profile->bio ?? $master->name . ' — ' . ucfirst($profile->specialty ?? 'Майстер') }}">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<link rel="stylesheet" href="/css/maystr.css">
<script src="/js/vendor/vue.global.prod.js"></script>
<script src="/js/vendor/axios.min.js"></script>
</head>
<body>
<div class="pub-page">
    <!-- Sticky header -->
    <header style="position:sticky;top:0;z-index:50;background:rgba(255,255,255,0.35);backdrop-filter:blur(var(--blur-lg));-webkit-backdrop-filter:blur(var(--blur-lg));border-bottom:1px solid var(--border);">
        <div class="pub-container" style="height:56px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:8px;">
                <div class="brand-logo" style="width:24px;height:24px;font-size:11px;"><i class="fa fa-asterisk"></i></div>
                <span class="brand-name" style="font-size:15px;">Spravna</span>
            </div>
            @if($profile->is_accepting_bookings)
            <a href="#book" class="btn btn-primary btn-sm">
                <i class="fa fa-calendar-plus"></i> Записатися
            </a>
            @endif
        </div>
    </header>

    <!-- Master info -->
    <div class="pub-container">
        <div class="pub-master-head" style="padding-top:36px;">
            @if($profile->avatar)
                <img src="{{ $profile->avatar_url }}" alt="{{ $master->name }}" class="pub-avatar-lg" style="object-fit:cover;">
            @else
                <div class="pub-avatar-lg">{{ strtoupper(substr($master->name, 0, 1)) }}</div>
            @endif
            <div>
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px;">
                    <h1 style="font-size:26px;">{{ $master->name }}</h1>
                    @if($profile->specialty)
                    <span style="background:var(--accent-soft);color:var(--accent-text);padding:3px 10px;border-radius:var(--r-full);font-size:12px;font-weight:600;">{{ ucfirst($profile->specialty) }}</span>
                    @endif
                </div>
                @if($profile->city || $profile->country)
                <p style="color:var(--text-sub);font-size:13px;margin-bottom:8px;">
                    <i class="fa fa-location-dot" style="color:var(--accent);margin-right:4px;"></i>
                    {{ collect([$profile->city, $profile->country])->filter()->join(', ') }}
                </p>
                @endif
                @if($profile->bio)
                <p style="color:var(--text-sub);line-height:1.7;max-width:600px;font-size:13.5px;">{{ $profile->bio }}</p>
                @endif
                <div style="display:flex;gap:14px;margin-top:12px;flex-wrap:wrap;">
                    @if($profile->instagram)
                    <a href="https://instagram.com/{{ ltrim($profile->instagram,'@') }}" target="_blank" style="display:flex;align-items:center;gap:5px;color:var(--text-sub);font-size:13px;transition:color .15s;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--text-sub)'">
                        <i class="fa-brands fa-instagram" style="color:var(--accent);"></i> {{ $profile->instagram }}
                    </a>
                    @endif
                    @if($profile->website)
                    <a href="{{ $profile->website }}" target="_blank" style="display:flex;align-items:center;gap:5px;color:var(--text-sub);font-size:13px;">
                        <i class="fa fa-globe" style="color:var(--accent);"></i> Сайт
                    </a>
                    @endif
                    @if($profile->social_links['facebook'] ?? null)
                    <a href="{{ $profile->social_links['facebook'] }}" target="_blank" style="display:flex;align-items:center;gap:5px;color:var(--text-sub);font-size:13px;transition:color .15s;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--text-sub)'">
                        <i class="fa-brands fa-facebook" style="color:var(--accent);"></i> Facebook
                    </a>
                    @endif
                    @if($profile->social_links['tiktok'] ?? null)
                    <a href="{{ $profile->social_links['tiktok'] }}" target="_blank" style="display:flex;align-items:center;gap:5px;color:var(--text-sub);font-size:13px;transition:color .15s;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--text-sub)'">
                        <i class="fa-brands fa-tiktok" style="color:var(--accent);"></i> TikTok
                    </a>
                    @endif
                    @if($profile->social_links['telegram'] ?? null)
                    <a href="{{ $profile->social_links['telegram'] }}" target="_blank" style="display:flex;align-items:center;gap:5px;color:var(--text-sub);font-size:13px;transition:color .15s;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--text-sub)'">
                        <i class="fa-brands fa-telegram" style="color:var(--accent);"></i> Telegram
                    </a>
                    @endif
                    @if($profile->social_links['whatsapp'] ?? null)
                    <a href="{{ $profile->social_links['whatsapp'] }}" target="_blank" style="display:flex;align-items:center;gap:5px;color:var(--text-sub);font-size:13px;transition:color .15s;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--text-sub)'">
                        <i class="fa-brands fa-whatsapp" style="color:var(--accent);"></i> WhatsApp
                    </a>
                    @endif
                </div>
            </div>
        </div>

        <!-- Services -->
        @if($services->isNotEmpty())
        <div style="margin-bottom:32px;">
            <h2 style="font-size:16px;font-weight:700;margin-bottom:14px;"><i class="fa fa-scissors" style="color:var(--accent);margin-right:6px;"></i>Послуги</h2>
            <div class="pub-services-grid">
                @foreach($services as $service)
                <div class="pub-svc-card">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:{{ $service->color }};"></div>
                        <span style="font-weight:600;font-size:13.5px;">{{ $service->name }}</span>
                    </div>
                    @if($service->description)
                    <p style="font-size:12px;color:var(--text-sub);margin-bottom:6px;line-height:1.5;">{{ $service->description }}</p>
                    @endif
                    <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">
                        <span style="font-weight:700;color:var(--accent);">{{ $service->price_display }}</span>
                        <span style="color:var(--text-sub);"><i class="fa fa-clock" style="margin-right:3px;font-size:10px;"></i>{{ $service->duration_display }}</span>
                    </div>
                </div>
                @endforeach
            </div>
        </div>
        @endif

        <!-- Booking notice -->
        @if($profile->booking_notice)
        <div style="background:var(--pending-soft);border:1px solid rgba(245,158,11,.2);border-radius:var(--r-lg);padding:14px 16px;margin-bottom:24px;">
            <p style="font-size:13px;color:var(--pending);"><i class="fa fa-circle-info" style="margin-right:6px;"></i>{{ $profile->booking_notice }}</p>
        </div>
        @endif

        <!-- Booking form -->
        <div id="book" style="padding-bottom:60px;">
            @if($profile->is_accepting_bookings)
            <div id="booking-app">
                <div class="booking-section">
                    @if($profile->show_availability)
                    <div class="availability-card">
                        <h3 class="avail-cal-title"><i class="fa fa-calendar-check"></i> Доступний час</h3>
                        <availability-calendar slug="{{ $profile->slug }}"></availability-calendar>
                    </div>
                    @endif
                    <div class="booking-form-card">
                        <h2 style="font-size:18px;font-weight:700;text-align:center;margin-bottom:4px;">Записатися</h2>
                        <p style="text-align:center;color:var(--text-sub);font-size:13px;margin-bottom:20px;">Надіслати заявку до {{ $master->name }}</p>
                        <booking-form
                            slug="{{ $profile->slug }}"
                            services-json="{{ $servicesJson }}"
                        ></booking-form>
                    </div>
                </div>
            </div>
            @else
            <div style="text-align:center;padding:48px 20px;color:var(--text-muted);">
                <i class="fa fa-calendar-xmark" style="font-size:32px;display:block;margin-bottom:12px;"></i>
                <p style="font-size:15px;">{{ $master->name }} наразі не приймає нові записи.</p>
            </div>
            @endif
        </div>
    </div>

    <footer style="border-top:1px solid var(--border);padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">
        Працює на <a href="/" style="color:var(--accent);">Spravna</a>
    </footer>
</div>

@verbatim
<script>
const { createApp, ref, reactive, computed, watch, onMounted } = Vue;

/* Shared state: calendar → form slot selection */
const _slotPick = reactive({ date: '', time: '' });

/* ── Helpers ─────────────────────────────────────────────── */
function pad2(n) { return String(n).padStart(2, '0'); }

/* ── MDateTimePicker (24h, inline copy) ──────────────────── */
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
            return { y: now.getFullYear(), mo: now.getMonth() + 1, d: now.getDate(), hh: 12, mm: 0 };
        }
        const parsed = ref(parse(props.modelValue));
        const viewMonth = ref(new Date(parsed.value.y, parsed.value.mo - 1, 1));
        watch(() => props.modelValue, v => { parsed.value = parse(v); });
        function emitVal() {
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
            emitVal();
        }
        function prevMonth() { viewMonth.value = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() - 1, 1); }
        function nextMonth() { viewMonth.value = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() + 1, 1); }
        function setHour(h) { parsed.value = { ...parsed.value, hh: h }; emitVal(); }
        function setMinute(m) { parsed.value = { ...parsed.value, mm: m }; emitVal(); }
        function isSelectedDay(day) {
            return !!day && parsed.value.y === viewMonth.value.getFullYear() && parsed.value.mo === viewMonth.value.getMonth() + 1 && parsed.value.d === day;
        }
        function isToday(day) {
            const t = new Date();
            return !!day && t.getFullYear() === viewMonth.value.getFullYear() && t.getMonth() === viewMonth.value.getMonth() && t.getDate() === day;
        }
        const hourOptions = Array.from({ length: 24 }, (_, i) => i);
        const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);
        function toggle() { open.value = !open.value; if (open.value) viewMonth.value = new Date(parsed.value.y, parsed.value.mo - 1, 1); }
        function close() { open.value = false; }
        return { open, parsed, displayLabel, monthLabel, calendarDays, selectDay, prevMonth, nextMonth, setHour, setMinute, isSelectedDay, isToday, hourOptions, minuteOptions, toggle, close, pad2 };
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
          <div class="dt-pop-weekdays"><span v-for="d in ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']" :key="d">{{ d }}</span></div>
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

/* ── Availability Calendar ─────────────────────────────────── */
const AvailabilityCalendar = {
    props: ['slug'],
    emits: ['pick'],
    setup(props, { emit }) {
        const loading  = ref(true);
        const enabled  = ref(true);
        const data     = ref(null);
        const cursor   = ref(new Date());
        const selected = ref(null);

        const todayStr = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); })();
        const minCursor = (() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; })();
        const maxCursor = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()+2); d.setHours(0,0,0,0); return d; })();

        function monthParam(d) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); }

        async function load() {
            loading.value = true;
            try {
                const { data: res } = await axios.get('/api/masters/' + props.slug + '/availability', { params: { month: monthParam(cursor.value) } });
                if (!res.enabled) { enabled.value = false; }
                else { data.value = res; }
            } catch(e) { enabled.value = false; }
            loading.value = false;
        }

        const monthLabel = computed(() => cursor.value.toLocaleDateString('uk', { month: 'long', year: 'numeric' }));
        const canPrev    = computed(() => cursor.value > minCursor);
        const canNext    = computed(() => cursor.value < maxCursor);

        function shiftMonth(delta) {
            const d = new Date(cursor.value);
            d.setMonth(d.getMonth() + delta);
            cursor.value = d;
            selected.value = null;
            load();
        }

        const cells = computed(() => {
            if (!data.value) return [];
            const y = cursor.value.getFullYear(), m = cursor.value.getMonth();
            const first = (new Date(y, m, 1).getDay() + 6) % 7;
            const daysIn = new Date(y, m+1, 0).getDate();
            const arr = [];
            for (let i = 0; i < first; i++) arr.push(null);
            for (let i = 1; i <= daysIn; i++) {
                const ds = y + '-' + String(m+1).padStart(2,'0') + '-' + String(i).padStart(2,'0');
                const info = data.value.days[ds] || { status: 'closed', slots: [] };
                arr.push({ day: i, date: ds, status: info.status, slots: info.slots });
            }
            return arr;
        });

        const selectedSlots = computed(() => {
            if (!selected.value || !data.value) return [];
            return data.value.days[selected.value]?.slots || [];
        });

        const selectedLabel = computed(() => {
            if (!selected.value) return '';
            const [y, m, d] = selected.value.split('-').map(Number);
            return new Date(y, m-1, d).toLocaleDateString('uk', { weekday: 'long', day: 'numeric', month: 'long' });
        });

        const hasAnyFreeSlot = computed(() => selectedSlots.value.some(s => s.free));

        function selectDay(cell) {
            if (!cell || cell.status === 'closed' || cell.status === 'past') return;
            selected.value = cell.date;
        }

        function pickSlot(slot) {
            if (!slot.free || selected.value === todayStr) return;
            _slotPick.date = selected.value;
            _slotPick.time = slot.time;
        }

        onMounted(load);

        return {
            loading, enabled, monthLabel, canPrev, canNext, shiftMonth,
            cells, selected, selectedSlots, selectedLabel, hasAnyFreeSlot,
            selectDay, pickSlot, todayStr,
        };
    },
    template: `
<div class="avail-cal-loading" v-if="loading"><i class="fa fa-spinner fa-spin"></i> Завантаження…</div>
<div class="avail-cal" v-else-if="enabled">
  <div class="avail-cal-hdr">
    <button class="avail-nav-btn" type="button" :disabled="!canPrev" @click="shiftMonth(-1)"><i class="fa fa-chevron-left"></i></button>
    <span class="avail-month-label">{{ monthLabel }}</span>
    <button class="avail-nav-btn" type="button" :disabled="!canNext" @click="shiftMonth(1)"><i class="fa fa-chevron-right"></i></button>
  </div>
  <div class="avail-weekdays">
    <span v-for="d in ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']" :key="d">{{ d }}</span>
  </div>
  <div class="avail-days">
    <div v-for="(cell,i) in cells" :key="i"
      :class="['avail-day', cell ? ('avail-' + cell.status) : 'empty', cell && cell.date===selected ? 'selected' : '', cell && cell.date===todayStr ? 'today' : '']"
      @click="selectDay(cell)">
      <span v-if="cell">{{ cell.day }}</span>
    </div>
  </div>
  <div class="avail-legend">
    <span><i class="avail-dot avail-dot-available"></i>Вільно</span>
    <span><i class="avail-dot avail-dot-full"></i>Зайнято</span>
    <span><i class="avail-dot avail-dot-closed"></i>Вихідний</span>
  </div>
  <div v-if="selected" class="avail-slots">
    <div class="avail-slots-hdr">{{ selectedLabel }}</div>
    <div v-if="!selectedSlots.length" class="avail-slots-empty">Немає робочих слотів цього дня</div>
    <div v-else class="avail-slot-grid">
      <button v-for="s in selectedSlots" :key="s.time" type="button"
        :class="['avail-slot', s.free && selected !== todayStr ? 'free' : 'busy']"
        :disabled="!s.free || selected === todayStr"
        @click="pickSlot(s)">{{ s.time }}</button>
    </div>
    <p v-if="hasAnyFreeSlot && selected !== todayStr" class="avail-hint">
      <i class="fa fa-hand-pointer"></i> Натисніть на час, щоб заповнити форму
    </p>
  </div>
</div>`
};

/* ── Booking Form ──────────────────────────────────────────── */
const BookingForm = {
    props: ['slug', 'servicesJson'],
    components: { MDateTimePicker },
    setup(props) {
        const submitted      = ref(false);
        const submitting     = ref(false);
        const error          = ref('');
        const preferredDatetime = ref(''); // 'YYYY-MM-DDTHH:MM' or ''
        const services = computed(() => {
            try { return JSON.parse(props.servicesJson || '[]'); } catch(e) { return []; }
        });
        const form = reactive({
            client_name: '', client_phone: '', client_email: '', client_instagram: '',
            service_id: '', message: '',
        });

        function initDatetime() {
            // Default to tomorrow at noon when user opens the picker
            const d = new Date();
            d.setDate(d.getDate() + 1);
            preferredDatetime.value = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T12:00`;
        }

        function clearDatetime() {
            preferredDatetime.value = '';
            _slotPick.date = '';
            _slotPick.time = '';
        }

        watch(_slotPick, (v) => {
            if (v.date && v.time) preferredDatetime.value = v.date + 'T' + v.time;
        }, { deep: true });

        async function submit() {
            if (!form.client_name.trim()) { error.value = 'Введіть ваше ім\'я'; return; }
            if (!form.client_phone && !form.client_email) { error.value = 'Вкажіть телефон або email'; return; }
            submitting.value = true; error.value = '';
            try {
                const p = { ...form };
                if (preferredDatetime.value) {
                    const [preferred_date, preferred_time] = preferredDatetime.value.split('T');
                    p.preferred_date = preferred_date;
                    p.preferred_time = preferred_time;
                }
                if (!p.service_id) delete p.service_id;
                await axios.post('/api/masters/' + props.slug + '/book', p);
                submitted.value = true;
            } catch(e) {
                const errs = e.response?.data?.errors;
                error.value = errs ? Object.values(errs)[0][0] : (e.response?.data?.message || 'Не вдалося відправити');
            }
            submitting.value = false;
        }

        return { form, services, submitted, submitting, error, preferredDatetime, initDatetime, clearDatetime, submit };
    },
    template: `
<div>
  <div v-if="submitted" style="text-align:center;padding:32px 0;">
    <i class="fa fa-circle-check" style="font-size:40px;color:var(--completed);display:block;margin-bottom:12px;"></i>
    <p style="font-size:16px;font-weight:600;margin-bottom:4px;">Заявку відправлено!</p>
    <p style="color:var(--text-sub);font-size:13px;">Ми зв'яжемося з вами найближчим часом.</p>
  </div>
  <form v-else @submit.prevent="submit" style="display:flex;flex-direction:column;gap:12px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div class="form-group">
        <label class="label">Ім'я *</label>
        <input v-model="form.client_name" class="input" required placeholder="Ваше ім'я">
      </div>
      <div class="form-group">
        <label class="label">Телефон</label>
        <input v-model="form.client_phone" class="input" type="tel" placeholder="+38 050…">
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div class="form-group">
        <label class="label">Електронна пошта</label>
        <input v-model="form.client_email" class="input" type="email">
      </div>
      <div class="form-group">
        <label class="label">Instagram</label>
        <input v-model="form.client_instagram" class="input" placeholder="@handle">
      </div>
    </div>
    <div class="form-group" v-if="services.length">
      <label class="label">Послуга</label>
      <select v-model="form.service_id" class="select">
        <option value="">Ще не визначився</option>
        <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
    </div>
    <div class="form-group">
      <label class="label">Бажана дата та час</label>
      <div v-if="!preferredDatetime" style="display:flex;align-items:center;gap:8px;">
        <button type="button" class="btn btn-ghost btn-sm" style="flex:1;justify-content:center;" @click="initDatetime">
          <i class="fa fa-calendar-plus"></i> Обрати дату та час
        </button>
      </div>
      <div v-else style="display:flex;align-items:center;gap:8px;">
        <div style="flex:1;">
          <m-date-time-picker v-model="preferredDatetime"></m-date-time-picker>
        </div>
        <button type="button" class="btn btn-ghost btn-sm btn-icon" @click="clearDatetime" title="Скасувати">
          <i class="fa fa-xmark"></i>
        </button>
      </div>
    </div>
    <div class="form-group">
      <label class="label">Повідомлення</label>
      <textarea v-model="form.message" class="textarea" rows="3" placeholder="Опишіть свою ідею, задайте питання…"></textarea>
    </div>
    <p v-if="error" style="color:var(--cancelled);font-size:12px;">{{ error }}</p>
    <button type="submit" :disabled="submitting" class="btn btn-primary" style="width:100%;justify-content:center;padding:11px;">
      <i class="fa fa-paper-plane"></i> {{ submitting ? 'Відправлення…' : 'Надіслати заявку' }}
    </button>
    <p style="font-size:11px;color:var(--text-muted);text-align:center;">Оплата не потрібна. Ми підтвердимо ваш запис.</p>
  </form>
</div>`
};

/* ── Root App ──────────────────────────────────────────────── */
createApp({ components: { BookingForm, AvailabilityCalendar } }).mount('#booking-app');
</script>
@endverbatim
</body>
</html>
