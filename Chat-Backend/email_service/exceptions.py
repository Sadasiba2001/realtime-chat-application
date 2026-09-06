class EmailDeliveryError(Exception):
    """
    Raised when an email delivery operation fails.
    Encapsulates SMTP/network errors cleanly without leaking sensitive credentials or raw tracebacks.
    """
    pass
