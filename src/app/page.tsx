'use client';

import { useState, useEffect } from 'react';
import { calculateSaju, SajuData } from '@/lib/saju';
import { generateCharacterResponse } from '@/lib/groq';
import Onboarding from '@/components/Onboarding';
import SajuForm from '@/components/SajuForm';
import TarotCardSelection from '@/components/TarotCardSelection';
import PungryuGate from '@/components/PungryuGate';
import VisualNovel from '@/components/VisualNovel';
import SajuDashboard from '@/components/SajuDashboard';
import SettingsModal from '@/components/SettingsModal';
import CharacterSelection from '@/components/CharacterSelection';
import TitleScreen from '@/components/TitleScreen';
import { CHARACTERS } from '@/lib/characters';
import { Box, Drawer, ActionIcon, Modal, Text } from '@mantine/core';
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
  const [sajuModalOpened, { open: openSajuModal, close: closeSajuModal }] = useDisclosure(false);
  const [pendingCharacterId, setPendingCharacterId] = useState<string | null>(null);
  const [tarotModalOpened, { open: openTarotModal, close: closeTarotModal }] = useDisclosure(false);
  const [pungryuModalOpened, { open: openPungryuModal, close: closePungryuModal }] = useDisclosure(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);

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
    // Do NOT calculate Saju yet. Just save name and proceed to selection.
  };

  const calculateAndSetSaju = (data: any) => {
    const calculated = calculateSaju(
      dayjs(data.birthDate).year(),
      dayjs(data.birthDate).month() + 1,
      dayjs(data.birthDate).date(),
      (() => {
        if (data.birthTime === 'unknown') return 12;
        const timeStr = data.birthTime.replace(':', '');
        let h = 0;
        if (timeStr.length === 4) h = parseInt(timeStr.substring(0, 2));
        else if (data.birthTime.includes(':')) h = parseInt(data.birthTime.split(':')[0]);
        else h = parseInt(data.birthTime);
        return isNaN(h) ? 0 : h;
      })(),
      (() => {
        if (data.birthTime === 'unknown') return 0;
        const timeStr = data.birthTime.replace(':', '');
        let m = 0;
        if (timeStr.length === 4) m = parseInt(timeStr.substring(2, 4));
        else if (data.birthTime.includes(':') && data.birthTime.split(':')[1]) m = parseInt(data.birthTime.split(':')[1]);
        return isNaN(m) ? 0 : m;
      })(),
      data.calendarType === 'lunar',
      data.isLeap === 'true'
    );
    setSaju(calculated);
    return calculated;
  };

  const handleSajuComplete = (data: any) => {
    const calculated = calculateAndSetSaju(data);
    setSaju(calculated);
    closeSajuModal();

    // Proceed to chat with pending character (Cheongsan)
    if (pendingCharacterId) {
      setCharacterId(pendingCharacterId);
      const char = CHARACTERS[pendingCharacterId];
      setHistory([{ role: 'model', text: char.greeting, emotion: 'default' }]);
      setPendingCharacterId(null);
    }
  };

  const handleTarotComplete = (card: any) => {
    setSelectedCard(card);
    closeTarotModal();

    if (pendingCharacterId) {
      setCharacterId(pendingCharacterId);
      // Initial greeting for Zion with Tarot context
      // We set a special greeting here usually, but the AI will generate the actual reading immediately.
      // Let's set a placeholder greeting and then immediately trigger the AI response?
      // Or we can manually set the history with a system instruction pretending to be the model's first message?
      // The prompt logic expects `sajuSummary`. We can pass `cardSummary` instead.

      // Let's make the user "send" a hidden system message or just start with an empty history 
      // and let the `useEffect` or `handleSendMessage` trigger?
      // No, usually chat starts with model greeting.
      // For Zion, we want his First Message to be the reading.

      // We'll set an initial history with a "Thinking..." state maybe?
      // Or just trigger a generation call right here.

      initializeZionChat(pendingCharacterId, card);
      setPendingCharacterId(null);
    }
  };

  const initializeZionChat = async (charId: string, card: any) => {
    setIsTyping(true);
    setHistory([]); // Clear history

    try {
      // Construct a special prompt for the first message
      const cardContext = `User drew the Tarot card: ${card.name}.\nMeaning: ${card.meaning}\n\nInterpret this card for the user as your first greeting.`;

      // We need to call generic API but with this context. 
      // `generateCharacterResponse` takes `sajuSummary`. We can hijack that parameter for Tarot context since Zion doesn't use Saju.
      const response = await generateCharacterResponse(apiKey, charId, "행운의 카드를 뽑았습니다. 해석해주세요.", cardContext, []);

      setHistory([{ role: 'model', text: response.text, emotion: response.emotion }]);
    } catch (e) {
      console.error(e);
      setHistory([{ role: 'model', text: "카드의 기운이 너무 강해 읽을 수가 없군요... 다시 시도해주세요.", emotion: 'default' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePungryuEnter = () => {
    closePungryuModal();
    if (pendingCharacterId) {
      setCharacterId(pendingCharacterId);
      const char = CHARACTERS[pendingCharacterId];
      setHistory([{ role: 'model', text: char.greeting, emotion: 'default' }]);
      setPendingCharacterId(null);
    }
  };

  const handleCharacterSelect = (id: string) => {
    if (id === 'cheongsan' && !saju) {
      setPendingCharacterId(id);
      openSajuModal();
    } else if (id === 'zion') {
      setPendingCharacterId(id);
      openTarotModal();
    } else if (id === 'pungryu') {
      setPendingCharacterId(id);
      openPungryuModal();
    } else {
      setCharacterId(id);
      const char = CHARACTERS[id];
      setHistory([{ role: 'model', text: char.greeting, emotion: 'default' }]);
    }
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
      // If character is Zion, use selected Card as context if available
      let context = '';
      if (characterId === 'cheongsan' && saju) {
        context = `${saju.year.ganji}년 ${saju.month.ganji}월 ${saju.day.ganji}일 ${userData?.birthTime === 'unknown' ? '생시 모름' : saju.time.ganji + '시생'} (${saju.day.sibsin}격)`;
      } else if (characterId === 'zion' && selectedCard) {
        context = `Selected Tarot Card: ${selectedCard.name}\nMeaning: ${selectedCard.meaning}`;
      }

      const response = await generateCharacterResponse(apiKey, characterId || 'cheongsan', text, context, history);
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
      setSelectedCard(null);
      closeSettings();
    }
  };

  const handleChangeCharacter = () => {
    if (confirm("대화 상대를 변경하시겠습니까?")) {
      if (confirm("기존 대화 내용을 지우고 새로 시작하시겠습니까? (취소 시 대화 유지)")) {
        setHistory([]);
        localStorage.removeItem('cosmic_history');
        setSelectedCard(null);
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
            title={characterId === 'zion' ? "당신의 타로 카드" : "당신의 운명 원국"}
            position="left"
            size="md"
            styles={{ content: { background: 'var(--background)', color: 'white' } }}
          >
            {characterId === 'cheongsan' && (saju ? <SajuDashboard data={saju} /> : <Box p="md">사주 정보가 없습니다.</Box>)}
            {characterId === 'zion' && (selectedCard ? (
              <Box p="md" ta="center">
                <img src={selectedCard.image} alt={selectedCard.name} style={{ width: '100%', borderRadius: '12px', marginBottom: '20px' }} />
                <Text size="xl" fw={700} c="gold">{selectedCard.name}</Text>
                <Text size="sm" mt="md">{selectedCard.meaning.split('/')[1]}</Text>
              </Box>
            ) : <Box p="md">선택된 카드가 없습니다.</Box>)}
          </Drawer>

          <SettingsModal
            opened={settingsOpened}
            onClose={closeSettings}
            onReset={handleReset}
          />
        </>
      )}

      <Modal opened={sajuModalOpened} onClose={closeSajuModal} title="운명 데이터 입력" centered overlayProps={{ blur: 3 }}>
        <SajuForm onComplete={handleSajuComplete} onCancel={closeSajuModal} />
      </Modal>

      <Modal opened={tarotModalOpened} onClose={closeTarotModal} fullScreen withCloseButton={false} styles={{ content: { background: 'rgba(0,0,0,0.9)' } }}>
        <TarotCardSelection onSelect={handleTarotComplete} onCancel={closeTarotModal} />
      </Modal>

      <Modal opened={pungryuModalOpened} onClose={closePungryuModal} fullScreen withCloseButton={false} styles={{ content: { background: '#000' } }}>
        <PungryuGate onEnter={handlePungryuEnter} onCancel={closePungryuModal} />
      </Modal>
    </Box>
  );
}
