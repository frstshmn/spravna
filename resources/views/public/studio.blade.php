<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $studio->name }} — Spravna</title>
<meta name="description" content="{{ $studio->description ?? $studio->name . ' — студія майстрів на Spravna' }}">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<link rel="stylesheet" href="/css/maystr.css">
<script src="/js/vendor/vue.global.prod.js"></script>
<script src="/js/vendor/axios.min.js"></script>
<script>window.__STUDIO_SLUG__ = "{{ $studio->slug }}";</script>
<style>
.stu-page { max-width: 720px; margin: 0 auto; padding: 0 16px 80px; }
.stu-topbar { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
.stu-topbar-inner { max-width: 720px; margin: 0 auto; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.stu-brand { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--text); font-size: 15px; }
.stu-brand-icon { width: 28px; height: 28px; background: var(--accent); border-radius: 7px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; }
.stu-hero { text-align: center; padding: 40px 0 28px; }
.stu-logo { width: 88px; height: 88px; border-radius: 20px; object-fit: cover; margin: 0 auto 16px; display: block; border: 3px solid var(--border); }
.stu-logo-placeholder { width: 88px; height: 88px; border-radius: 20px; background: var(--accent); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 32px; color: #fff; }
.stu-name { font-size: 24px; font-weight: 800; color: var(--text); margin: 0 0 8px; }
.stu-desc { font-size: 14px; color: var(--text-muted); margin: 0; line-height: 1.6; max-width: 480px; margin: 0 auto; }
.stu-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-sub); margin: 28px 0 14px; }
.stu-masters-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.stu-master-card { background: var(--card); border: 1.5px solid var(--border); border-radius: 14px; padding: 18px 14px; text-align: center; cursor: pointer; transition: border-color .15s, box-shadow .15s; }
.stu-master-card:hover, .stu-master-card.selected { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(var(--accent-rgb,.6,1,.6),.12); }
.stu-master-avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; margin: 0 auto 10px; display: block; background: var(--accent); }
.stu-master-init { width: 56px; height: 56px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 20px; font-weight: 700; color: #fff; }
.stu-master-name { font-size: 14px; font-weight: 600; color: var(--text); margin: 0 0 4px; }
.stu-master-spec { font-size: 11px; color: var(--text-muted); }
.stu-back-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--accent); background: none; border: none; cursor: pointer; padding: 8px 0; margin-bottom: 4px; }
.stu-booking-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 8px; }
.stu-not-booking { text-align: center; padding: 32px 0; color: var(--text-muted); font-size: 13px; }
@media(max-width:560px) { .stu-booking-section { grid-template-columns: 1fr; } .stu-masters-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
</head>
<body>
<header class="stu-topbar">
    <div class="stu-topbar-inner">
        <div class="stu-brand">
            <div class="stu-brand-icon"><i class="fa fa-asterisk"></i></div>
            <span>Spravna</span>
        </div>
        <span style="font-size:13px;font-weight:600;color:var(--text-sub);">{{ $studio->name }}</span>
    </div>
</header>

<div id="studio-app">
  <div class="stu-page">

    <!-- Studio hero — rendered from PHP, no Vue needed here -->
    <div class="stu-hero">
        @if($studio->photo)
            <img src="/storage/{{ $studio->photo }}" class="stu-logo" alt="{{ $studio->name }}">
        @else
            <div class="stu-logo-placeholder"><i class="fa fa-store"></i></div>
        @endif
        <h1 class="stu-name">{{ $studio->name }}</h1>
        @if($studio->description)
            <p class="stu-desc">{{ $studio->description }}</p>
        @endif
    </div>

    @verbatim
    <div v-if="loading" style="text-align:center;padding:40px 0;color:var(--text-muted);">
        <i class="fa fa-spinner fa-spin fa-2x"></i>
    </div>

    <!-- Master selection -->
    <template v-else-if="!selectedMaster">
        <div class="stu-section-title"><i class="fa fa-users"></i> Оберіть майстра</div>
        <div class="stu-masters-grid">
            <div v-for="m in masters" :key="m.id" class="stu-master-card" @click="selectMaster(m)">
                <img v-if="m.avatar_url" :src="m.avatar_url" class="stu-master-avatar" :alt="m.name">
                <div v-else class="stu-master-init">{{ m.name.charAt(0).toUpperCase() }}</div>
                <div class="stu-master-name">{{ m.name }}</div>
                <div v-if="m.specialty" class="stu-master-spec">{{ m.specialty }}</div>
            </div>
        </div>
        <div v-if="!masters.length" style="text-align:center;padding:40px 0;color:var(--text-muted);font-size:13px;">
            У цій студії поки немає активних майстрів.
        </div>
    </template>

    <!-- Master detail + booking -->
    <template v-else>
        <button class="stu-back-btn" @click="selectedMaster=null;_slotPick.date='';_slotPick.time=''">
            <i class="fa fa-arrow-left"></i> Назад до вибору майстра
        </button>

        <!-- Master mini-header -->
        <div style="display:flex;align-items:center;gap:14px;padding:8px 0 20px;">
            <img v-if="selectedMaster.avatar_url" :src="selectedMaster.avatar_url" style="width:52px;height:52px;border-radius:50%;object-fit:cover;" :alt="selectedMaster.name">
            <div v-else style="width:52px;height:52px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;">{{ selectedMaster.name.charAt(0).toUpperCase() }}</div>
            <div>
                <div style="font-size:16px;font-weight:700;color:var(--text);">{{ selectedMaster.name }}</div>
                <div v-if="selectedMaster.specialty" style="font-size:12px;color:var(--text-muted);">{{ selectedMaster.specialty }}</div>
                <div v-if="selectedMaster.city" style="font-size:12px;color:var(--text-muted);"><i class="fa fa-location-dot"></i> {{ selectedMaster.city }}</div>
            </div>
        </div>

        <div v-if="!selectedMaster.is_accepting_bookings" class="stu-not-booking">
            <i class="fa fa-calendar-xmark fa-2x" style="margin-bottom:12px;"></i>
            <p>{{ selectedMaster.name }} наразі не приймає нові записи.</p>
        </div>

        <div v-else class="stu-booking-section">
            <div v-if="selectedMaster.show_availability" class="availability-card">
                <h3 class="avail-cal-title"><i class="fa fa-calendar-check"></i> Доступний час</h3>
                <studio-availability :master-id="selectedMaster.id" :slug="slug"></studio-availability>
            </div>
            <div class="booking-form-card">
                <h2 class="pub-book-title">Записатися</h2>
                <p class="pub-book-sub">до {{ selectedMaster.name }}</p>
                <studio-booking-form
                    :slug="slug"
                    :master="selectedMaster"
                ></studio-booking-form>
            </div>
        </div>
    </template>
    @endverbatim

  </div>
</div>

<footer class="pub-footer" style="margin-top:40px;">
    <div class="pub-container pub-footer-inner">
        <span>Працює на <a href="/" class="pub-footer-link">Spravna</a></span>
    </div>
</footer>

@verbatim
<script>
const { createApp, ref, reactive, computed, watch, onMounted } = Vue;
const _slotPick = reactive({ date: '', time: '' });
const slug = window.__STUDIO_SLUG__;

function pad2(n) { return String(n).padStart(2, '0'); }

/* ── Availability Calendar (studio variant) ── */
const StudioAvailability = {
    props: ['masterId', 'slug'],
    setup(props) {
        const loading  = ref(true);
        const enabled  = ref(true);
        const data     = ref(null);
        const cursor   = ref(new Date());
        const selected = ref(null);
        const todayStr = (() => { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate()); })();
        const minCursor = (() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; })();
        const maxCursor = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()+2); d.setHours(0,0,0,0); return d; })();

        function monthParam(d) { return d.getFullYear() + '-' + pad2(d.getMonth()+1); }
        async function load() {
            loading.value = true; selected.value = null;
            try {
                const { data: res } = await axios.get('/api/studios/' + props.slug + '/masters/' + props.masterId + '/availability', { params: { month: monthParam(cursor.value) } });
                if (!res.enabled) enabled.value = false;
                else data.value = res;
            } catch { enabled.value = false; }
            loading.value = false;
        }
        const monthLabel = computed(() => cursor.value.toLocaleDateString('uk', { month: 'long', year: 'numeric' }));
        const canPrev = computed(() => cursor.value > minCursor);
        const canNext = computed(() => cursor.value < maxCursor);
        function shiftMonth(d) { const nd = new Date(cursor.value); nd.setMonth(nd.getMonth()+d); cursor.value = nd; load(); }
        const cells = computed(() => {
            if (!data.value) return [];
            const y = cursor.value.getFullYear(), m = cursor.value.getMonth();
            const first = (new Date(y, m, 1).getDay() + 6) % 7;
            const daysIn = new Date(y, m+1, 0).getDate();
            const arr = [];
            for (let i = 0; i < first; i++) arr.push(null);
            for (let i = 1; i <= daysIn; i++) {
                const ds = y + '-' + pad2(m+1) + '-' + pad2(i);
                const info = data.value.days[ds] || { status: 'closed', slots: [] };
                arr.push({ day: i, date: ds, status: info.status, slots: info.slots });
            }
            return arr;
        });
        const selectedSlots = computed(() => { if (!selected.value || !data.value) return []; return data.value.days[selected.value]?.slots || []; });
        const selectedLabel = computed(() => { if (!selected.value) return ''; const [y,m,d] = selected.value.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('uk',{weekday:'long',day:'numeric',month:'long'}); });
        const hasAnyFreeSlot = computed(() => selectedSlots.value.some(s => s.free));
        function selectDay(cell) { if (!cell || cell.status==='closed' || cell.status==='past') return; selected.value = cell.date; }
        function pickSlot(slot) { if (!slot.free || selected.value===todayStr) return; _slotPick.date=selected.value; _slotPick.time=slot.time; }
        onMounted(load);
        return { loading, enabled, monthLabel, canPrev, canNext, shiftMonth, cells, selected, selectedSlots, selectedLabel, hasAnyFreeSlot, selectDay, pickSlot, todayStr };
    },
    template: `
<div class="avail-cal-loading" v-if="loading"><i class="fa fa-spinner fa-spin"></i> Завантаження…</div>
<div class="avail-cal" v-else-if="enabled">
  <div class="avail-cal-hdr">
    <button class="avail-nav-btn" type="button" :disabled="!canPrev" @click="shiftMonth(-1)"><i class="fa fa-chevron-left"></i></button>
    <span class="avail-month-label">{{ monthLabel }}</span>
    <button class="avail-nav-btn" type="button" :disabled="!canNext" @click="shiftMonth(1)"><i class="fa fa-chevron-right"></i></button>
  </div>
  <div class="avail-weekdays"><span v-for="d in ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']" :key="d">{{ d }}</span></div>
  <div class="avail-days">
    <div v-for="(cell,i) in cells" :key="i"
      :class="['avail-day', cell ? ('avail-'+cell.status) : 'empty', cell&&cell.date===selected?'selected':'', cell&&cell.date===todayStr?'today':'']"
      @click="selectDay(cell)"><span v-if="cell">{{ cell.day }}</span></div>
  </div>
  <div class="avail-legend">
    <span><i class="avail-dot avail-dot-available"></i>Вільно</span>
    <span><i class="avail-dot avail-dot-full"></i>Зайнято</span>
    <span><i class="avail-dot avail-dot-closed"></i>Вихідний</span>
  </div>
  <div v-if="selected" class="avail-slots">
    <div class="avail-slots-hdr">{{ selectedLabel }}</div>
    <div v-if="!selectedSlots.length" class="avail-slots-empty">Немає робочих слотів</div>
    <div v-else class="avail-slot-grid">
      <button v-for="s in selectedSlots" :key="s.time" type="button"
        :class="['avail-slot', s.free&&selected!==todayStr?'free':'busy']"
        :disabled="!s.free||selected===todayStr" @click="pickSlot(s)">{{ s.time }}</button>
    </div>
    <p v-if="hasAnyFreeSlot&&selected!==todayStr" class="avail-hint"><i class="fa fa-hand-pointer"></i> Натисніть на час, щоб заповнити форму</p>
  </div>
</div>`
};

/* ── DateTime picker (inline copy) ── */
const MDateTimePicker = {
    props: { modelValue: String },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        const open = ref(false);
        function parse(val) {
            if (val) { const [dp, tp] = val.split('T'); const [y,mo,d] = dp.split('-').map(Number); const [hh,mm] = (tp||'00:00').split(':').map(Number); return {y,mo,d,hh,mm}; }
            const now = new Date(); return {y:now.getFullYear(),mo:now.getMonth()+1,d:now.getDate(),hh:12,mm:0};
        }
        const parsed = ref(parse(props.modelValue));
        const viewMonth = ref(new Date(parsed.value.y, parsed.value.mo-1, 1));
        watch(()=>props.modelValue, v=>{parsed.value=parse(v);});
        function emitVal() { const {y,mo,d,hh,mm}=parsed.value; emit('update:modelValue',`${y}-${pad2(mo)}-${pad2(d)}T${pad2(hh)}:${pad2(mm)}`); }
        const displayLabel = computed(()=>{ const {y,mo,d,hh,mm}=parsed.value; return `${pad2(d)}.${pad2(mo)}.${y}, ${pad2(hh)}:${pad2(mm)}`; });
        const monthLabel = computed(()=>viewMonth.value.toLocaleDateString('uk',{month:'long',year:'numeric'}));
        const calendarDays = computed(()=>{ const y=viewMonth.value.getFullYear(),mo=viewMonth.value.getMonth(); const first=(new Date(y,mo,1).getDay()+6)%7,dIn=new Date(y,mo+1,0).getDate(),cells=[]; for(let i=0;i<first;i++)cells.push(null); for(let i=1;i<=dIn;i++)cells.push(i); return cells; });
        function selectDay(day) { if(!day)return; parsed.value={...parsed.value,y:viewMonth.value.getFullYear(),mo:viewMonth.value.getMonth()+1,d:day}; emitVal(); }
        function prevMonth(){viewMonth.value=new Date(viewMonth.value.getFullYear(),viewMonth.value.getMonth()-1,1);}
        function nextMonth(){viewMonth.value=new Date(viewMonth.value.getFullYear(),viewMonth.value.getMonth()+1,1);}
        function setHour(h){parsed.value={...parsed.value,hh:h};emitVal();}
        function setMinute(m){parsed.value={...parsed.value,mm:m};emitVal();}
        function isSelectedDay(day){return!!day&&parsed.value.y===viewMonth.value.getFullYear()&&parsed.value.mo===viewMonth.value.getMonth()+1&&parsed.value.d===day;}
        function isToday(day){const t=new Date();return!!day&&t.getFullYear()===viewMonth.value.getFullYear()&&t.getMonth()===viewMonth.value.getMonth()&&t.getDate()===day;}
        return {open,parsed,displayLabel,monthLabel,calendarDays,selectDay,prevMonth,nextMonth,setHour,setMinute,isSelectedDay,isToday,hourOptions:Array.from({length:24},(_,i)=>i),minuteOptions:Array.from({length:12},(_,i)=>i*5),toggle:()=>{open.value=!open.value;if(open.value)viewMonth.value=new Date(parsed.value.y,parsed.value.mo-1,1);},close:()=>{open.value=false;},pad2};
    },
    template:`<div class="dt-picker"><button type="button" class="dt-trigger input" @click="toggle"><i class="fa fa-calendar-days"></i><span>{{ displayLabel }}</span></button><teleport to="body"><div v-if="open" class="dt-pop-overlay" @mousedown.self="close"><div class="dt-pop"><div class="dt-pop-cal"><div class="dt-pop-cal-head"><button type="button" class="dt-nav" @click="prevMonth"><i class="fa fa-chevron-left"></i></button><span class="dt-month-label">{{ monthLabel }}</span><button type="button" class="dt-nav" @click="nextMonth"><i class="fa fa-chevron-right"></i></button></div><div class="dt-pop-weekdays"><span v-for="d in ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']" :key="d">{{ d }}</span></div><div class="dt-pop-days"><button v-for="(day,i) in calendarDays" :key="i" type="button" :class="['dt-day',{empty:!day,selected:isSelectedDay(day),today:isToday(day)}]" :disabled="!day" @click="selectDay(day)">{{ day }}</button></div></div><div class="dt-pop-time"><div class="dt-pop-time-label"><i class="fa fa-clock"></i> Час (24г)</div><div class="dt-pop-time-row"><select class="select dt-time-select" :value="parsed.hh" @change="setHour(+$event.target.value)"><option v-for="h in hourOptions" :key="h" :value="h">{{ pad2(h) }}</option></select><span class="dt-time-sep">:</span><select class="select dt-time-select" :value="parsed.mm" @change="setMinute(+$event.target.value)"><option v-for="m in minuteOptions" :key="m" :value="m">{{ pad2(m) }}</option></select></div></div><button type="button" class="btn btn-primary btn-sm dt-pop-done" @click="close">Готово</button></div></div></teleport></div>`
};

/* ── Studio booking form ── */
const StudioBookingForm = {
    props: ['slug', 'master'],
    components: { MDateTimePicker },
    setup(props) {
        const submitted = ref(false), submitting = ref(false), error = ref('');
        const preferredDatetime = ref('');
        const form = reactive({ client_name:'', client_phone:'', client_email:'', client_instagram:'', service_id:'', message:'' });
        watch(_slotPick, v => { if(v.date&&v.time) preferredDatetime.value=v.date+'T'+v.time; }, { deep: true });
        function initDatetime() { const d=new Date(); d.setDate(d.getDate()+1); preferredDatetime.value=`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T12:00`; }
        function clearDatetime() { preferredDatetime.value=''; _slotPick.date=''; _slotPick.time=''; }
        async function submit() {
            if (!form.client_name.trim()) { error.value="Введіть ваше ім'я"; return; }
            if (!form.client_phone && !form.client_email) { error.value='Вкажіть телефон або email'; return; }
            submitting.value=true; error.value='';
            try {
                const p = { ...form, master_id: props.master.id };
                if (preferredDatetime.value) { const [pd,pt]=preferredDatetime.value.split('T'); p.preferred_date=pd; p.preferred_time=pt; }
                if (!p.service_id) delete p.service_id;
                await axios.post('/api/studios/'+props.slug+'/book', p);
                submitted.value=true;
            } catch(e) {
                const errs=e.response?.data?.errors;
                error.value=errs?Object.values(errs)[0][0]:(e.response?.data?.error||e.response?.data?.message||'Не вдалося відправити');
            }
            submitting.value=false;
        }
        return { form, submitted, submitting, error, preferredDatetime, initDatetime, clearDatetime, submit };
    },
    template:`<div>
  <div v-if="submitted" class="pub-book-success"><i class="fa fa-circle-check"></i><p class="pub-book-success-title">Заявку відправлено!</p><p class="pub-book-success-sub">Ми зв'яжемося з вами найближчим часом.</p></div>
  <form v-else @submit.prevent="submit" style="display:flex;flex-direction:column;gap:12px;">
    <div class="pub-book-row"><div class="form-group"><label class="label">Ім'я *</label><input v-model="form.client_name" class="input" required placeholder="Ваше ім'я"></div><div class="form-group"><label class="label">Телефон</label><input v-model="form.client_phone" class="input" type="tel" placeholder="+38 050…"></div></div>
    <div class="pub-book-row"><div class="form-group"><label class="label">Email</label><input v-model="form.client_email" class="input" type="email"></div><div class="form-group"><label class="label">Instagram</label><input v-model="form.client_instagram" class="input" placeholder="@handle"></div></div>
    <div class="form-group" v-if="master.services && master.services.length"><label class="label">Послуга</label><select v-model="form.service_id" class="select"><option value="">Ще не визначився</option><option v-for="s in master.services" :key="s.id" :value="s.id">{{ s.name }}</option></select></div>
    <div class="form-group"><label class="label">Бажана дата та час</label>
      <div v-if="!preferredDatetime" style="display:flex;align-items:center;gap:8px;"><button type="button" class="btn btn-ghost btn-sm" style="flex:1;justify-content:center;" @click="initDatetime"><i class="fa fa-calendar-plus"></i> Обрати дату та час</button></div>
      <div v-else style="display:flex;align-items:center;gap:8px;"><div style="flex:1;"><m-date-time-picker v-model="preferredDatetime"></m-date-time-picker></div><button type="button" class="btn btn-ghost btn-sm btn-icon" @click="clearDatetime"><i class="fa fa-xmark"></i></button></div>
    </div>
    <div class="form-group"><label class="label">Повідомлення</label><textarea v-model="form.message" class="textarea" rows="3" placeholder="Опишіть ідею…"></textarea></div>
    <p v-if="error" style="color:var(--cancelled);font-size:12px;">{{ error }}</p>
    <button type="submit" :disabled="submitting" class="btn btn-primary pub-submit-btn"><i class="fa fa-paper-plane"></i> {{ submitting?'Відправлення…':'Надіслати заявку' }}</button>
    <p class="pub-book-note">Оплата не потрібна. Ми підтвердимо ваш запис.</p>
  </form>
</div>`
};

/* ── Root app ── */
createApp({
    components: { StudioAvailability, StudioBookingForm },
    setup() {
        const loading       = ref(true);
        const studioData    = ref(null);
        const masters       = ref([]);
        const selectedMaster = ref(null);

        async function load() {
            try {
                const { data } = await axios.get('/api/studios/' + slug);
                studioData.value  = data;
                masters.value     = data.masters || [];
            } catch {}
            loading.value = false;
        }

        function selectMaster(m) { selectedMaster.value = m; _slotPick.date=''; _slotPick.time=''; }

        onMounted(load);
        return { loading, studioData, masters, selectedMaster, selectMaster, slug };
    }
}).mount('#studio-app');
</script>
@endverbatim
</body>
</html>
