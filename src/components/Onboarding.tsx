'use client';

import { useState } from 'react';
import { TextInput, Button, Stack, Title, Text, Box } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IconArrowRight } from '@tabler/icons-react';
import SajuForm from './SajuForm';

interface OnboardingProps {
    onComplete: (data: { name: string; saju: any }) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');

    const handleNameSubmit = () => {
        if (name) setStep(2);
    };

    const handleSajuComplete = (sajuData: any) => {
        onComplete({ name, saju: sajuData });
    };

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
                {step === 1 ? (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Stack gap="md">
                            <Title order={2} fw={300} c="gold">반가워요! 👋</Title>
                            <Text size="sm" c="dimmed">제가 불러드릴 이름을 알려주세요! 📝</Text>
                            <TextInput
                                placeholder="이름을 입력하세요"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                size="md"
                                variant="filled"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && name) handleNameSubmit();
                                }}
                            />
                            <Button
                                rightSection={<IconArrowRight size={16} />}
                                onClick={handleNameSubmit}
                                disabled={!name}
                                color="indigo"
                                fullWidth
                            >
                                다음으로
                            </Button>
                        </Stack>
                    </motion.div>
                ) : (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <SajuForm onComplete={handleSajuComplete} />
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
}
