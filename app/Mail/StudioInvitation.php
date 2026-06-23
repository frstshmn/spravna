<?php

namespace App\Mail;

use App\Models\StudioMember;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudioInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public StudioMember $member) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Запрошення до студії «' . $this->member->studio->name . '» — Spravna',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.studio-invitation');
    }
}
