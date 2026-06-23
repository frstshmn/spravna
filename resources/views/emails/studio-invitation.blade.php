<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <div style="background:#2d4a3e;padding:32px 40px 24px;text-align:center;">
        <div style="font-size:28px;margin-bottom:8px;">✦</div>
        <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-.3px;">Spravna</div>
    </div>
    <div style="padding:36px 40px;">
        <h1 style="margin:0 0 12px;font-size:20px;color:#1a1a1a;">Вас запрошено до студії</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
            Власник студії <strong style="color:#1a1a1a;">«{{ $member->studio->name }}»</strong> запрошує вас приєднатися як майстра.
            Після підтвердження ваш акаунт отримає план <strong>Studio</strong>.
        </p>
        <div style="text-align:center;margin:28px 0;">
            <a href="{{ url('/join/' . $member->invite_token) }}"
               style="display:inline-block;background:#2d4a3e;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;">
                Прийняти запрошення
            </a>
        </div>
        <p style="margin:0;font-size:12px;color:#999;text-align:center;line-height:1.7;">
            Якщо ви не очікували цього листа — просто проігноруйте його.<br>
            Посилання дійсне до тих пір, поки запрошення не буде прийнято або скасовано.
        </p>
    </div>
    <div style="background:#f9f9f7;padding:16px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#aaa;">Spravna — CRM для майстрів краси та арту</p>
    </div>
</div>
</body>
</html>
