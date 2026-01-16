import { useState } from 'react';
import { TextInput, Select, Button, Stack, Title, Text, Group, Box, Checkbox } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconSparkles } from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface SajuFormProps {
    onComplete: (data: any) => void;
    onCancel?: () => void;
}

export default function SajuForm({ onComplete, onCancel }: SajuFormProps) {
    const [formData, setFormData] = useState({
        birthDate: null as Date | null,
        birthTime: '',
        calendarType: 'solar',
        isLeap: 'false'
    });

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Stack gap="md">
                <Title order={3} fw={300} c="gold" ta="center">내 운세 알아보기 ✨</Title>
                <Text size="sm" c="dimmed" ta="center">정확한 분석을 위해 태어난 시간을 알려주세요!</Text>

                <DatePickerInput
                    label="생년월일"
                    placeholder="날짜 선택"
                    value={formData.birthDate}
                    onChange={(d) => setFormData({ ...formData, birthDate: d as Date | null })}
                    size="md"
                    valueFormat="YYYY년 MM월 DD일"
                    styles={{ input: { fontSize: '16px' } }} // Mobile friendly

                />

                <Group gap="xs" align="flex-end">
                    <TextInput
                        style={{ flex: 1 }}
                        label="태어난 시각 (HH:mm)"
                        placeholder="예: 14:30"
                        value={formData.birthTime === 'unknown' ? '' : formData.birthTime}
                        onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                        disabled={formData.birthTime === 'unknown'}
                        size="md"
                    />
                    <Checkbox
                        mb={12}
                        label="모름"
                        checked={formData.birthTime === 'unknown'}
                        onChange={(e) => setFormData({ ...formData, birthTime: e.currentTarget.checked ? 'unknown' : '' })}
                        styles={{ label: { whiteSpace: 'nowrap' } }}
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

                <Group pt="md">
                    {onCancel && (
                        <Button variant="default" onClick={onCancel} flex={1}>
                            취소
                        </Button>
                    )}
                    <Button
                        rightSection={<IconSparkles size={16} />}
                        onClick={() => onComplete(formData)}
                        disabled={!formData.birthDate || !formData.birthTime}
                        variant="filled"
                        color="indigo"
                        flex={2}
                    >
                        운세 시작하기
                    </Button>
                </Group>
            </Stack>
        </motion.div>
    );
}
