from config.settings import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Never touch a real Redis from tests (presence, rate limits and call state all use the cache).
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    },
}

# Outgoing email is captured in memory (Django's test runner also enforces this).
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
MAILERS = {'default': {'BACKEND': 'django.core.mail.backends.locmem.EmailBackend'}}

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]
