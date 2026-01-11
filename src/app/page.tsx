'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Box, Drawer, ActionIcon, Modal, Text, Group, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLayoutDashboard } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';

export default function Home() {
  const [userData, setUserData] = useState<any>(null); // Revert session check
  const [saju, setSaju] = useState<SajuData | null>(null);
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  // const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_GROQ_API_KEY || ''); // Not used on client anymore
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showTitle, setShowTitle] = useState(true); // Restored
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileInstance>(null);

  // Existing Modals & State
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  // Dashboard drawer is still used for mobile
  const [dashboardOpened, { toggle: toggleDashboard }] = useDisclosure(false);
  const [sajuModalOpened, { open: openSajuModal, close: closeSajuModal }] = useDisclosure(false);
  const [pendingCharacterId, setPendingCharacterId] = useState<string | null>(null);
  const [tarotModalOpened, { open: openTarotModal, close: closeTarotModal }] = useDisclosure(false);
  const [pungryuModalOpened, { open: openPungryuModal, close: closePungryuModal }] = useDisclosure(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);

  // New Alert/Confirm Modals
  const [changeCharModalOpened, { open: openChangeCharModal, close: closeChangeCharModal }] = useDisclosure(false);
  const [confirmModalOpened, { open: openConfirmModal, close: closeConfirmModal }] = useDisclosure(false);
  const [alertModalOpened, { open: openAlertModal, close: closeAlertModal }] = useDisclosure(false);

  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', action: () => { } });
  const [alertMessage, setAlertMessage] = useState('');
  const [emailOptIn, setEmailOptIn] = useState('');
  const [clearHistoryOnSwitch, setClearHistoryOnSwitch] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Removed apiKey local storage logic as it's server-side now

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

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "행운의 카드를 뽑았습니다. 해석해주세요.",
          characterId: charId,
          context: cardContext,
          history: [],
          turnstileToken // Send token
        })
      });

      if (res.status === 429) {
        setAlertMessage('하루 대화 가능 횟수(20회)를 초과했습니다. 내일 다시 와주세요!');
        openAlertModal();
        setHistory([{ role: 'model', text: "오늘의 인연은 여기까지인 것 같군요. 내일 다시 만나요.", emotion: 'default' }]);
        return;
      }

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Chat API Error: ${res.status} ${res.statusText}`, errText);
        throw new Error(`Chat API Error: ${res.status} - ${errText}`);
      }

      const response = await res.json();
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
    console.log('[Client] Sending message, token:', turnstileToken ? turnstileToken.substring(0, 20) + '...' : 'EMPTY');

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

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          characterId: characterId || 'cheongsan',
          context,
          history,
          turnstileToken // Send token
        })
      });

      if (res.status === 429) {
        setAlertMessage('하루 대화 가능 횟수(20회)를 초과했습니다. 내일 다시 와주세요!');
        openAlertModal();
        // Don't remove user message, but reply with limit message
        setHistory([...newHistory, { role: 'model', text: "오늘의 대화 에너지가 소진되었습니다. 내일 다시 만나요.", emotion: 'default' }]);
        return;
      }

      const response = await res.json();
      setHistory([...newHistory, { role: 'model', text: response.text, emotion: response.emotion }]);
    } catch (error) {
      console.error(error);
      setHistory([...newHistory, { role: 'model', text: "운명의 흐름에 일시적인 장애가 발생했군요.", emotion: 'frust' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    setConfirmConfig({
      title: '데이터 초기화',
      message: '정말로 모든 데이터를 삭제하고 처음으로 돌아가시겠습니까?',
      action: () => {
        localStorage.removeItem('cosmic_user');
        localStorage.removeItem('cosmic_history');
        localStorage.removeItem('cosmic_character');
        setUserData(null);
        setSaju(null);
        setHistory([]);
        setCharacterId(null);
        setSelectedCard(null);
        closeSettings();
        closeConfirmModal();
      }
    });
    openConfirmModal();
  };

  const handleChangeCharacterRequest = () => {
    openChangeCharModal();
  };

  const confirmChangeCharacter = () => {
    if (emailOptIn) {
      console.log(`[Email Opt-in] User opted in from Char Switch: ${emailOptIn}`);
      // In real app, post to API here
    }

    if (clearHistoryOnSwitch) {
      setHistory([]);
      localStorage.removeItem('cosmic_history');
      setSelectedCard(null);
    }
    setCharacterId(null);
    localStorage.removeItem('cosmic_character');
    closeChangeCharModal();
  };

  if (!isInitialized) return null;

  // Title Screen

  // Title Screen logic integrated into main return to ensure Turnstile is always mounted


  // If authenticated (implicit via Turnstile existence)
  // ... continue to Game flow


  // Dashboard Content Reuse
  const DashboardContent = (
    <>
      <Text size="xl" fw={700} c="gold" mb="md">{characterId === 'zion' ? "당신의 타로 카드" : "당신의 운명 원국"}</Text>
      {characterId === 'cheongsan' && (saju ? <SajuDashboard data={saju} /> : <Box p="md">사주 정보가 없습니다.</Box>)}
      {characterId === 'zion' && (selectedCard ? (
        <Box p="md" ta="center">
          <img
            src={selectedCard.image}
            alt={selectedCard.name}
            style={{
              width: '100%',
              maxHeight: '300px',
              objectFit: 'contain',
              borderRadius: '12px',
              marginBottom: '20px'
            }}
          />
          <Text size="xl" fw={700} c="gold">{selectedCard.name}</Text>
          <Text size="sm" mt="md">{selectedCard.meaning.split('/')[1]}</Text>
        </Box>
      ) : <Box p="md">선택된 카드가 없습니다.</Box>)}
    </>
  );

  return (
    <Box mih="100vh" style={{ position: 'relative' }}>
      <div className="starfield" />

      {/* Invisible Turnstile Widget - Always mounted to maintain token */}
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
        <Box style={{ position: 'fixed', bottom: 10, right: 10, zIndex: 9999, opacity: 0, pointerEvents: 'none' }}>
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onSuccess={(token: string) => {
              console.log('[Turnstile] Token received');
              setTurnstileToken(token);
            }}
            onExpire={() => {
              console.log('[Turnstile] Token expired, resetting...');
              turnstileRef.current?.reset();
            }}
            onError={(error) => {
              console.error('[Turnstile] Error:', error);
            }}
          />
        </Box>
      ) : null}

      {showTitle ? (
        <TitleScreen onEnter={() => setShowTitle(false)} />
      ) : (
        <>
          {/* Global Modals */}
          <Modal opened={alertModalOpened} onClose={closeAlertModal} title="알림" centered overlayProps={{ blur: 3 }} styles={{ content: { background: 'rgba(30, 35, 50, 0.95)', border: '1px solid gold' } }}>
            <Text mb="lg">{alertMessage}</Text>
            <Group justify="flex-end">
              <ActionIcon size="xl" color="gold" variant="filled" onClick={closeAlertModal}>확인</ActionIcon>
            </Group>
          </Modal>

          <Modal opened={confirmModalOpened} onClose={closeConfirmModal} title={confirmConfig.title} centered overlayProps={{ blur: 3 }} styles={{ content: { background: 'rgba(30, 35, 50, 0.95)', border: '1px solid gold' } }}>
            <Text mb="lg">{confirmConfig.message}</Text>
            <Group justify="flex-end">
              <ActionIcon color="gray" size="xl" variant="subtle" onClick={closeConfirmModal}>취소</ActionIcon>
              <ActionIcon color="red" size="xl" variant="filled" onClick={confirmConfig.action}>확인</ActionIcon>
            </Group>
          </Modal>

          <Modal opened={changeCharModalOpened} onClose={closeChangeCharModal} title="대화 상대 변경" centered overlayProps={{ blur: 3 }} styles={{ content: { background: 'rgba(30, 35, 50, 0.95)', border: '1px solid gold' } }}>
            <Stack gap="md">
              <Text>대화 상대를 변경하시겠습니까?</Text>
              <Stack gap="sm">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '8px' }}>
                  <input type="checkbox" checked={clearHistoryOnSwitch} onChange={(e) => setClearHistoryOnSwitch(e.target.checked)} />
                  <Text size="sm">기존 대화 내용 지우기</Text>
                </label>

                <Box pt="md" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <Text size="sm" mb={8} c="gold">정식 출시 알림 받기</Text>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={emailOptIn}
                    onChange={(e) => setEmailOptIn(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #444',
                      background: 'rgba(0,0,0,0.3)',
                      color: 'white'
                    }}
                  />
                </Box>
              </Stack>
              <Group justify="flex-end" mt="md">
                <ActionIcon color="gray" size="xl" variant="subtle" onClick={closeChangeCharModal}>취소</ActionIcon>
                <ActionIcon color="gold" size="xl" variant="filled" onClick={confirmChangeCharacter}>변경</ActionIcon>
              </Group>
            </Stack>
          </Modal>

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
                isTyping={isTyping}
                characterId={characterId}
                onSwitchToCharacter={(id) => {
                  if (id === characterId) return;
                  // Directly switch, handling prerequisites via existing handler logic if needed, 
                  // or just set ID if we assume prerequisites (like Saju) are global.
                  // Use handleCharacterSelect to be safe (it checks Saju/Tarot existence).
                  handleCharacterSelect(id);
                }}
                dashboard={DashboardContent}
              />

              {/* Mobile Only Dashboard Button and Drawer */}
              <Box hiddenFrom="sm">
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
                  {DashboardContent}
                </Drawer>
              </Box>

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
        </>
      )}
    </Box>
  );
}
