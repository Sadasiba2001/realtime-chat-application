from django.conf import settings
from django.core.cache import cache
from django.core.management.base import BaseCommand, CommandError

# Keys written by the pre-2026 presence implementation. Nothing reads them any more.
LEGACY_KEY_PATTERNS = ("presence_conn_*", "presence_last_seen_*")


class Command(BaseCommand):
    help = "Deletes legacy presence counters (presence_conn_*, presence_last_seen_*) from the Redis cache."

    def add_arguments(self, parser):
        parser.add_argument("--delete", action="store_true", help="Actually delete (default is a dry run).")

    def handle(self, *args, **options):
        backend = settings.CACHES["default"]["BACKEND"]
        if not backend.endswith("RedisCache"):
            raise CommandError(f"Default cache is {backend}; legacy keys only matter in Redis.")

        client = cache._cache.get_client(write=True)
        found = []
        for pattern in LEGACY_KEY_PATTERNS:
            # Match exactly the keys Django generated for this pattern (key prefix + version).
            full_pattern = cache.make_key(pattern)
            found.extend(client.scan_iter(match=full_pattern, count=500))

        self.stdout.write(f"Found {len(found)} legacy presence key(s).")
        for key in found[:20]:
            self.stdout.write(f"  {key.decode() if isinstance(key, bytes) else key}")
        if not options["delete"]:
            self.stdout.write("Dry run. Re-run with --delete to remove them.")
            return
        for key in found:
            client.delete(key)
        self.stdout.write(self.style.SUCCESS(f"Deleted {len(found)} legacy presence key(s)."))
