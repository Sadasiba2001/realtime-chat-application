import os
import sys
import environ
from pathlib import Path
from datetime import timedelta
from django.core.exceptions import ImproperlyConfigured
from corsheaders.defaults import default_headers, default_methods

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, True)
)
environ.Env.read_env(BASE_DIR / '.env')

from django.core.exceptions import ImproperlyConfigured

SECRET_KEY = env('SECRET_KEY', default=None)
DEBUG = env.bool('DEBUG', default=True)

if not SECRET_KEY:
    raise ImproperlyConfigured("The SECRET_KEY setting must not be empty. Set the SECRET_KEY environment variable.")

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[
    '*',
] if DEBUG else [
    'localhost', 
    '127.0.0.1', 
    '[::1]', 
    'sbchatwebpro.online',
    'www.sbchatwebpro.online',
    'footwork-vessel-guide.ngrok-free.dev',
])

FRONTEND_BASE_URL = env('FRONTEND_BASE_URL', default='https://sbchatwebpro.online' if not DEBUG else 'http://localhost:5173')


INSTALLED_APPS = [
    'daphne',
    'channels',
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'authentication_service',
    'email_service',
    'chatting_service',
    'voice_calling',
    'video_calling',
]

AUTH_USER_MODEL = 'authentication_service.User'


MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'authentication_service.middleware.request_size_middleware.RequestSizeLimitMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:5173", "http://127.0.0.1:5173"] if DEBUG else []
)
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True


CORS_ALLOW_HEADERS = list(default_headers) + [
    "ngrok-skip-browser-warning",
]

CORS_ALLOW_METHODS = list(default_methods)



ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'


REDIS_URL = env('REDIS_URL', default=None)

# The test runner must never read or write a real (possibly shared/production) Redis.
RUNNING_TESTS = len(sys.argv) > 1 and sys.argv[1] == 'test'

if REDIS_URL and not RUNNING_TESTS:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [{
                    'address': REDIS_URL,
                    'socket_timeout': None,
                    'socket_connect_timeout': 5,
                }],
            },
        },
    }
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
        }
    }
else:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }

# User presence (chatting_service/services/presence_service.py) lives in the default cache.
# - Redis (REDIS_URL): shared by all backend processes; required for multiple workers/servers.
# - LocMemCache (no REDIS_URL): process-local; presence is only accurate with a single local
#   Django process. It is not a distributed presence store.
# Do not point a local dev server at a Redis shared with another environment: presence
# (and the channel layer) would then mix users connected to that other environment.
# Each WebSocket connection expires PRESENCE_CONNECTION_TTL seconds after its last heartbeat.
PRESENCE_CONNECTION_TTL = env.int('PRESENCE_CONNECTION_TTL', default=90)
PRESENCE_HEARTBEAT_INTERVAL = env.int('PRESENCE_HEARTBEAT_INTERVAL', default=30)
if PRESENCE_HEARTBEAT_INTERVAL >= PRESENCE_CONNECTION_TTL:
    raise ImproperlyConfigured('PRESENCE_HEARTBEAT_INTERVAL must be shorter than PRESENCE_CONNECTION_TTL.')


if env('DB_HOST', default=None):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': env('DB_NAME', default='postgres'),
            'USER': env('DB_USER', default='postgres'),
            'PASSWORD': env('DB_PASSWORD', default=''),
            'HOST': env('DB_HOST', default='localhost'),
            'PORT': env('DB_PORT', default='5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]



LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


STATIC_URL = 'static/'


# Email Configuration (Django 6+ MAILERS)
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='SB Chat <no-reply@sbchatwebpro.online>')

_EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
_EMAIL_BACKEND = env(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.smtp.EmailBackend' if (_EMAIL_HOST_USER or not DEBUG) else 'django.core.mail.backends.console.EmailBackend'
)

MAILERS = {
    'default': {
        'BACKEND': _EMAIL_BACKEND,
        'OPTIONS': {
            'host': env('EMAIL_HOST', default='smtp.gmail.com'),
            'port': env.int('EMAIL_PORT', default=587),
            'username': _EMAIL_HOST_USER,
            'password': env('EMAIL_HOST_PASSWORD', default=''),
            'use_tls': env.bool('EMAIL_USE_TLS', default=True),
            'use_ssl': env.bool('EMAIL_USE_SSL', default=False),
            'timeout': env.int('EMAIL_TIMEOUT', default=10),
        },
    },
}



JWT_SECRET_KEY = env("JWT_SECRET_KEY", default=None)
if not JWT_SECRET_KEY:
    raise ImproperlyConfigured("The JWT_SECRET_KEY setting must not be empty. Set the JWT_SECRET_KEY environment variable.")

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'authentication_service.custom_auth.SafeJWTAuthentication',
    ),
    'EXCEPTION_HANDLER': 'authentication_service.utils.custom_exception_handler',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': env('THROTTLE_ANON_RATE', default='100/day'),
        'user': env('THROTTLE_USER_RATE', default='1000/day'),
        'login': env('THROTTLE_LOGIN_RATE', default='5/minute'),
        'register': env('THROTTLE_REGISTER_RATE', default='3/minute'),
        'refresh': env('THROTTLE_REFRESH_RATE', default='10/minute'),
        'search': env('THROTTLE_SEARCH_RATE', default='30/minute'),
        'history': env('THROTTLE_HISTORY_RATE', default='60/minute'),
        'password_reset': env('THROTTLE_PASSWORD_RESET_RATE', default='5/minute'),
        'verify_email': env('THROTTLE_VERIFY_EMAIL_RATE', default='10/minute'),
    }
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': JWT_SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',

    'JTI_CLAIM': 'jti',
}

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME = env('CLOUD_NAME', default='')
CLOUDINARY_API_KEY = env('API_KEY', default='')
CLOUDINARY_API_SECRET = env('API_SECRET', default='')
CLOUDINARY_URL = env('CLOUDINARY_URL', default='')

# Security Limits
MAX_MESSAGE_LENGTH = env.int("MAX_MESSAGE_LENGTH", default=1000)
MAX_WEBSOCKET_PAYLOAD_SIZE = env.int("MAX_WEBSOCKET_PAYLOAD_SIZE", default=65536) # 64 KB
MAX_REQUEST_SIZE = env.int("MAX_REQUEST_SIZE", default=5242880) # 5 MB

# WebRTC ICE Server Configuration (STUN / TURN)
WEBRTC_STUN_SERVER = env.list(
    "WEBRTC_STUN_SERVER",
    default=[
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun.cloudflare.com:3478",
    ],
)
WEBRTC_TURN_SERVER = env("WEBRTC_TURN_SERVER", default=None)
WEBRTC_TURN_USERNAME = env("WEBRTC_TURN_USERNAME", default=None)
WEBRTC_TURN_CREDENTIAL = env("WEBRTC_TURN_CREDENTIAL", default=None)


if not DEBUG:
    SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
    SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=True)
    CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=True)
    SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=31536000) # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=True)
    SECURE_HSTS_PRELOAD = env.bool("SECURE_HSTS_PRELOAD", default=True)
    SECURE_CONTENT_TYPE_NOSNIFF = env.bool("SECURE_CONTENT_TYPE_NOSNIFF", default=True)
    SECURE_REFERRER_POLICY = env("SECURE_REFERRER_POLICY", default="same-origin")
    X_FRAME_OPTIONS = "DENY"
else:
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    SECURE_HSTS_SECONDS = 0
    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_HSTS_PRELOAD = False
    SECURE_CONTENT_TYPE_NOSNIFF = False
    X_FRAME_OPTIONS = "SAMEORIGIN"


