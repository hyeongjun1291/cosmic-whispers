'use client';

import { useState, useEffect, useRef } from 'react';
import { calculateSaju, SajuData, analyzeSaju } from '@/lib/saju';
import { generateCharacterResponse } from '@/lib/groq';
// Import I Ching Logic
import { castIChing, MeihuaResult } from '@/lib/iching';
// Import Shaman/Obanggi Logic
import { ShamanResult } from '@/lib/shaman';
import Onboarding from '@/components/Onboarding';
import SajuForm from '@/components/SajuForm';
import TarotCardSelection from '@/components/TarotCardSelection';
// import ObanggiSelection from '@/components/ObanggiSelection'; // [NEW] Hwari Engine - Removed
import { weighSoul, SoulWeight } from '@/lib/egypt'; // [NEW] Anu Engine
import PungryuGate from '@/components/PungryuGate';
import VisualNovel from '@/components/VisualNovel';
import SajuDashboard from '@/components/SajuDashboard';
import WesternChartDashboard from '@/components/WesternChartDashboard';
// Import I Ching Dashboard
import IChingDashboard from '@/components/IChingDashboard';
import AnuSoulScale, { AnuSoulScaleRef } from '@/components/AnuSoulScale'; // [NEW] Anu Engine
import HwariCheeringKit from '@/components/HwariCheeringKit'; // [NEW] Hwari Engine
import SettingsModal from '@/components/SettingsModal';
import CharacterSelection from '@/components/CharacterSelection';
// Removed Talisman Import
import TitleScreen from '@/components/TitleScreen';
import { saveEpisode, getRelevantEpisodes } from '@/lib/memory';
import { CHARACTERS } from '@/lib/characters';
import { Box, Drawer, ActionIcon, Modal, Text, Group, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLayoutDashboard, IconSettings } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { notifications as mantineNotifications } from '@mantine/notifications';

export default function Home() {
  const [userData, setUserData] = useState<any>(null);
  const [saju, setSaju] = useState<SajuData | null>(null);
  const [sajuInput, setSajuInput] = useState<any>(null); // New: Store raw input for Natal Chart
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [chatHistories, setChatHistories] = useState<Record<string, any[]>>({}); // Persist per character
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileInstance>(null);

  // Feature State: I Ching
  const [ichingResult, setIchingResult] = useState<MeihuaResult | null>(null);

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

    // USER REQUEST: Unconditionally ask for Name/DOB on refresh.
    // Therefore, we CLEAR all persisted data on mount.
    localStorage.removeItem('cosmic_user');
    localStorage.removeItem('cosmic_saju_input');
    localStorage.removeItem('cosmic_user');
    localStorage.removeItem('cosmic_saju_input');
    localStorage.removeItem('cosmic_history');
    localStorage.removeItem('cosmic_chat_histories');

    setUserData(null);
    setSajuInput(null);
    setHistory([]);

    // Always start at Title
    setCharacterId(null);
  }, []);

  const calculateAndSetSaju = (input: any) => {
    try {
      if (!input || !input.birthDate) return null;

      const date = new Date(input.birthDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      let hour = 12; // Default if unknown
      let minute = 0;
      let isTimeUnknown = false;

      if (input.birthTime === 'unknown') {
        isTimeUnknown = true;
      } else if (input.birthTime) {
        const parts = input.birthTime.split(':');
        if (parts.length === 2) {
          hour = parseInt(parts[0], 10);
          minute = parseInt(parts[1], 10);
        }
      }

      const isLunar = input.calendarType === 'lunar';
      const isLeap = input.isLeap === 'true';

      const sajuResult = calculateSaju(
        year,
        month,
        day,
        hour,
        minute,
        isLunar,
        isLeap,
        isTimeUnknown
      );

      return sajuResult;
    } catch (e) {
      console.error("Failed to calculate Saju:", e);
      return null;
    }
  };

  const handleOnboardingComplete = (data: { name: string, saju: any }) => {
    setUserData({ name: data.name });
    localStorage.setItem('cosmic_user', JSON.stringify({ name: data.name }));

    if (data.saju) {
      setSajuInput(data.saju);
      localStorage.setItem('cosmic_saju_input', JSON.stringify(data.saju));

      // Calculate and Set Saju State
      const calculated = calculateAndSetSaju(data.saju);
      console.log("Onboarding Saju Calculated:", calculated);
      setSaju(calculated);
    }
  };

  // ... (down to DashboardContent)

  const [dashboardOpened, { toggle: toggleDashboard }] = useDisclosure(false);
  // Optional: Settings modal state if needed, assuming user had it
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [notifications, setNotifications] = useState<Record<string, boolean>>({});

  // Modal States
  const [sajuModalOpened, { open: openSajuModal, close: closeSajuModal }] = useDisclosure(false);
  const [tarotModalOpened, { open: openTarotModal, close: closeTarotModal }] = useDisclosure(false);
  const [pungryuModalOpened, { open: openPungryuModal, close: closePungryuModal }] = useDisclosure(false);

  // State for specific features
  const [selectedCard, setSelectedCard] = useState<any>(null); // For Tarot
  const [tarotTopic, setTarotTopic] = useState<string>(''); // For Tarot Context
  // const [obanggiModalOpened, setObanggiModalOpened] = useState(false); // [NEW] Hwari - Removed
  const [obanggiResult, setObanggiResult] = useState<any>(null); // [NEW] Hwari
  const [soulResult, setSoulResult] = useState<SoulWeight | null>(null); // [NEW] Anu

  // Ref for Anu Scale
  const anuScaleRef = useRef<AnuSoulScaleRef>(null);

  // Feature Handlers
  const handleSajuComplete = (data: any) => {
    // Taeil's specific Saju update (re-calc or update existing)
    const calculated = calculateAndSetSaju(data);
    setSaju(calculated);
    setSajuInput(data); // Sync main input
    localStorage.setItem('cosmic_saju_input', JSON.stringify(data));
    closeSajuModal();
  };

  const handleTarotComplete = (card: any) => {
    setSelectedCard(card);
    closeTarotModal();

    // Trigger Tarot interpretation immediately
    // Simulate user asking about the card they just picked
    // Use a small timeout to allow modal to close smoothly
    // [USER REQUEST] Localize to Korean AND Include Topic Context
    setTimeout(() => {
      // If there's a specific topic/query from a chip, use it ONE-SHOT with the card context.
      // Otherwise, fall back to the generic "interpret this card" request.
      let fullMessage = `'${card.name}' 카드를 뽑았어. 이 카드가 내 상황에 어떤 의미가 있는지 해석해줘.`;

      if (tarotTopic) {
        // Combine query and card info naturally
        fullMessage = `"${tarotTopic}" (이 질문에 대해)\n\n'${card.name}' 카드를 뽑았어. 이 카드를 바탕으로 위 질문에 대한 운세를 해석해줘.`;
      }

      handleSendMessage(fullMessage);
      setTarotTopic(''); // Reset after sending
    }, 500);
  };

  // [NEW] Hwari Handler - Removed

  const handleHwajuEnter = () => {
    // Pungryu Hwaju logic
    closePungryuModal();
    // Maybe set some Pungryu specific state
  };

  // [NEW] Anu Handler
  const handleSoulReference = async (result: SoulWeight) => {
    setSoulResult(result);
    // Trigger Anu's reaction with HIDDEN context
    // We manually construct the history with a hidden user message
    const hiddenUserMsg = {
      role: 'user',
      text: `(내 영혼의 무게: ${result.mg}mg, 판정: ${result.verdict})\n\n${result.reaction}\n\n이 결과에 대해 어떻게 생각해?`,
      timestamp: new Date(),
      hidden: true // [NEW] Flag to hide from UI
    };

    const newHistory = [...history, hiddenUserMsg];
    // Don't update state with this immediately if we want to look seamless, 
    // BUT we need it in history for the API to see it.
    // The VisualNovel component will filter it out based on 'hidden: true'
    setHistory(newHistory);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: newHistory,
          characterId: 'anu',
          userName: userData?.name,
          soulResult: result, // Pass result explicitly just in case
          turnstileToken: turnstileToken
        })
      });

      const textBody = await res.text();
      let data;
      try { data = JSON.parse(textBody); } catch (e) { throw new Error(textBody); }

      if (!res.ok) throw new Error(data.error || 'Server Error');

      const aiMsg = {
        role: 'model',
        text: data.text,
        emotion: data.emotion,
        timestamp: new Date()
      };

      setHistory([...newHistory, aiMsg]);
      localStorage.setItem('cosmic_history', JSON.stringify([...newHistory, aiMsg]));

    } catch (e) {
      console.error(e);
      mantineNotifications.show({ title: '오류', message: '아누의 목소리를 듣지 못했습니다.', color: 'red' });
    } finally {
      setIsTyping(false);
    }
  };

  // [NEW] Hwari Cheering Handler
  const handleHwariCheer = async (result: ShamanResult) => {
    setObanggiResult(result);

    const hiddenUserMsg = {
      role: 'user',
      text: `[오방기 결과: ${result.flagName}]\n의미: ${result.meaning}\n\n화리야, 이 점괘를 아이돌 팬싸인회 느낌으로 해석해줘!`,
      timestamp: new Date(),
      hidden: true
    };

    const newHistory = [...history, hiddenUserMsg];
    setHistory(newHistory);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: newHistory,
          characterId: 'hwaju',
          userName: userData?.name,
          obanggiResult: result,
          turnstileToken: turnstileToken
        })
      });

      const textBody = await res.text();
      let data;
      try { data = JSON.parse(textBody); } catch (e) { throw new Error(textBody); }

      if (!res.ok) throw new Error(data.error || 'Server Error');

      const aiMsg = {
        role: 'model',
        text: data.text,
        emotion: data.emotion,
        thought: data.thought,
        timestamp: new Date()
      };

      setHistory([...newHistory, aiMsg]);
      localStorage.setItem('cosmic_history', JSON.stringify([...newHistory, aiMsg]));

    } catch (e) {
      console.error(e);
      mantineNotifications.show({ title: '오류', message: '화리의 응원을 받지 못했습니다.', color: 'red' });
    } finally {
      setIsTyping(false);
    }
  };

  // [NEW] Anu Quick Action Handler
  const handleAnuQuickAction = (text: string) => {
    // Auto-switch to Anu if not already (should be handled by UI context, but safe guard)
    if (characterId !== 'anu') setCharacterId('anu');

    // Call imperative handle
    setTimeout(() => {
      if (anuScaleRef.current) {
        anuScaleRef.current.autoWeigh(text);
      }
    }, 100);
  };

  // Helper for Tarot trigger from chips
  const handleDetailedTarotRequest = (topic: string) => {
    if (topic) setTarotTopic(topic);
    openTarotModal();
  };

  // Utility for Reset
  const handleReset = () => {
    localStorage.clear();
    location.reload();
  };

  // Missing Modals Logic (Saju/Tarot/Pungryu specific inputs)
  // Simplified for now to just allow entry. 

  const confirmChangeCharacter = () => {
    if (emailOptIn) {
      // Save email logic here
    }
    if (clearHistoryOnSwitch) {
      setHistory([]);
      localStorage.removeItem('cosmic_history');
    }
    setCharacterId(null);
    closeChangeCharModal();
  };

  const handleCharacterSelect = (id: string) => {
    // 1. Save Current History to State Map
    if (characterId) {
      setChatHistories(prev => ({
        ...prev,
        [characterId]: history
      }));
    }

    // 2. Load New History from State Map (if exists)
    // We access chatHistories directly. Note: In this render cycle, chatHistories[id] is clean because we assume we are switching to a DIFFERENT id.
    const savedHistory = chatHistories[id];

    if (savedHistory && savedHistory.length > 0) {
      setHistory(savedHistory);
      setCharacterId(id);
      // Skip greeting injection since we have history
      return;
    }

    // If no history, Initialize:
    setHistory([]);
    // localStorage.removeItem('cosmic_history'); // No longer needed as we manage in memory during session

    // 3. Inject New Character Greeting
    // @ts-ignore
    const char = CHARACTERS[id];
    if (char && id !== 'hwaju') {
      const greetingMsg = {
        role: 'model',
        text: char.greeting,
        emotion: 'default',
        timestamp: new Date()
      };
      setHistory([greetingMsg]);
    }

    // For Hwari, we can have greeting AND a modal.
    if (id === 'hwaju') {
      // Maybe inject greeting FIRST, then modal.
      const greetingMsg = {
        role: 'model',
        text: CHARACTERS['hwaju'].greeting,
        emotion: 'default',
        timestamp: new Date()
      };
      setHistory([greetingMsg]);
    }

    setCharacterId(id);

    // 3. Trigger Modals/Calculations if Data Missing or Feature Required
    // [USER REQUEST] Remove auto-trigger for Tarot. Only manual trigger via Chips.
    // if (id === 'claire' && !selectedCard) {
    //   setTimeout(() => openTarotModal(), 500);
    // }

    // I Ching for Ryungi
    if (id === 'hyeonryeong') {
      const result = castIChing();
      setIchingResult(result);
      // Ryungi logic is auto-calculated time-based, so just setting state is enough.
      // The API will pick it up on next message.
    }

    // [NEW] Obanggi for Hwari (Manual Trigger) - Removed auto trigger

    // [NEW] Soul Weighing for Anu (Auto Trigger) - REMOVED Auto Trigger (Handled in Component)
    if (id === 'anu') {
      // Just clear result, let component handle interaction
      setSoulResult(null);
    }
  };

  const handleSendMessage = async (input: string) => {
    if (!input.trim() || isTyping) return;

    // Optimistic update
    const userMsg = { role: 'user', text: input, timestamp: new Date() };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: newHistory,
          characterId,
          userName: userData?.name,
          saju: saju, // Keep saju for Taei
          sajuInput: sajuInput,
          ichingResult: characterId === 'hyeonryeong' ? ichingResult : null, // [NEW] Pass Ryungi Data
          obanggiResult: characterId === 'hwaju' ? obanggiResult : null,    // [NEW] Pass Hwari Data
          soulResult: characterId === 'anu' ? soulResult : null,             // [NEW] Pass Anu Data
          turnstileToken: turnstileToken // Fix: Pass token for validation
        })
      });

      const textBody = await res.text();
      let data;
      try {
        data = JSON.parse(textBody);
      } catch (err) {
        console.error("Non-JSON API Response:", textBody);
        throw new Error(`Server Error (${res.status}): ${textBody.slice(0, 100)}...`);
      }

      if (!res.ok) {
        console.error(`Server API Error (${res.status}):`, data);
        // Handle specific Groq errors
        if (data.details?.includes("GROQ_QUOTA")) {
          throw new Error("⚠️ AI 이용량이 초과되었습니다. (내일 다시 시도해주세요)");
        }
        // Show actual server detail for debugging
        throw new Error(data.details || data.error || `Server Error ${res.status}`);
      }

      const aiMsg = {
        role: 'model', // Fixed: was 'assistant'
        text: data.text, // Fixed: was 'content'
        emotion: data.emotion,
        thought: data.thought,
        timestamp: new Date()
      };

      const finalHistory = [...newHistory, aiMsg];
      setHistory(finalHistory);
      localStorage.setItem('cosmic_history', JSON.stringify(finalHistory));

    } catch (e) {
      console.error(e);
      mantineNotifications.show({
        title: '오류',
        message: '메시지 전송 실패',
        color: 'red'
      });
    } finally {
      setIsTyping(false);
    }
  };

  // Dashboard Content Reuse
  const DashboardContent = (
    <>
      <Text size="xl" fw={700} c="gold" mb="md">
        {characterId === 'claire' ? "나의 타로 카드" :
          characterId === 'selene' ? "나의 천궁도" :
            characterId === 'hyeonryeong' ? "매화역수 괘상" : // Title for Ryungi
              "나의 사주 분석표"}
      </Text>

      {/* Saju Dashboard (Default: Taeil ONLY) */}
      {characterId === 'taeil' && (
        saju ? <SajuDashboard data={saju} /> : <Box p="md">사주 정보가 없습니다.</Box>
      )}

      {/* Hwari Cheering Kit */}
      {characterId === 'hwaju' && (
        <HwariCheeringKit
          userName={userData?.name || 'User'}
          existingResult={obanggiResult}
          onCheer={handleHwariCheer}
        />
      )}

      {/* I Ching Dashboard (Ryungi) */}
      {characterId === 'hyeonryeong' && (
        ichingResult ? <IChingDashboard data={ichingResult} /> : <Box p="md">괘상을 뽑는 중...</Box>
      )}

      {/* Western Chart (Selene) */}
      {characterId === 'selene' && (
        sajuInput?.birthDate ? <WesternChartDashboard birthDate={sajuInput.birthDate} /> : <Box p="md" c="dimmed">운명 데이터(생년월일)가 필요합니다.</Box>
      )}

      {/* Anu Soul Scale */}
      {characterId === 'anu' && (
        <AnuSoulScale
          ref={anuScaleRef}
          userName={userData?.name || 'User'}
          onReference={handleSoulReference}
        />
      )}

      {/* Tarot Card (Claire) */}
      {characterId === 'claire' && (selectedCard ? (
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
      ) : <Box p="md" c="dimmed">아직 카드를 뽑지 않았습니다.</Box>)}
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

      {/* Global Settings Button - Always visible if not in Title/Onboarding for now */}
      {!showTitle && (
        <ActionIcon
          variant="transparent"
          color="gray"
          size="lg"
          pos="absolute"
          top={20}
          right={20}
          style={{ zIndex: 1000 }}
          onClick={openSettings}
        >
          <IconSettings />
        </ActionIcon>
      )}

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

          <Modal opened={changeCharModalOpened} onClose={closeChangeCharModal} title="친구 목록으로 가기" centered overlayProps={{ blur: 3 }} styles={{ content: { background: 'rgba(30, 35, 50, 0.95)', border: '1px solid gold' } }}>
            <Stack gap="md">
              <Text>다른 친구와 이야기를 나눠볼까요? 😊</Text>
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
            <CharacterSelection onSelect={handleCharacterSelect} notifications={notifications} />
          ) : (
            <>
              <VisualNovel
                userName={userData?.name || 'User'}
                history={history}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
                characterId={characterId}
                onSwitchToCharacter={handleCharacterSelect}
                dashboard={DashboardContent}
                notifications={notifications}
                onTriggerTarot={(topic) => {
                  if (topic) setTarotTopic(topic);
                  openTarotModal();
                }}
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
                  title={characterId === 'claire' ? "나의 타로 카드" : "나의 사주 분석표"}
                  position="left"
                  size="md"
                  styles={{ content: { background: 'var(--background)', color: 'white' } }}
                >
                  {/* Character Navigation - Mobile Dashboard */}
                  <Box mb="lg" pb="md" style={{ borderBottom: '1px solid rgba(255, 215, 0, 0.2)' }}>
                    <Text size="sm" c="dimmed" mb="sm">친구 선택</Text>
                    <Stack gap="sm">
                      {Object.values(CHARACTERS).map((char) => {
                        return (
                          <Box
                            key={char.id}
                            onClick={() => {
                              handleCharacterSelect(char.id);
                              toggleDashboard();
                            }}
                            style={{
                              cursor: 'pointer',
                              background: characterId === char.id
                                ? 'rgba(255, 215, 0, 0.15)'
                                : 'rgba(255, 255, 255, 0.03)',
                              borderRadius: '8px',
                              border: characterId === char.id
                                ? '1px solid rgba(255, 215, 0, 0.5)'
                                : '1px solid rgba(255, 255, 255, 0.05)',
                              transition: 'all 0.2s ease',
                              padding: '12px'
                            }}
                          >
                            <Group gap="md" wrap="nowrap">
                              <Box
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  overflow: 'hidden',
                                  flexShrink: 0
                                }}
                              >
                                <img
                                  src={`/images/ui/nav_${char.id}.png`}
                                  alt={char.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.currentTarget.src = `/images/characters/${char.imageNumber}_default.jpg`;
                                  }}
                                />
                              </Box>
                              <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                <Text size="sm" fw={characterId === char.id ? 700 : 500} c={characterId === char.id ? 'gold' : 'white'}>
                                  {char.name}
                                </Text>
                                <Text size="xs" c="dimmed" truncate>{char.title}</Text>
                              </Stack>
                            </Group>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>

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
          <Modal
            opened={tarotModalOpened}
            onClose={closeTarotModal}
            fullScreen
            transitionProps={{ transition: 'slide-up', duration: 300 }}
            padding={0}
            styles={{
              root: { zIndex: 200 },
              body: { height: '100dvh', backgroundColor: '#1a1b1e' }
            }}
          >
            <TarotCardSelection onSelect={handleTarotComplete} onCancel={closeTarotModal} />
          </Modal>

          {/* [NEW] Obanggi Selection Modal for Hwari - Removed */}

          <Modal opened={pungryuModalOpened} onClose={closePungryuModal} fullScreen withCloseButton={false} styles={{ content: { background: '#000' } }}>
            <PungryuGate onEnter={handleHwajuEnter} onCancel={closePungryuModal} />
          </Modal>

        </>
      )}
    </Box>
  );
}
