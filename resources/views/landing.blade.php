<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Maystr — CRM для майстрів</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<link rel="stylesheet" href="/css/maystr.css">
</head>
<body>
<div class="landing">
    <nav class="landing-nav">
        <div style="display:flex;align-items:center;gap:10px;">
            <div class="brand-logo"><i class="fa fa-star"></i></div>
            <span class="brand-name">Maystr</span>
        </div>
        <a href="{{ route('login') }}" class="btn btn-primary btn-sm">
            <i class="fa fa-arrow-right-to-bracket"></i> Увійти
        </a>
    </nav>

    <div class="landing-hero">
        <div style="display:inline-flex;align-items:center;gap:8px;background:var(--accent-soft);border:1px solid rgba(201,168,76,.3);border-radius:var(--r-full);padding:5px 14px;font-size:12px;color:var(--accent-text);margin-bottom:20px;">
            <i class="fa fa-star"></i> Для тату-майстрів, нейлістів, бровістів та інших
        </div>
        <h1 class="hero-title">
            Твоє мистецтво.<br>
            <span style="color:var(--accent);">В порядку.</span>
        </h1>
        <p class="hero-sub">Потужна CRM для незалежних майстрів. Керуй клієнтами, плануй сесії, приймай запити на бронювання — без зайвого шуму.</p>
        <div class="hero-actions">
            <a href="{{ route('login') }}" class="btn btn-primary btn-lg">
                <i class="fa fa-arrow-right-to-bracket"></i> Увійти
            </a>
        </div>
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
            <div class="feature-icon" style="color:var(--accent);"><i class="fa {{ $icon }}"></i></div>
            <div class="feature-title">{{ $title }}</div>
            <div class="feature-desc">{{ $desc }}</div>
        </div>
        @endforeach
    </div>

    <footer style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;border-top:1px solid var(--border);">
        © {{ date('Y') }} Maystr. Всі права захищено.
    </footer>
</div>
</body>
</html>
