<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $master->name }} — Maystr</title>
<meta name="description" content="{{ $profile->bio ?? $master->name . ' — ' . ucfirst($profile->specialty ?? 'Master') }}">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<link rel="stylesheet" href="/css/maystr.css">
<script src="/js/vendor/vue.global.prod.js"></script>
<script src="/js/vendor/axios.min.js"></script>
</head>
<body>
<div class="pub-page">
    <!-- Sticky header -->
    <header style="position:sticky;top:0;z-index:50;background:rgba(11,11,16,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);">
        <div class="pub-container" style="height:56px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:8px;">
                <div class="brand-logo" style="width:24px;height:24px;font-size:11px;"><i class="fa fa-star"></i></div>
                <span class="brand-name" style="font-size:15px;">Maystr</span>
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
                        <i class="fa fa-globe" style="color:var(--accent);"></i> Website
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
            <div class="booking-form-card">
                <h2 style="font-size:18px;font-weight:700;text-align:center;margin-bottom:4px;">Записатися</h2>
                <p style="text-align:center;color:var(--text-sub);font-size:13px;margin-bottom:20px;">Надіслати заявку до {{ $master->name }}</p>

                <div id="booking-app">
                    <booking-form
                        slug="{{ $profile->slug }}"
                        services-json="{{ $servicesJson }}"
                    ></booking-form>
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
        Працює на <a href="/" style="color:var(--accent);">Maystr</a>
    </footer>
</div>

@verbatim
<script>
const { createApp, ref, reactive, computed } = Vue;

const BookingForm = {
    props: ['slug', 'servicesJson'],
    setup(props) {
        const submitted = ref(false);
        const submitting = ref(false);
        const error = ref('');
        const services = computed(() => {
            try { return JSON.parse(props.servicesJson || '[]'); } catch(e) { return []; }
        });
        const form = reactive({
            client_name: '', client_phone: '', client_email: '', client_instagram: '',
            service_id: '', preferred_date: '', preferred_time: '', message: '',
        });
        const minDate = new Date(Date.now() + 86400000).toISOString().slice(0,10);

        async function submit() {
            if (!form.client_name.trim()) { error.value = 'Введіть ваше ім\'я'; return; }
            if (!form.client_phone && !form.client_email) { error.value = 'Вкажіть телефон або email'; return; }
            submitting.value = true; error.value = '';
            try {
                const p = { ...form };
                if (!p.service_id) delete p.service_id;
                if (!p.preferred_date) delete p.preferred_date;
                if (!p.preferred_time) delete p.preferred_time;
                await axios.post('/api/masters/' + props.slug + '/book', p);
                submitted.value = true;
            } catch(e) {
                const errs = e.response?.data?.errors;
                error.value = errs ? Object.values(errs)[0][0] : (e.response?.data?.message || 'Не вдалося відправити');
            }
            submitting.value = false;
        }

        return { form, services, submitted, submitting, error, minDate, submit };
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
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div class="form-group">
        <label class="label">Бажана дата</label>
        <input v-model="form.preferred_date" class="input" type="date" :min="minDate">
      </div>
      <div class="form-group">
        <label class="label">Бажаний час</label>
        <input v-model="form.preferred_time" class="input" type="time">
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

createApp({ components: { BookingForm } }).mount('#booking-app');
</script>
@endverbatim
</body>
</html>
