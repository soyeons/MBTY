import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import Modal from "react-modal";

/* ---------- MBTI 프로필 이미지 ---------- */
import isfj from "../assets/ISFJ.png";
import entj from "../assets/ENTJ.png";
import istp from "../assets/ISTP.png";
import estj from "../assets/ESTJ.png";
import enfp from "../assets/ENFP.png";
import infj from "../assets/INFJ.png";
import estp from "../assets/ESTP.png";
import enfj from "../assets/ENFJ.png";
import istj from "../assets/ISTJ.png";
import intj from "../assets/INTJ.png";
import intp from "../assets/INTP.png";
import infp from "../assets/INFP.png";
import esfp from "../assets/ESFP.png";
import esfj from "../assets/ESFJ.png";
import isfp from "../assets/ISFP.png";
import entp from "../assets/ENTP.png";
import user from "../assets/user.png";

const allPersonasMap = {
  ISFJ: isfj,
  ENTJ: entj,
  ISTP: istp,
  ESTJ: estj,
  ENFP: enfp,
  INFJ: infj,
  ESTP: estp,
  ENFJ: enfj,
  ISTJ: istj,
  INTJ: intj,
  INTP: intp,
  INFP: infp,
  ESFP: esfp,
  ESFJ: esfj,
  ISFP: isfp,
  ENTP: entp,
  User: user,
};

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

/* ---------- OpenAI 호출 ---------- */
async function callOpenAI(messages) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages,
      max_tokens: 300,
    }),
  });
  const data = await res.json();
  return data.choices[0].message;
}

/* ---------- Whisper API 호출 ---------- */
const transcribeAudio = async (audioFile) => {
  const formData = new FormData();
  formData.append("file", audioFile);
  formData.append("model", "whisper-1");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    }
  );

  const data = await response.json();
  return data.text;
};

export default function DiscussionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { topic, personas, roles } = location.state || {};

  /* ---------- state ---------- */
  const defaultRoles = { pro: ["User"], con: [] };
  const safeRoles = roles || defaultRoles;

  const [messages, setMessages] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [turnOrder, setTurnOrder] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [allRoundsMessages, setAllRoundsMessages] = useState([]);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [isDiscussionActive, setIsDiscussionActive] = useState(true);
  const [round3OpponentMessage, setRound3OpponentMessage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  /* ---------- 유틸 ---------- */
  const removeQuotes = (text) =>
    !text ? text : text.replace(/['"]/g, "").trim();
  const userStance = safeRoles.pro.includes("User") ? "찬성" : "반대";

  /* ---------- 녹음 제어 ---------- */
  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = handleRecordingStop;
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (e) {
      console.error("녹음 시작 오류:", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRecordingStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const audioFile = new File([audioBlob], "recording.webm", {
      type: "audio/webm",
    });

    const text = await transcribeAudio(audioFile);
    if (text) handleSend(text);
  };

  /* ---------- 라운드 1 초기 메시지 ---------- */
  useEffect(() => {
    if (!topic || !personas) return;

    const pros = safeRoles.pro.filter((p) => p !== "User");
    const cons = safeRoles.con.filter((p) => p !== "User");

    const firstSpeakers =
      userStance === "찬성" ? ["User", cons[0]] : [pros[0], "User"];

    setTurnOrder(firstSpeakers);

    const round2Order = [
      safeRoles.pro[1],
      safeRoles.con[1],
      safeRoles.pro[0],
      safeRoles.con[0],
      safeRoles.pro[1],
      safeRoles.con[1],
    ];

    const round3Order =
      userStance === "찬성"
        ? ["User", safeRoles.con[0]]
        : [safeRoles.pro[0], "User"];

    if (currentRound === 2) setTurnOrder(round2Order);
    if (currentRound === 3) setTurnOrder(round3Order);

    (async () => {
      if (currentRound !== 1 || currentTurn !== 0) return;
      const firstMsgs = [];

      for (const name of firstSpeakers) {
        if (name === "User") {
          firstMsgs.push({ sender: "User", content: null, stance: userStance });
          continue;
        }
        const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";
        const sys = {
          role: "system",
          content:
            `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}". ` +
            `${stance} 입장에서 ${name} MBTI 성향을 말투에 반영하여 한두 문장 첫 발언하되, 당신의 MBTI를 직접적으로 언급하는 답변은 하지마세요`,
        };
        const reply = await callOpenAI([sys]);
        firstMsgs.push({
          sender: name,
          content: removeQuotes(reply.content),
          stance,
          mbti: name,
        });
      }
      setAllRoundsMessages(firstMsgs);
    })();
  }, [topic, personas, safeRoles, currentRound]);

  /* ---------- 라운드 2·3 GPT 메시지 추가 ---------- */
  useEffect(() => {
    if (currentRound === 2 && !isUserTurn && isDiscussionActive) {
      (async () => {
        const newMsgs = await getMessages();
        if (newMsgs && newMsgs.length > 0) {
          if (currentTurn === 5) {
            const lastMessage = allRoundsMessages[allRoundsMessages.length - 1];
            if (lastMessage && lastMessage.content === newMsgs[0].content) {
              setCurrentRound(3);
              setCurrentTurn(0);
              const opponentMsg = await generateRound3OpponentMessage();
              setRound3OpponentMessage(opponentMsg);
              if (userStance === "찬성") {
                setIsUserTurn(true);
              } else {
                if (opponentMsg) {
                  setMessages((prev) => [...prev, opponentMsg]);
                  setAllRoundsMessages((prev) => [...prev, opponentMsg]);
                }
                setIsUserTurn(true);
              }
              return;
            }
          }

          setAllRoundsMessages((prev) => [...prev, ...newMsgs]);
          setMessages((prev) => [...prev, ...newMsgs]);

          if (currentTurn < 5) {
            advanceTurn({ 1: 2, 2: 6, 3: 2 });
          } else if (currentTurn === 5) {
            setCurrentRound(3);
            setCurrentTurn(0);
            const opponentMsg = await generateRound3OpponentMessage();
            setRound3OpponentMessage(opponentMsg);
            if (userStance === "찬성") {
              setIsUserTurn(true);
            } else {
              if (opponentMsg) {
                setMessages((prev) => [...prev, opponentMsg]);
                setAllRoundsMessages((prev) => [...prev, opponentMsg]);
              }
              setIsUserTurn(true);
            }
          }
        }
      })();
    }
  }, [
    currentRound,
    currentTurn,
    isUserTurn,
    isDiscussionActive,
    userStance,
    allRoundsMessages,
  ]);

  /* ---------- 라운드 3 상대방 메시지 생성 함수 ---------- */
  const generateRound3OpponentMessage = async () => {
    const messageTexts = allRoundsMessages
      .filter((msg) => msg && msg.content)
      .map((msg) => `${msg.content}`);

    const opponentName =
      userStance === "찬성" ? safeRoles.con[0] : safeRoles.pro[0];
    const opponentStance = userStance === "찬성" ? "반대" : "찬성";

    const prompt =
      `당신은 ${opponentName} MBTI 토론자입니다. 주제: "${topic}".\n\n` +
      `지금까지의 전체 토론 내용입니다:\n${messageTexts.join("\n")}\n\n` +
      `위의 모든 발언을 참고하여, ${opponentStance} 입장에서 최종 변론을 해주세요. ` +
      `지금까지의 토론을 종합하여 가장 강력한 주장을 펼쳐주세요. ` +
      `반드시 두 문장 이내로만 명료하게 답변해주세요. ` +
      `${opponentStance} 입장에서 ${opponentName} MBTI 성향을 말투에 반영하여 성격을 말투에 반영하되 MBTI를 직접적으로 언급하지는 마세요. ` +
      `반드시 존댓말을 사용해주세요.`;

    const reply = await callOpenAI([
      { role: "system", content: prompt },
      ...messageTexts.map((msg) => ({
        role: "user",
        content: msg,
      })),
    ]);

    if (reply && reply.content) {
      return {
        sender: opponentName,
        content: removeQuotes(reply.content),
        stance: opponentStance,
        mbti: opponentName,
      };
    }
    return null;
  };

  /* ---------- 메시지 한 개씩 출력 ---------- */
  useEffect(() => {
    const maxTurns = { 1: 2, 2: 6, 3: 2 };

    if (!isDiscussionActive || currentRound === 3) return;

    const roundStartIdx = { 1: 0, 2: 2, 3: 8 };
    const idx = roundStartIdx[currentRound] + currentTurn;

    const pros = safeRoles.pro.filter((p) => p !== "User");
    const cons = safeRoles.con.filter((p) => p !== "User");

    const round2Order = [
      safeRoles.pro[1],
      safeRoles.con[1],
      safeRoles.pro[0],
      safeRoles.con[0],
      safeRoles.pro[1],
      safeRoles.con[1],
    ];

    const round3Order =
      userStance === "찬성" ? ["User", safeRoles.con[0]] : [pros[0], "User"];

    const currentOrder =
      currentRound === 2
        ? round2Order
        : currentRound === 3
        ? round3Order
        : turnOrder;

    const isCurrentUserTurn = currentOrder[currentTurn] === "User";

    if (isCurrentUserTurn) {
      setIsUserTurn(true);
      return;
    }

    const timer = setTimeout(async () => {
      if (!allRoundsMessages[idx]) return;

      const msg = allRoundsMessages[idx];
      if (msg.sender === "User") {
        setIsUserTurn(true);
        return;
      }

      const isDuplicate = messages.some(
        (m) =>
          m.sender === msg.sender &&
          m.content === msg.content &&
          m.stance === msg.stance
      );

      if (!isDuplicate) {
        setMessages((prev) => [...prev, msg]);
      }

      advanceTurn(maxTurns);
    }, 2000);

    return () => clearTimeout(timer);
  }, [
    allRoundsMessages,
    currentTurn,
    currentRound,
    turnOrder,
    safeRoles,
    userStance,
    isDiscussionActive,
    messages,
  ]);

  const advanceTurn = (maxTurns) => {
    setCurrentTurn((prev) => {
      const nextTurn = prev + 1;
      if (currentRound === 1 && nextTurn === maxTurns[1]) {
        setCurrentRound(2);
        return 0;
      } else if (currentRound === 2 && nextTurn === maxTurns[2]) {
        setCurrentRound(3);
        return 0;
      }
      return nextTurn;
    });
  };

  /* ---------- 유저 음성 입력 처리 ---------- */
  const handleSend = (text) => {
    if (!text.trim() || !isDiscussionActive) return;
    const newMsg = { sender: "User", content: text, stance: userStance };

    setMessages((prev) => [...prev, newMsg]);
    setAllRoundsMessages((prev) => {
      const up = [...prev];
      const roundStartIdx = { 1: 0, 2: 2, 3: 8 };
      const idx = roundStartIdx[currentRound] + currentTurn;
      up[idx] = newMsg;
      return up;
    });

    setIsUserTurn(false);

    if (currentRound === 3) {
      if (userStance === "찬성" && round3OpponentMessage) {
        setMessages((prev) => [...prev, round3OpponentMessage]);
        setAllRoundsMessages((prev) => [...prev, round3OpponentMessage]);
      }
      setShowVoteModal(true);
      setIsDiscussionActive(false);
    } else {
      advanceTurn({ 1: 2, 2: 6, 3: 2 });
    }
  };

  /* ---------- GPT 메시지 생성 ---------- */
  const getMessages = async () => {
    if (currentRound === 3) return [];

    const pros = safeRoles.pro.filter((p) => p !== "User");
    const cons = safeRoles.con.filter((p) => p !== "User");

    const round2Order = [
      safeRoles.pro[1],
      safeRoles.con[1],
      safeRoles.pro[0],
      safeRoles.con[0],
      safeRoles.pro[1],
      safeRoles.con[1],
    ];

    const round3Order =
      userStance === "찬성" ? ["User", safeRoles.con[0]] : [pros[0], "User"];

    const currentOrder =
      currentRound === 2
        ? round2Order
        : currentRound === 3
        ? round3Order
        : turnOrder;

    const currentSpeaker = currentOrder[currentTurn];
    if (currentSpeaker === "User") {
      setIsUserTurn(true);
      return [];
    }

    const messages = [];
    let accumulatedMessages = [...allRoundsMessages];

    if (currentRound === 2) {
      const name = currentOrder[currentTurn];
      const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";

      const messageHistory = accumulatedMessages
        .filter((msg) => msg && msg.content)
        .map((msg) => ({
          role: "user",
          content: msg.content,
        }));

      const previousSpeaker =
        currentTurn > 0 ? currentOrder[currentTurn - 1] : null;
      const previousMessage = previousSpeaker
        ? accumulatedMessages[accumulatedMessages.length - 1]
        : null;

      const prompt =
        `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}".\n\n` +
        `직전 발언자(${previousSpeaker})의 메시지:\n` +
        `${previousMessage ? previousMessage.content : "첫 발언"}\n\n` +
        `${stance} 입장에서 대화해주세요. ` +
        `실제 사람이 대화하는 것처럼 자연스럽게 말해주세요.\n\n` +
        `답변은 두 문장으로 해주세요:\n` +
        `1. 첫 문장에서는 직전 발언자의 주장에 대한 반응을 보여주세요. ` +
        `2. 두 번째 문장에서는 ${stance} 입장의 핵심 주장을 펼쳐주세요.\n\n` +
        `주의사항:\n` +
        `- 실제 사람이 대화하는 것처럼 자연스럽게 말해주세요. ` +
        `- ${name} MBTI의 특성을 말투에 자연스럽게 반영해주세요.` +
        `- MBTI를 직접적으로 언급하지 말고, 대화체로만 말해주세요.` +
        `- 존댓말을 사용하되, 너무 격식적이지 않게 일상적인 대화체로 말해주세요.`;

      const reply = await callOpenAI([
        { role: "system", content: prompt },
        ...messageHistory,
      ]);

      if (!reply || !reply.content) return null;

      let content = removeQuotes(reply.content);
      try {
        const jsonMatch = content.match(/^\{.*\}$/s);
        if (jsonMatch) {
          const jsonContent = JSON.parse(jsonMatch[0]);
          if (jsonContent.content) content = jsonContent.content;
        }
      } catch (e) {
        console.log("응답이 JSON 형식이 아닙니다:", content);
      }

      content = content.replace(/^[^(]+\([^)]+\):\s*/g, "");

      const message = {
        sender: name,
        content: content,
        stance,
        mbti: name,
      };

      messages.push(message);
      return messages;
    } else {
      for (const name of currentOrder) {
        const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";

        const prompt =
          `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}". ` +
          `${stance} 입장에서 ${name} MBTI 성향을 말투에 반영하여 첫 발언해주세요. ` +
          `반드시 두 문장 이내로만 명료하게 답변해주세요. ` +
          `MBTI를 직접 언급하지는 마세요. ` +
          `반드시 존댓말을 사용해주세요.`;

        const reply = await callOpenAI([{ role: "system", content: prompt }]);

        if (!reply || !reply.content) return null;

        messages.push({
          sender: name,
          content: removeQuotes(reply.content),
          stance,
          mbti: name,
        });
      }
      return messages;
    }
  };

  const roundLabels = {
    1: "🗣️ 입론 : 나의 첫 주장을 펼쳐요",
    2: "🔄 반론 : 상대 의견에 반박해요",
    3: "🎯 최종 변론 : 내 입장을 정리해요",
  };

  /* ---------- 렌더 ---------- */
  return (
    <PageContainer>
      <Header>📢 토론 주제: "{topic}"</Header>
      <RoundIndicator>{roundLabels[currentRound]}</RoundIndicator>

      <ChatArea>
        {messages.map((m, i) => (
          <Message key={i} isUser={m.sender === "User"} {...m} />
        ))}
      </ChatArea>

      {isUserTurn && (
        <RecorderArea>
          <RecorderButton
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? "Stop 🔴" : "🎤 Speak"}
            \n{" "}
          </RecorderButton>
        </RecorderArea>
      )}

      <Modal
        isOpen={showVoteModal}
        onRequestClose={() => setShowVoteModal(false)}
        style={{
          content: {
            inset: "40% auto auto 50%",
            transform: "translate(-50%,-50%)",
            width: 500,
            borderRadius: 14,
            padding: "32px 40px",
            textAlign: "center",
          },
          overlay: { backgroundColor: "rgba(0,0,0,0.45)" },
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
          🗳️ 토론 이후, 입장 변화에 대해 투표해 주세요
        </h2>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button
            onClick={() => {
              setShowVoteModal(false);
              setShowEndModal(true);
            }}
            style={{
              padding: "10px 28px",
              background: "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            찬성
          </button>
          <button
            onClick={() => {
              setShowVoteModal(false);
              setShowEndModal(true);
            }}
            style={{
              padding: "10px 28px",
              background: "#f44336",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            반대
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showEndModal}
        onRequestClose={() => setShowEndModal(false)}
        style={{
          content: {
            inset: "40% auto auto 50%",
            transform: "translate(-50%,-50%)",
            width: 420,
            borderRadius: 14,
            padding: "32px 40px",
            textAlign: "center",
          },
          overlay: { backgroundColor: "rgba(0,0,0,0.45)" },
        }}
      >
        <h3
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: "#000000",
            marginBottom: 10,
          }}
        >
          🗳️ 투표 결과 🗳️
        </h3>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
          찬성 : 3표, 반대 : 1표
        </h2>
        <p style={{ marginBottom: 32, fontSize: 18 }}>
          새로운 토론을 시작하시겠습니까?
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 28px",
              background: "#6c63ff",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            예
          </button>
          <button
            onClick={() => setShowEndModal(false)}
            style={{
              padding: "10px 28px",
              background: "#e0e0e0",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            아니오
          </button>
        </div>
      </Modal>
    </PageContainer>
  );
}

/* ---------- 말풍선 + 프로필 ---------- */
const Message = ({ isUser, sender, content, stance, mbti }) => {
  const profileImg = allPersonasMap[mbti || sender] || user;
  return (
    <MessageContainer $isUser={isUser}>
      {!isUser && (
        <ProfileBox>
          <ProfileImg src={profileImg} alt={mbti || sender} />
          <MBTILabel>{mbti || sender}</MBTILabel>
        </ProfileBox>
      )}
      <Bubble $isUser={isUser}>
        <Text>{content}</Text>
        <StanceTag $isPro={stance === "찬성"}>{stance}</StanceTag>
      </Bubble>
    </MessageContainer>
  );
};

/* ---------- styled-components ---------- */
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const Header = styled.div`
  font-size: 40px;
  font-weight: 800;
  margin: 30px 0;
  color: #000000;
  background-color: #ffffff;
  display: flex;
  justify-content: center;
`;

const RoundIndicator = styled.div`
  font-size: 30px;
  font-weight: 700;
  padding-top: 20px;
  padding-bottom: 20px;
  color: #ffffff;
  background-color: #000000;
  display: flex;
  justify-content: center;
`;

const ChatArea = styled.div`
  flex: 1;
  background: #dfdfdf;
  overflow-y: auto;
  padding: 20px 30px;
`;

const RecorderArea = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px 30px;
`;

const RecorderButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  background: #6c63ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const MessageContainer = styled.div`
  display: flex;
  flex-direction: ${({ $isUser }) => ($isUser ? "row-reverse" : "row")};
  align-items: center;
  margin: 10px 30px;
`;

const ProfileBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const MBTILabel = styled.div`
  margin-top: 4px;
  font-size: 20px;
  font-weight: 800;
`;

const ProfileImg = styled.img`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  margin: 0 10px;
`;

const Bubble = styled.div`
  max-width: 50%;
  background: ${({ $isUser }) => ($isUser ? "#000" : "#f1f1f1")};
  color: ${({ $isUser }) => ($isUser ? "#fff" : "#000")};
  padding: 14px 20px;
  border-radius: 20px;
  font-size: 20px;
`;

const Text = styled.div`
  white-space: pre-line;
`;

const StanceTag = styled.div`
  font-size: 15px;
  margin-top: 6px;
  text-align: right;
  color: ${({ $isPro }) => ($isPro ? "#4caf50" : "#f44336")};
  font-weight: 800;
`;
