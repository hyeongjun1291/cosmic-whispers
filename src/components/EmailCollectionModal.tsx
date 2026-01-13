'use client';

import { useState } from 'react';
import { Modal, TextInput, Button, Group, Text, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

interface EmailCollectionModalProps {
    opened: boolean;
    onClose: () => void;
}

export default function EmailCollectionModal({ opened, onClose }: EmailCollectionModalProps) {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!email.includes('@')) return; // Basic validation

        try {
            // Call API to save email
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                console.error('Failed to save email');
                return;
            }

            setSubmitted(true);
            setTimeout(() => {
                setSubmitted(false);
                setEmail('');
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Email submission error:', error);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="출시 알림 받기" centered overlayProps={{ blur: 3 }} styles={{ content: { background: 'rgba(30, 35, 50, 0.95)', border: '1px solid gold' } }}>
            <Stack>
                {!submitted ? (
                    <>
                        <Text size="sm">정식 출시가 되면 가장 먼저 소식을 알려드릴게요.</Text>
                        <TextInput
                            placeholder="your@email.com"
                            data-autofocus
                            value={email}
                            onChange={(e) => setEmail(e.currentTarget.value)}
                        />
                        <Group justify="flex-end">
                            <Button variant="subtle" color="gray" onClick={onClose}>취소</Button>
                            <Button variant="filled" color="gold" onClick={handleSubmit}>신청하기</Button>
                        </Group>
                    </>
                ) : (
                    <Box py="xl" ta="center">
                        <Text size="lg" fw={700} c="gold" mb="md">감사합니다!</Text>
                        <Text size="sm">소중한 인연, 꼭 먼저 찾아뵙겠습니다.</Text>
                    </Box>
                )}
            </Stack>
        </Modal>
    );
}

// Helper Box import missing in snippet, adding it to imports in real usage or using div
import { Box } from '@mantine/core';
