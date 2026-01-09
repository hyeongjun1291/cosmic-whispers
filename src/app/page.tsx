'use client';

import { useState, useEffect } from 'react';
import { calculateSaju, SajuData } from '@/lib/saju';
import { generateCharacterResponse } from '@/lib/groq';
import Onboarding from '@/components/Onboarding';
import VisualNovel from '@/components/VisualNovel';
import SajuDashboard from '@/components/SajuDashboard';
import SettingsModal from '@/components/SettingsModal';
import CharacterSelection from '@/components/CharacterSelection';
import TitleScreen from '@/components/TitleScreen';
import { CHARACTERS } from '@/lib/characters';
import { Box, Drawer, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLayoutDashboard } from '@tabler/icons-react';
import dayjs from 'dayjs';

export default function Home() {
  const [userData, setUserData] = useState<any>(null);
  const [saju, setSaju] = useState<SajuData | null>(null);
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_GROQ_API_KEY || '');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showTitle, setShowTitle] = useState(true);

  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [dashboardOpened, { toggle: toggleDashboard }] = useDisclosure(false);

  useEffect(() => {
    // Load API Key only
    const savedKey = localStorage.getItem('cosmic_api_key');
    if (savedKey) setApiKey(savedKey);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (apiKey) localStorage.setItem('cosmic_api_key', apiKey);
  }, [apiKey]);

  const handleOnboardingComplete = (data: any) => {
    setUserData(data);
    const calculated = calculateSaju(
      dayjs(data.birthDate).year(),
      dayjs(data.birthDate).month() + 1,
      dayjs(data.birthDate).date(),
      (() => {
        const timeStr = data.birthTime.replace(':', '');
        let h = 0;
        if (timeStr.length === 4) h = parseInt(timeStr.substring(0, 2));
        else if (data.birthTime.includes(':')) h = parseInt(data.birthTime.split(':')[0]);
        else h = parseInt(data.birthTime);
        return isNaN(h) ? 0 : h;
      })(),
      data.calendarType === 'lunar',
      data.isLeap === 'true'
    );
    setSaju(calculated);
  };

  const handleCharacterSelect = (id: string) => {
    setCharacterId(id);
    const char = CHARACTERS[id];
    setHistory([{ role: 'model', text: char.greeting, emotion: 'default' }]);
  };

  const handleSendMessage = async (text: string) => {
    if (!apiKey) {
      alert('API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
      return;
    }

    const newHistory = [...history, { role: 'user', text }];
    setHistory(newHistory);
    setIsTyping(true);

    try {
      const sajuSummary = saju ? `${saju.year.ganji}년 ${saju.month.ganji}월 ${saju.day.ganji}일 ${saju.time.ganji}시생 (${saju.day.sibsin}격)` : '';
      const response = await generateCharacterResponse(apiKey, characterId || 'cheongsan', text, sajuSummary, history);
      // response is { text, emotion }
      setHistory([...newHistory, { role: 'model', text: response.text, emotion: response.emotion }]);
    } catch (error) {
      console.error(error);
      setHistory([...newHistory, { role: 'model', text: "운명의 흐름에 일시적인 장애가 발생했군요.", emotion: 'frust' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    if (confirm("정말로 모든 데이터를 삭제하고 처음으로 돌아가시겠습니까?")) {
      localStorage.removeItem('cosmic_user');
      localStorage.removeItem('cosmic_history');
      localStorage.removeItem('cosmic_character');
      setUserData(null);
      setSaju(null);
      setHistory([]);
      setCharacterId(null);
      closeSettings();
    }
  };

  const handleChangeCharacter = () => {
    if (confirm("대화 상대를 변경하시겠습니까?")) {
      if (confirm("기존 대화 내용을 지우고 새로 시작하시겠습니까? (취소 시 대화 유지)")) {
        setHistory([]);
        localStorage.removeItem('cosmic_history');
      }
      setCharacterId(null);
      localStorage.removeItem('cosmic_character');
    }
  }

  if (!isInitialized) return null;

  if (showTitle) {
    return (
      <Box mih="100vh" style={{ position: 'relative' }}>
        <div className="starfield" />
        <TitleScreen onEnter={() => setShowTitle(false)} />
      </Box>
    );
  }

  return (
    <Box mih="100vh" style={{ position: 'relative' }}>
      {!userData ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : !characterId ? (
        <CharacterSelection onSelect={handleCharacterSelect} />
      ) : (
        <>
          <VisualNovel
            userName={userData.name}
            history={history}
            onSendMessage={handleSendMessage}
            onOpenSettings={openSettings}
            isTyping={isTyping}
            characterId={characterId}
            onChangeCharacter={handleChangeCharacter}
          />

          <ActionIcon
            variant="filled"
            color="indigo"
            size="xl"
            onClick={toggleDashboard}
            style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, borderRadius: '50%' }}
          >
            <IconLayoutDashboard size={24} />
          </ActionIcon>

          <Drawer
            opened={dashboardOpened}
            onClose={toggleDashboard}
            title="당신의 운명 원국"
            position="left"
            size="md"
            styles={{ content: { background: 'var(--background)', color: 'white' } }}
          >
            {saju && <SajuDashboard data={saju} />}
          </Drawer>

          <SettingsModal
            opened={settingsOpened}
            onClose={closeSettings}
            onReset={handleReset}
          />
        </>
      )}
    </Box>
  );
}
