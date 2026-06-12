<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\Service;
use App\Models\User;
use App\Services\InstagramService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ClientShowcaseSeeder extends Seeder
{
    public function run(): void
    {
        $oksana = User::where('email', 'maria@maystr.app')->first();
        if (!$oksana) {
            $this->command?->error('Master "maria@maystr.app" not found — run the main DatabaseSeeder first.');
            return;
        }

        // Services in the same order they were seeded by DatabaseSeeder
        $services = Service::where('user_id', $oksana->id)->orderBy('sort_order')->get()->values();
        // 0: Маленьке тату, 1: Середнє тату, 2: Велика робота, 3: Акварель, 4: Корекція

        $clients = [
            ['name'=>'Олена Ткаченко','email'=>'olena.tkachenko@gmail.com','phone'=>'+38 (050) 111-22-44','instagram'=>'frstshmn','birthday'=>'1994-03-12','source'=>'Instagram','is_vip'=>true,'notes'=>'Колекціонує дрібні дотворк-тату. Дуже акуратна, завжди вчасно.','appts'=>[
                ['svc'=>0,'expr'=>'-70 days 11:00','dur'=>90, 'price'=>1200,'status'=>'completed','notes'=>'Маленька квітка на запʼясті.'],
                ['svc'=>4,'expr'=>'-30 days 14:00','dur'=>60, 'price'=>700, 'status'=>'completed'],
                ['svc'=>0,'expr'=>'-9 days 10:00', 'dur'=>90, 'price'=>1400,'status'=>'completed','notes'=>'Друга дрібна робота — зірки.'],
                ['svc'=>1,'expr'=>'+6 days 10:00', 'dur'=>180,'price'=>3200,'status'=>'confirmed'],
            ]],
            ['name'=>'Максим Поляков','email'=>'maksym.poliakov@gmail.com','phone'=>'+38 (067) 222-33-55','instagram'=>'@maks_poliakov','birthday'=>'1991-07-02','source'=>'Рекомендація','is_vip'=>false,'notes'=>'Цікавиться геометричним стилем.','appts'=>[
                ['svc'=>1,'expr'=>'-55 days 12:00','dur'=>180,'price'=>3500,'status'=>'completed'],
                ['svc'=>4,'expr'=>'-14 days 13:00','dur'=>60, 'price'=>900, 'status'=>'completed'],
            ]],
            ['name'=>'Софія Гриценко','email'=>'sofia.hrytsenko@ukr.net','phone'=>'+38 (063) 333-44-66','instagram'=>'@sofia.gr','birthday'=>'1999-12-08','source'=>'TikTok','is_vip'=>false,'notes'=>'Перше тату — дуже хвилюється, потрібно більше пояснень.','medical_notes'=>'Чутлива шкіра, використовувати гіпоалергенну фарбу.','appts'=>[
                ['svc'=>0,'expr'=>'-21 days 15:00','dur'=>90,'price'=>1100,'status'=>'completed','notes'=>'Перше тату — напис на ребрах.'],
                ['svc'=>0,'expr'=>'+14 days 11:00','dur'=>90,'price'=>1300,'status'=>'pending'],
            ]],
            ['name'=>'Артем Литвин','email'=>'artem.lytvyn@gmail.com','phone'=>'+38 (073) 444-55-77','instagram'=>'@artem_lytvyn','birthday'=>'1988-01-27','source'=>'Google','is_vip'=>true,'notes'=>'Великий проєкт — фулслів, працюємо поетапно вже пів року.','appts'=>[
                ['svc'=>2,'expr'=>'-95 days 10:00','dur'=>360,'price'=>4500,'status'=>'completed','notes'=>'Фулслів — сесія 1.'],
                ['svc'=>2,'expr'=>'-65 days 10:00','dur'=>360,'price'=>4500,'status'=>'completed','notes'=>'Фулслів — сесія 2.'],
                ['svc'=>2,'expr'=>'-32 days 10:00','dur'=>360,'price'=>4800,'status'=>'completed','notes'=>'Фулслів — сесія 3.'],
                ['svc'=>2,'expr'=>'+9 days 10:00', 'dur'=>360,'price'=>4800,'status'=>'confirmed','notes'=>'Фулслів — сесія 4.'],
            ]],
            ['name'=>'Вікторія Семенюк','email'=>'viktoria.semeniuk@gmail.com','phone'=>'+38 (066) 555-66-88','instagram'=>'@vika.semeniuk','birthday'=>'2000-05-19','source'=>'Instagram','is_vip'=>false,'notes'=>'Любить акварель та яскраві кольори.','appts'=>[
                ['svc'=>3,'expr'=>'-40 days 12:00','dur'=>240,'price'=>3800,'status'=>'completed','notes'=>'Акварельний колібрі.'],
                ['svc'=>4,'expr'=>'-6 days 16:00', 'dur'=>60, 'price'=>650, 'status'=>'completed'],
            ]],
            ['name'=>'Богдана Кравець','email'=>'bohdana.kravets@ukr.net','phone'=>'+38 (097) 666-77-99','birthday'=>'1996-09-30','source'=>'Сарафанне радіо','is_vip'=>false,'notes'=>'Прийшла за рекомендацією подруги.','appts'=>[
                ['svc'=>0,'expr'=>'-18 days 11:00','dur'=>90,'price'=>1000,'status'=>'completed'],
            ]],
            ['name'=>'Денис Захарчук','email'=>'denys.zakharchuk@gmail.com','phone'=>'+38 (050) 777-88-00','instagram'=>'@denys.zak','birthday'=>'1985-11-11','source'=>'Facebook','is_vip'=>false,'notes'=>'Реставрація старого тату 10-річної давнини.','appts'=>[
                ['svc'=>4,'expr'=>'-25 days 10:00','dur'=>60, 'price'=>1200,'status'=>'completed','notes'=>'Освіження кольору на плечі.'],
                ['svc'=>1,'expr'=>'-2 days 14:00', 'dur'=>180,'price'=>3000,'status'=>'cancelled','internal'=>'Перенесено на наступний місяць.'],
            ]],
            ['name'=>'Юрій Остапенко','email'=>'yurii.ostapenko@mail.ua','phone'=>'+38 (063) 888-99-11','birthday'=>'1990-04-05','source'=>'Google','is_vip'=>false,'notes'=>'Працює у нічні зміни, записується тільки на вихідні.','appts'=>[
                ['svc'=>1,'expr'=>'-48 days 10:00','dur'=>180,'price'=>2800,'status'=>'completed'],
                ['svc'=>1,'expr'=>'+17 days 10:00','dur'=>180,'price'=>3000,'status'=>'confirmed'],
            ]],
            ['name'=>'Марія Костенко','email'=>'maria.kostenko@gmail.com','phone'=>'+38 (067) 999-00-22','instagram'=>'@maria.kostenko','birthday'=>'2003-02-17','source'=>'Instagram','is_vip'=>false,'notes'=>'Студентка, записується на знижкові години.','appts'=>[
                ['svc'=>0,'expr'=>'-11 days 13:00','dur'=>90,'price'=>900,'status'=>'completed'],
            ]],
            ['name'=>'Павло Дяченко','email'=>'pavlo.diachenko@ukr.net','phone'=>'+38 (073) 100-22-33','instagram'=>'@pavlo_d','birthday'=>'1993-08-23','source'=>'Рекомендація','is_vip'=>true,'notes'=>'VIP — завжди передоплачує повністю, без депозитів.','appts'=>[
                ['svc'=>3,'expr'=>'-60 days 11:00','dur'=>240,'price'=>5200,'status'=>'completed','notes'=>'Акварельний тигр на грудях.'],
                ['svc'=>4,'expr'=>'-15 days 12:00','dur'=>60, 'price'=>800, 'status'=>'completed'],
                ['svc'=>3,'expr'=>'+11 days 11:00','dur'=>240,'price'=>5500,'status'=>'confirmed','notes'=>'Продовження композиції на плечі.'],
            ]],
            ['name'=>'Анастасія Бойчук','email'=>'anastasia.boichuk@gmail.com','phone'=>'+38 (050) 200-33-44','instagram'=>'@nastya.boichuk','birthday'=>'1997-06-14','source'=>'TikTok','is_vip'=>false,'notes'=>'Хоче серію дрібних тату по тілу — мінімалізм.','appts'=>[
                ['svc'=>0,'expr'=>'-37 days 15:00','dur'=>90,'price'=>1000,'status'=>'completed'],
                ['svc'=>0,'expr'=>'-16 days 15:00','dur'=>90,'price'=>1000,'status'=>'completed'],
                ['svc'=>0,'expr'=>'+4 days 15:00', 'dur'=>90,'price'=>1100,'status'=>'pending'],
            ]],
            ['name'=>'Руслан Гончаренко','email'=>'ruslan.honcharenko@mail.ua','phone'=>'+38 (066) 300-44-55','birthday'=>'1986-10-09','source'=>'Сарафанне радіо','is_vip'=>false,'notes'=>'Військовий, записується завчасно через нерегулярний графік.','appts'=>[
                ['svc'=>2,'expr'=>'-80 days 10:00','dur'=>360,'price'=>4500,'status'=>'completed','notes'=>'Памʼятне тату з символікою підрозділу.'],
                ['svc'=>4,'expr'=>'-9 days 16:00','dur'=>60,'price'=>700,'status'=>'completed'],
            ]],
            ['name'=>'Кристина Олійник','email'=>'kristina.oliynyk@gmail.com','phone'=>'+38 (097) 400-55-66','instagram'=>'@kristina.oliynyk','birthday'=>'2001-03-29','source'=>'Instagram','is_vip'=>false,'notes'=>'Активна в соцмережах, часто тегає студію.','appts'=>[
                ['svc'=>0,'expr'=>'-5 days 12:00','dur'=>90,'price'=>1200,'status'=>'completed','notes'=>'Маленька тату — символ нескінченності.'],
                ['svc'=>4,'expr'=>'+20 days 13:00','dur'=>60,'price'=>650,'status'=>'pending'],
            ]],
            ['name'=>'Владислав Савчук','email'=>'vladyslav.savchuk@gmail.com','phone'=>'+38 (063) 500-66-77','birthday'=>'1989-12-19','source'=>'Google','is_vip'=>false,'notes'=>null,'appts'=>[
                ['svc'=>1,'expr'=>'-43 days 14:00','dur'=>180,'price'=>2900,'status'=>'completed'],
                ['svc'=>1,'expr'=>'-19 days 14:00','dur'=>180,'price'=>3100,'status'=>'no_show','internal'=>'Не зʼявився, не відповідає на дзвінки.'],
            ]],
            ['name'=>'Наталя Дубенко','email'=>'natalia.dubenko@ukr.net','phone'=>'+38 (050) 600-77-88','instagram'=>'@natalia.dubenko','birthday'=>'1995-05-04','source'=>'Facebook','is_vip'=>false,'notes'=>'Розглядає кавер-ап старого тату на щиколотці.','appts'=>[
                ['svc'=>4,'expr'=>'-27 days 10:00','dur'=>60,'price'=>900,'status'=>'completed','notes'=>'Консультація + дрібна корекція.'],
            ]],
            ['name'=>'Сергій Ткачук','email'=>'serhii.tkachuk@gmail.com','phone'=>'+38 (067) 700-88-99','birthday'=>'1983-02-28','source'=>'Рекомендація','is_vip'=>true,'notes'=>'Власник тату-салону у Львові, замовляє роботи коли приїжджає до Києва.','appts'=>[
                ['svc'=>2,'expr'=>'-72 days 10:00','dur'=>360,'price'=>4700,'status'=>'completed'],
                ['svc'=>2,'expr'=>'-24 days 10:00','dur'=>360,'price'=>4700,'status'=>'completed'],
                ['svc'=>2,'expr'=>'+13 days 10:00','dur'=>360,'price'=>5000,'status'=>'confirmed'],
            ]],
            ['name'=>'Тетяна Бондар','email'=>'tetiana.bondar@gmail.com','phone'=>'+38 (073) 800-99-00','instagram'=>'@tetiana.bondar','birthday'=>'1998-07-07','source'=>'Instagram','is_vip'=>false,'notes'=>'Дизайнерка, часто приходить з власними ескізами.','appts'=>[
                ['svc'=>3,'expr'=>'-33 days 12:00','dur'=>240,'price'=>4200,'status'=>'completed','notes'=>'Авторський ескіз — абстракція.'],
                ['svc'=>4,'expr'=>'-4 days 11:00','dur'=>60,'price'=>750,'status'=>'completed'],
            ]],
            ['name'=>'Ігор Савенко','email'=>'ihor.savenko@ukr.net','phone'=>'+38 (066) 900-00-11','birthday'=>'1992-09-15','source'=>'Google','is_vip'=>false,'notes'=>'Потребує перенесення сесій через відрядження.','appts'=>[
                ['svc'=>1,'expr'=>'-12 days 13:00','dur'=>180,'price'=>2700,'status'=>'completed'],
                ['svc'=>1,'expr'=>'+22 days 13:00','dur'=>180,'price'=>2900,'status'=>'pending'],
            ]],
            ['name'=>'Олександра Мельниченко','email'=>'oleksandra.melnychenko@gmail.com','phone'=>'+38 (050) 010-11-22','instagram'=>'@sasha.melnychenko','birthday'=>'2000-01-30','source'=>'TikTok','is_vip'=>false,'notes'=>'Студентка художньої академії, цікавиться технікою лінійної роботи.','appts'=>[
                ['svc'=>0,'expr'=>'-8 days 10:00','dur'=>90,'price'=>1300,'status'=>'completed'],
            ]],
            ['name'=>'Євген Стельмах','email'=>'yevhen.stelmakh@gmail.com','phone'=>'+38 (063) 020-22-33','instagram'=>'@yevhen.stelmakh','birthday'=>'1987-04-21','source'=>'Сарафанне радіо','is_vip'=>true,'notes'=>'Постійний клієнт з 2022 року, рекомендує студію друзям.','medical_notes'=>'Низький болевий порог — частіші перерви під час сесії.','appts'=>[
                ['svc'=>2,'expr'=>'-88 days 10:00','dur'=>360,'price'=>4500,'status'=>'completed'],
                ['svc'=>4,'expr'=>'-44 days 14:00','dur'=>60, 'price'=>700, 'status'=>'completed'],
                ['svc'=>1,'expr'=>'-17 days 11:00','dur'=>180,'price'=>3000,'status'=>'completed'],
                ['svc'=>1,'expr'=>'+25 days 11:00','dur'=>180,'price'=>3200,'status'=>'confirmed'],
            ]],
        ];

        $instagram = app(InstagramService::class);

        foreach ($clients as $data) {
            $appts = $data['appts'];
            unset($data['appts']);

            $data['avatar_url'] = null;
            if (!empty($data['instagram'])) {
                $data['avatar_url'] = $instagram->fetchAvatar($data['instagram']);
            }

            $client = Client::create(array_merge(['user_id' => $oksana->id], $data));

            foreach ($appts as $a) {
                $this->appt(
                    $oksana,
                    $client,
                    $services[$a['svc']],
                    $a['expr'],
                    $a['dur'],
                    $a['price'],
                    $a['status'],
                    $a['notes'] ?? null,
                    $a['internal'] ?? null,
                );
            }
        }

        $this->command?->info('Seeded ' . count($clients) . ' showcase clients for ' . $oksana->name . '.');
    }

    private function appt(User $u, Client $c, Service $s, string $expr, int $dur, float $price, string $status, ?string $notes = null, ?string $internal = null): Appointment
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
            'title'          => $s->name . ' — ' . $c->name,
            'scheduled_at'   => $date,
            'duration'       => $dur,
            'status'         => $status,
            'price'          => $price,
            'deposit'        => in_array($status, ['completed', 'confirmed', 'in_progress']) ? round($price * 0.3) : null,
            'deposit_paid'   => in_array($status, ['completed', 'in_progress']),
            'notes'          => $notes,
            'internal_notes' => $internal,
            'color'          => $s->color,
        ]);
    }
}
