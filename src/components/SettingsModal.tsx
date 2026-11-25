'use client';

import { Modal, Button, Stack, Text } from '@mantine/core';

interface SettingsModalProps {
    opened: boolean;
    onClose: () => void;
    onReset: () => void;
    onChangeCharacter?: () => void;
}

export default function SettingsModal({ opened, onClose, onReset, onChangeCharacter }: SettingsModalProps) {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="시스템 설정"
            centered
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            <Stack gap="md">
                {onChangeCharacter && (
                    <Button onClick={onChangeCharacter} fullWidth variant="light" color="indigo">
                        대화 상대 변경
                    </Button>
                )}

                <Text size="xs" c="dimmed" ta="center" mt="sm">
                    데이터가 꼬였거나 처음부터 다시 시작하고 싶으신가요?
                </Text>
                <Button onClick={onReset} fullWidth variant="light" color="red">
                    모든 데이터 초기화 (처음부터 다시)
                </Button>
                <Button onClick={onClose} fullWidth variant="subtle" color="gray">닫기</Button>
            </Stack>
        </Modal>
    );
}
