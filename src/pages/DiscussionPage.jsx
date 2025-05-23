import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import Modal from "react-modal";

import { perplexity } from '@ai-sdk/perplexity';
import { streamText } from 'ai';

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

/* ---------- 모델 할당 ---------- */
const AVAILABLE_MODELS = ["sonar", "sonar-pro", "llama-3.3-70b-versatile"];

const assignModelsToSpeakers = (roles) => {
  const speakerModels = {};
  const availableModels = [...AVAILABLE_MODELS];
  
  // User를 제외한 모든 스피커에게 모델 할당
  [...roles.pro, ...roles.con].forEach(speaker => {
    if (speaker !== "User") {
      const randomIndex = Math.floor(Math.random() * availableModels.length);
      speakerModels[speaker] = availableModels[randomIndex];
      availableModels.splice(randomIndex, 1);
    }
  });

  console.log("Assigned models to speakers:", speakerModels);
  
  return speakerModels;
};

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

/* ---------- Perplexity 호출 ---------- */
async function callPerplexity(messages, model) {
  try {
    console.log("Messages being sent:", messages); // Debug log
    
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REACT_APP_PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages,
        stream: false,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Perplexity API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message;
  } catch (error) {
    console.error("Error calling Perplexity:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    throw error;
  }
}

/* ---------- Groq 호출 ---------- */
async function callGroq(messages, model) {
  try {
    console.log("Messages being sent to Groq:", messages);
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages,
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message;
  } catch (error) {
    console.error("Error calling Groq:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    throw error;
  }
}

/* ---------- 유틸 함수들 ---------- */
const createDebatePrompt = (topic, speaker, stance, currentRound) => {
  switch(currentRound) {
    case 1:
      return `"${topic}" 주제의 토론에 대해 ${stance} 입장으로 ${speaker} 성향을 말투에 반영하여 매우 간결한 한마디로 시작 발언하시오.`;
    case 2:
      return `직전 주장에 대해서 ${speaker} 성향을 말투에 반영하여 매우 간결한 한마디로 확실히 반박하시오.`;
    case 3:
      return `지금까지의 대화 흐름을 보고 ${stance} 입장으로 ${speaker} 성향을 말투에 반영하여 한마디로 최후변론을 해주시오.`;
    default:
      return "";
  }
};

const addMessage = (setMessages, sender, content, stance, mbti) => {
  setMessages(prev => [...prev, {
    sender,
    content,
    stance,
    mbti,
  }]);
};

const handleAIMessage = async (topic, speaker, stance, setMessages, roles, currentRound, speakerModels, messages) => {
  try {
    const prompt = createDebatePrompt(topic, speaker, stance, currentRound);
    
    // Convert messages to alternating user/assistant format
    const messageHistory = [];
    
    // Convert system message to user message
    messageHistory.push({
      role: "user",
      content: `당신은 ${speaker} MBTI 토론자입니다. 주제: "${topic}". ${stance} 입장에서 대화해주세요.`
    });

    if (currentRound === 1) {
      // Round 1: Just send the prompt
      messageHistory.push({ role: "assistant", content: "네, 이해했습니다." });
      messageHistory.push({ role: "user", content: prompt });
    } else {
      // Round 2, 3: Send last message and prompt
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        messageHistory.push({
          role: "assistant",
          content: lastMessage.content
        });
        messageHistory.push({
          role: "user",
          content: prompt
        });
      }
    }

    console.log("Final message history:", messageHistory);
    
    // Choose API based on model
    const model = speakerModels[speaker];
    const aiMessage = model.startsWith("llama") 
      ? await callGroq(messageHistory, model)
      : await callPerplexity(messageHistory, model);
    
    addMessage(
      setMessages,
      speaker,
      aiMessage.content,
      stance,
      speaker
    );
    return true;
  } catch (error) {
    console.error("Error calling AI:", error);
    addMessage(
      setMessages,
      speaker,
      "입론합니다.",
      stance,
      speaker
    );
    return false;
  }
};

/* ---------- 라운드별 핸들러 ---------- */
const handleRound1 = async (topic, roles, currentTurn, setMessages, setIsUserTurn, setCurrentTurn, setCurrentRound, speakerModels, messages) => {
  if (currentTurn === 0) {
    if (roles.pro.includes("User")) {
      setIsUserTurn(true);
    } else {
      await handleAIMessage(topic, roles.pro[0], "찬성", setMessages, roles, 1, speakerModels, messages);
      setCurrentTurn(prev => prev + 1);
    }
  } else {
    if (roles.pro.includes("User")) {
      await handleAIMessage(topic, roles.con[0], "반대", setMessages, roles, 1, speakerModels, messages);
      setCurrentRound(prev => prev + 1);
      setCurrentTurn(0);
    } else {
      setIsUserTurn(true);
    }
  }
};

const handleRound2 = async (topic, roles, currentTurn, setMessages, setIsUserTurn, setCurrentTurn, setCurrentRound, speakerModels, messages) => {
  if (currentTurn === 6) {
    setCurrentRound(3);
    setCurrentTurn(0);
    return;
  }

  const round2Order = [
    roles.pro[1], roles.con[1], roles.pro[0],
    roles.con[0], roles.pro[1], roles.con[1]
  ];

  const currentSpeaker = round2Order[currentTurn];
  if (currentSpeaker === "User") {
    setIsUserTurn(true);
    return;
  }

  const stance = roles.pro.includes(currentSpeaker) ? "찬성" : "반대";
  await handleAIMessage(topic, currentSpeaker, stance, setMessages, roles, 2, speakerModels, messages);
  setCurrentTurn(prev => prev + 1);
};

const handleRound3 = async (topic, roles, currentTurn, setMessages, setIsUserTurn, setCurrentTurn, setShowVoteModal, speakerModels, messages) => {
  if (currentTurn >= 2) {
    setShowVoteModal(true);
    return;
  }

  if (roles.pro.includes("User")) {
    if (currentTurn === 0) {
      setIsUserTurn(true);
    } else {
      await handleAIMessage(topic, roles.con[0], "반대", setMessages, roles, 3, speakerModels, messages);
      setCurrentTurn(prev => prev + 1);
    }
  } else {
    if (currentTurn === 0) {
      await handleAIMessage(topic, roles.pro[0], "찬성", setMessages, roles, 3, speakerModels, messages);
      setCurrentTurn(prev => prev + 1);
    } else {
      setIsUserTurn(true);
    }
  }
};

export default function DiscussionPage() {
  const location = useLocation();
  const navigate = useNavigate(); // 홈 이동
  const { topic, personas, roles } = location.state || {};

  /* ---------- state ---------- */

  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [currentRound, setCurrentRound] = useState(1);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [discussionHistory, setDiscussionHistory] = useState([]);
  const [speakerModels, setSpeakerModels] = useState({});
  /* ---------- 유틸 ---------- */
  useEffect(() => {
    if (!topic || !personas) return;

    // 모델 할당
    if (Object.keys(speakerModels).length === 0) {
      const assignedModels = assignModelsToSpeakers(roles);
      setSpeakerModels(assignedModels);
      return; // 모델 할당 후 바로 종료, 다음 렌더에서 진행
    }

    console.log(`currRound: ${currentRound}, currTurn: ${currentTurn}`);
    console.log(`토론 주제: ${topic}`);
    console.log(`전체 토론 참가자:`, roles);

    const handleRound = async () => {
      switch(currentRound) {
        case 1:
          await handleRound1(topic, roles, currentTurn, setMessages, setIsUserTurn, setCurrentTurn, setCurrentRound, speakerModels, messages);
          break;
        case 2:
          await handleRound2(topic, roles, currentTurn, setMessages, setIsUserTurn, setCurrentTurn, setCurrentRound, speakerModels, messages);
          break;
        case 3:
          await handleRound3(topic, roles, currentTurn, setMessages, setIsUserTurn, setCurrentTurn, setShowVoteModal, speakerModels, messages);
          break;
        default:
          break;
      }
    };

    handleRound();
  }, [topic, personas, roles, currentRound, currentTurn, speakerModels]);

  useEffect(() => {
    console.log("누적 메세지 ", messages);
  }, [messages]);

  const roundLabels = {
    1: "🗣️ 입론 : 나의 첫 주장을 펼쳐요",
    2: "🔄 반론 : 상대 의견에 반박해요",
    3: "🎯 최종 변론 : 내 입장을 정리해요",
  };

  const handleSend = () => {
    if (!userInput.trim()) return;

    switch(currentRound) {
      case 1:
        // 유저 입력에 대한 처리
        setMessages(prev => [...prev, {
          sender: "User",
          content: userInput,
          stance: currentTurn === 0 ? "찬성" : "반대",
          mbti: "User",
        }]);
        setUserInput("");
        setIsUserTurn(false);

        // 턴 처리
        if(currentTurn === 1) {
          // 입론은 턴이 두번밖에 없으니 바로 다음 라운드로 넘기기.
          console.log("입론 종료");
          setCurrentRound(prev => prev + 1);
          setCurrentTurn(0);
        }
        else {
          setCurrentTurn(prev => prev + 1);
        }
        break;
      case 2:
        // 유저 입력 처리
        setMessages(prev => [...prev, {
          sender: "User",
          content: userInput,
          stance: roles.pro.includes("User") ? "찬성" : "반대",
          mbti: "User",
        }]);
        setUserInput("");
        setIsUserTurn(false);
        setCurrentTurn(prev => prev + 1);
        break;
      case 3:
        setMessages(prev => [...prev, {
          sender: "User",
          content: userInput,
          stance: roles.pro.includes("User") ? "찬성" : "반대",
          mbti: "User",
        }]);
        setUserInput("");
        setIsUserTurn(false);
        setCurrentTurn(prev => prev + 1);
        break;
      default:
        break;
    }
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
        <InputArea>
          <TextInput
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="당신의 차례입니다. 논리정연하게 두 문장 이내로 발언해 주세요."
          />
          <SendButton onClick={handleSend}>전송</SendButton>
        </InputArea>
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
              setShowVoteModal(false); // ✅ 투표 모달 닫고
              setShowEndModal(true);  // ✅ 종료 모달 열기
            }}
            style={{
              padding: "10px 28px",
              background: "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 20,
              cursor: "pointer"
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
              cursor: "pointer"
            }}
          >
            반대
          </button>
        </div>
      </Modal>


      {/* ---------- 종료 모달 ---------- */}
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
        <h3 style={{ fontSize: 30, fontWeight: 800, color: "#000000", marginBottom: 10 }}>
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
              cursor: "pointer"
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
              cursor: "pointer"
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

const InputArea = styled.div`
  display: flex;
  gap: 20px;
  //margin: 30px;
  padding: 20px 30px;
`;

const TextInput = styled.input`
  flex: 1;
  padding: 8px;
  font-size: 16px;
`;

const SendButton = styled.button`
  padding: 8px 16px;
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
