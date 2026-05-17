from __future__ import annotations

import html
import os
import re
import smtplib
import ssl
from email.message import EmailMessage
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
ENV_PATH = BASE_DIR / ".env"


def load_env_file(path: Path = ENV_PATH) -> None:
    try:
        from dotenv import load_dotenv  # type: ignore
    except Exception:
        load_dotenv = None

    if load_dotenv is not None:
        load_dotenv(path if path.exists() else None)
        return

    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "oui", "on"}


def strip_html(value: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    text = re.sub(r"</p\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return html.unescape(text).strip()


def render_email_html(message: str, context: dict[str, Any] | None = None, template_name: str = "email_notification.html") -> str:
    context = dict(context or {})
    template_path = TEMPLATES_DIR / template_name

    if template_path.exists():
        try:
            from jinja2 import Environment, FileSystemLoader, select_autoescape

            env = Environment(
                loader=FileSystemLoader(str(template_path.parent)),
                autoescape=select_autoescape(["html", "xml"]),
            )
            template = env.get_template(template_path.name)
            return template.render(message=message, **context)
        except Exception:
            # Fallback minimal si Jinja ne peut pas charger le template.
            pass

    safe_message = html.escape(message).replace("\n", "<br>")
    return f"""
    <!doctype html>
    <html lang="fr">
      <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:720px;margin:auto;padding:24px;">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:22px;">
            <h1 style="margin:0 0 12px;color:#ef4444;">Alerte critique</h1>
            <p style="line-height:1.6;">{safe_message}</p>
          </div>
        </div>
      </body>
    </html>
    """


def send_email_notification(
    message: str,
    recipient: str | None = None,
    subject: str | None = None,
    context: dict[str, Any] | None = None,
    template_name: str = "email_notification.html",
) -> dict[str, Any]:
    """Envoie une notification email HTML.

    Identifiants attendus dans dashboard/.env :
    - EMAIL_HOST ou SMTP_HOST
    - EMAIL_PORT ou SMTP_PORT
    - EMAIL_USERNAME ou SMTP_USERNAME
    - EMAIL_PASSWORD ou SMTP_PASSWORD
    - EMAIL_FROM, optionnel si EMAIL_USERNAME existe
    - EMAIL_ADMINISTRATOR, destinataire par défaut
    - EMAIL_USE_TLS=true ou EMAIL_USE_SSL=true

    La fonction reçoit au minimum message. Si recipient n'est pas donné, elle
    utilise EMAIL_ADMINISTRATOR.
    """
    load_env_file()

    recipient = recipient or os.getenv("EMAIL_ADMINISTRATOR")
    host = os.getenv("EMAIL_HOST") or os.getenv("SMTP_HOST")
    port_raw = os.getenv("EMAIL_PORT") or os.getenv("SMTP_PORT") or "587"
    username = os.getenv("EMAIL_USERNAME") or os.getenv("SMTP_USERNAME")
    password = os.getenv("EMAIL_PASSWORD") or os.getenv("SMTP_PASSWORD")
    sender = os.getenv("EMAIL_FROM") or username
    timeout = int(os.getenv("EMAIL_TIMEOUT", "12"))
    use_ssl = env_bool("EMAIL_USE_SSL", False)
    use_tls = env_bool("EMAIL_USE_TLS", True)

    if not recipient:
        raise RuntimeError("EMAIL_ADMINISTRATOR est manquant dans .env et aucun destinataire n'a été fourni.")
    if not host:
        raise RuntimeError("EMAIL_HOST ou SMTP_HOST est manquant dans .env.")
    if not sender:
        raise RuntimeError("EMAIL_FROM ou EMAIL_USERNAME est manquant dans .env.")

    try:
        port = int(port_raw)
    except ValueError as exc:
        raise RuntimeError("EMAIL_PORT doit être un nombre.") from exc

    html_body = render_email_html(message, context=context, template_name=template_name)
    text_body = strip_html(html_body) or message

    email = EmailMessage()
    email["Subject"] = subject or os.getenv("EMAIL_DEFAULT_SUBJECT", "Alerte qualité de l'air")
    email["From"] = sender
    email["To"] = recipient
    email.set_content(text_body)
    email.add_alternative(html_body, subtype="html")

    if use_ssl:
        smtp_context = ssl.create_default_context()
        with smtplib.SMTP_SSL(host, port, timeout=timeout, context=smtp_context) as smtp:
            if username and password:
                smtp.login(username, password)
            smtp.send_message(email)
    else:
        with smtplib.SMTP(host, port, timeout=timeout) as smtp:
            smtp.ehlo()
            if use_tls:
                smtp.starttls(context=ssl.create_default_context())
                smtp.ehlo()
            if username and password:
                smtp.login(username, password)
            smtp.send_message(email)

    return {
        "ok": True,
        "recipient": recipient,
        "subject": email["Subject"],
        "host": host,
        "port": port,
    }
