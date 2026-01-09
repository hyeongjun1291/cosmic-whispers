'use client';

import { useState } from 'react';
import { TextInput, NumberInput, Select, Button, Stack, Title, Text, Group, Box } from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { motion, AnimatePresence } from 'framer-motion';
import { IconArrowRight, IconSparkles } from '@tabler/icons-react';

interface OnboardingProps {
    onComplete: (data: any) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        birthDate: null as Date | null,
        birthTime: '',
        gender: 'female',
        calendarType: 'solar',
        isLeap: 'false'
    });

    const nextStep = () => setStep(s => s + 1);

    const steps = [
        (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Stack gap="md">
                    <Title order={2} fw={300} c="gold">입문을 축하드립니다.</Title>
                    <Text size="sm" c="dimmed">먼저, 당신을 무엇이라 불러야 할지 알려주시겠습니까?</Text>
                    <TextInput
                        placeholder="이름을 입력하세요"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        size="md"
                        variant="filled"
                    />
                    <Button
                        rightSection={<IconArrowRight size={16} />}
                        onClick={nextStep}
                        disabled={!formData.name}
                        color="indigo"
                    >
                        다음으로
                    </Button>
                </Stack>
            </motion.div>
        ),
        (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Stack gap="md">
                    <Title order={2} fw={300} c="gold">운명의 바퀴를 맞춥니다.</Title>
                    <Text size="sm" c="dimmed">태어난 날짜와 시간을 정확히 기록해주십시오.</Text>
                    <Group grow>
                        <DateInput
                            label="생년월일"
                            placeholder="날짜 선택"
                            value={formData.birthDate}
                            onChange={(d: any) => setFormData({ ...formData, birthDate: d })}
                            size="md"
                        />
                        <TextInput
                            label="태어난 시각 (HH:mm)"
                            placeholder="예: 14:30"
                            value={formData.birthTime}
                            onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                            size="md"
                        />
                    </Group>
                    <Group grow>
                        <Select
                            label="달력 종류"
                            data={[
                                { value: 'solar', label: '양력' },
                                { value: 'lunar', label: '음력' }
                            ]}
                            value={formData.calendarType}
                            onChange={(v) => setFormData({ ...formData, calendarType: v || 'solar' })}
                        />
                        {formData.calendarType === 'lunar' && (
                            <Select
                                label="윤달 여부"
                                data={[
                                    { value: 'false', label: '평달' },
                                    { value: 'true', label: '윤달' }
                                ]}
                                value={formData.isLeap}
                                onChange={(v) => setFormData({ ...formData, isLeap: v || 'false' })}
                            />
                        )}
                    </Group>
                    <Button
                        rightSection={<IconSparkles size={16} />}
                        onClick={() => onComplete(formData)}
                        disabled={!formData.birthDate || !formData.birthTime}
                        variant="filled"
                        color="indigo"
                    >
                        운명 확인하기
                    </Button>
                </Stack>
            </motion.div>
        )
    ];

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
                {steps[step]}
            </AnimatePresence>
        </Box>
    );
}
