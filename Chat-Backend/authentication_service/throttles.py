from rest_framework.throttling import SimpleRateThrottle

class LoginRateThrottle(SimpleRateThrottle):
    scope = 'login'
    def get_cache_key(self, request, view):
        email = request.data.get('email', '') if hasattr(request, 'data') else ''
        ident = email.strip().lower() if email else self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }

class RegisterRateThrottle(SimpleRateThrottle):
    scope = 'register'
    def get_cache_key(self, request, view):
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request)
        }

class RefreshRateThrottle(SimpleRateThrottle):
    scope = 'refresh'
    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }

class SearchRateThrottle(SimpleRateThrottle):
    scope = 'search'
    def get_cache_key(self, request, view):
        ident = request.user.pk if request.user and request.user.is_authenticated else self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }

class HistoryRateThrottle(SimpleRateThrottle):
    scope = 'history'
    def get_cache_key(self, request, view):
        ident = request.user.pk if request.user and request.user.is_authenticated else self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }
