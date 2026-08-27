from django.test import TestCase
from voice_calling.services import CallStateService, CallState


class CallStateServiceTests(TestCase):
    def setUp(self):
        self.call_id = "test_voice_call_101"
        self.caller_id = 1
        self.receiver_id = 2

    def test_create_call(self):
        call_data = CallStateService.create_call(self.call_id, self.caller_id, self.receiver_id)
        self.assertIsNotNone(call_data)
        self.assertEqual(call_data["call_id"], self.call_id)
        self.assertEqual(call_data["state"], CallState.CALLING)

    def test_get_call_state(self):
        CallStateService.create_call(self.call_id, self.caller_id, self.receiver_id)
        fetched = CallStateService.get_call(self.call_id)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched["caller_id"], self.caller_id)

    def test_terminate_call(self):
        CallStateService.create_call(self.call_id, self.caller_id, self.receiver_id)
        terminated = CallStateService.terminate_call(self.call_id, CallState.ENDED)
        self.assertEqual(terminated["state"], CallState.ENDED)
