// import React, { useEffect, useState } from "react";
// import { useLocation } from "react-router-dom";
// import styled from "styled-components";

// // assets - MBTI 이미지
// import isfj from "../assets/ISFJ.png";
// import entj from "../assets/ENTJ.png";
// import istp from "../assets/ISTP.png";
// import estj from "../assets/ESTJ.png";
// import enfp from "../assets/ENFP.png";
// import infj from "../assets/INFJ.png";
// import estp from "../assets/ESTP.png";
// import enfj from "../assets/ENFJ.png";
// import istj from "../assets/ISTJ.png";
// import intj from "../assets/INTJ.png";
// import intp from "../assets/INTP.png";
// import infp from "../assets/INFP.png";
// import esfp from "../assets/ESFP.png";
// import esfj from "../assets/ESFJ.png";
// import isfp from "../assets/ISFP.png";
// import entp from "../assets/ENTP.png";
// import user from "../assets/user.png";

// const allPersonasMap = {
//   ISFJ: isfj,
//   ENTJ: entj,
//   ISTP: istp,
//   ESTJ: estj,
//   ENFP: enfp,
//   INFJ: infj,
//   ESTP: estp,
//   ENFJ: enfj,
//   ISTJ: istj,
//   INTJ: intj,
//   INTP: intp,
//   INFP: infp,
//   ESFP: esfp,
//   ESFJ: esfj,
//   ISFP: isfp,
//   ENTP: entp,
//   User: user,
// };

// const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

// async function callOpenAI(messages) {
//   const res = await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${OPENAI_API_KEY}`,
//     },
//     body: JSON.stringify({
//       model: "gpt-4",
//       messages,
//       max_tokens: 300,
//     }),
//   });
//   const data = await res.json();
//   return data.choices[0].message;
// }

// export default function DiscussionPage() {
//   const location = useLocation();
//   const { topic, personas, roles } = location.state || {};

//   // roles가 없을 경우 기본값 설정
//   const defaultRoles = {
//     pro: ["User"],
//     con: [],
//   };
//   const safeRoles = roles || defaultRoles;

//   const [messages, setMessages] = useState([]);
//   const [userInput, setUserInput] = useState("");
//   const [currentRound, setCurrentRound] = useState(1);
//   const [turnOrder, setTurnOrder] = useState([]);
//   const [currentTurn, setCurrentTurn] = useState(0);
//   const [isUserTurn, setIsUserTurn] = useState(false);
//   const [allRoundsMessages, setAllRoundsMessages] = useState([]);

//   // 따옴표 제거 함수
//   const removeQuotes = (text) => {
//     if (!text) return text;
//     return text.replace(/^["']|["']$/g, "").trim();
//   };

//   const userStance = safeRoles.pro.includes("User") ? "찬성" : "반대";

//   // 초기 메시지 생성 및 턴 순서 설정
//   useEffect(() => {
//     if (!topic || !personas) return;

//     const turnOrderTemp = [];

//     const pros = safeRoles.pro.filter((p) => p !== "User");
//     const cons = safeRoles.con.filter((p) => p !== "User");

//     turnOrderTemp[0] = pros[0];
//     turnOrderTemp[1] = cons[0];
//     turnOrderTemp[2] = userStance === "찬성" ? "User" : pros[1];
//     turnOrderTemp[3] = userStance === "반대" ? "User" : cons[1];

//     setTurnOrder(turnOrderTemp);

//     (async () => {
//       const tempMessages = [];

//       if (currentRound === 1 && currentTurn === 0) {
//         // 라운드 1: 첫 발언
//         for (const name of turnOrderTemp) {
//           if (name === "User") {
//             tempMessages.push({
//               sender: "User",
//               content: null,
//               stance: userStance,
//             });
//             continue;
//           }

//           console.log(`(round1) ${name} 발언 생성중`);

//           const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";
//           const systemMsg = {
//             role: "system",
//             content:
//               `당신은 ${name} MBTI를 가진 토론 참가자입니다. 주제: "${topic}". ` +
//               `${stance} 입장에서, MBTI 성격을 반영해 한두문장으로 첫 발언을 하세요.`,
//           };

//           const reply = await callOpenAI([systemMsg]);
//           tempMessages.push({
//             sender: name,
//             content: removeQuotes(reply.content),
//             stance,
//           });
//         }

//         setAllRoundsMessages(tempMessages);
//       }
//     })();
//   }, [topic, personas, safeRoles]);

//   // 라운드 변경 시 메시지 설정
//   useEffect(() => {
//     if ((currentRound === 2 || currentRound === 3) && currentTurn === 0) {
//       (async () => {
//         const newMessages = await getMessages();
//         setAllRoundsMessages((prevMessages) => [
//           ...prevMessages,
//           ...newMessages,
//         ]);
//       })();
//     }
//   }, [currentRound, currentTurn]);

//   // 하나씩 메시지를 보여주기 위한 효과
//   useEffect(() => {
//     console.log(
//       `(현재 라운드) ${currentRound} (현재 턴) ${currentTurn} / (누적 메시지) 아래 표시:`
//     );

//     // 라운드별 최대 턴 수 계산
//     const maxTurns = {
//       1: 4,
//       2: 8,
//       3: 12,
//     };

//     // 라운드 3의 마지막 턴이면 종료
//     // if(currentRound === 3 && currentTurn === maxTurns[3]) {
//     //   setIsUserTurn(false); // 더 이상의 유저 입력을 받지 않음
//     //   return;
//     // }
//     if (currentRound === 3 && currentTurn === 3) {
//       setIsUserTurn(false); // 더 이상의 유저 입력을 받지 않음
//       return;
//     }

//     console.log(allRoundsMessages);

//     // 현재 라운드의 시작 인덱스 계산
//     const roundStartIndex = {
//       1: 0,
//       2: 4,
//       3: 8,
//     };

//     const currentIndex = roundStartIndex[currentRound] + currentTurn;
//     if (
//       allRoundsMessages.length === 0 ||
//       currentIndex >= allRoundsMessages.length
//     )
//       return;

//     const msg = allRoundsMessages[currentIndex];
//     if (msg.sender === "User") {
//       setIsUserTurn(true);
//       return;
//     }

//     const timer = setTimeout(async () => {
//       try {
//         // 현재 턴의 메시지가 없으면 생성
//         if (!msg.content) {
//           const newMessages = await getMessages();
//           const newMsg = newMessages.find((m) => m.sender === msg.sender);
//           if (newMsg) {
//             setAllRoundsMessages((prev) => {
//               const updated = [...prev];
//               updated[currentIndex] = newMsg;
//               return updated;
//             });
//             setMessages((prev) => [...prev, newMsg]);
//           }
//         } else {
//           setMessages((prev) => [...prev, msg]);
//         }

//         setCurrentTurn((prev) => prev + 1);

//         // 라운드 전환 로직
//         if (currentRound === 1 && currentTurn === maxTurns[1] - 1) {
//           console.log("라운드 1 종료, 라운드 2로 전환");
//           setTimeout(() => {
//             setCurrentRound(2);
//             setCurrentTurn(0);
//           }, 0);
//         } else if (currentRound === 2 && currentTurn === 3) {
//           // 라운드 2는 4턴만 진행
//           console.log("라운드 2 종료, 라운드 3로 전환");
//           setTimeout(() => {
//             setCurrentRound(3);
//             setCurrentTurn(0);
//           }, 0);
//         }
//       } catch (error) {
//         console.error("메시지 처리 중 오류 발생:", error);
//         // 오류 발생 시 다음 턴으로 넘어가도록 설정
//         setCurrentTurn((prev) => prev + 1);
//       }
//     }, 2000);

//     return () => clearTimeout(timer);
//   }, [allRoundsMessages, currentTurn, currentRound]);

//   const handleSend = () => {
//     if (!userInput.trim()) return;

//     const newMsg = { sender: "User", content: userInput, stance: userStance };
//     setMessages((prev) => [...prev, newMsg]);

//     setAllRoundsMessages((prev) => {
//       const updated = [...prev];
//       updated[currentTurn] = newMsg;
//       return updated;
//     });

//     setUserInput("");
//     setIsUserTurn(false);

//     if (currentRound === 1 && currentTurn === 3) {
//       console.log("라운드 1 종료, 라운드 2로 전환");
//       setCurrentRound(2);
//       setCurrentTurn(0);
//     } else if (currentRound === 2 && currentTurn === 3) {
//       // 라운드 2는 4턴만 진행
//       console.log("라운드 2 종료, 라운드 3로 전환");
//       setCurrentRound(3);
//       setCurrentTurn(0);
//     } else {
//       setCurrentTurn((prev) => prev + 1);
//     }
//   };

//   // 라운드 2와 3의 GPT 호출 시 반론, 보완, 요약을 유도하는 프롬프트
//   const getMessages = () => {
//     // 이전 라운드의 메시지만 따로 필터링
//     const previousRoundMessages = allRoundsMessages
//       .slice(0, currentRound === 2 ? 4 : 8)
//       .map((msg) => ({
//         role: msg.sender === "User" ? "user" : "assistant",
//         content: msg.content,
//       }));

//     const roundMessages = turnOrder.map(async (name) => {
//       const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";

//       let apiMsgs;

//       if (currentRound === 2) {
//         console.log(`(round2) ${name} 발언 생성중`);

//         const systemMsg = {
//           role: "user",
//           content:
//             `당신은 ${name} MBTI를 가진 토론 참가자입니다. 주제: "${topic}"에 대해 토론 중입니다. ` +
//             `다음은 Round 1에서 나눈 참가자들의 발언입니다. 이 중 하나의 의견을 언급하며 ` +
//             `당신의 ${stance} 입장을 더욱 강력하게 주장해주세요. ` +
//             `두 문장 이내로 답하고, MBTI 성격을 반영해주세요.`,
//         };

//         apiMsgs = [...previousRoundMessages, systemMsg];
//       } else if (currentRound === 3) {
//         console.log(`(round3) ${name} 발언 생성중`);

//         const systemMsg = {
//           role: "user",
//           content:
//             `당신은 ${name} MBTI를 가진 토론 참가자입니다. 주제: "${topic}"에 대한 토론의 최종 발언을 하셔야 합니다. ` +
//             `지금까지 나온 모든 의견들을 검토한 후, ` +
//             `당신의 MBTI 성격(${name})에 맞는 말투와 태도로, ${stance} 입장을 확고히 두 문장 정도로 간단명료하게 주장하세요.`,
//         };

//         apiMsgs = [...previousRoundMessages, systemMsg];
//       }

//       const reply = await callOpenAI(apiMsgs);
//       return { sender: name, content: removeQuotes(reply.content), stance };
//     });

//     return Promise.all(roundMessages);
//   };

//   return (
//     <PageContainer>
//       <Header>📢 토론 주제: "{topic}"</Header>
//       <RoundIndicator>
//         {currentRound === 2
//           ? "현재 라운드: 2 - 마지막 발언"
//           : currentRound === 3
//           ? "현재 라운드: 3 - 최종 발언"
//           : `현재 라운드: ${currentRound}`}
//       </RoundIndicator>
//       <ChatArea>
//         {messages.map((msg, idx) => (
//           // <Message key={idx} isUser={msg.sender === 'User'}>
//           //   <strong>{msg.sender} ({msg.stance}):</strong> {msg.content}
//           // </Message>
//           <Message
//             key={idx}
//             isUser={msg.sender === "User"}
//             sender={msg.sender}
//             content={msg.content}
//             stance={msg.stance}
//           />
//         ))}
//       </ChatArea>
//       {isUserTurn && (
//         <InputArea>
//           <TextInput
//             value={userInput}
//             onChange={(e) => setUserInput(e.target.value)}
//             placeholder="당신의 차례입니다. 논리정연하게 한두 문장으로 발언해 주세요."
//           />
//           <SendButton onClick={handleSend}>전송</SendButton>
//         </InputArea>
//       )}
//     </PageContainer>
//   );
// }

// // 말풍선 + 프로필 컴포넌트
// const Message = ({ isUser, sender, content, stance }) => {
//   const profileImg = allPersonasMap[sender] || user;

//   return (
//     <MessageContainer $isUser={isUser}>
//       {!isUser && (
//         <ProfileBox>
//           <ProfileImg src={profileImg} alt={sender} />
//           <MBTILabel>{sender}</MBTILabel>
//         </ProfileBox>
//       )}
//       <Bubble $isUser={isUser}>
//         <Text>{content}</Text>
//         <StanceTag $isPro={stance === "찬성"}>{stance}</StanceTag>
//       </Bubble>
//       {isUser && (
//         <ProfileBox>
//           <ProfileImg src={profileImg} alt="User" />
//           <MBTILabel>{sender}</MBTILabel>
//         </ProfileBox>
//       )}
//     </MessageContainer>
//   );
// };

// // 스타일 컴포넌트
// const PageContainer = styled.div`
//   display: flex;
//   flex-direction: column;
//   height: 100vh;
// `;

// const Header = styled.div`
//   font-size: 40px;
//   font-weight: 800;
//   margin-top: 30px;
//   margin-bottom: 30px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
// `;

// const RoundIndicator = styled.div`
//   font-size: 20px;
//   font-weight: 700;
//   margin-bottom: 10px;
//   margin-top: 10px;
//   color: #555;
//   margin-left: 30px;
// `;

// const ChatArea = styled.div`
//   flex: 1;
//   background-color: #dfdfdf;
// `;

// const InputArea = styled.div`
//   display: flex;
//   gap: 20px;
//   margin: 30px;
// `;

// const TextInput = styled.input`
//   flex: 1;
//   padding: 8px;
//   font-size: 16px;
// `;

// const SendButton = styled.button`
//   padding: 8px 16px;
//   font-size: 16px;
//   background: #6c63ff;
//   color: #fff;
//   border: none;
//   border-radius: 4px;
//   cursor: pointer;
// `;

// const MessageContainer = styled.div`
//   display: flex;
//   flex-direction: ${({ $isUser }) => ($isUser ? "row-reverse" : "row")};
//   align-items: center;
//   justify-content: flex-start;
//   margin: 10px 30px;
// `;

// const ProfileBox = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
// `;

// const MBTILabel = styled.div`
//   margin-top: 4px;
//   font-size: 20px;
//   font-weight: 800;
//   color: #000000;
// `;

// const ProfileImg = styled.img`
//   width: 70px;
//   height: 70px;
//   border-radius: 50%;
//   margin: 0 10px;
// `;

// const Bubble = styled.div`
//   max-width: 50%;
//   background-color: ${({ $isUser }) => ($isUser ? "#000000" : "#f1f1f1")};
//   color: ${({ $isUser }) => ($isUser ? "#fff" : "#000")};
//   padding: 14px 20px;
//   border-radius: 20px;
//   font-size: 20px;
//   position: relative;
// `;

// const Text = styled.div`
//   white-space: pre-line;
// `;

// const StanceTag = styled.div`
//   font-size: 15px;
//   margin-top: 6px;
//   text-align: right;
//   color: ${({ $isPro }) => ($isPro ? "#4caf50" : "#f44336")};
//   font-weight: 800;
// `;

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

  /* ---------- 유틸 ---------- */
  const removeQuotes = (text) =>
    !text ? text : text.replace(/^["']|["']$/g, "").trim();
  const userStance = safeRoles.pro.includes("User") ? "찬성" : "반대";

  /* ---------- 라운드 1 초기 메시지 ---------- */
  useEffect(() => {
    if (!topic || !personas) return;

    const pros = safeRoles.pro.filter((p) => p !== "User");
    const cons = safeRoles.con.filter((p) => p !== "User");
    const order = [
      pros[0],
      cons[0],
      userStance === "찬성" ? "User" : pros[1],
      userStance === "반대" ? "User" : cons[1],
    ];
    setTurnOrder(order);

    (async () => {
      if (currentRound !== 1 || currentTurn !== 0) return;
      const firstMsgs = [];

      for (const name of order) {
        if (name === "User") {
          firstMsgs.push({ sender: "User", content: null, stance: userStance });
          continue;
        }
        const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";
        const sys = {
          role: "system",
          content:
            `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}". ` +
            `${stance} 입장에서 MBTI 성격을 반영하여 한두 문장 첫 발언.`,
        };
        const reply = await callOpenAI([sys]);
        firstMsgs.push({
          sender: name,
          content: removeQuotes(reply.content),
          stance,
        });
      }
      setAllRoundsMessages(firstMsgs);
    })();
  }, [topic, personas, safeRoles]);

  /* ---------- 라운드 2·3 GPT 메시지 추가 ---------- */
  useEffect(() => {
    if ((currentRound === 2 || currentRound === 3) && currentTurn === 0) {
      (async () => {
        const newMsgs = await getMessages();
        setAllRoundsMessages((prev) => [...prev, ...newMsgs]);
      })();
    }
  }, [currentRound, currentTurn]);

  /* ---------- 메시지 한 개씩 출력 ---------- */
  useEffect(() => {
    const maxTurns = { 1: 4, 2: 4, 3: 4 }; // 라운드별 4턴

    /* ---- 종료 조건 ---- */
    if (currentRound === 3 && currentTurn === maxTurns[3]) {
      setIsUserTurn(false);
      setShowEndModal(true); // ★ 모달 오픈
      return;
    }

    const roundStartIdx = { 1: 0, 2: 4, 3: 8 };
    const idx = roundStartIdx[currentRound] + currentTurn;
    if (!allRoundsMessages[idx]) return;

    const msg = allRoundsMessages[idx];
    if (msg.sender === "User") {
      setIsUserTurn(true);
      return;
    }

    const timer = setTimeout(async () => {
      if (!msg.content) {
        const genMsgs = await getMessages();
        const genMsg = genMsgs.find((m) => m.sender === msg.sender);
        if (genMsg) {
          setAllRoundsMessages((prev) => {
            const up = [...prev];
            up[idx] = genMsg;
            return up;
          });
          setMessages((prev) => [...prev, genMsg]);
        }
      } else {
        setMessages((prev) => [...prev, msg]);
      }
      advanceTurn(maxTurns);
    }, 2000);

    return () => clearTimeout(timer);
  }, [allRoundsMessages, currentTurn, currentRound]);

  const advanceTurn = (maxTurns) => {
    setCurrentTurn((prev) => prev + 1);
    if (currentRound === 1 && currentTurn === maxTurns[1] - 1) {
      setCurrentRound(2);
      setCurrentTurn(0);
    } else if (currentRound === 2 && currentTurn === maxTurns[2] - 1) {
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
    advanceTurn({ 1: 4, 2: 4, 3: 4 });
  };

  /* ---------- GPT 메시지 생성 ---------- */
  const getMessages = () => {
    const prev = allRoundsMessages
      .slice(0, currentRound === 2 ? 4 : 8)
      .map((m) => ({
        role: m.sender === "User" ? "user" : "assistant",
        content: m.content,
      }));

    const tasks = turnOrder.map(async (name) => {
      const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";
      let prompt;
      if (currentRound === 2) {
        prompt =
          `당신은 ${name} MBTI 토론자. 주제: "${topic}". ` +
          `아래는 1라운드 발언. 한 의견을 인용해 ${stance} 입장을 더 강하게 주장. 두 문장, MBTI 반영.`;
      } else {
        prompt =
          `당신은 ${name} MBTI 토론자. 주제: "${topic}". ` +
          `최종 발언: 지금까지 의견 검토 후 ${stance} 입장을 두 문장으로 강력하게 정리.`;
      }
      const reply = await callOpenAI([
        ...prev,
        { role: "user", content: prompt },
      ]);
      return { sender: name, content: removeQuotes(reply.content), stance };
    });
    return Promise.all(tasks);
  };

  /* ---------- 렌더 ---------- */
  return (
    <PageContainer>
      <Header>📢 토론 주제: "{topic}"</Header>
      <RoundIndicator>
        {currentRound === 3
          ? "현재 라운드: 3 - 최종 발언"
          : currentRound === 2
          ? "현재 라운드: 2 - 마지막 발언"
          : `현재 라운드: ${currentRound}`}
      </RoundIndicator>

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
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
          토론이 종료되었습니다
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
const Message = ({ isUser, sender, content, stance }) => {
  const profileImg = allPersonasMap[sender] || user;
  return (
    <MessageContainer $isUser={isUser}>
      {!isUser && (
        <ProfileBox>
          <ProfileImg src={profileImg} alt={sender} />
          <MBTILabel>{sender}</MBTILabel>
        </ProfileBox>
      )}
      <Bubble $isUser={isUser}>
        <Text>{content}</Text>
        <StanceTag $isPro={stance === "찬성"}>{stance}</StanceTag>
      </Bubble>
      {isUser && (
        <ProfileBox>
          <ProfileImg src={profileImg} alt="User" />
          <MBTILabel>{sender}</MBTILabel>
        </ProfileBox>
      )}
    </MessageContainer>
  );
};

/* ---------- styled-components ---------- */
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const Header = styled.div`
  font-size: 40px;
  font-weight: 800;
  margin: 30px 0;
  display: flex;
  justify-content: center;
`;

const RoundIndicator = styled.div`
  font-size: 20px;
  font-weight: 700;
  margin: 10px 0 10px 30px;
  color: #555;
`;

const ChatArea = styled.div`
  flex: 1;
  background: #dfdfdf;
`;

const InputArea = styled.div`
  display: flex;
  gap: 20px;
  margin: 30px;
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
