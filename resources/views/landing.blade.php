<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Spravna — CRM для майстрів</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<link rel="stylesheet" href="/css/maystr.css">
</head>
<body>
<div class="landing">
    <nav class="landing-nav">
        <div style="display:flex;align-items:center;gap:10px;">
            <div class="brand-logo"><i class="fa fa-asterisk"></i></div>
            <span class="brand-name">Spravna</span>
        </div>
        <div class="landing-nav-links">
            <a href="#features">Можливості</a>
            <a href="#pricing">Тарифи</a>
            <a href="#faq">Питання</a>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
            <a href="{{ route('login') }}" class="btn btn-ghost btn-sm">Увійти</a>
            <a href="{{ route('register') }}" class="btn btn-primary btn-sm">
                Спробувати безкоштовно
            </a>
        </div>
    </nav>

    <!-- Hero -->
    <div class="landing-hero">
        <div class="hero-content">
            <div class="hero-badge">
                <i class="fa fa-asterisk"></i> Для тату-майстрів, нейлістів, бровістів та інших
            </div>
            <h1 class="hero-title">
                Твоє мистецтво.<br>
                <span style="color:var(--accent);">В порядку.</span>
            </h1>
            <p class="hero-sub">Потужна CRM для незалежних майстрів. Керуй клієнтами, плануй сесії, приймай запити на бронювання — без зайвого шуму.</p>
            <div class="hero-actions">
                <a href="{{ route('register') }}" class="btn btn-primary btn-lg">
                    <i class="fa fa-rocket"></i> Почати безкоштовно
                </a>
                <a href="#pricing" class="btn btn-secondary btn-lg">
                    Переглянути тарифи
                </a>
            </div>
            <div class="hero-trust">
                <div class="hero-trust-avatars">
                    <img src="https://picsum.photos/seed/spravna-m1/64/64" alt="">
                    <img src="https://picsum.photos/seed/spravna-m2/64/64" alt="">
                    <img src="https://picsum.photos/seed/spravna-m3/64/64" alt="">
                    <img src="https://picsum.photos/seed/spravna-m4/64/64" alt="">
                </div>
                <div>
                    <div style="font-weight:700;"><i class="fa fa-star" style="color:var(--pending);"></i> 4.9/5</div>
                    <div style="color:var(--text-muted);font-size:12px;">довіряють 1 200+ майстрів</div>
                </div>
            </div>
        </div>
        <div class="hero-media">
            <img src="https://picsum.photos/seed/spravna-hero/640/760" alt="Майстер за роботою" class="hero-img-main">
            <div class="hero-float-card hero-float-1">
                <div class="hero-float-icon" style="background:var(--completed-soft);color:var(--completed);"><i class="fa fa-circle-check"></i></div>
                <div>
                    <div style="font-weight:700;font-size:13px;">Сесію підтверджено</div>
                    <div style="color:var(--text-muted);font-size:12px;">Олена К. · Манікюр · 15:00</div>
                </div>
            </div>
            <div class="hero-float-card hero-float-2">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Доходи цього місяця</div>
                <div style="font-size:22px;font-weight:800;">38 450 ₴</div>
                <div style="color:var(--completed);font-size:12px;font-weight:600;"><i class="fa fa-arrow-trend-up"></i> +18% до минулого</div>
            </div>
        </div>
    </div>

    <!-- Trust bar -->
    <div class="landing-trust">
        <div class="trust-stat">
            <div class="trust-value">1 200+</div>
            <div class="trust-label">майстрів на платформі</div>
        </div>
        <div class="trust-stat">
            <div class="trust-value">85 000+</div>
            <div class="trust-label">записів щомісяця</div>
        </div>
        <div class="trust-stat">
            <div class="trust-value">4.9 / 5</div>
            <div class="trust-label">середня оцінка</div>
        </div>
        <div class="trust-stat">
            <div class="trust-value">−42%</div>
            <div class="trust-label">менше пропущених записів</div>
        </div>
    </div>

    <!-- Features -->
    <section class="landing-section" id="features">
        <div class="section-head">
            <div class="section-tag">Можливості</div>
            <h2 class="section-title">Все, що потрібно для роботи — в одному місці</h2>
            <p class="section-sub">Spravna об'єднує розклад, клієнтів, заявки та фінанси, щоб ви могли зосередитись на творчості, а не на хаосі в нотатках.</p>
        </div>
        <div class="landing-features">
            @foreach([
                ['fa-gauge',         'Дашборд',              'Статистика доходів, кількість сесій та ваш розклад на день — одним поглядом.'],
                ['fa-calendar-days', 'Візуальний розклад',   'Тижневий та місячний календар. Натисніть на будь-який слот, щоб записати. Ваш день — за секунди.'],
                ['fa-inbox',         'Запити на запис',      'Клієнти залишають заявки з вашої публічної сторінки. Приймайте, відхиляйте, конвертуйте.'],
                ['fa-box-archive',   'Архів сесій',          'Повна історія кожної сесії зі статусом, ціною та нотатками по клієнту.'],
                ['fa-globe',         'Публічна сторінка',    'Особиста сторінка для запису з переліком послуг, портфоліо та формою заявки.'],
                ['fa-scissors',      'Каталог послуг',       'Гнучке ціноутворення — фіксована, діапазон, від або за запитом. Власна тривалість.'],
            ] as [$icon, $title, $desc])
            <div class="feature-card">
                <div class="feature-icon"><i class="fa {{ $icon }}"></i></div>
                <div class="feature-title">{{ $title }}</div>
                <div class="feature-desc">{{ $desc }}</div>
            </div>
            @endforeach
        </div>
    </section>

    <!-- How it works -->
    <section class="landing-section">
        <div class="section-head">
            <div class="section-tag">Як це працює</div>
            <h2 class="section-title">Запуск за три кроки</h2>
            <p class="section-sub">Реєстрація займає менше двох хвилин — без складних налаштувань і дзвінків менеджеру.</p>
        </div>
        <div class="how-grid">
            <div class="how-step">
                <div class="how-num">1</div>
                <div class="how-title">Створіть акаунт</div>
                <div class="how-desc">Вкажіть ім'я, спеціалізацію та email — і ваш простір готовий до роботи.</div>
            </div>
            <div class="how-step">
                <div class="how-num">2</div>
                <div class="how-title">Додайте послуги та клієнтів</div>
                <div class="how-desc">Налаштуйте каталог послуг з цінами та тривалістю, перенесіть базу клієнтів.</div>
            </div>
            <div class="how-step">
                <div class="how-num">3</div>
                <div class="how-title">Поділіться сторінкою</div>
                <div class="how-desc">Відправте посилання на публічну сторінку клієнтам — заявки одразу потраплять у Spravna.</div>
            </div>
        </div>
    </section>

    <!-- Showcase -->
    <section class="landing-section">
        <div class="showcase-grid">
            <img src="https://picsum.photos/seed/spravna-studio1/420/520" alt="Тату-студія" class="showcase-img showcase-img-1">
            <img src="https://picsum.photos/seed/spravna-studio2/420/520" alt="Майстер манікюру" class="showcase-img showcase-img-2">
            <div class="showcase-text">
                <div class="section-tag">Для будь-якого майстра</div>
                <h2 class="section-title" style="text-align:left;">Tату, нейл-арт, брови, перукарство — і ще багато інших напрямків</h2>
                <p class="section-sub" style="text-align:left;margin:0 0 20px;">Spravna підлаштовується під вашу спеціалізацію: гнучкий каталог послуг, власна тривалість сесій та індивідуальна публічна сторінка з портфоліо робіт.</p>
                <ul class="showcase-list">
                    <li><i class="fa fa-check"></i> Портфоліо робіт на публічній сторінці</li>
                    <li><i class="fa fa-check"></i> Гнучкі ціни: фіксована, діапазон або «за запитом»</li>
                    <li><i class="fa fa-check"></i> Нагадування клієнтам про візит</li>
                    <li><i class="fa fa-check"></i> Нотатки та історія по кожному клієнту</li>
                </ul>
            </div>
        </div>
    </section>

    <!-- Pricing -->
    <section class="landing-section" id="pricing">
        <div class="section-head">
            <div class="section-tag">Тарифи</div>
            <h2 class="section-title">Прозорі ціни, без прихованих платежів</h2>
            <p class="section-sub">Почніть безкоштовно. Переходьте на вищий тариф, коли ваш бізнес росте — скасувати можна будь-коли.</p>
        </div>
        <div class="pricing-grid">
            <div class="price-card">
                <div class="price-name">Старт</div>
                <div class="price-desc">Щоб спробувати та зрозуміти, чи це для вас</div>
                <div class="price-amount">0 ₴<span class="price-period">/міс</span></div>
                <a href="{{ route('register') }}" class="btn btn-secondary price-cta">Почати безкоштовно</a>
                <ul class="price-features">
                    <li><i class="fa fa-check"></i> 1 акаунт майстра</li>
                    <li><i class="fa fa-check"></i> До 30 записів на місяць</li>
                    <li><i class="fa fa-check"></i> Базова публічна сторінка</li>
                    <li><i class="fa fa-check"></i> Каталог послуг (до 5)</li>
                    <li><i class="fa fa-check"></i> Email-сповіщення</li>
                </ul>
            </div>
            <div class="price-card price-card-popular">
                <div class="price-badge">Популярний</div>
                <div class="price-name">Профі</div>
                <div class="price-desc">Для майстрів, що працюють з клієнтами щодня</div>
                <div class="price-amount">349 ₴<span class="price-period">/міс</span></div>
                <a href="{{ route('register') }}" class="btn btn-primary price-cta">Спробувати 14 днів безкоштовно</a>
                <ul class="price-features">
                    <li><i class="fa fa-check"></i> Необмежена кількість записів</li>
                    <li><i class="fa fa-check"></i> Повний каталог послуг</li>
                    <li><i class="fa fa-check"></i> Запити на бронювання та архів сесій</li>
                    <li><i class="fa fa-check"></i> Історія та нотатки по клієнтах</li>
                    <li><i class="fa fa-check"></i> Статистика доходів</li>
                    <li><i class="fa fa-check"></i> Кастомізація публічної сторінки</li>
                    <li><i class="fa fa-check"></i> Пріоритетна підтримка</li>
                </ul>
            </div>
            <div class="price-card">
                <div class="price-name">Студія</div>
                <div class="price-desc">Для команд і студій з кількома майстрами</div>
                <div class="price-amount">799 ₴<span class="price-period">/міс</span></div>
                <a href="{{ route('register') }}" class="btn btn-secondary price-cta">Зв'язатися з нами</a>
                <ul class="price-features">
                    <li><i class="fa fa-check"></i> Все з тарифу «Профі»</li>
                    <li><i class="fa fa-check"></i> До 5 майстрів у команді</li>
                    <li><i class="fa fa-check"></i> Командний календар</li>
                    <li><i class="fa fa-check"></i> Розширена аналітика</li>
                    <li><i class="fa fa-check"></i> Власний домен для сторінки</li>
                    <li><i class="fa fa-check"></i> Персональний менеджер</li>
                </ul>
            </div>
        </div>
        <p style="text-align:center;color:var(--text-muted);font-size:12.5px;margin-top:16px;">
            При оплаті за рік — знижка 20% на будь-якому тарифі. Ціни вказано без ПДВ.
        </p>
    </section>

    <!-- Testimonials -->
    <section class="landing-section">
        <div class="section-head">
            <div class="section-tag">Відгуки</div>
            <h2 class="section-title">Майстри, які вже працюють зі Spravna</h2>
        </div>
        <div class="testimonials-grid">
            <div class="testimonial-card">
                <div class="testimonial-quote">"Перестала загубляти записи в нотатках телефону. Клієнти самі записуються через мою сторінку, а я бачу весь день одразу."</div>
                <div class="testimonial-person">
                    <img src="https://picsum.photos/seed/spravna-person1/80/80" alt="">
                    <div>
                        <div style="font-weight:700;">Марія Коваленко</div>
                        <div style="color:var(--text-muted);font-size:12px;">Майстер манікюру, Київ</div>
                    </div>
                </div>
            </div>
            <div class="testimonial-card">
                <div class="testimonial-quote">"Архів сесій — моя улюблена фіча. Бачу всю історію клієнта: що робили, скільки коштувало, які нотатки залишав."</div>
                <div class="testimonial-person">
                    <img src="https://picsum.photos/seed/spravna-person2/80/80" alt="">
                    <div>
                        <div style="font-weight:700;">Дмитро Тарасенко</div>
                        <div style="color:var(--text-muted);font-size:12px;">Тату-майстер, Львів</div>
                    </div>
                </div>
            </div>
            <div class="testimonial-card">
                <div class="testimonial-quote">"Перейшли на тариф «Студія» всією командою — тепер усі бачать загальний розклад і нікому не дублюють час."</div>
                <div class="testimonial-person">
                    <img src="https://picsum.photos/seed/spravna-person3/80/80" alt="">
                    <div>
                        <div style="font-weight:700;">Анна Прокопенко</div>
                        <div style="color:var(--text-muted);font-size:12px;">Власниця брів-студії, Одеса</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- FAQ -->
    <section class="landing-section" id="faq">
        <div class="section-head">
            <div class="section-tag">Питання та відповіді</div>
            <h2 class="section-title">Залишились питання?</h2>
        </div>
        <div class="faq-list">
            <details class="faq-item" open>
                <summary>Чи можна спробувати безкоштовно?<i class="fa fa-chevron-down"></i></summary>
                <p>Так, тариф «Старт» безкоштовний назавжди — підходить для перевірки сервісу. Тариф «Профі» доступний з 14-денним безкоштовним пробним періодом, картка не потрібна.</p>
            </details>
            <details class="faq-item">
                <summary>Чи є мобільний додаток?<i class="fa fa-chevron-down"></i></summary>
                <p>Окремого застосунку немає, але Spravna — це повноцінний веб-додаток, оптимізований для телефона: можна додати на головний екран і користуватись як звичайною програмою.</p>
            </details>
            <details class="faq-item">
                <summary>Як клієнти записуються через мою сторінку?</summary>
                <p>Кожен майстер отримує власне посилання з переліком послуг та формою бронювання. Заявка одразу з'являється у вкладці «Запити», де ви її підтверджуєте або відхиляєте.</p>
            </details>
            <details class="faq-item">
                <summary>Можна змінити тариф пізніше?<i class="fa fa-chevron-down"></i></summary>
                <p>Звісно. Перейти на вищий або нижчий тариф можна в будь-який момент у налаштуваннях акаунту — зміна застосовується одразу.</p>
            </details>
            <details class="faq-item">
                <summary>Що буде з моїми даними, якщо я скасую підписку?<i class="fa fa-chevron-down"></i></summary>
                <p>Ваші дані залишаються доступними на безкоштовному тарифі «Старт». Видалити акаунт повністю можна в будь-який момент із налаштувань.</p>
            </details>
        </div>
    </section>

    <!-- Final CTA -->
    <section class="landing-section">
        <div class="cta-box">
            <h2 class="section-title" style="margin-bottom:8px;">Готові навести порядок у своєму графіку?</h2>
            <p class="section-sub" style="margin-bottom:24px;">Приєднуйтесь до 1 200+ майстрів, які вже керують своїм бізнесом зі Spravna.</p>
            <a href="{{ route('register') }}" class="btn btn-primary btn-lg">
                <i class="fa fa-rocket"></i> Створити безкоштовний акаунт
            </a>
        </div>
    </section>

    <footer class="landing-footer">
        <div class="footer-cols">
            <div class="footer-col">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                    <div class="brand-logo"><i class="fa fa-asterisk"></i></div>
                    <span class="brand-name">Spravna</span>
                </div>
                <p style="color:var(--text-muted);font-size:13px;max-width:240px;">CRM для незалежних майстрів краси та мистецтва.</p>
            </div>
            <div class="footer-col">
                <div class="footer-col-title">Продукт</div>
                <a href="#features">Можливості</a>
                <a href="#pricing">Тарифи</a>
                <a href="#faq">Питання</a>
            </div>
            <div class="footer-col">
                <div class="footer-col-title">Акаунт</div>
                <a href="{{ route('login') }}">Увійти</a>
                <a href="{{ route('register') }}">Реєстрація</a>
            </div>
        </div>
        <div style="text-align:center;padding-top:24px;border-top:1px solid var(--border);color:var(--text-muted);font-size:12px;">
            © {{ date('Y') }} Spravna. Всі права захищено.
        </div>
    </footer>
</div>
</body>
</html>
