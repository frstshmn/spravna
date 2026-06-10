<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\BookingRequest;
use App\Models\Client;
use App\Models\ScheduleBlock;
use App\Models\Service;
use App\Models\User;
use App\Models\WorkingHour;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ══════════════════════════════════════════════════════════════
        // USER 1 — Оксана Петренко — Тату-майстер
        // ══════════════════════════════════════════════════════════════
        $oksana = User::create([
            'name'     => 'Оксана Петренко',
            'email'    => 'maria@maystr.app',
            'password' => Hash::make('demo1234'),
            'role'     => 'master',
        ]);

        $oksana->profile()->create([
            'slug'                  => 'oksana-petrenko',
            'bio'                   => 'Тату-майстер з 8 роками досвіду. Спеціалізуюсь на чорно-сірому реалізмі та акварельних роботах. Кожне тату — це унікальна історія на вашій шкірі. Приймаю у власній студії у центрі Києва.',
            'specialty'             => 'tattoo',
            'phone'                 => '+38 (050) 123-45-67',
            'city'                  => 'Київ',
            'country'               => 'Україна',
            'instagram'             => '@oksana.ink',
            'website'               => 'https://oksana-ink.ua',
            'booking_notice'        => 'Депозит 30% при записі. Запис мінімум за 3 тижні для складних робіт.',
            'cancellation_policy'   => 'Скасування за 48 годин. При пізньому скасуванні депозит не повертається.',
            'is_public'             => true,
            'is_accepting_bookings' => true,
            'currency'              => 'UAH',
        ]);

        // Робочі години (Вт–Сб 10:00–19:00)
        for ($d = 0; $d <= 6; $d++) {
            WorkingHour::create([
                'user_id'     => $oksana->id,
                'day_of_week' => $d,
                'start_time'  => '10:00',
                'end_time'    => '19:00',
                'is_working'  => in_array($d, [2, 3, 4, 5, 6]),
            ]);
        }

        ScheduleBlock::create([
            'user_id'    => $oksana->id,
            'date'       => Carbon::now()->addDays(14)->toDateString(),
            'start_time' => '10:00',
            'end_time'   => '19:00',
            'type'       => 'vacation',
            'reason'     => 'Відпустка',
        ]);

        // Послуги Оксани
        $s1 = [];
        $s1[] = Service::create(['user_id'=>$oksana->id,'name'=>'Маленьке тату (до 5 см)','description'=>'Невеликі лінійні або дотворк-роботи. Ідеально для першого тату.','category'=>'tattoo','price_from'=>800,'price_to'=>1500,'duration'=>90,'color'=>'#6366f1','is_active'=>true,'sort_order'=>1]);
        $s1[] = Service::create(['user_id'=>$oksana->id,'name'=>'Середнє тату (5–15 см)','description'=>'Детальні роботи середнього розміру. Реалізм, графіка, традиція.','category'=>'tattoo','price_from'=>2000,'price_to'=>4500,'duration'=>180,'color'=>'#8b5cf6','is_active'=>true,'sort_order'=>2]);
        $s1[] = Service::create(['user_id'=>$oksana->id,'name'=>'Велика робота / Сесія','description'=>'Повні рукави, спини, стегна. Складні багатогодинні сесії.','category'=>'tattoo','price'=>4500,'duration'=>360,'color'=>'#7c3aed','is_active'=>true,'sort_order'=>3]);
        $s1[] = Service::create(['user_id'=>$oksana->id,'name'=>'Акварель','description'=>'Акварельна техніка — яскраво, живо, унікально.','category'=>'tattoo','price_from'=>2500,'price_to'=>6000,'duration'=>240,'color'=>'#06b6d4','is_active'=>true,'sort_order'=>4]);
        $s1[] = Service::create(['user_id'=>$oksana->id,'name'=>'Корекція / Підправлення','description'=>'Освіження кольорів, виправлення старого тату.','category'=>'tattoo','price_from'=>500,'price_to'=>1500,'duration'=>60,'color'=>'#10b981','is_active'=>true,'sort_order'=>5]);
        $s1[] = Service::create(['user_id'=>$oksana->id,'name'=>'Консультація + Ескіз','description'=>'Розробка індивідуального ескізу та обговорення деталей.','category'=>'tattoo','price_on_request'=>true,'duration'=>60,'color'=>'#f59e0b','is_active'=>true,'sort_order'=>6]);
        $s1[] = Service::create(['user_id'=>$oksana->id,'name'=>'Кавер-ап (перекриття)','description'=>'Художнє перекриття небажаного тату новою роботою.','category'=>'tattoo','price_on_request'=>true,'duration'=>300,'color'=>'#ef4444','is_active'=>false,'sort_order'=>7]);

        // Клієнти Оксани
        $c1 = [];
        $c1[] = Client::create(['user_id'=>$oksana->id,'name'=>'Дмитро Коваленко','email'=>'dmytro.kovalenko@gmail.com','phone'=>'+38 (067) 234-56-78','instagram'=>'@dmytro_k','birthday'=>'1992-05-14','source'=>'Instagram','notes'=>'Постійний клієнт. Замовляє рукав поетапно.','medical_notes'=>'Алергія на нікель.','is_vip'=>true]);
        $c1[] = Client::create(['user_id'=>$oksana->id,'name'=>'Марина Сидоренко','email'=>'marina.sydorenko@ukr.net','phone'=>'+38 (050) 345-67-89','instagram'=>'@marina.tattoo_fan','birthday'=>'1998-11-22','source'=>'Рекомендація','notes'=>'Перше тату, трохи нервує.','is_vip'=>false]);
        $c1[] = Client::create(['user_id'=>$oksana->id,'name'=>'Андрій Мельник','email'=>'andrii.melnyk@gmail.com','phone'=>'+38 (063) 456-78-90','instagram'=>'@andrii_melnyk','birthday'=>'1989-03-07','source'=>'Google','notes'=>'Замовляє рукав поетапно, сесія 3-4.','medical_notes'=>'Схильність до рубців — обережно.','is_vip'=>true]);
        $c1[] = Client::create(['user_id'=>$oksana->id,'name'=>'Соломія Гнатюк','email'=>'solomia@ukr.net','phone'=>'+38 (073) 567-89-01','instagram'=>'@solomia_art','birthday'=>'2001-08-30','source'=>'TikTok','notes'=>'Цікавиться акварельними роботами.','is_vip'=>false]);
        $c1[] = Client::create(['user_id'=>$oksana->id,'name'=>'Василь Бондаренко','phone'=>'+38 (097) 678-90-12','source'=>'Сарафанне радіо','notes'=>'Хоче зробити портрет батька.','is_vip'=>false]);
        $c1[] = Client::create(['user_id'=>$oksana->id,'name'=>'Ірина Шевченко','email'=>'irina.shevchenko@gmail.com','phone'=>'+38 (066) 789-01-23','instagram'=>'@irina_shevchenko','birthday'=>'1995-01-15','source'=>'Instagram','notes'=>'Мінімалістичний стиль.','is_vip'=>true]);
        $c1[] = Client::create(['user_id'=>$oksana->id,'name'=>'Тарас Кравченко','email'=>'taras.kravchenko@mail.ua','phone'=>'+38 (050) 890-12-34','birthday'=>'1987-07-19','source'=>'Viber','notes'=>'Великі роботи по всій спині.','is_vip'=>false]);
        $c1[] = Client::create(['user_id'=>$oksana->id,'name'=>'Катерина Лисенко','email'=>'kate.lysenko@gmail.com','phone'=>'+38 (063) 901-23-45','instagram'=>'@kate.lysenko_art','birthday'=>'2000-04-03','source'=>'Instagram','is_vip'=>false]);
        $c1[] = Client::create(['user_id'=>$oksana->id,'name'=>'Олексій Назаренко','phone'=>'+38 (067) 012-34-56','source'=>'Рекомендація','notes'=>'Корекція старого тату з 2015 року.','is_vip'=>false]);
        $c1[] = Client::create(['user_id'=>$oksana->id,'name'=>'Людмила Романенко','email'=>'lyudmyla.romanenko@ukr.net','phone'=>'+38 (073) 123-45-67','instagram'=>'@lyudmyla.r','birthday'=>'1993-12-25','source'=>'Facebook','notes'=>'Слов\'янська символіка.','is_vip'=>true]);

        // Записи Оксани — архів
        $this->appt($oksana,$c1[0],$s1[2],'-90 days 14:00',360,4500,'completed','Перша сесія рукава.');
        $this->appt($oksana,$c1[2],$s1[1],'-75 days 11:00',180,3200,'completed','Частина рукава — квіти.');
        $this->appt($oksana,$c1[0],$s1[2],'-60 days 10:00',360,4500,'completed','Друга сесія рукава.');
        $this->appt($oksana,$c1[1],$s1[0],'-55 days 15:00',90, 1200,'completed','Перше тату — метелик.');
        $this->appt($oksana,$c1[3],$s1[3],'-45 days 12:00',240,3500,'completed','Акварель — лісовий пейзаж.');
        $this->appt($oksana,$c1[6],$s1[2],'-40 days 10:00',360,4500,'completed','Спина — перша сесія.');
        $this->appt($oksana,$c1[5],$s1[1],'-35 days 13:00',180,2800,'completed');
        $this->appt($oksana,$c1[9],$s1[3],'-30 days 11:00',240,4000,'completed','Рукав — акварель з мандалами.');
        $this->appt($oksana,$c1[4],$s1[1],'-28 days 14:00',180,3000,'cancelled',null,'Не попередив — депозит утримано.');
        $this->appt($oksana,$c1[7],$s1[0],'-25 days 16:00',90, 900, 'completed');
        $this->appt($oksana,$c1[8],$s1[4],'-20 days 11:00',60, 800, 'completed','Підправили старе тату.');
        $this->appt($oksana,$c1[2],$s1[2],'-15 days 10:00',360,4500,'completed','Третя сесія рукава!');
        $this->appt($oksana,$c1[4],$s1[1],'-12 days 13:00',180,2500,'no_show',  null,'Не з\'явився без дзвінка.');
        $this->appt($oksana,$c1[9],$s1[2],'-10 days 10:00',360,4500,'completed');
        $this->appt($oksana,$c1[0],$s1[4],'-7 days 15:00', 60, 600, 'completed','Корекція 2-річного тату.');
        $this->appt($oksana,$c1[1],$s1[3],'-5 days 12:00', 240,3200,'completed','Акварель — квіти на стегні.');
        $this->appt($oksana,$c1[6],$s1[2],'-3 days 10:00', 360,4500,'completed','Спина — друга сесія.');
        $this->appt($oksana,$c1[7],$s1[1],'-2 days 14:00', 180,2200,'cancelled',null,'Хвора.');

        // Записи Оксани — сьогодні і майбутні
        $this->appt($oksana,$c1[3],$s1[1],'today 11:00',   180,3000,'confirmed');
        $this->appt($oksana,$c1[5],$s1[3],'today 15:00',   240,3800,'in_progress','Акварель — сова на руці.');
        $this->appt($oksana,$c1[2],$s1[2],'+3 days 10:00', 360,4500,'confirmed','Фінальна сесія рукава.');
        $this->appt($oksana,$c1[9],$s1[4],'+5 days 14:00', 60, 700, 'confirmed');
        $this->appt($oksana,$c1[0],$s1[2],'+8 days 10:00', 360,4500,'confirmed','Ліс на стегні — нова робота.');
        $this->appt($oksana,$c1[4],$s1[1],'+10 days 13:00',180,2800,'pending');
        $this->appt($oksana,$c1[7],$s1[3],'+12 days 11:00',240,3500,'confirmed');
        $this->appt($oksana,$c1[8],$s1[0],'+15 days 16:00',90, 1100,'confirmed');
        $this->appt($oksana,$c1[1],$s1[2],'+18 days 10:00',360,4500,'pending');
        $this->appt($oksana,$c1[6],$s1[2],'+20 days 10:00',360,4500,'confirmed','Третя сесія спини.');

        // Запити Оксани
        BookingRequest::create(['user_id'=>$oksana->id,'service_id'=>$s1[1]->id,'client_name'=>'Назар Гречко','client_phone'=>'+38 (067) 555-11-22','client_instagram'=>'@nazar_grechko','preferred_date'=>Carbon::now()->addDays(9)->toDateString(),'preferred_time'=>'12:00','message'=>'Хочу зробити вовка на плечі в стилі чорно-сірого реалізму. Є ескіз.','status'=>'pending','source'=>'public_page']);
        BookingRequest::create(['user_id'=>$oksana->id,'service_id'=>$s1[3]->id,'client_name'=>'Юлія Мороз','client_email'=>'yulia.moroz@gmail.com','client_phone'=>'+38 (050) 444-33-22','preferred_date'=>Carbon::now()->addDays(11)->toDateString(),'preferred_time'=>'14:00','message'=>'Хочу акварельний метелик на лопатці, розмір ~10 см.','status'=>'pending','source'=>'public_page']);
        BookingRequest::create(['user_id'=>$oksana->id,'service_id'=>$s1[2]->id,'client_name'=>'Богдан Савченко','client_phone'=>'+38 (063) 777-88-99','message'=>'Цікавить повний рукав у японському стилі. Хочу обговорити концепцію.','status'=>'pending','source'=>'public_page']);
        BookingRequest::create(['user_id'=>$oksana->id,'service_id'=>$s1[0]->id,'client_name'=>'Анна Кириленко','client_email'=>'anna.kyrylenko@ukr.net','preferred_date'=>Carbon::now()->addDays(6)->toDateString(),'preferred_time'=>'11:00','message'=>'Маленьке тату — координати міста, де народилась.','status'=>'accepted','response_message'=>'Привіт! Підтверджую запис. Чекаю вас!','responded_at'=>Carbon::now()->subDays(2),'source'=>'public_page']);
        BookingRequest::create(['user_id'=>$oksana->id,'client_name'=>'Роман Федоренко','client_phone'=>'+38 (097) 321-65-44','message'=>'Хочу перекрити старе тату на зап\'ястку.','status'=>'declined','response_message'=>'На жаль, зараз не беру кавер-апи. Спробуйте повторно через 2 місяці.','responded_at'=>Carbon::now()->subDays(5),'source'=>'public_page']);


        // ══════════════════════════════════════════════════════════════
        // USER 2 — Аліна Мороз — Нейл-майстер
        // ══════════════════════════════════════════════════════════════
        $alina = User::create([
            'name'     => 'Аліна Мороз',
            'email'    => 'james@maystr.app',
            'password' => Hash::make('demo1234'),
            'role'     => 'master',
        ]);

        $alina->profile()->create([
            'slug'                  => 'alina-moroz',
            'bio'                   => 'Нейл-майстер з 6-річним досвідом. Гель-лак, акрил, нарощування, нейл-арт будь-якої складності. Працюю у власному кабінеті на Позняках. Завжди стежу за трендами.',
            'specialty'             => 'nails',
            'phone'                 => '+38 (066) 987-65-43',
            'city'                  => 'Київ',
            'country'               => 'Україна',
            'instagram'             => '@alina.nails_kyiv',
            'booking_notice'        => 'Запис мінімум за 3 дні. Матеріали включені в ціну.',
            'cancellation_policy'   => 'Скасування за 24 години. Інакше — 50% вартості.',
            'is_public'             => true,
            'is_accepting_bookings' => true,
            'currency'              => 'UAH',
        ]);

        // Робочі години Аліни (Пн–Пт 9–19, Сб 10–17, Нд вихідний)
        $alinaSchedule = [0=>false,1=>['09:00','19:00'],2=>['09:00','19:00'],3=>['09:00','19:00'],4=>['09:00','19:00'],5=>['09:00','19:00'],6=>['10:00','17:00']];
        foreach ($alinaSchedule as $day => $hours) {
            WorkingHour::create(['user_id'=>$alina->id,'day_of_week'=>$day,'start_time'=>$hours?$hours[0]:'09:00','end_time'=>$hours?$hours[1]:'18:00','is_working'=>(bool)$hours]);
        }

        ScheduleBlock::create(['user_id'=>$alina->id,'date'=>Carbon::now()->addDays(7)->toDateString(),'start_time'=>'14:00','end_time'=>'17:00','type'=>'custom','reason'=>'Особисті справи']);

        // Послуги Аліни
        $s2 = [];
        $s2[] = Service::create(['user_id'=>$alina->id,'name'=>'Манікюр з гель-лаком','description'=>'Класичний манікюр + покриття гель-лаком. Тримається до 3 тижнів.','category'=>'nails','price'=>450,'duration'=>90,'color'=>'#ec4899','is_active'=>true,'sort_order'=>1]);
        $s2[] = Service::create(['user_id'=>$alina->id,'name'=>'Нарощування (акрил)','description'=>'Нарощування нігтів акрилом. Натуральний або французький вигляд.','category'=>'nails','price'=>850,'duration'=>150,'color'=>'#f43f5e','is_active'=>true,'sort_order'=>2]);
        $s2[] = Service::create(['user_id'=>$alina->id,'name'=>'Нейл-арт','description'=>'Художній розпис нігтів. Від простих малюнків до складних дизайнів.','category'=>'nails','price_from'=>100,'price_to'=>500,'duration'=>60,'color'=>'#a855f7','is_active'=>true,'sort_order'=>3]);
        $s2[] = Service::create(['user_id'=>$alina->id,'name'=>'Педикюр з покриттям','description'=>'Апаратний педикюр + гель-лак.','category'=>'nails','price'=>550,'duration'=>120,'color'=>'#f97316','is_active'=>true,'sort_order'=>4]);
        $s2[] = Service::create(['user_id'=>$alina->id,'name'=>'Зняття гель-лаку','description'=>'Акуратне зняття без шкоди для нігтя.','category'=>'nails','price'=>150,'duration'=>30,'color'=>'#14b8a6','is_active'=>true,'sort_order'=>5]);
        $s2[] = Service::create(['user_id'=>$alina->id,'name'=>'Корекція нарощування','description'=>'Корекція акрилу або гелю кожні 3–4 тижні.','category'=>'nails','price'=>600,'duration'=>120,'color'=>'#3b82f6','is_active'=>true,'sort_order'=>6]);
        $s2[] = Service::create(['user_id'=>$alina->id,'name'=>'Весільний манікюр','description'=>'Особливий манікюр для весільного дня. Включає дизайн і консультацію.','category'=>'nails','price_on_request'=>true,'duration'=>180,'color'=>'#f59e0b','is_active'=>true,'sort_order'=>7]);

        // Клієнти Аліни
        $c2 = [];
        $c2[] = Client::create(['user_id'=>$alina->id,'name'=>'Ольга Тимченко','email'=>'olga.tymchenko@gmail.com','phone'=>'+38 (050) 111-22-33','instagram'=>'@olga_nails','birthday'=>'1990-06-18','source'=>'Instagram','notes'=>'Постійна. Приходить кожні 3 тижні.','is_vip'=>true]);
        $c2[] = Client::create(['user_id'=>$alina->id,'name'=>'Яна Бойко','email'=>'yana.boyko@ukr.net','phone'=>'+38 (067) 222-33-44','instagram'=>'@yana.boyko','birthday'=>'1997-02-14','source'=>'Рекомендація','is_vip'=>false]);
        $c2[] = Client::create(['user_id'=>$alina->id,'name'=>'Вікторія Поліщук','email'=>'vika.polishchuk@gmail.com','phone'=>'+38 (063) 333-44-55','instagram'=>'@vika_poli','birthday'=>'2002-09-07','source'=>'TikTok','notes'=>'Любить яскраві кольори та нейл-арт.','is_vip'=>false]);
        $c2[] = Client::create(['user_id'=>$alina->id,'name'=>'Наталія Ковальчук','email'=>'natalia.kovalchuk@mail.ua','phone'=>'+38 (073) 444-55-66','birthday'=>'1985-12-03','source'=>'Facebook','notes'=>'Ламкі нігті, потребує укріплення.','medical_notes'=>'Алергія на акриловий порошок — тільки гель.','is_vip'=>true]);
        $c2[] = Client::create(['user_id'=>$alina->id,'name'=>'Євгенія Гаврилюк','phone'=>'+38 (066) 555-66-77','source'=>'Viber','notes'=>'Весільний манікюр у планах.','is_vip'=>false]);
        $c2[] = Client::create(['user_id'=>$alina->id,'name'=>'Тетяна Захаренко','email'=>'tatyana.zakharenko@gmail.com','phone'=>'+38 (097) 666-77-88','instagram'=>'@tanya_style','birthday'=>'1994-04-22','source'=>'Instagram','is_vip'=>false]);
        $c2[] = Client::create(['user_id'=>$alina->id,'name'=>'Оксана Лук\'яненко','email'=>'oksana.lukyanenko@ukr.net','phone'=>'+38 (050) 777-88-99','birthday'=>'1988-10-11','source'=>'Google','notes'=>'Педикюр + манікюр разом раз на місяць.','is_vip'=>true]);
        $c2[] = Client::create(['user_id'=>$alina->id,'name'=>'Дарина Кузьменко','email'=>'daryna.kuzmenko@gmail.com','phone'=>'+38 (067) 888-99-00','instagram'=>'@daryna_k','birthday'=>'2003-07-25','source'=>'Instagram','notes'=>'Нарощування кожні 4 тижні.','is_vip'=>false]);

        // Записи Аліни — архів
        $this->appt($alina,$c2[0],$s2[0],'-85 days 10:00',90, 450, 'completed');
        $this->appt($alina,$c2[1],$s2[1],'-80 days 12:00',150,850, 'completed');
        $this->appt($alina,$c2[2],$s2[2],'-78 days 14:00',60, 300, 'completed','Нейл-арт — квіти.');
        $this->appt($alina,$c2[0],$s2[0],'-64 days 10:00',90, 450, 'completed');
        $this->appt($alina,$c2[3],$s2[0],'-62 days 11:00',90, 450, 'completed','Тільки гель — без акрилу.');
        $this->appt($alina,$c2[7],$s2[1],'-58 days 13:00',150,850, 'completed');
        $this->appt($alina,$c2[6],$s2[3],'-50 days 10:00',120,550, 'completed');
        $this->appt($alina,$c2[0],$s2[5],'-43 days 10:00',120,600, 'completed');
        $this->appt($alina,$c2[4],$s2[6],'-40 days 11:00',180,1200,'completed','Весільний манікюр. Клієнтка задоволена!');
        $this->appt($alina,$c2[1],$s2[5],'-38 days 12:00',120,600, 'completed');
        $this->appt($alina,$c2[5],$s2[0],'-35 days 15:00',90, 450, 'cancelled',null,'Захворіла.');
        $this->appt($alina,$c2[2],$s2[0],'-30 days 14:00',90, 450, 'completed');
        $this->appt($alina,$c2[3],$s2[5],'-29 days 11:00',120,600, 'completed');
        $this->appt($alina,$c2[7],$s2[5],'-22 days 13:00',120,600, 'completed');
        $this->appt($alina,$c2[6],$s2[0],'-21 days 10:00',90, 450, 'completed');
        $this->appt($alina,$c2[0],$s2[0],'-21 days 12:00',90, 450, 'completed');
        $this->appt($alina,$c2[1],$s2[2],'-18 days 14:00',60, 350, 'completed','Нейл-арт — геометрія.');
        $this->appt($alina,$c2[5],$s2[3],'-15 days 11:00',120,550, 'completed');
        $this->appt($alina,$c2[2],$s2[4],'-13 days 15:00',30, 150, 'completed');
        $this->appt($alina,$c2[3],$s2[0],'-12 days 10:00',90, 450, 'no_show',  null,'Не попередила.');
        $this->appt($alina,$c2[7],$s2[5],'-8 days 13:00', 120,600, 'completed');
        $this->appt($alina,$c2[6],$s2[0],'-7 days 10:00', 90, 450, 'completed');
        $this->appt($alina,$c2[0],$s2[3],'-5 days 10:00', 120,550, 'completed');
        $this->appt($alina,$c2[1],$s2[0],'-3 days 11:00', 90, 450, 'completed');
        $this->appt($alina,$c2[4],$s2[6],'-2 days 12:00', 180,1400,'cancelled',null,'Перенесла.');

        // Записи Аліни — сьогодні і майбутні
        $this->appt($alina,$c2[2],$s2[0],'today 10:00',   90, 450, 'confirmed');
        $this->appt($alina,$c2[0],$s2[5],'today 12:00',   120,600, 'in_progress','Корекція. VIP клієнтка.');
        $this->appt($alina,$c2[6],$s2[3],'today 15:00',   120,550, 'confirmed');
        $this->appt($alina,$c2[3],$s2[0],'+1 days 11:00', 90, 450, 'confirmed');
        $this->appt($alina,$c2[7],$s2[1],'+2 days 13:00', 150,850, 'confirmed');
        $this->appt($alina,$c2[5],$s2[0],'+4 days 10:00', 90, 450, 'confirmed');
        $this->appt($alina,$c2[1],$s2[5],'+5 days 12:00', 120,600, 'confirmed');
        $this->appt($alina,$c2[6],$s2[0],'+7 days 10:00', 90, 450, 'pending');
        $this->appt($alina,$c2[0],$s2[0],'+8 days 10:00', 90, 450, 'confirmed');
        $this->appt($alina,$c2[4],$s2[6],'+14 days 11:00',180,1400,'confirmed','Весілля 15-го. Клієнтка чекає!');
        $this->appt($alina,$c2[2],$s2[2],'+15 days 14:00',60, 400, 'pending');
        $this->appt($alina,$c2[3],$s2[5],'+19 days 10:00',120,600, 'confirmed');

        // Запити Аліни
        BookingRequest::create(['user_id'=>$alina->id,'service_id'=>$s2[6]->id,'client_name'=>'Поліна Данченко','client_phone'=>'+38 (050) 234-56-78','client_instagram'=>'@polina_wedding','preferred_date'=>Carbon::now()->addDays(16)->toDateString(),'preferred_time'=>'11:00','message'=>'Весілля 17-го. Хочу ніжний дизайн з перлинами та квітами.','status'=>'pending','source'=>'public_page']);
        BookingRequest::create(['user_id'=>$alina->id,'service_id'=>$s2[0]->id,'client_name'=>'Крістіна Войтенко','client_email'=>'kristina.voytenko@gmail.com','client_phone'=>'+38 (067) 345-67-89','preferred_date'=>Carbon::now()->addDays(3)->toDateString(),'preferred_time'=>'13:00','message'=>'Хочу гель-лак у стилі nude. Чи є вільний час?','status'=>'pending','source'=>'public_page']);
        BookingRequest::create(['user_id'=>$alina->id,'service_id'=>$s2[1]->id,'client_name'=>'Аліса Романова','client_email'=>'alisa.romanova@ukr.net','preferred_date'=>Carbon::now()->addDays(6)->toDateString(),'preferred_time'=>'15:00','message'=>'Хочу довгі нігті. Форма мигдаль.','status'=>'accepted','response_message'=>'Доброго дня! Підтверджую ваш запис. До зустрічі!','responded_at'=>Carbon::now()->subDays(1),'source'=>'public_page']);
        BookingRequest::create(['user_id'=>$alina->id,'client_name'=>'Лілія Степаненко','client_phone'=>'+38 (073) 456-78-90','message'=>'Чи робите нарощування гелем? Є алергія на акрил.','status'=>'pending','source'=>'public_page']);
    }

    private function appt(User $u, Client $c, Service $s, string $expr, int $dur, float $price, string $status, ?string $notes=null, ?string $internal=null): Appointment
    {
        if (str_starts_with($expr, 'today ')) {
            [$h, $m] = explode(':', substr($expr, 6));
            $date = Carbon::today()->setHour((int)$h)->setMinute((int)$m)->setSecond(0);
        } elseif (preg_match('/^([+-]\d+)\s+days?\s+(\d+):(\d+)/', $expr, $match)) {
            $date = Carbon::today()->addDays((int)$match[1])->setHour((int)$match[2])->setMinute((int)$match[3])->setSecond(0);
        } else {
            $date = Carbon::parse($expr);
        }

        return Appointment::create([
            'user_id'        => $u->id,
            'client_id'      => $c->id,
            'service_id'     => $s->id,
            'title'          => $s->name.' — '.$c->name,
            'scheduled_at'   => $date,
            'duration'       => $dur,
            'status'         => $status,
            'price'          => $price,
            'deposit'        => in_array($status, ['completed','confirmed','in_progress']) ? round($price*0.3) : null,
            'deposit_paid'   => in_array($status, ['completed','in_progress']),
            'notes'          => $notes,
            'internal_notes' => $internal,
            'color'          => $s->color,
        ]);
    }
}
