'use client';

import { useState } from 'react';
import { TextInput, Button, Stack, Title, Text, Box } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IconArrowRight } from '@tabler/icons-react';
import { MAX_USER_NAME_LENGTH } from '@/lib/chat-contract';

interface OnboardingProps {
    onComplete: (data: { name: string }) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [name, setName] = useState('');

    return (
        <Box
            maw={400}
            mx="auto"
            mt={{ base: 40, sm: 100 }}
            p={{ base: 'md', sm: 'xl' }}
            className="dialogue-box"
            w={{ base: '95%', sm: 'auto' }}
        >
            <AnimatePresence mode="wait">
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <Stack gap="md">
                        <Title order={2} fw={300} c="gold">입문을 축하드립니다.</Title>
                        <Text size="sm" c="dimmed">먼저, 당신을 무엇이라 불러야 할지 알려주시겠습니까?</Text>
                        <TextInput
                            placeholder="이름을 입력하세요"
                            value={name}
                            maxLength={MAX_USER_NAME_LENGTH}
                            onChange={(e) => setName(e.target.value)}
                            size="md"
                            variant="filled"
                        />
                        <Button
                            rightSection={<IconArrowRight size={16} />}
                            onClick={() => onComplete({ name: name.trim() })}
                            disabled={!name.trim()}
                            color="indigo"
                        >
                            다음으로
                        </Button>
                    </Stack>
                </motion.div>
            </AnimatePresence>
        </Box>
    );
}
