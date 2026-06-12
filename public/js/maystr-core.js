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
    return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDT(dt) {
    if (!dt) return '—';
    return fmt(dt) + ' ' + fmtTime(dt);
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

window.M = { fmt, fmtTime, fmtDT, fmtMoney, timeAgo, statusColor, initials, durationLabel };

/* ── API factory ── */
function makeAPI(token) {
    const ax = axios.create({
        baseURL: '/api',
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' }
    });
    ax.interceptors.response.use(r => r, err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('spravna_token');
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

/* ── MBadge ── */
const MBadge = {
    props: ['status'],
    methods: {
        label(s) {
            const map = {
                pending: 'Очікує', confirmed: 'Підтверджено', in_progress: 'Виконується',
                completed: 'Завершено', cancelled: 'Скасовано', no_show: 'Не з\'явився',
                accepted: 'Прийнято', declined: 'Відхилено', converted: 'Конвертовано'
            };
            return map[s] || (s || '').replace('_', ' ');
        }
    },
    template: `<span :class="'badge badge-' + (status||'pending').replace('_','-')">{{ label(status) }}</span>`
};

/* ── MAvatar ── */
const MAvatar = {
    props: { name: String, size: { default: 'md' } },
    computed: { ini() { return M.initials(this.name); } },
    template: `<div :class="'avatar av-' + size">{{ ini }}</div>`
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
    props: { api: Object, existing: Object, initialDate: String, initialHour: Number },
    emits: ['saved', 'cancel'],
    components: { MModal, ClientFormBody },
    setup(props, { emit }) {
        const clients = ref([]);
        const services = ref([]);
        const saving = ref(false);
        const error = ref('');
        const showClientModal = ref(false);
        const clientQuery = ref('');
        const clientDropdownOpen = ref(false);

        const defaultDT = () => {
            if (props.initialDate) {
                const d = new Date(props.initialDate + 'T' + String(props.initialHour || 10).padStart(2, '0') + ':00');
                return d.toISOString().slice(0, 16);
            }
            const d = new Date(); d.setSeconds(0, 0); return d.toISOString().slice(0, 16);
        };

        const form = reactive({
            client_id: props.existing?.client_id ?? '',
            service_id: props.existing?.service_id ?? '',
            scheduled_at: props.existing?.scheduled_at?.slice(0, 16) ?? defaultDT(),
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
            if (!form.client_id) { error.value = 'Оберіть клієнта'; return; }
            saving.value = true; error.value = '';
            try {
                const p = { ...form };
                if (!p.service_id) delete p.service_id;
                if (p.price === '' || p.price === null) delete p.price;
                if (p.deposit === '' || p.deposit === null) delete p.deposit;
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
        };
    },
    template: `
<div class="modal-body">
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
  <div class="form-row">
    <div class="form-group">
      <label class="label">Дата та час *</label>
      <input type="datetime-local" v-model="form.scheduled_at" class="input">
    </div>
    <div class="form-group">
      <label class="label">Тривалість (хв)</label>
      <input type="number" v-model.number="form.duration" class="input" min="15" step="15">
    </div>
  </div>
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
    setup(props, { emit }) {
        const responding = ref(false);
        const error = ref('');
        const mode = ref('accept'); // accept | decline
        const form = reactive({
            status: 'accepted',
            response_message: '',
            scheduled_at: props.request?.preferred_date ? props.request.preferred_date + 'T' + (props.request.preferred_time || '10:00') : '',
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
        return { form, mode, responding, error, respond };
    },
    template: `
<div class="modal-body">
  <div style="background:var(--surface-3);border-radius:var(--r-md);padding:12px 14px;margin-bottom:4px;">
    <p style="font-weight:600;font-size:13px;margin-bottom:2px;">{{ request.client_name }}</p>
    <p style="font-size:12px;color:var(--text-sub);">{{ request.client_phone || request.client_email || request.client_instagram }}</p>
    <p v-if="request.service" style="font-size:12px;margin-top:4px;"><i class="fa fa-scissors" style="color:var(--accent);margin-right:4px;"></i>{{ request.service.name }}</p>
    <p v-if="request.preferred_date" style="font-size:12px;"><i class="fa fa-calendar" style="color:var(--accent);margin-right:4px;"></i>Бажано: {{ request.preferred_date }} {{ request.preferred_time }}</p>
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
        <input type="datetime-local" v-model="form.scheduled_at" class="input">
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

/* Export all shared components */
window.SpravnaComponents = {
    MModal, MBadge, MAvatar,
    AppointmentFormBody, ClientFormBody, ServiceFormBody, RespondFormBody
};
