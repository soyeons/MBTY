import React, { useEffect, useState } from "react";
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

export default function DiscussionPage() {
  const location = useLocation();
  const navigate = useNavigate(); // 홈 이동
  const { topic, personas, roles } = location.state || {};

  /* ---------- state ---------- */
  const defaultRoles = { pro: ["User"], con: [] };
  const safeRoles = roles || defaultRoles;

  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [currentRound, setCurrentRound] = useState(1);
  const [turnOrder, setTurnOrder] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [allRoundsMessages, setAllRoundsMessages] = useState([]);
  const [showEndModal, setShowEndModal] = useState(false); // ★ 종료 모달
  const [showVoteModal, setShowVoteModal] = useState(false); // 투표


  /* ---------- 유틸 ---------- */
  const removeQuotes = (text) =>
    !text ? text : text.replace(/['"]/g, "").trim();
  const userStance = safeRoles.pro.includes("User") ? "찬성" : "반대";

  /* ---------- 라운드 1 초기 메시지 ---------- */
  useEffect(() => {
    if (!topic || !personas) return;

    // 각 진영의 참가자 목록 설정 (유저 제외)
    const pros = safeRoles.pro.filter((p) => p !== "User");
    const cons = safeRoles.con.filter((p) => p !== "User");

    // 참가자 정보 로깅
    console.log("\n=== 참가자 정보 ===");
    console.log("찬성 진영:", safeRoles.pro);
    console.log("반대 진영:", safeRoles.con);
    console.log("찬성 진영 (유저 제외):", pros);
    console.log("반대 진영 (유저 제외):", cons);

    // 유저의 진영에 따라 첫 발언자 순서 결정
    // 유저는 항상 자신의 진영의 1번이 됨
    const firstSpeakers = userStance === "찬성" 
      ? ["User", cons[0]]  // 찬성1(유저) -> 반대1
      : [pros[0], "User"]; // 찬성1 -> 반대1(유저)

    console.log("\n=== 라운드 1 발언 순서 ===");
    console.log("찬성 진영:", userStance === "찬성" ? ["User", pros[0]] : [pros[0], pros[1]]);
    console.log("반대 진영:", userStance === "반대" ? ["User", cons[0]] : [cons[0], cons[1]]);
    console.log("첫 발언 순서:", firstSpeakers);

    setTurnOrder(firstSpeakers);

    // 라운드 2의 발언 순서 설정
    const round2Order = [
      safeRoles.pro[1],     // 찬성2
      safeRoles.con[1],     // 반대2
      safeRoles.pro[0],     // 찬성1
      safeRoles.con[0],     // 반대1
      safeRoles.pro[1],     // 찬성2
      safeRoles.con[1]      // 반대2
    ];

    // 순서 확인을 위한 로깅
    console.log("\n=== 라운드 2 발언 순서 ===");
    console.log("현재 참가자 정보:");
    console.log("- 찬성1:", safeRoles.pro[0]);
    console.log("- 찬성2:", safeRoles.pro[1]);
    console.log("- 반대1:", safeRoles.con[0]);
    console.log("- 반대2:", safeRoles.con[1]);
    
    console.log("\n전체 발언 순서:");
    round2Order.forEach((speaker, idx) => {
      const role = speaker === safeRoles.pro[0] ? "찬성1" :
                  speaker === safeRoles.pro[1] ? "찬성2" :
                  speaker === safeRoles.con[0] ? "반대1" : "반대2";
      console.log(`${idx + 1}. ${role}(${speaker})`);
    });

    // 라운드 2 시작 시 발언 순서 업데이트
    if (currentRound === 2) {
      setTurnOrder(round2Order);
    }

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
            `${stance} 입장에서 MBTI 성격을 반영하여 한두 문장 첫 발언하되, 당신의 MBTI를 언급하는 답변은 하지마`,
        };
        const reply = await callOpenAI([sys]);
        firstMsgs.push({
          sender: name,
          content: removeQuotes(reply.content),
          stance,
          mbti: name
        });
      }
      setAllRoundsMessages(firstMsgs);
    })();
  }, [topic, personas, safeRoles, currentRound]);

  /* ---------- 라운드 2·3 GPT 메시지 추가 ---------- */
  useEffect(() => {
    if ((currentRound === 2 || currentRound === 3) && currentTurn === 0) {
      (async () => {
        const newMsgs = await getMessages();
      })();
    }
  }, [currentRound, currentTurn]);

  /* ---------- 메시지 한 개씩 출력 ---------- */
  useEffect(() => {
    const maxTurns = { 1: 2, 2: 6, 3: 2 }; // 라운드 3는 2턴으로 수정

    console.log("\n=== 토론 진행 상황 ===");
    console.log(`현재 라운드: ${currentRound} (${roundLabels[currentRound]})`);
    console.log(`현재 턴: ${currentTurn + 1}/${maxTurns[currentRound]}`);

    /* ---- 종료 조건 ---- */
    if (currentRound === 3 && currentTurn === maxTurns[3]) {
      console.log("\n=== 토론 종료 ===");
      setIsUserTurn(false);
      setShowVoteModal(true);
      return;
    }

    const roundStartIdx = { 1: 0, 2: 2, 3: 8 }; // 라운드 3 시작 인덱스는 그대로 유지
    const idx = roundStartIdx[currentRound] + currentTurn;
    
    // 유저 차례인지 먼저 확인
    const isCurrentUserTurn = turnOrder[currentTurn] === "User";
    
    if (isCurrentUserTurn) {
      console.log("\n=== 유저 차례 ===");
      setIsUserTurn(true);
      return;
    }

    // 현재 발언자 확인
    const currentSpeaker = turnOrder[currentTurn];
    console.log(`\n=== ${currentSpeaker}의 발언 차례 ===`);

    const timer = setTimeout(async () => {
      if (!allRoundsMessages[idx]) return;

      const msg = allRoundsMessages[idx];
      if (msg.sender === "User") {
        console.log("\n=== 유저 차례 ===");
        setIsUserTurn(true);
        return;
      }

      setMessages((prev) => [...prev, msg]);
      advanceTurn(maxTurns);
    }, 2000);

    return () => clearTimeout(timer);
  }, [allRoundsMessages, currentTurn, currentRound, turnOrder]);

  const advanceTurn = (maxTurns) => {
    setCurrentTurn((prev) => prev + 1);
    if (currentRound === 1 && currentTurn === maxTurns[1] - 1) {
      console.log("\n=== 라운드 1 종료, 라운드 2 시작 ===");
      setCurrentRound(2);
      setCurrentTurn(0);
    } else if (currentRound === 2 && currentTurn === maxTurns[2] - 1) {
      console.log("\n=== 라운드 2 종료, 라운드 3 시작 ===");
      setCurrentRound(3);
      setCurrentTurn(0);
    }
  };

  /* ---------- 유저 전송 ---------- */
  const handleSend = () => {
    if (!userInput.trim()) return;
    const newMsg = { sender: "User", content: userInput, stance: userStance };

    setMessages((prev) => [...prev, newMsg]);
    setAllRoundsMessages((prev) => {
      const up = [...prev];
      up[currentTurn] = newMsg;
      return up;
    });

    setUserInput("");
    setIsUserTurn(false);
    advanceTurn({ 1: 2, 2: 6, 3: 2 }); // 라운드 3의 턴 수 수정
  };

  /* ---------- GPT 메시지 생성 ---------- */
  const getMessages = async () => {
    // 각 진영의 참가자 목록 설정 (유저 제외)
    const pros = safeRoles.pro.filter((p) => p !== "User");
    const cons = safeRoles.con.filter((p) => p !== "User");

    // 라운드 2의 발언 순서 설정
    const round2Order = [
      safeRoles.pro[1],     // 찬성2
      safeRoles.con[1],     // 반대2
      safeRoles.pro[0],     // 찬성1
      safeRoles.con[0],     // 반대1
      safeRoles.pro[1],     // 찬성2
      safeRoles.con[1]      // 반대2
    ];

    // 라운드 3의 발언 순서 설정 (찬성1과 반대1만)
    const round3Order = userStance === "찬성"
      ? ["User", safeRoles.con[0]]  // 찬성1(유저) -> 반대1
      : [pros[0], "User"];          // 찬성1 -> 반대1(유저)

    // 현재 라운드에 따른 발언 순서 결정
    const currentOrder = currentRound === 2 ? round2Order : 
                        currentRound === 3 ? round3Order : 
                        turnOrder;

    const messages = [];
    let accumulatedMessages = [...allRoundsMessages]; // 현재까지의 모든 메시지 복사
    
    // 라운드 2는 순차적으로 처리
    if (currentRound === 2) {
      for (let index = 0; index < currentOrder.length; index++) {
        const name = currentOrder[index];
        
        // 유저 차례인 경우 건너뛰기
        if (name === "User") {
          continue;
        }

        const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";
        
        // 현재까지의 모든 메시지를 컨텍스트로 사용
        const messageTexts = accumulatedMessages
          .filter(msg => msg && msg.content)
          .map(msg => `${msg.content}`);  // 발언자와 진영 정보 제거

        // 직전 발언자와 메시지 확인
        const previousSpeaker = index > 0 ? currentOrder[index - 1] : null;
        const previousMessage = previousSpeaker ? 
          accumulatedMessages[accumulatedMessages.length - 1] : null;

        console.log(`\n=== Round 2 Turn ${index + 1} ===`);
        console.log(`Current Speaker: ${name} (${stance})`);
        console.log(`Previous Speaker: ${previousSpeaker}`);
        console.log(`Previous Message:`, previousMessage);
        console.log(`Message History:`, messageTexts);

        const prompt =
          `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}".\n\n` +
          `지금까지의 토론 내용입니다:\n${messageTexts.join("\n")}\n\n` +
          `${stance} 입장에서, 마치 실제 사람이 대화하는 것처럼 자연스럽게 말해주세요. ` +
          `직전 발언자(${previousSpeaker})의 주장을 반드시 직접 인용("...")하여 언급한 후, 그에 대한 반박이나 새로운 관점을 제시해주세요. ` +
          `반드시 정확히 두 문장으로만 답변해주세요. ` +
          `첫 번째 문장에서는 직전 발언자의 주장을 인용하고 그에 대한 반박이나 새로운 관점을 제시하고, 두 번째 문장에서는 당신의 확장된 주장을 펼쳐주세요. ` +
          `세 문장 이상으로 답변하지 마세요. ` +
          `MBTI 성격을 말투에 반영하되 MBTI를 직접 언급하지는 마세요. ` +
          `반드시 존댓말을 사용하되, 너무 딱딱하거나 격식체로 말하지 말고 일상적인 대화처럼 자연스럽게 말해주세요.`;

        const reply = await callOpenAI([
          { role: "system", content: prompt },
          ...messageTexts.map(msg => ({
            role: "user",
            content: msg
          }))
        ]);

        if (!reply || !reply.content) {
          console.error('Invalid reply from OpenAI');
          return null;
        }

        const message = { 
          sender: name, 
          content: removeQuotes(reply.content), 
          stance,
          mbti: name
        };
        
        messages.push(message);
        // 현재 메시지를 누적 메시지 목록에 추가
        accumulatedMessages.push(message);
        // 상태 업데이트
        setAllRoundsMessages(accumulatedMessages);
        // 메시지를 즉시 화면에 표시
        setMessages(prev => [...prev, message]);
        // 턴 진행
        advanceTurn({ 1: 2, 2: 6, 3: 2 });
        
        // 각 턴 사이에 약간의 딜레이 추가
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      return messages;
    } else if (currentRound === 3) {
      // 라운드 3는 전체 토론 내용을 참고
      const messageTexts = allRoundsMessages
        .filter(msg => msg && msg.content)
        .map(msg => `${msg.content}`);

      for (const name of currentOrder) {
        const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";
        
        const prompt =
          `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}".\n\n` +
          `지금까지의 전체 토론 내용입니다:\n${messageTexts.join("\n")}\n\n` +
          `위의 모든 발언을 참고하여, ${stance} 입장에서 최종 변론을 해주세요. ` +
          `지금까지의 토론을 종합하여 가장 강력한 주장을 펼쳐주세요. ` +
          `반드시 두 문장 이내로만 명료하게 답변해주세요. ` +
          `MBTI 성격을 말투에 반영하되 MBTI를 직접 언급하지는 마세요. ` +
          `반드시 존댓말을 사용해주세요.`;

        const reply = await callOpenAI([
          { role: "system", content: prompt },
          ...messageTexts.map(msg => ({
            role: "user",
            content: msg
          }))
        ]);

        if (!reply || !reply.content) {
          console.error('Invalid reply from OpenAI');
          return null;
        }

        messages.push({ 
          sender: name, 
          content: removeQuotes(reply.content), 
          stance,
          mbti: name
        });
      }
      return messages;
    } else {
      // 라운드 1은 첫 발언만
      for (const name of currentOrder) {
        const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";
        
        const prompt =
          `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}". ` +
          `${stance} 입장에서 MBTI 성격을 반영하여 첫 발언해주세요. ` +
          `반드시 두 문장 이내로만 명료하게 답변해주세요. ` +
          `MBTI를 직접 언급하지는 마세요. ` +
          `반드시 존댓말을 사용해주세요.`;

        const reply = await callOpenAI([
          { role: "system", content: prompt }
        ]);

        if (!reply || !reply.content) {
          console.error('Invalid reply from OpenAI');
          return null;
        }

        messages.push({ 
          sender: name, 
          content: removeQuotes(reply.content), 
          stance,
          mbti: name
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
