// import React, { useEffect, useState, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import styled from "styled-components";
// import Modal from "react-modal";

// /* ---------- MBTI 프로필 이미지 ---------- */
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

// /* ---------- OpenAI 호출 ---------- */
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

// /* ---------- Whisper API 호출 ---------- */
// const transcribeAudio = async (audioFile) => {
//   const formData = new FormData();
//   formData.append("file", audioFile);
//   formData.append("model", "whisper-1");

//   const response = await fetch(
//     "https://api.openai.com/v1/audio/transcriptions",
//     {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${OPENAI_API_KEY}`,
//       },
//       body: formData,
//     }
//   );

//   const data = await response.json();
//   return data.text;
// };

// export default function DiscussionPage() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { topic, personas, roles } = location.state || {};

//   /* ---------- state ---------- */
//   const defaultRoles = { pro: ["User"], con: [] };
//   const safeRoles = roles || defaultRoles;

//   const [messages, setMessages] = useState([]);
//   const [currentRound, setCurrentRound] = useState(1);
//   const [turnOrder, setTurnOrder] = useState([]);
//   const [currentTurn, setCurrentTurn] = useState(0);
//   const [isUserTurn, setIsUserTurn] = useState(false);
//   const [allRoundsMessages, setAllRoundsMessages] = useState([]);
//   const [showEndModal, setShowEndModal] = useState(false);
//   const [showVoteModal, setShowVoteModal] = useState(false);
//   const [isDiscussionActive, setIsDiscussionActive] = useState(true);
//   const [round3OpponentMessage, setRound3OpponentMessage] = useState(null);
//   const [isRecording, setIsRecording] = useState(false);

//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);

//   /* ---------- 유틸 ---------- */
//   const removeQuotes = (text) =>
//     !text ? text : text.replace(/['"]/g, "").trim();
//   const userStance = safeRoles.pro.includes("User") ? "찬성" : "반대";

//   /* ---------- 녹음 제어 ---------- */
//   const startRecording = async () => {
//     if (isRecording) return;
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const recorder = new MediaRecorder(stream);
//       audioChunksRef.current = [];
//       recorder.ondataavailable = (e) => {
//         if (e.data.size > 0) audioChunksRef.current.push(e.data);
//       };
//       recorder.onstop = handleRecordingStop;
//       recorder.start();
//       mediaRecorderRef.current = recorder;
//       setIsRecording(true);
//     } catch (e) {
//       console.error("녹음 시작 오류:", e);
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && isRecording) {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
//     }
//   };

//   const handleRecordingStop = async () => {
//     const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
//     const audioFile = new File([audioBlob], "recording.webm", {
//       type: "audio/webm",
//     });

//     const text = await transcribeAudio(audioFile);
//     if (text) handleSend(text);
//   };

//   /* ---------- 라운드 1 초기 메시지 ---------- */
//   useEffect(() => {
//     if (!topic || !personas) return;

//     const pros = safeRoles.pro.filter((p) => p !== "User");
//     const cons = safeRoles.con.filter((p) => p !== "User");

//     const firstSpeakers =
//       userStance === "찬성" ? ["User", cons[0]] : [pros[0], "User"];

//     setTurnOrder(firstSpeakers);

//     const round2Order = [
//       safeRoles.pro[1],
//       safeRoles.con[1],
//       safeRoles.pro[0],
//       safeRoles.con[0],
//       safeRoles.pro[1],
//       safeRoles.con[1],
//     ];

//     const round3Order =
//       userStance === "찬성"
//         ? ["User", safeRoles.con[0]]
//         : [safeRoles.pro[0], "User"];

//     if (currentRound === 2) setTurnOrder(round2Order);
//     if (currentRound === 3) setTurnOrder(round3Order);

//     (async () => {
//       if (currentRound !== 1 || currentTurn !== 0) return;
//       const firstMsgs = [];

//       for (const name of firstSpeakers) {
//         if (name === "User") {
//           firstMsgs.push({ sender: "User", content: null, stance: userStance });
//           continue;
//         }
//         const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";
//         const sys = {
//           role: "system",
//           content:
//             `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}". ` +
//             `${stance} 입장에서 ${name} MBTI 성향을 말투에 반영하여 한두 문장 첫 발언하되, 당신의 MBTI를 직접적으로 언급하는 답변은 하지마세요`,
//         };
//         const reply = await callOpenAI([sys]);
//         firstMsgs.push({
//           sender: name,
//           content: removeQuotes(reply.content),
//           stance,
//           mbti: name,
//         });
//       }
//       setAllRoundsMessages(firstMsgs);
//     })();
//   }, [topic, personas, safeRoles, currentRound]);

//   /* ---------- 라운드 2·3 GPT 메시지 추가 ---------- */
//   useEffect(() => {
//     if (currentRound === 2 && !isUserTurn && isDiscussionActive) {
//       (async () => {
//         const newMsgs = await getMessages();
//         if (newMsgs && newMsgs.length > 0) {
//           if (currentTurn === 5) {
//             const lastMessage = allRoundsMessages[allRoundsMessages.length - 1];
//             if (lastMessage && lastMessage.content === newMsgs[0].content) {
//               setCurrentRound(3);
//               setCurrentTurn(0);
//               const opponentMsg = await generateRound3OpponentMessage();
//               setRound3OpponentMessage(opponentMsg);
//               if (userStance === "찬성") {
//                 setIsUserTurn(true);
//               } else {
//                 if (opponentMsg) {
//                   setMessages((prev) => [...prev, opponentMsg]);
//                   setAllRoundsMessages((prev) => [...prev, opponentMsg]);
//                 }
//                 setIsUserTurn(true);
//               }
//               return;
//             }
//           }

//           setAllRoundsMessages((prev) => [...prev, ...newMsgs]);
//           setMessages((prev) => [...prev, ...newMsgs]);

//           if (currentTurn < 5) {
//             advanceTurn({ 1: 2, 2: 6, 3: 2 });
//           } else if (currentTurn === 5) {
//             setCurrentRound(3);
//             setCurrentTurn(0);
//             const opponentMsg = await generateRound3OpponentMessage();
//             setRound3OpponentMessage(opponentMsg);
//             if (userStance === "찬성") {
//               setIsUserTurn(true);
//             } else {
//               if (opponentMsg) {
//                 setMessages((prev) => [...prev, opponentMsg]);
//                 setAllRoundsMessages((prev) => [...prev, opponentMsg]);
//               }
//               setIsUserTurn(true);
//             }
//           }
//         }
//       })();
//     }
//   }, [
//     currentRound,
//     currentTurn,
//     isUserTurn,
//     isDiscussionActive,
//     userStance,
//     allRoundsMessages,
//   ]);

//   /* ---------- 라운드 3 상대방 메시지 생성 함수 ---------- */
//   const generateRound3OpponentMessage = async () => {
//     const messageTexts = allRoundsMessages
//       .filter((msg) => msg && msg.content)
//       .map((msg) => `${msg.content}`);

//     const opponentName =
//       userStance === "찬성" ? safeRoles.con[0] : safeRoles.pro[0];
//     const opponentStance = userStance === "찬성" ? "반대" : "찬성";

//     const prompt =
//       `당신은 ${opponentName} MBTI 토론자입니다. 주제: "${topic}".\n\n` +
//       `지금까지의 전체 토론 내용입니다:\n${messageTexts.join("\n")}\n\n` +
//       `위의 모든 발언을 참고하여, ${opponentStance} 입장에서 최종 변론을 해주세요. ` +
//       `지금까지의 토론을 종합하여 가장 강력한 주장을 펼쳐주세요. ` +
//       `반드시 두 문장 이내로만 명료하게 답변해주세요. ` +
//       `${opponentStance} 입장에서 ${opponentName} MBTI 성향을 말투에 반영하여 성격을 말투에 반영하되 MBTI를 직접적으로 언급하지는 마세요. ` +
//       `반드시 존댓말을 사용해주세요.`;

//     const reply = await callOpenAI([
//       { role: "system", content: prompt },
//       ...messageTexts.map((msg) => ({
//         role: "user",
//         content: msg,
//       })),
//     ]);

//     if (reply && reply.content) {
//       return {
//         sender: opponentName,
//         content: removeQuotes(reply.content),
//         stance: opponentStance,
//         mbti: opponentName,
//       };
//     }
//     return null;
//   };

//   /* ---------- 메시지 한 개씩 출력 ---------- */
//   useEffect(() => {
//     const maxTurns = { 1: 2, 2: 6, 3: 2 };

//     if (!isDiscussionActive || currentRound === 3) return;

//     const roundStartIdx = { 1: 0, 2: 2, 3: 8 };
//     const idx = roundStartIdx[currentRound] + currentTurn;

//     const pros = safeRoles.pro.filter((p) => p !== "User");
//     const cons = safeRoles.con.filter((p) => p !== "User");

//     const round2Order = [
//       safeRoles.pro[1],
//       safeRoles.con[1],
//       safeRoles.pro[0],
//       safeRoles.con[0],
//       safeRoles.pro[1],
//       safeRoles.con[1],
//     ];

//     const round3Order =
//       userStance === "찬성" ? ["User", safeRoles.con[0]] : [pros[0], "User"];

//     const currentOrder =
//       currentRound === 2
//         ? round2Order
//         : currentRound === 3
//         ? round3Order
//         : turnOrder;

//     const isCurrentUserTurn = currentOrder[currentTurn] === "User";

//     if (isCurrentUserTurn) {
//       setIsUserTurn(true);
//       return;
//     }

//     const timer = setTimeout(async () => {
//       if (!allRoundsMessages[idx]) return;

//       const msg = allRoundsMessages[idx];
//       if (msg.sender === "User") {
//         setIsUserTurn(true);
//         return;
//       }

//       const isDuplicate = messages.some(
//         (m) =>
//           m.sender === msg.sender &&
//           m.content === msg.content &&
//           m.stance === msg.stance
//       );

//       if (!isDuplicate) {
//         setMessages((prev) => [...prev, msg]);
//       }

//       advanceTurn(maxTurns);
//     }, 2000);

//     return () => clearTimeout(timer);
//   }, [
//     allRoundsMessages,
//     currentTurn,
//     currentRound,
//     turnOrder,
//     safeRoles,
//     userStance,
//     isDiscussionActive,
//     messages,
//   ]);

//   const advanceTurn = (maxTurns) => {
//     setCurrentTurn((prev) => {
//       const nextTurn = prev + 1;
//       if (currentRound === 1 && nextTurn === maxTurns[1]) {
//         setCurrentRound(2);
//         return 0;
//       } else if (currentRound === 2 && nextTurn === maxTurns[2]) {
//         setCurrentRound(3);
//         return 0;
//       }
//       return nextTurn;
//     });
//   };

//   /* ---------- 유저 음성 입력 처리 ---------- */
//   const handleSend = (text) => {
//     if (!text.trim() || !isDiscussionActive) return;
//     const newMsg = { sender: "User", content: text, stance: userStance };

//     setMessages((prev) => [...prev, newMsg]);
//     setAllRoundsMessages((prev) => {
//       const up = [...prev];
//       const roundStartIdx = { 1: 0, 2: 2, 3: 8 };
//       const idx = roundStartIdx[currentRound] + currentTurn;
//       up[idx] = newMsg;
//       return up;
//     });

//     setIsUserTurn(false);

//     if (currentRound === 3) {
//       if (userStance === "찬성" && round3OpponentMessage) {
//         setMessages((prev) => [...prev, round3OpponentMessage]);
//         setAllRoundsMessages((prev) => [...prev, round3OpponentMessage]);
//       }
//       setShowVoteModal(true);
//       setIsDiscussionActive(false);
//     } else {
//       advanceTurn({ 1: 2, 2: 6, 3: 2 });
//     }
//   };

//   /* ---------- GPT 메시지 생성 ---------- */
//   const getMessages = async () => {
//     if (currentRound === 3) return [];

//     const pros = safeRoles.pro.filter((p) => p !== "User");
//     const cons = safeRoles.con.filter((p) => p !== "User");

//     const round2Order = [
//       safeRoles.pro[1],
//       safeRoles.con[1],
//       safeRoles.pro[0],
//       safeRoles.con[0],
//       safeRoles.pro[1],
//       safeRoles.con[1],
//     ];

//     const round3Order =
//       userStance === "찬성" ? ["User", safeRoles.con[0]] : [pros[0], "User"];

//     const currentOrder =
//       currentRound === 2
//         ? round2Order
//         : currentRound === 3
//         ? round3Order
//         : turnOrder;

//     const currentSpeaker = currentOrder[currentTurn];
//     if (currentSpeaker === "User") {
//       setIsUserTurn(true);
//       return [];
//     }

//     const messages = [];
//     let accumulatedMessages = [...allRoundsMessages];

//     if (currentRound === 2) {
//       const name = currentOrder[currentTurn];
//       const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";

//       const messageHistory = accumulatedMessages
//         .filter((msg) => msg && msg.content)
//         .map((msg) => ({
//           role: "user",
//           content: msg.content,
//         }));

//       const previousSpeaker =
//         currentTurn > 0 ? currentOrder[currentTurn - 1] : null;
//       const previousMessage = previousSpeaker
//         ? accumulatedMessages[accumulatedMessages.length - 1]
//         : null;

//       const prompt =
//         `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}".\n\n` +
//         `직전 발언자(${previousSpeaker})의 메시지:\n` +
//         `${previousMessage ? previousMessage.content : "첫 발언"}\n\n` +
//         `${stance} 입장에서 대화해주세요. ` +
//         `실제 사람이 대화하는 것처럼 자연스럽게 말해주세요.\n\n` +
//         `답변은 두 문장으로 해주세요:\n` +
//         `1. 첫 문장에서는 직전 발언자의 주장에 대한 반응을 보여주세요. ` +
//         `2. 두 번째 문장에서는 ${stance} 입장의 핵심 주장을 펼쳐주세요.\n\n` +
//         `주의사항:\n` +
//         `- 실제 사람이 대화하는 것처럼 자연스럽게 말해주세요. ` +
//         `- ${name} MBTI의 특성을 말투에 자연스럽게 반영해주세요.` +
//         `- MBTI를 직접적으로 언급하지 말고, 대화체로만 말해주세요.` +
//         `- 존댓말을 사용하되, 너무 격식적이지 않게 일상적인 대화체로 말해주세요.`;

//       const reply = await callOpenAI([
//         { role: "system", content: prompt },
//         ...messageHistory,
//       ]);

//       if (!reply || !reply.content) return null;

//       let content = removeQuotes(reply.content);
//       try {
//         const jsonMatch = content.match(/^\{.*\}$/s);
//         if (jsonMatch) {
//           const jsonContent = JSON.parse(jsonMatch[0]);
//           if (jsonContent.content) content = jsonContent.content;
//         }
//       } catch (e) {
//         console.log("응답이 JSON 형식이 아닙니다:", content);
//       }

//       content = content.replace(/^[^(]+\([^)]+\):\s*/g, "");

//       const message = {
//         sender: name,
//         content: content,
//         stance,
//         mbti: name,
//       };

//       messages.push(message);
//       return messages;
//     } else {
//       for (const name of currentOrder) {
//         const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";

//         const prompt =
//           `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}". ` +
//           `${stance} 입장에서 ${name} MBTI 성향을 말투에 반영하여 첫 발언해주세요. ` +
//           `반드시 두 문장 이내로만 명료하게 답변해주세요. ` +
//           `MBTI를 직접 언급하지는 마세요. ` +
//           `반드시 존댓말을 사용해주세요.`;

//         const reply = await callOpenAI([{ role: "system", content: prompt }]);

//         if (!reply || !reply.content) return null;

//         messages.push({
//           sender: name,
//           content: removeQuotes(reply.content),
//           stance,
//           mbti: name,
//         });
//       }
//       return messages;
//     }
//   };

//   const roundLabels = {
//     1: "🗣️ 입론 : 나의 첫 주장을 펼쳐요",
//     2: "🔄 반론 : 상대 의견에 반박해요",
//     3: "🎯 최종 변론 : 내 입장을 정리해요",
//   };

//   /* ---------- 렌더 ---------- */
//   return (
//     <PageContainer>
//       <Header>📢 토론 주제: "{topic}"</Header>
//       <RoundIndicator>{roundLabels[currentRound]}</RoundIndicator>

//       <ChatArea>
//         {messages.map((m, i) => (
//           <Message key={i} isUser={m.sender === "User"} {...m} />
//         ))}
//       </ChatArea>

//       {isUserTurn && (
//         <RecorderArea>
//           <RecorderButton
//             onClick={isRecording ? stopRecording : startRecording}
//           >
//             {isRecording ? "Stop 🔴" : "🎤 Speak"}
//             \n{" "}
//           </RecorderButton>
//         </RecorderArea>
//       )}

//       <Modal
//         isOpen={showVoteModal}
//         onRequestClose={() => setShowVoteModal(false)}
//         style={{
//           content: {
//             inset: "40% auto auto 50%",
//             transform: "translate(-50%,-50%)",
//             width: 500,
//             borderRadius: 14,
//             padding: "32px 40px",
//             textAlign: "center",
//           },
//           overlay: { backgroundColor: "rgba(0,0,0,0.45)" },
//         }}
//       >
//         <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
//           🗳️ 토론 이후, 입장 변화에 대해 투표해 주세요
//         </h2>
//         <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
//           <button
//             onClick={() => {
//               setShowVoteModal(false);
//               setShowEndModal(true);
//             }}
//             style={{
//               padding: "10px 28px",
//               background: "#4caf50",
//               color: "#fff",
//               border: "none",
//               borderRadius: 8,
//               fontWeight: 600,
//               fontSize: 20,
//               cursor: "pointer",
//             }}
//           >
//             찬성
//           </button>
//           <button
//             onClick={() => {
//               setShowVoteModal(false);
//               setShowEndModal(true);
//             }}
//             style={{
//               padding: "10px 28px",
//               background: "#f44336",
//               color: "#fff",
//               border: "none",
//               borderRadius: 8,
//               fontWeight: 600,
//               fontSize: 20,
//               cursor: "pointer",
//             }}
//           >
//             반대
//           </button>
//         </div>
//       </Modal>

//       <Modal
//         isOpen={showEndModal}
//         onRequestClose={() => setShowEndModal(false)}
//         style={{
//           content: {
//             inset: "40% auto auto 50%",
//             transform: "translate(-50%,-50%)",
//             width: 420,
//             borderRadius: 14,
//             padding: "32px 40px",
//             textAlign: "center",
//           },
//           overlay: { backgroundColor: "rgba(0,0,0,0.45)" },
//         }}
//       >
//         <h3
//           style={{
//             fontSize: 30,
//             fontWeight: 800,
//             color: "#000000",
//             marginBottom: 10,
//           }}
//         >
//           🗳️ 투표 결과 🗳️
//         </h3>
//         <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
//           찬성 : 3표, 반대 : 1표
//         </h2>
//         <p style={{ marginBottom: 32, fontSize: 18 }}>
//           새로운 토론을 시작하시겠습니까?
//         </p>
//         <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
//           <button
//             onClick={() => navigate("/")}
//             style={{
//               padding: "10px 28px",
//               background: "#6c63ff",
//               color: "#fff",
//               border: "none",
//               borderRadius: 8,
//               fontWeight: 600,
//               fontSize: 20,
//               cursor: "pointer",
//             }}
//           >
//             예
//           </button>
//           <button
//             onClick={() => setShowEndModal(false)}
//             style={{
//               padding: "10px 28px",
//               background: "#e0e0e0",
//               border: "none",
//               borderRadius: 8,
//               fontWeight: 600,
//               fontSize: 20,
//               cursor: "pointer",
//             }}
//           >
//             아니오
//           </button>
//         </div>
//       </Modal>
//     </PageContainer>
//   );
// }

// /* ---------- 말풍선 + 프로필 ---------- */
// const Message = ({ isUser, sender, content, stance, mbti }) => {
//   const profileImg = allPersonasMap[mbti || sender] || user;
//   return (
//     <MessageContainer $isUser={isUser}>
//       {!isUser && (
//         <ProfileBox>
//           <ProfileImg src={profileImg} alt={mbti || sender} />
//           <MBTILabel>{mbti || sender}</MBTILabel>
//         </ProfileBox>
//       )}
//       <Bubble $isUser={isUser}>
//         <Text>{content}</Text>
//         <StanceTag $isPro={stance === "찬성"}>{stance}</StanceTag>
//       </Bubble>
//     </MessageContainer>
//   );
// };

// /* ---------- styled-components ---------- */
// const PageContainer = styled.div`
//   display: flex;
//   flex-direction: column;
//   height: 100vh;
//   overflow: hidden;
// `;

// const Header = styled.div`
//   font-size: 40px;
//   font-weight: 800;
//   margin: 30px 0;
//   color: #000000;
//   background-color: #ffffff;
//   display: flex;
//   justify-content: center;
// `;

// const RoundIndicator = styled.div`
//   font-size: 30px;
//   font-weight: 700;
//   padding-top: 20px;
//   padding-bottom: 20px;
//   color: #ffffff;
//   background-color: #000000;
//   display: flex;
//   justify-content: center;
// `;

// const ChatArea = styled.div`
//   flex: 1;
//   background: #dfdfdf;
//   overflow-y: auto;
//   padding: 20px 30px;
// `;

// const RecorderArea = styled.div`
//   display: flex;
//   justify-content: center;
//   padding: 20px 30px;
// `;

// const RecorderButton = styled.button`
//   padding: 10px 20px;
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
//   margin: 10px 30px;
// `;

// const ProfileBox = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
// `;

// const MBTILabel = styled.div`
//   margin-top: 4px;
//   font-size: 20px;
//   font-weight: 800;
// `;

// const ProfileImg = styled.img`
//   width: 70px;
//   height: 70px;
//   border-radius: 50%;
//   margin: 0 10px;
// `;

// const Bubble = styled.div`
//   max-width: 50%;
//   background: ${({ $isUser }) => ($isUser ? "#000" : "#f1f1f1")};
//   color: ${({ $isUser }) => ($isUser ? "#fff" : "#000")};
//   padding: 14px 20px;
//   border-radius: 20px;
//   font-size: 20px;
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

import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import Modal from "react-modal";

// import { perplexity } from "@ai-sdk/perplexity";
// import { streamText } from "ai";

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
import moderator from "../assets/moderator.jpg";

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
  moderator: moderator,
};

/* ---------- TTS 설정 ---------- */
// 목소리 매핑: male -> 'fable', female -> 'shimmer'
// Fable: warm, engaging male voice; Shimmer: soft, gentle female voice ([ttsopen.ai](https://ttsopen.ai/?utm_source=chatgpt.com), [datacamp.com](https://www.datacamp.com/tutorial/how-to-use-the-openai-text-to-speech-api))
const TTS_VOICE_MAPPING = {
  male: "onyx",
  female: "nova",
};

const TTS_PLAYBACK_RATE = 1.3; // 재생 속도 조절 (1.0 기본, 높일수록 빠름)

// 성별 매핑
const personaGenders = {
  ISFJ: "male",
  ENTJ: "female",
  ISTP: "male",
  ESTJ: "male",
  ENFP: "female",
  INFJ: "female",
  ESTP: "male",
  ENFJ: "female",
  ISTJ: "male",
  INTJ: "female",
  INTP: "female",
  INFP: "female",
  ESFP: "male",
  ESFJ: "female",
  ISFP: "male",
  ENTP: "female",
  User: "user",
  moderator: "male",
};

const OPENAI_API_KEY = process.env.REACT_APP_OPEN_AI_API_KEY;

/* ---------- 모델 할당 ---------- */
const AVAILABLE_MODELS = ["sonar", "sonar-pro", "llama-3.3-70b-versatile"];

const assignModelsToSpeakers = (roles) => {
  const speakerModels = {};
  const availableModels = [...AVAILABLE_MODELS];

  // User를 제외한 모든 스피커에게 모델 할당
  [...roles.pro, ...roles.con].forEach((speaker) => {
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
      model: "gpt-4.1-nano",
      messages,
      max_tokens: 500,
    }),
  });
  const data = await res.json();
  return data.choices[0].message;
}

/* ---------- TTS API 호출 함수 ---------- */
async function textToSpeech(text, voice) {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "tts-1", voice, input: text }),
  });
  if (!response.ok) throw new Error("TTS request failed");
  const audioBuffer = await response.arrayBuffer();
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
  return URL.createObjectURL(blob);
}

/* ---------- STT ---------- */
const transcribeAudio = async (audioFile) => {
  const form = new FormData();
  form.append("file", audioFile);
  form.append("model", "whisper-1");
  const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });
  const d = await resp.json();
  return d.text;
};

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
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Perplexity API error: ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    return data.choices[0].message;
  } catch (error) {
    console.error("Error calling Perplexity:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });
    throw error;
  }
}

/* ---------- Groq 호출 ---------- */
async function callGroq(messages, model) {
  try {
    console.log("Messages being sent to Groq:", messages);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages,
          temperature: 0.7,
          max_tokens: 300,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Groq API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    return data.choices[0].message;
  } catch (error) {
    console.error("Error calling Groq:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });
    throw error;
  }
}

/* ---------- 유틸 함수들 ---------- */
const createDebatePrompt = (topic, speaker, stance, currentRound) => {
  switch (currentRound) {
    case 1:
      return `"${topic}" 주제의 토론에 대해 ${stance} 입장으로 ${speaker} 성향을 말투에 반영하여 매우 간결한 한마디로 시작 발언하시오. 한국어로만 말하시오.`;
    case 2:
      return `직전 주장에 대해서 ${speaker} 성향을 말투에 반영하여 매우 간결하게 확실히 반박하시오. 한국어로만 말하시오.`;
    case 3:
      return `지금까지의 대화 흐름을 보고 ${stance} 입장으로 ${speaker} 성향을 말투에 반영하여 한마디로 최후변론을 해주시오. 한국어로만 말하시오.`;
    default:
      return "";
  }
};

const addMessage = (setMessages, sender, content, stance, mbti) => {
  setMessages((prev) => [
    ...prev,
    {
      sender,
      content,
      stance,
      mbti,
    },
  ]);
};

const handleAIMessage = async (
  topic,
  speaker,
  stance,
  setMessages,
  roles,
  currentRound,
  speakerModels,
  messages
) => {
  try {
    const prompt = createDebatePrompt(topic, speaker, stance, currentRound);

    // Convert messages to alternating user/assistant format
    const messageHistory = [];

    // Convert system message to user message
    messageHistory.push({
      role: "user",
      content: `당신은 ${speaker} MBTI 토론자입니다. 주제: "${topic}". ${stance} 입장에서 대화해주세요.`,
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
          content: lastMessage.content,
        });
        messageHistory.push({
          role: "user",
          content: prompt,
        });
      }
    }

    console.log("Final message history:", messageHistory);

    // Choose API based on model
    const model = speakerModels[speaker];
    const aiMessage = model.startsWith("llama")
      ? await callGroq(messageHistory, model)
      : await callPerplexity(messageHistory, model);

    addMessage(setMessages, speaker, aiMessage.content, stance, speaker);
    return true;
  } catch (error) {
    console.error("Error calling AI:", error);
    addMessage(setMessages, speaker, "입론합니다.", stance, speaker);
    return false;
  }
};

/* ---------- 라운드별 핸들러 ---------- */
const handleRound1 = async (
  topic,
  roles,
  currentTurn,
  setMessages,
  setIsUserTurn,
  setCurrentTurn,
  setCurrentRound,
  speakerModels,
  messages
) => {
  if (currentTurn === 0) {
    setMessages((prev) => [
      {
        sender: "moderator",
        content: `안녕하세요. 오늘 토론은 찬성 2인 반대 2인이 참여합니다. 각 팀별로 입론 1분, 반론 5분, 최종발언 1분의 시간이 주어지고, 발언 순서는 제가 안내하도록 하겠습니다. 그럼 시작하겠습니다.`,
        stance: "중립",
        mbti: "moderator",
      },
    ]);

    const background = await callOpenAI([
      {
        role: "system",
        content: `당신은 토론의 진행자입니다. 최근 여러 회사들은 어떤 장점때문에 원격 근무를 기본으로 하고 있지요~~~(등 관련 내용 배경 설명) 의 형식으로 주제에 대해 토론 참가자들이 engage 할 수 있도록 한마디 배경에 대한 한문장으로만 소개해주세요.`,
      },
      {
        role: "user",
        content: `주제 "${topic}"에 대한 배경 설명을 해주세요.`,
      },
    ]);

    setMessages((prev) => [
      ...prev,
      {
        sender: "moderator",
        content:
          `오늘의 토론 주제는 "${topic}" 입니다. ${background.content}` +
          ` 이제 입론을 진행하겠습니다. 주제에 대한 개인 의견을 제시해주시길 바랍니다. 찬성측 ${roles.pro[0]}부터 발언하겠습니다!`,
        stance: "중립",
        mbti: "moderator",
      },
    ]);

    if (roles.pro.includes("User")) {
      setIsUserTurn(true);
    } else {
      await handleAIMessage(
        topic,
        roles.pro[0],
        "찬성",
        setMessages,
        roles,
        1,
        speakerModels,
        messages
      );

      setCurrentTurn((prev) => prev + 1);
    }
  } else {
    if (roles.pro.includes("User")) {
      await handleAIMessage(
        topic,
        roles.con[0],
        "반대",
        setMessages,
        roles,
        1,
        speakerModels,
        messages
      );

      setMessages((prevMessages) => {
        const lastContent = prevMessages[prevMessages.length - 1].content;
        callOpenAI([
          {
            role: "system",
            content: `참가자의 주장을 한마디로 명쾌하게 요약 바람. 형식은 다음과 같이 해줘: "네, 삶의 질이 개선되어 업무시간에 더욱 집중력이 올라갈 것이라는 의견 잘 들었습니다."`,
          },
          {
            role: "user",
            content: `참가자의 주장을 한마디로 요약해서 소개해주세요. 참가자의 주장: ${lastContent}.`,
          },
        ]).then((summary) => {
          setMessages((prev) => [
            ...prev,
            {
              sender: "moderator",
              content:
                `${summary.content}` +
                ` 다음은 반론 시간입니다. 각자 의견에 대하여 추가적으로 주장하실 내용이 있거나 상대측 의견에 반박하실 말씀이 있다면 진행해주시면 감사하겠습니다. 찬성측 ${roles.pro[1]} 부터 의견 들어보도록 하겠습니다.`,
              stance: "중립",
              mbti: "moderator",
            },
          ]);
          setCurrentRound((prev) => prev + 1);
          setCurrentTurn(0);
        });

        return prevMessages;
      });
    } else {
      if(roles.con.includes("User") && currentTurn > 1) {
        return;
      }
      setMessages((prevMessages) => {
        const lastContent = prevMessages[prevMessages.length - 1].content;
        callOpenAI([
          {
            role: "system",
            content: `참가자의 주장을 한마디로 명쾌하게 요약 바람. 형식은 다음과 같이 해줘: "네, 삶의 질이 개선되어 업무시간에 더욱 집중력이 올라갈 것이라는 의견 잘 들었습니다."`,
          },
          {
            role: "user",
            content: `참가자의 주장을 한마디로 요약해서 소개해주세요. 참가자의 주장: ${lastContent}.`,
          },
        ]).then((summary) => {
          setMessages((prev) => [
            ...prev,
            {
              sender: "moderator",
              content:
                `${summary.content}` +
                ` 다음 반대측 ${roles.con[0]} 발언하겠습니다.`,
              stance: "중립",
              mbti: "moderator",
            },
          ]);
          // setCurrentTurn(prev => prev + 1);
          setIsUserTurn(true);
        });
        return prevMessages;
      });
    }
  }
};

const handleRound2 = async (
  topic,
  roles,
  currentTurn,
  setMessages,
  setIsUserTurn,
  setCurrentTurn,
  setCurrentRound,
  speakerModels,
  messages
) => {
  if (currentTurn === 6) {
    setCurrentRound(3);
    setCurrentTurn(0);
    return;
  }

  const round2Order = [
    roles.pro[1],
    roles.con[1],
    roles.pro[0],
    roles.con[0],
    roles.pro[1],
    roles.con[1],
  ];

  const currentSpeaker = round2Order[currentTurn];
  if (currentSpeaker === "User") {
    setIsUserTurn(true);
    return;
  }

  const stance = roles.pro.includes(currentSpeaker) ? "찬성" : "반대";
  await handleAIMessage(
    topic,
    currentSpeaker,
    stance,
    setMessages,
    roles,
    2,
    speakerModels,
    messages
  );

  if (currentTurn < 5) {
    setMessages((prevMessages) => {
      const lastContent = prevMessages[prevMessages.length - 1].content;
      callOpenAI([
        {
          role: "system",
          content: `참가자의 주장을 한마디로 명쾌하게 요약 바람. 형식은 다음과 같이 해줘: "네, 삶의 질이 개선되어 업무시간에 더욱 집중력이 올라갈 것이라는 의견 잘 들었습니다."`,
        },
        {
          role: "user",
          content: `참가자의 주장을 한마디로 요약해서 소개해주세요. 참가자의 주장: ${lastContent}.`,
        },
      ]).then((summary) => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "moderator",
            content: `${summary.content} 해당 의견에 대해 ${
              round2Order[currentTurn + 1]
            }님 의견 있으실까요?`,
            stance: "중립",
            mbti: "moderator",
          },
        ]);
        setCurrentTurn((prev) => prev + 1);
      });
      return prevMessages;
    });
  } else {
    setCurrentRound(3);
    setCurrentTurn(0);
    setMessages((prev) => [
      ...prev,
      {
        sender: "moderator",
        content: `해당 주제에 대한 양측 의견 잘 들었습니다. 각 진영은 마지막으로 의견 정리해서 최종변론 진행해주세요. 찬성측 ${roles.pro[0]}부터 발언해주세요.`,
        stance: "중립",
        mbti: "moderator",
      },
    ]);
  }
};

// setCurrentTurn(prev => prev + 1)

const handleRound3 = async (
  topic,
  roles,
  currentTurn,
  setMessages,
  setIsUserTurn,
  setCurrentTurn,
  setShowVoteModal,
  speakerModels,
  messages
) => {
  if (currentTurn >= 2) {
    setMessages((prevMessages) => {
      const lastContent = prevMessages[prevMessages.length - 1].content;
      // 전체 토론 내용을 문자열로 변환
      const discussionContent = prevMessages
        .filter((msg) => msg.sender !== "moderator") // 사회자 메시지 제외
        .map((msg) => `${msg.sender}(${msg.stance}): ${msg.content}`)
        .join("\n");

      callOpenAI([
        {
          role: "system",
          content: `당신은 토론의 사회자입니다. 전체 토론 내용을 바탕으로 토론의 핵심 논점과 결론을 간단히 요약해주세요. 
          형식은 다음과 같이 해주세요: "토론을 통해 어떠한 의견과 관점이 지배적으로 모아진 듯 보입니다."`,
        },
        {
          role: "user",
          content: `다음은 전체 토론 내용입니다. 이를 바탕으로 토론을 요약해주세요:\n\n${discussionContent}`,
        },
      ]).then((summary) => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "moderator",
            content: `네 분 모두 고생 많으셨습니다. 오늘 토론은 "${topic}" 라는 주제로 논의됐습니다. ${summary.content} 마지막으로 본 토론에 대해 어느 측의 주장이 더욱 와닿았고, 토론을 잘 진행한 것 같은지 투표를 진행하도록 하겠습니다.`,
            stance: "중립",
            mbti: "moderator",
          },
        ]);
        setShowVoteModal(true);
      });
      return prevMessages;
    });

    return;
  }

  if (roles.pro.includes("User")) {
    if (currentTurn === 0) {
      setIsUserTurn(true);
    } else {
      await handleAIMessage(
        topic,
        roles.con[0],
        "반대",
        setMessages,
        roles,
        3,
        speakerModels,
        messages
      );
      setCurrentTurn((prev) => prev + 1);
    }
  } else {
    if (currentTurn === 0) {
      await handleAIMessage(
        topic,
        roles.pro[0],
        "찬성",
        setMessages,
        roles,
        3,
        speakerModels,
        messages
      );
      setCurrentTurn((prev) => prev + 1);
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
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  /* ---------- TTS 큐 및 재생 상태 ---------- */
  const [speechQueue, setSpeechQueue] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  /* ---------- 새 메시지 추가 시 TTS 큐에 등록 ---------- */
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.sender !== "User") {
      const gender = personaGenders[last.mbti || last.sender];
      const voice = TTS_VOICE_MAPPING[gender] || TTS_VOICE_MAPPING.female;
      // include the message index so we know which bubble to highlight
      setSpeechQueue((q) => [
        ...q,
        { text: last.content, voice, id: messages.length - 1 },
      ]);
      // setSpeechQueue((q) => [...q, { text: last.content, voice }]);
    }
  }, [messages]);

  /* ---------- 큐에서 순차 재생 ---------- */
  useEffect(() => {
    if (isSpeaking || speechQueue.length === 0) return;
    // const { text, voice } = speechQueue[0];
    const { text, voice, id } = speechQueue[0];
    setIsSpeaking(true);
    setSpeakingMessageId(id);
    textToSpeech(text, voice)
      .then((url) => {
        const audio = new Audio(url);
        audio.playbackRate = TTS_PLAYBACK_RATE;
        audio.onended = () => {
          setIsSpeaking(false);
          setSpeechQueue((q) => q.slice(1));
          setSpeakingMessageId(null);
        };
        audio.play();
      })
      .catch((err) => {
        console.error("TTS playback error", err);
        setIsSpeaking(false);
        setSpeechQueue((q) => q.slice(1));
        setSpeakingMessageId(null);
      });
  }, [speechQueue, isSpeaking]);

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
      switch (currentRound) {
        case 1:
          await handleRound1(
            topic,
            roles,
            currentTurn,
            setMessages,
            setIsUserTurn,
            setCurrentTurn,
            setCurrentRound,
            speakerModels,
            messages
          );
          break;
        case 2:
          await handleRound2(
            topic,
            roles,
            currentTurn,
            setMessages,
            setIsUserTurn,
            setCurrentTurn,
            setCurrentRound,
            speakerModels,
            messages
          );
          break;
        case 3:
          await handleRound3(
            topic,
            roles,
            currentTurn,
            setMessages,
            setIsUserTurn,
            setCurrentTurn,
            setShowVoteModal,
            speakerModels,
            messages
          );
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

  /* ---------- Recording Control ---------- */
  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      audioChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      rec.onstop = handleRecordingStop;
      rec.start();
      mediaRecorderRef.current = rec;
      setIsRecording(true);
    } catch (e) {
      console.error(e);
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  const handleRecordingStop = async () => {
    const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const file = new File([blob], "record.webm", { type: "audio/webm" });
    const text = await transcribeAudio(file);
    if (text) {
      // simulate text input send
      setMessages((prev) => [
        ...prev,
        {
          sender: "User",
          content: text,
          stance: roles.pro.includes("User") ? "찬성" : "반대",
          mbti: "User",
        },
      ]);

      if(currentRound === 1 && currentTurn === 0) {
        // 유저 찬성일 때
        setMessages((prevMessages) => {
          const lastContent = prevMessages[prevMessages.length - 1].content;
          callOpenAI([
            {
              role: "system",
              content: `참가자의 주장을 한마디로 명쾌하게 요약 바람. 형식은 다음과 같이 해줘: "네, 삶의 질이 개선되어 업무시간에 더욱 집중력이 올라갈 것이라는 의견 잘 들었습니다."`,
            },
            {
              role: "user",
              content: `참가자의 주장을 한마디로 요약해서 소개해주세요. 참가자의 주장: ${lastContent}.`,
            },
          ]).then((summary) => {
            setMessages((prev) => [
              ...prev,
              {
                sender: "moderator",
                content:
                  `${summary.content}` +
                  ` 이제 반대측 ${roles.con[0]} 입론해주시기 바랍니다.`,
                stance: "중립",
                mbti: "moderator",
              },
            ]);
            // setCurrentRound((prev) => prev + 1);
            setIsUserTurn(false);
            setCurrentTurn((prev) => prev + 1);
          });
          return prevMessages;
        });

      } else {
        setMessages((prevMessages) => {
          const lastContent = prevMessages[prevMessages.length - 1].content;
          callOpenAI([
            {
              role: "system",
              content: `참가자의 주장을 한마디로 명쾌하게 요약 바람. 형식은 다음과 같이 해줘: "네, 삶의 질이 개선되어 업무시간에 더욱 집중력이 올라갈 것이라는 의견 잘 들었습니다."`,
            },
            {
              role: "user",
              content: `참가자의 주장을 한마디로 요약해서 소개해주세요. 참가자의 주장: ${lastContent}.`,
            },
          ]).then((summary) => {
            setMessages((prev) => [
              ...prev,
              {
                sender: "moderator",
                content:
                  `${summary.content}` +
                  ` 다음은 반론 시간입니다. 각자 의견에 대하여 추가적으로 주장하실 내용이 있거나 상대측 의견에 반박하실 말씀이 있다면 진행해주시면 감사하겠습니다. 찬성측 ${roles.pro[1]} 부터 의견 들어보도록 하겠습니다.`,
                stance: "중립",
                mbti: "moderator",
              },
            ]);
            setIsUserTurn(false);
            setCurrentRound((prev) => prev + 1);
            setCurrentTurn(0);
          });
          return prevMessages;
        });
      }
      
      // advance turn
      // setCurrentTurn((prev) => prev + 1);
    }
  };

  const roundLabels = {
    1: "🗣️ 입론 : 나의 첫 주장을 펼쳐요",
    2: "🔄 반론 : 상대 의견에 반박해요",
    3: "🎯 최종 변론 : 내 입장을 정리해요",
  };

  const handleSend = () => {
    if (!userInput.trim()) return;

    switch (currentRound) {
      case 1:
        // 유저 입력에 대한 처리
        setMessages((prev) => [
          ...prev,
          {
            sender: "User",
            content: userInput,
            stance: currentTurn === 0 ? "찬성" : "반대",
            mbti: "User",
          },
        ]);
        setUserInput("");
        setIsUserTurn(false);

        // 턴 처리
        if (currentTurn === 1) {
          // 입론은 턴이 두번밖에 없으니 바로 다음 라운드로 넘기기.
          console.log("입론 종료");
          setMessages((prevMessages) => {
            const lastContent = prevMessages[prevMessages.length - 1].content;
            callOpenAI([
              {
                role: "system",
                content: `참가자의 주장을 한마디로 명쾌하게 요약 바람. 형식은 다음과 같이 해줘: "네, 삶의 질이 개선되어 업무시간에 더욱 집중력이 올라갈 것이라는 의견 잘 들었습니다."`,
              },
              {
                role: "user",
                content: `참가자의 주장을 한마디로 요약해서 소개해주세요. 참가자의 주장: ${lastContent}.`,
              },
            ]).then((summary) => {
              setMessages((prev) => [
                ...prev,
                {
                  sender: "moderator",
                  content:
                    `${summary.content}` +
                    ` 다음은 반론 시간입니다. 각자 의견에 대하여 추가적으로 주장하실 내용이 있거나 상대측 의견에 반박하실 말씀이 있다면 진행해주시면 감사하겠습니다. 찬성측 ${roles.pro[1]} 부터 의견 들어보도록 하겠습니다.`,
                  stance: "중립",
                  mbti: "moderator",
                },
              ]);
              setCurrentRound((prev) => prev + 1);
              setCurrentTurn(0);
            });
            return prevMessages;
          });
        } else {
          // 찬성일 때

          setMessages((prevMessages) => {
            const lastContent = prevMessages[prevMessages.length - 1].content;
            callOpenAI([
              {
                role: "system",
                content: `참가자의 주장을 한마디로 명쾌하게 요약 바람. 형식은 다음과 같이 해줘: "네, 삶의 질이 개선되어 업무시간에 더욱 집중력이 올라갈 것이라는 의견 잘 들었습니다."`,
              },
              {
                role: "user",
                content: `참가자의 주장을 한마디로 요약해서 소개해주세요. 참가자의 주장: ${lastContent}.`,
              },
            ]).then((summary) => {
              setMessages((prev) => [
                ...prev,
                {
                  sender: "moderator",
                  content:
                    `${summary.content}` +
                    ` 다음 반대측 ${roles.con[0]} 발언하겠습니다. 222`,
                  stance: "중립",
                  mbti: "moderator",
                },
              ]);
              setCurrentTurn((prev) => prev + 1);
            });
            return prevMessages;
          });
        }
        break;
      case 2:
        // 유저 입력 처리
        setMessages((prev) => [
          ...prev,
          {
            sender: "User",
            content: userInput,
            stance: roles.pro.includes("User") ? "찬성" : "반대",
            mbti: "User",
          },
        ]);
        // setUserInput("");
        // setIsUserTurn(false);

        setMessages((prevMessages) => {
          const lastContent = prevMessages[prevMessages.length - 1].content;
          callOpenAI([
            {
              role: "system",
              content: `참가자의 주장을 한마디로 명쾌하게 요약 바람. 형식은 다음과 같이 해줘: "네, 삶의 질이 개선되어 업무시간에 더욱 집중력이 올라갈 것이라는 의견 잘 들었습니다."`,
            },
            {
              role: "user",
              content: `참가자의 주장을 한마디로 요약해서 소개해주세요. 참가자의 주장: ${lastContent}.`,
            },
          ]).then((summary) => {
            setMessages((prev) => [
              ...prev,
              {
                sender: "moderator",
                content: `${summary.content} 해당 의견에 대한 반박 부탁드립니다.`,
                stance: "중립",
                mbti: "moderator",
              },
            ]);
            setCurrentTurn((prev) => prev + 1);
            setUserInput("");
            setIsUserTurn(false);
          });
          return prevMessages;
        });
        // setCurrentTurn(prev => prev + 1);
        break;
      case 3:
        setMessages((prev) => [
          ...prev,
          {
            sender: "User",
            content: userInput,
            stance: roles.pro.includes("User") ? "찬성" : "반대",
            mbti: "User",
          },
        ]);
        setUserInput("");
        setIsUserTurn(false);
        setCurrentTurn((prev) => prev + 1);
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
        {/* {messages.map((m, i) => (
          <Message key={i} isUser={m.sender === "User"} {...m} />
        ))} */}
        {messages.map((m, i) => (
          <Message
            key={i}
            index={i}
            speakingMessageId={speakingMessageId}
            isUser={m.sender === "User"}
            {...m}
          />
        ))}
      </ChatArea>
      {isUserTurn && (
        <RecorderArea>
          <RecorderButton
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? "Stop 🔴" : "🎤 Speak"}
          </RecorderButton>
        </RecorderArea>
        // {isUserTurn && (
        // <InputArea>
        //   <TextInput
        //     value={userInput}
        //     onChange={(e) => setUserInput(e.target.value)}
        //     placeholder="당신의 차례입니다. 논리정연하게 두 문장 이내로 발언해 주세요."
        //   />
        //   <SendButton onClick={handleSend}>전송</SendButton>
        // </InputArea>
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
              setShowEndModal(true); // ✅ 종료 모달 열기
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
const Message = ({
  isUser,
  sender,
  content,
  stance,
  mbti,
  index,
  speakingMessageId,
}) => {
  const isSpeaking = index === speakingMessageId;
  const profileImg = allPersonasMap[mbti || sender] || user;
  return (
    <MessageContainer $isUser={isUser}>
      {!isUser && (
        <ProfileBox>
          <ProfileImg src={profileImg} alt={mbti || sender} />
          <MBTILabel>{mbti || sender}</MBTILabel>
        </ProfileBox>
      )}
      <Bubble $isUser={isUser} $isSpeaking={index === speakingMessageId}>
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
  // background: ${({ $isUser }) => ($isUser ? "#000" : "#f1f1f1")};
  // color: ${({ $isUser }) => ($isUser ? "#fff" : "#000")};
  background: ${({ $isUser, $isSpeaking }) =>
    $isSpeaking
      ? "#fffde7" /* light highlight */
      : $isUser
      ? "#000"
      : "#f1f1f1"};
  color: ${({ $isUser, $isSpeaking }) =>
    $isSpeaking ? "#000" : $isUser ? "#fff" : "#000"};
  border: ${({ $isSpeaking }) => ($isSpeaking ? "2px solid #fdd835" : "none")};
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
