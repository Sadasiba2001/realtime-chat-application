from django.test import TestCase
from video_calling.services import VideoCallStateService, VideoCallState


class VideoCallStateServiceTests(TestCase):
    def setUp(self):
        self.call_id = "test_video_call_202"
        self.caller_id = 10
        self.receiver_id = 20

    def test_create_video_call(self):
        call_data = VideoCallStateService.create_call(self.call_id, self.caller_id, self.receiver_id)
        self.assertIsNotNone(call_data)
        self.assertEqual(call_data["call_id"], self.call_id)
        self.assertEqual(call_data["state"], VideoCallState.CALLING)

    def test_end_video_call(self):
        VideoCallStateService.create_call(self.call_id, self.caller_id, self.receiver_id)
        ended = VideoCallStateService.end_call(self.call_id)
        self.assertEqual(ended["state"], VideoCallState.ENDED)
