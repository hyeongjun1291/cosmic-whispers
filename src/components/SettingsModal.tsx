'use client';

import { Modal, Button, Stack, Text, Checkbox } from '@mantine/core';

interface SettingsModalProps {
    opened: boolean;
    onClose: () => void;
    onReset: () => void;
}

export default function SettingsModal({ opened, onClose, onReset }: SettingsModalProps) {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="설정 ⚙️"
            centered
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    API 키는 .env.local 파일에서 관리됩니다.
                </Text>
                <Button onClick={onClose} fullWidth color="indigo">닫기</Button>

                <Checkbox
                    label="데이터 꼬임 방지 (초기화)"
                    description="앱이 이상하면 눌러주세요!"
                    color="red"
                    size="xs"
                    style={{ display: 'none' }}
                />
                <Text size="xs" c="dimmed" ta="center" mt="sm">
                    처음부터 다시 시작하고 싶으신가요? 🔄
                </Text>
                <Button onClick={onReset} fullWidth variant="light" color="red">
                    모든 기록 지우고 새로 시작하기
                </Button>
            </Stack>
        </Modal>
    );
}
